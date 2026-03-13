import { Hono } from "hono";
import type { Env } from "../types";
import { authMiddleware } from "../lib/auth";

const chatui = new Hono<{ Bindings: Env }>();

// HuggingFace Chat UI compatible endpoint configuration
// Provides the settings that HF Chat UI needs to connect to this platform
chatui.get("/config", async (c) => {
	const origin = new URL(c.req.url).origin;
	const models = await c.env.DB.prepare(
		"SELECT model_id, description FROM hf_models WHERE status = 'available' LIMIT 50",
	).all();

	return c.json({
		MODELS: JSON.stringify(
			models.results.map((m: Record<string, unknown>) => ({
				name: m.model_id,
				displayName: (m.model_id as string).split("/").pop(),
				description: m.description || "",
				websiteUrl: `https://huggingface.co/${m.model_id}`,
				endpoints: [
					{
						type: "openai",
						baseURL: `${origin}/v1`,
					},
				],
			})),
		),
		OPENID_CONFIG: `${origin}/auth/.well-known/openid-configuration`,
		PUBLIC_APP_NAME: "Worker Platform Chat",
		PUBLIC_APP_DESCRIPTION:
			"AI Chat powered by Worker Platform with MCP tools and agent SDKs",
		PUBLIC_APP_COLOR: "orange",
	});
});

// OpenAI-compatible chat completions for HF Chat UI
chatui.post("/v1/chat/completions", authMiddleware, async (c) => {
	const body = await c.req.json();
	const { model, messages, max_tokens, stream: useStream } = body;

	// Route to HuggingFace Router
	const resp = await fetch(
		"https://router.huggingface.co/v1/chat/completions",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${c.env.HF_API_TOKEN}`,
			},
			body: JSON.stringify({
				model: model || "meta-llama/Llama-3.1-8B-Instruct",
				messages,
				max_tokens: max_tokens || 2048,
				stream: useStream || false,
			}),
		},
	);

	if (useStream) {
		return new Response(resp.body, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	}

	return c.json(await resp.json());
});

// Models listing compatible with OpenAI /v1/models
chatui.get("/v1/models", async (c) => {
	const models = await c.env.DB.prepare(
		"SELECT model_id, description FROM hf_models WHERE status = 'available' ORDER BY model_id",
	).all();

	return c.json({
		object: "list",
		data: models.results.map((m: Record<string, unknown>) => ({
			id: m.model_id,
			object: "model",
			created: Date.now(),
			owned_by: (m.model_id as string).split("/")[0] || "unknown",
			description: m.description,
		})),
	});
});

export { chatui };
