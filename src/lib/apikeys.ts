import type { Env } from "../types";

// Generate a random API key: sk-wp-<32 hex chars>
export function generateApiKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return `sk-wp-${hex}`;
}

// Hash API key for storage (we store hash, return raw key only once)
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function createApiKey(
  db: D1Database,
  userId: number,
  name: string,
  rateLimitRpm: number = 60
): Promise<{ key: string; id: number }> {
  const key = generateApiKey();
  const keyHash = await hashApiKey(key);

  const result = await db.prepare(
    `INSERT INTO api_keys (user_id, key_hash, name, rate_limit_rpm) VALUES (?, ?, ?, ?)`
  ).bind(userId, keyHash, name, rateLimitRpm).run();

  return { key, id: result.meta.last_row_id as number };
}

export async function validateApiKey(
  db: D1Database,
  rawKey: string
): Promise<{ valid: boolean; userId?: number; keyId?: number; email?: string; role?: string; rateLimitRpm?: number }> {
  const keyHash = await hashApiKey(rawKey);

  const row = await db.prepare(
    `SELECT ak.id, ak.user_id, ak.rate_limit_rpm, u.email, u.role
     FROM api_keys ak JOIN users u ON ak.user_id = u.id
     WHERE ak.key_hash = ? AND (ak.expires_at IS NULL OR ak.expires_at > datetime('now'))`
  ).bind(keyHash).first<{ id: number; user_id: number; rate_limit_rpm: number; email: string; role: string }>();

  if (!row) return { valid: false };
  return {
    valid: true,
    userId: row.user_id,
    keyId: row.id,
    email: row.email,
    role: row.role,
    rateLimitRpm: row.rate_limit_rpm,
  };
}

export async function listApiKeys(db: D1Database, userId: number) {
  return db.prepare(
    `SELECT id, name, substr(key_hash, 1, 8) as key_prefix, scopes, rate_limit_rpm, last_used_at, expires_at, created_at
     FROM api_keys WHERE user_id = ?`
  ).bind(userId).all();
}

export async function revokeApiKey(db: D1Database, keyId: number, userId: number) {
  return db.prepare(
    `DELETE FROM api_keys WHERE id = ? AND user_id = ?`
  ).bind(keyId, userId).run();
}
