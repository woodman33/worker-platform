import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { authMiddleware } from "../lib/auth";
import { createApiKey, listApiKeys, revokeApiKey } from "../lib/apikeys";

const keys = new Hono<{ Bindings: Env; Variables: Variables }>();

// POST /keys - Create a new API key
keys.post("/", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const { name, rate_limit_rpm } = await c.req.json();

  if (!name) return c.json({ error: "name is required" }, 400);

  const { key, id } = await createApiKey(c.env.DB, user.id, name, rate_limit_rpm || 60);

  return c.json({
    id,
    key, // Only shown once!
    name,
    message: "Save this key — it won't be shown again.",
  }, 201);
});

// GET /keys - List API keys for current user
keys.get("/", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const result = await listApiKeys(c.env.DB, user.id);
  return c.json({ keys: result.results });
});

// DELETE /keys/:id - Revoke an API key
keys.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const keyId = parseInt(c.req.param("id") || "0");
  await revokeApiKey(c.env.DB, keyId, user.id);
  return c.json({ deleted: true });
});

export { keys };
