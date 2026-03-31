import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { validateApiKey } from "../lib/apikeys";
import { logUsage, checkCredits } from "../lib/usage";

const inference = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware: authenticate via API key, check credits
async function apiKeyAuth(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: { message: "Missing API key. Pass it as: Authorization: Bearer sk-wp-..." , type: "auth_error" } }, 401);
  }

  const key = authHeader.substring(7);
  const result = await validateApiKey(c.env.DB, key);
  if (!result.valid) {
    return c.json({ error: { message: "Invalid or expired API key", type: "auth_error" } }, 401);
  }

  // Check credits
  const creditCheck = await checkCredits(c.env.DB, result.userId!);
  if (!creditCheck.ok) {
    return c.json({
      error: {
        message: `Insufficient credits (${creditCheck.credits.toFixed(2)} remaining). Top up at /dashboard`,
        type: "billing_error",
      }
    }, 402);
  }

  c.set("userId", result.userId);
  c.set("apiKeyId", result.keyId);
  c.set("userCredits", creditCheck.credits);
  return next();
}

// POST /v1/chat/completions - OpenAI-compatible
inference.post("/v1/chat/completions", apiKeyAuth, async (c) => {
  const body = await c.req.json();
  const { model, messages, max_tokens, temperature, top_p, stream } = body;

  if (!messages || !Array.isArray(messages)) {
    return c.json({ error: { message: "messages array is required", type: "invalid_request" } }, 400);
  }

  const selectedModel = model || "meta-llama/Llama-3.2-3B-Instruct";
  const startTime = Date.now();

  let hfResponse: Response;
  try {
    // Proxy to HuggingFace Router
    hfResponse = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${c.env.HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: max_tokens || 2048,
        temperature: temperature ?? 0.7,
        top_p: top_p ?? 0.95,
        stream: stream || false,
      }),
    });
  } catch (e: any) {
    return c.json({
      error: { message: `Failed to connect to inference provider: ${e.message}`, type: "upstream_error" }
    }, 502);
  }

  if (!hfResponse.ok) {
    const err = await hfResponse.text();
    return c.json({
      error: {
        message: `Upstream error: ${hfResponse.status} - ${err}`,
        type: "upstream_error",
      }
    }, hfResponse.status as any);
  }

  const latencyMs = Date.now() - startTime;
  const userId = c.get("userId") as number;
  const apiKeyId = c.get("apiKeyId") as number;

  if (stream) {
    // For streaming, we pass through the SSE stream and log estimated usage after
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = hfResponse.body!.getReader();
    const decoder = new TextDecoder();
    let outputChunks = 0;

    // Estimate input tokens from message content
    const inputText = messages.map((m: any) => m.content || "").join(" ");
    const estimatedInputTokens = Math.ceil(inputText.length / 4);

    // Stream through and count output
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
          // Rough count of output tokens from SSE chunks
          const text = decoder.decode(value, { stream: true });
          const dataLines = text.split("\n").filter(l => l.startsWith("data: ") && !l.includes("[DONE]"));
          outputChunks += dataLines.length;
        }
      } finally {
        await writer.close();
        // Log usage asynchronously after stream ends
        c.executionCtx.waitUntil(
          logUsage(c.env.DB, {
            userId,
            apiKeyId,
            model: selectedModel,
            endpoint: "/v1/chat/completions",
            inputTokens: estimatedInputTokens,
            outputTokens: outputChunks, // Each SSE chunk ≈ 1 token
            statusCode: 200,
            latencyMs: Date.now() - startTime,
          })
        );
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Credits-Remaining": String(c.get("userCredits")),
      },
    });
  }

  // Non-streaming: parse response, log exact usage
  const result = await hfResponse.json() as any;

  const inputTokens = result.usage?.prompt_tokens || 0;
  const outputTokens = result.usage?.completion_tokens || 0;

  // Log usage in background
  c.executionCtx.waitUntil(
    logUsage(c.env.DB, {
      userId,
      apiKeyId,
      model: selectedModel,
      endpoint: "/v1/chat/completions",
      inputTokens,
      outputTokens,
      statusCode: 200,
      latencyMs,
    })
  );

  return c.json(result);
});

// POST /v1/completions - Text completions
inference.post("/v1/completions", apiKeyAuth, async (c) => {
  const body = await c.req.json();
  const { model, prompt, max_tokens, temperature } = body;

  if (!prompt) {
    return c.json({ error: { message: "prompt is required", type: "invalid_request" } }, 400);
  }

  const selectedModel = model || "Qwen/Qwen2.5-Coder-32B-Instruct";
  const startTime = Date.now();

  let hfResponse: Response;
  try {
    hfResponse = await fetch("https://router.huggingface.co/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${c.env.HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt,
        max_tokens: max_tokens || 512,
        temperature: temperature ?? 0.7,
      }),
    });
  } catch (e: any) {
    return c.json({ error: { message: `Failed to connect to inference provider: ${e.message}`, type: "upstream_error" } }, 502);
  }

  if (!hfResponse.ok) {
    const err = await hfResponse.text();
    return c.json({ error: { message: `Upstream error: ${hfResponse.status} - ${err}`, type: "upstream_error" } }, hfResponse.status as any);
  }

  const result = await hfResponse.json() as any;
  const latencyMs = Date.now() - startTime;

  c.executionCtx.waitUntil(
    logUsage(c.env.DB, {
      userId: c.get("userId") as number,
      apiKeyId: c.get("apiKeyId") as number,
      model: selectedModel,
      endpoint: "/v1/completions",
      inputTokens: result.usage?.prompt_tokens || Math.ceil(prompt.length / 4),
      outputTokens: result.usage?.completion_tokens || 0,
      statusCode: 200,
      latencyMs,
    })
  );

  return c.json(result);
});

// POST /v1/images/generations - Image generation via FLUX
inference.post("/v1/images/generations", apiKeyAuth, async (c) => {
  const body = await c.req.json();
  const { prompt, model, n, size } = body;

  if (!prompt) {
    return c.json({ error: { message: "prompt is required", type: "invalid_request" } }, 400);
  }

  const selectedModel = model || "black-forest-labs/FLUX.1-dev";
  const startTime = Date.now();

  let hfResponse: Response;
  try {
    hfResponse = await fetch(`https://router.huggingface.co/v1/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${c.env.HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt,
        n: n || 1,
        size: size || "1024x1024",
      }),
    });
  } catch (e: any) {
    return c.json({ error: { message: `Failed to connect to inference provider: ${e.message}`, type: "upstream_error" } }, 502);
  }

  if (!hfResponse.ok) {
    const err = await hfResponse.text();
    return c.json({ error: { message: `Upstream error: ${hfResponse.status} - ${err}`, type: "upstream_error" } }, hfResponse.status as any);
  }

  const result = await hfResponse.json();
  const latencyMs = Date.now() - startTime;

  c.executionCtx.waitUntil(
    logUsage(c.env.DB, {
      userId: c.get("userId") as number,
      apiKeyId: c.get("apiKeyId") as number,
      model: selectedModel,
      endpoint: "/v1/images/generations",
      inputTokens: 0,
      outputTokens: (n || 1), // 1 "token" per image for billing
      statusCode: 200,
      latencyMs,
    })
  );

  return c.json(result);
});

// GET /v1/models - List available models
inference.get("/v1/models", async (c) => {
  const models = await c.env.DB.prepare(
    "SELECT model_id, description, architecture, capabilities FROM hf_models WHERE status = 'available' ORDER BY model_id"
  ).all();

  return c.json({
    object: "list",
    data: models.results.map((m: any) => ({
      id: m.model_id,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: m.model_id.split("/")[0] || "unknown",
      description: m.description,
      architecture: m.architecture,
      capabilities: m.capabilities?.split(",") || [],
    })),
  });
});

export { inference };
