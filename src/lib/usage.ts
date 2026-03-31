import type { Env } from "../types";

// Cost per 1K tokens in credits (adjustable pricing)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // === FLAGSHIP / LARGE (highest cost) ===
  "Qwen/Qwen3.5-397B-A17B": { input: 0.6, output: 2.0 },
  "Qwen/Qwen3.5-122B-A10B": { input: 0.4, output: 1.2 },
  "mistralai/Mistral-Large-3-675B-Instruct-2512": { input: 0.6, output: 2.0 },
  "deepseek-ai/DeepSeek-V3.2": { input: 0.4, output: 1.2 },
  "deepseek-ai/DeepSeek-V3.2-Speciale": { input: 0.5, output: 2.0 },
  "deepseek-ai/DeepSeek-R1": { input: 0.5, output: 2.0 },
  "Qwen/Qwen3-235B-A22B": { input: 0.5, output: 1.5 },

  // === MEDIUM ===
  "Qwen/Qwen3.5-35B-A3B": { input: 0.1, output: 0.3 },
  "Qwen/Qwen3.5-27B": { input: 0.15, output: 0.5 },
  "mistralai/Mistral-Small-4-119B-2603": { input: 0.3, output: 1.0 },
  "deepseek-ai/DeepSeek-V3.1": { input: 0.3, output: 1.0 },
  "deepseek-ai/DeepSeek-V3-0324": { input: 0.3, output: 1.0 },
  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B": { input: 0.2, output: 0.6 },
  "meta-llama/Llama-4-Scout-17B-16E-Instruct": { input: 0.2, output: 0.6 },
  "meta-llama/Llama-3.3-70B-Instruct": { input: 0.2, output: 0.6 },
  "meta-llama/Llama-3.1-70B-Instruct": { input: 0.2, output: 0.6 },
  "moonshotai/Kimi-K2.5": { input: 0.3, output: 1.0 },
  "moonshotai/Kimi-K2-Instruct": { input: 0.3, output: 1.0 },
  "moonshotai/Kimi-K2-Thinking": { input: 0.3, output: 1.5 },
  "Qwen/Qwen3-32B": { input: 0.2, output: 0.6 },
  "Qwen/Qwen3-Coder-30B-A3B-Instruct": { input: 0.1, output: 0.3 },
  "google/gemma-3-27b-it": { input: 0.1, output: 0.3 },
  "google/gemma-3-12b-it": { input: 0.08, output: 0.2 },
  "mistralai/Mixtral-8x7B-Instruct-v0.1": { input: 0.1, output: 0.3 },
  "mistralai/Mistral-Small-24B-Instruct-2501": { input: 0.1, output: 0.3 },
  "CohereLabs/aya-vision-32b": { input: 0.2, output: 0.6 },

  // === SMALL / EFFICIENT (cheapest) ===
  "Qwen/Qwen3.5-9B": { input: 0.05, output: 0.15 },
  "Qwen/Qwen3.5-4B": { input: 0.03, output: 0.08 },
  "Qwen/Qwen3.5-2B": { input: 0.02, output: 0.05 },
  "Qwen/Qwen3-8B": { input: 0.05, output: 0.15 },
  "meta-llama/Llama-3.2-3B-Instruct": { input: 0.03, output: 0.08 },
  "meta-llama/Meta-Llama-3-8B-Instruct": { input: 0.05, output: 0.15 },
  "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B": { input: 0.03, output: 0.08 },
  "google/gemma-3-4b-it": { input: 0.03, output: 0.08 },
  "google/gemma-3-1b-it": { input: 0.01, output: 0.03 },
  "microsoft/Phi-4-mini-instruct": { input: 0.03, output: 0.08 },
  "microsoft/Phi-3.5-mini-instruct": { input: 0.02, output: 0.05 },

  // === IMAGE GENERATION (per image) ===
  "black-forest-labs/FLUX.2-dev": { input: 0, output: 8.0 },
  "black-forest-labs/FLUX.1-dev": { input: 0, output: 5.0 },
  "black-forest-labs/FLUX.1-schnell": { input: 0, output: 3.0 },
  "stabilityai/stable-diffusion-3.5-large": { input: 0, output: 5.0 },
  "stabilityai/stable-diffusion-3.5-large-turbo": { input: 0, output: 3.0 },
  "stabilityai/stable-diffusion-3.5-medium": { input: 0, output: 3.0 },

  // === SPEECH ===
  "mistralai/Voxtral-4B-TTS-2603": { input: 0.05, output: 0.2 },
};

const DEFAULT_PRICING = { input: 0.1, output: 0.3 };

export function getModelPricing(model: string) {
  return MODEL_PRICING[model] || DEFAULT_PRICING;
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(model);
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}

export async function logUsage(
  db: D1Database,
  params: {
    userId: number;
    apiKeyId: number | null;
    model: string;
    endpoint: string;
    inputTokens: number;
    outputTokens: number;
    statusCode: number;
    latencyMs: number;
  }
) {
  const totalTokens = params.inputTokens + params.outputTokens;
  const cost = calculateCost(params.model, params.inputTokens, params.outputTokens);

  const batch = [
    db.prepare(
      `INSERT INTO usage_logs (user_id, api_key_id, model, endpoint, input_tokens, output_tokens, total_tokens, cost_credits, status_code, latency_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      params.userId, params.apiKeyId, params.model, params.endpoint,
      params.inputTokens, params.outputTokens, totalTokens, cost,
      params.statusCode, params.latencyMs
    ),
    db.prepare(
      `UPDATE users SET credits = credits - ? WHERE id = ?`
    ).bind(cost, params.userId),
    db.prepare(
      `INSERT INTO credit_transactions (user_id, amount, type, description, balance_after)
       VALUES (?, ?, 'usage', ?, (SELECT credits FROM users WHERE id = ?))`
    ).bind(params.userId, -cost, `${params.model} - ${totalTokens} tokens`, params.userId),
  ];

  if (params.apiKeyId) {
    batch.push(
      db.prepare(`UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?`).bind(params.apiKeyId)
    );
  }

  await db.batch(batch);
  return { cost, totalTokens };
}

export async function checkCredits(db: D1Database, userId: number): Promise<{ ok: boolean; credits: number }> {
  const user = await db.prepare("SELECT credits FROM users WHERE id = ?").bind(userId).first<{ credits: number }>();
  if (!user) return { ok: false, credits: 0 };
  return { ok: user.credits > 0, credits: user.credits };
}
