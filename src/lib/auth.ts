import type { Context, Next } from "hono";
import type { Env } from "../types";

export async function authMiddleware(
	c: Context<{ Bindings: Env }>,
	next: Next,
) {
	const authHeader = c.req.header("Authorization");
	const sessionCookie = c.req.header("Cookie")?.match(/session=([^;]+)/)?.[1];

	// Check bearer token
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.substring(7);

		// Check API key in D1
		const apiKey = await c.env.DB.prepare(
			"SELECT ak.*, u.email, u.role FROM api_keys ak JOIN users u ON ak.user_id = u.id WHERE ak.key_hash = ? AND (ak.expires_at IS NULL OR ak.expires_at > datetime('now'))",
		)
			.bind(token)
			.first();

		if (apiKey) {
			c.set("user", {
				id: apiKey.user_id,
				email: apiKey.email,
				role: apiKey.role,
			});
			return next();
		}

		// Try OpenAuth token verification via KV session store
		const sessionData = await c.env.SESSION_STORE.get(`token:${token}`);
		if (sessionData) {
			const session = JSON.parse(sessionData);
			c.set("user", session.user);
			return next();
		}
	}

	// Check session cookie
	if (sessionCookie) {
		const sessionData = await c.env.SESSION_STORE.get(
			`session:${sessionCookie}`,
		);
		if (sessionData) {
			const session = JSON.parse(sessionData);
			c.set("user", session.user);
			return next();
		}
	}

	return c.json({ error: "Unauthorized" }, 401);
}

export async function optionalAuth(
	c: Context<{ Bindings: Env }>,
	next: Next,
) {
	const authHeader = c.req.header("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.substring(7);
		const sessionData = await c.env.SESSION_STORE.get(`token:${token}`);
		if (sessionData) {
			c.set("user", JSON.parse(sessionData).user);
		}
	}
	return next();
}
