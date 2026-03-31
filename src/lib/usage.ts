import type { Env } from "../types";

// Cost per 1K tokens in credits (adjustable pricing)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Large models - higher cost
  "Qwen/Qwen3-235B-A22B": { input: 0.5, output: 1.5 },
  "Qwen/Qwen3-Coder-480B-A35B-Instruct": { input: 0.8, output: 2.0 },
  "meta-llama/Llama-3.1-405B-Instruct": { input: 0.5, output: 1.5 },
  "meta-llama/Llama-4-Maverick-17B-128E-Instruct": { input: 0.3, output: 1.0 },
  "deepseek-ai/DeepSeek-V3-0324": { input: 0.3, output: 1.0 },
  "deepseek-ai/DeepSeek-R1": { input: 0.5, output: 2.0 },
  "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1": { input: 0.5, output: 1.5 },
  // Medium models
  "Qwen/Qwen3-32B": { input: 0.2, output: 0.6 },
  "meta-llama/Llama-3.3-70B-Instruct": { input: 0.2, output: 0.6 },
  "Qwen/Qwen2.5-72B-Instruct": { input: 0.2, output: 0.6 },
  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B": { input: 0.2, output: 0.6 },
  "google/gemma-3-27b-it": { input: 0.1, output: 0.3 },
  "mistralai/Mistral-Small-24B-Instruct-2501": { input: 0.1, output: 0.3 },
  // Small models - cheapest
  "Qwen/Qwen3-8B": { input: 0.05, output: 0.15 },
  "meta-llama/Llama-3.2-3B-Instruct": { input: 0.03, output: 0.08 },
  "google/gemma-2-2b-it": { input: 0.02, output: 0.05 },
  // Image generation
  "black-forest-labs/FLUX.1-dev": { input: 0, output: 5.0 },
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

  // Log usage and deduct credits in a batch
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
