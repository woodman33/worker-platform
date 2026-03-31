import type { Next } from "hono";
import type { Env, Variables } from "../types";
import { validateApiKey } from "./apikeys";

type AppContext = { Bindings: Env; Variables: Variables };

export async function authMiddleware(c: any, next: Next) {
	const authHeader = c.req.header("Authorization");
	const sessionCookie = c.req.header("Cookie")?.match(/session=([^;]+)/)?.[1];

	// Check bearer token
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.substring(7);

		// Check API key (hashed lookup)
		const result = await validateApiKey(c.env.DB, token);
		if (result.valid) {
			c.set("user", {
				id: result.userId,
				email: result.email,
				role: result.role,
			});
			return next();
		}

		// Try session token via KV
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
