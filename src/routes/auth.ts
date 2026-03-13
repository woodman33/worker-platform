import { Hono } from "hono";
import type { Env } from "../types";

const auth = new Hono<{ Bindings: Env }>();

// OpenAuth-compatible authorize endpoint
auth.get("/authorize", async (c) => {
	const redirectUri = c.req.query("redirect_uri");
	const clientId = c.req.query("client_id");
	const responseType = c.req.query("response_type");

	if (!redirectUri || !clientId) {
		return c.json({ error: "Missing redirect_uri or client_id" }, 400);
	}

	// Render login form
	return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>Sign In - Worker Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 24px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-weight: 600; margin-bottom: 0.25rem; font-size: 0.9rem; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
    button { width: 100%; padding: 0.75rem; background: #0051c3; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #003d94; }
    .error { color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Worker Platform</h1>
    <form id="loginForm">
      <input type="hidden" name="redirect_uri" value="${redirectUri}">
      <input type="hidden" name="client_id" value="${clientId}">
      <input type="hidden" name="response_type" value="${responseType || "code"}">
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" required>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" required>
      </div>
      <div class="error" id="error"></div>
      <button type="submit">Sign In</button>
    </form>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const resp = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form))
      });
      const data = await resp.json();
      if (resp.ok && data.redirect) {
        window.location.href = data.redirect;
      } else {
        document.getElementById('error').textContent = data.error || 'Login failed';
        document.getElementById('error').style.display = 'block';
      }
    });
  </script>
</body>
</html>`);
});

// Login endpoint
auth.post("/login", async (c) => {
	const { email, password, redirect_uri, client_id } = await c.req.json();

	if (!email) {
		return c.json({ error: "Email required" }, 400);
	}

	// Get or create user
	const user = await c.env.DB.prepare(
		"INSERT INTO users (email) VALUES (?) ON CONFLICT (email) DO UPDATE SET email = email RETURNING *",
	)
		.bind(email)
		.first();

	if (!user) {
		return c.json({ error: "Unable to process user" }, 500);
	}

	// Create session token
	const token = crypto.randomUUID();
	const sessionId = crypto.randomUUID();

	// Store in KV
	await c.env.SESSION_STORE.put(
		`token:${token}`,
		JSON.stringify({ user: { id: user.id, email: user.email, role: user.role } }),
		{ expirationTtl: 86400 },
	);
	await c.env.SESSION_STORE.put(
		`session:${sessionId}`,
		JSON.stringify({ user: { id: user.id, email: user.email, role: user.role }, token }),
		{ expirationTtl: 86400 },
	);

	if (redirect_uri) {
		const url = new URL(redirect_uri);
		url.searchParams.set("code", token);
		return c.json({
			redirect: url.toString(),
			token,
			session: sessionId,
		});
	}

	return c.json({
		token,
		session: sessionId,
		user: { id: user.id, email: user.email, role: user.role },
	});
});

// Token exchange
auth.post("/token", async (c) => {
	const { code, grant_type } = await c.req.json();

	if (grant_type === "authorization_code" && code) {
		const sessionData = await c.env.SESSION_STORE.get(`token:${code}`);
		if (sessionData) {
			return c.json({
				access_token: code,
				token_type: "Bearer",
				expires_in: 86400,
				user: JSON.parse(sessionData).user,
			});
		}
	}

	return c.json({ error: "Invalid grant" }, 400);
});

// User info
auth.get("/userinfo", async (c) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const token = authHeader.substring(7);
	const sessionData = await c.env.SESSION_STORE.get(`token:${token}`);
	if (!sessionData) {
		return c.json({ error: "Invalid token" }, 401);
	}
	return c.json(JSON.parse(sessionData).user);
});

// Logout
auth.post("/logout", async (c) => {
	const authHeader = c.req.header("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.substring(7);
		await c.env.SESSION_STORE.delete(`token:${token}`);
	}
	return c.json({ message: "Logged out" });
});

// OpenAuth .well-known discovery
auth.get("/.well-known/openid-configuration", async (c) => {
	const origin = new URL(c.req.url).origin;
	return c.json({
		issuer: origin,
		authorization_endpoint: `${origin}/auth/authorize`,
		token_endpoint: `${origin}/auth/token`,
		userinfo_endpoint: `${origin}/auth/userinfo`,
		response_types_supported: ["code"],
		grant_types_supported: ["authorization_code"],
		subject_types_supported: ["public"],
		id_token_signing_alg_values_supported: ["RS256"],
	});
});

export { auth };
