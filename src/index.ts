import { Hono } from "hono";
import { cors } from "hono/cors";
import Cloudflare from "cloudflare";
import type { Env } from "./types";
import { authMiddleware } from "./lib/auth";
import { handleRest } from "./lib/rest";
import { mcp } from "./routes/mcp";
import { agents } from "./routes/agents";
import { auth } from "./routes/auth";
import { openapi } from "./routes/openapi";
import { chatui } from "./routes/chatui";

const app = new Hono<{ Bindings: Env }>();

// Global CORS
app.use("*", cors());

// Health check
app.get("/health", (c) =>
	c.json({
		status: "ok",
		services: ["d1", "kv", "mcp", "openauth", "codex", "opencode", "chat"],
		version: "1.0.0",
	}),
);

// OpenAPI spec
app.route("/", openapi);

// Auth routes (OpenAuth-compatible)
app.route("/auth", auth);

// MCP routes (FastMCP-compatible)
app.route("/mcp", mcp);

// Agent routes (Codex, OpenCode, HF Chat)
app.route("/agents", agents);

// HuggingFace Chat UI compatible endpoints
app.route("/chat", chatui);
app.route("/", chatui);

// D1 REST API
app.all("/rest/*", authMiddleware, handleRest);

// Raw SQL query endpoint
app.post("/query", authMiddleware, async (c) => {
	const { query, params } = await c.req.json();
	if (!query) return c.json({ error: "Query is required" }, 400);
	const results = await c.env.DB.prepare(query)
		.bind(...(params || []))
		.all();
	return c.json(results);
});

// Worker deployment
app.post("/deploy", async (c) => {
	const isReadOnly = c.env.READONLY === "true" || c.env.READONLY === true;
	if (isReadOnly) {
		return c.json({ error: "Read-only mode enabled" }, 403);
	}

	const { scriptName, code } = await c.req.json();
	if (!scriptName || !code) {
		return c.json({ error: "Missing scriptName or code" }, 400);
	}

	const cf = new Cloudflare({ apiToken: c.env.CLOUDFLARE_API_TOKEN });
	const namespaceName = "my-dispatch-namespace";

	try {
		await cf.workersForPlatforms.dispatch.namespaces.get(namespaceName, {
			account_id: c.env.CLOUDFLARE_ACCOUNT_ID,
		});
	} catch {
		await cf.workersForPlatforms.dispatch.namespaces.create({
			account_id: c.env.CLOUDFLARE_ACCOUNT_ID,
			name: namespaceName,
		});
	}

	const moduleFileName = `${scriptName}.mjs`;
	await cf.workersForPlatforms.dispatch.namespaces.scripts.update(
		namespaceName,
		scriptName,
		{
			account_id: c.env.CLOUDFLARE_ACCOUNT_ID,
			metadata: { main_module: moduleFileName, bindings: [] },
			files: [
				new File([code], moduleFileName, {
					type: "application/javascript+module",
				}),
			],
		},
	);

	// Record in D1
	await c.env.DB.prepare(
		"INSERT INTO workers (name, namespace, code) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET code = ?, updated_at = datetime('now')",
	)
		.bind(scriptName, namespaceName, code, code)
		.run();

	return c.json({ namespace: namespaceName, script: scriptName });
});

// UI - serve the worker publisher
app.get("/", (c) => {
	const isReadOnly = c.env.READONLY === "true" || c.env.READONLY === true;
	return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>Worker Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .nav { background: #1e293b; border-bottom: 1px solid #334155; padding: 1rem 2rem; display: flex; gap: 2rem; align-items: center; }
    .nav h1 { font-size: 1.25rem; color: #f97316; }
    .nav a { color: #94a3b8; text-decoration: none; font-size: 0.9rem; }
    .nav a:hover { color: #f97316; }
    .container { max-width: 1000px; margin: 2rem auto; padding: 0 2rem; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; }
    .card h3 { color: #f97316; margin-bottom: 0.5rem; }
    .card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }
    .card a { display: inline-block; margin-top: 1rem; color: #f97316; text-decoration: none; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge-green { background: #065f46; color: #6ee7b7; }
    .badge-blue { background: #1e3a5f; color: #93c5fd; }
    .badge-orange { background: #7c2d12; color: #fdba74; }
  </style>
</head>
<body>
  <nav class="nav">
    <h1>Worker Platform</h1>
    <a href="/openapi.json">OpenAPI</a>
    <a href="/mcp">MCP</a>
    <a href="/agents/models">Models</a>
    <a href="/health">Health</a>
    <a href="/auth/authorize?redirect_uri=${encodeURIComponent("/")}&client_id=platform&response_type=code">Sign In</a>
  </nav>
  <div class="container">
    <h2>Integrated AI Worker Platform</h2>
    <p style="color: #94a3b8; margin-top: 0.5rem;">D1 Storage + KV Namespace + MCP Tools + Agent SDKs + OpenAuth</p>
    <div class="cards">
      <div class="card">
        <h3>MCP Server <span class="badge badge-green">FastMCP</span></h3>
        <p>Model Context Protocol tools and resources. Register custom tools backed by Workers or built-in D1/KV operations.</p>
        <a href="/mcp">Explore Tools &rarr;</a>
      </div>
      <div class="card">
        <h3>Agent Sessions <span class="badge badge-blue">AI SDKs</span></h3>
        <p>Create sessions with Codex, OpenCode, or HuggingFace Chat agents. Full conversation history stored in D1.</p>
        <a href="/agents/sessions">View Sessions &rarr;</a>
      </div>
      <div class="card">
        <h3>D1 REST API <span class="badge badge-orange">CRUD</span></h3>
        <p>Full REST API over any D1 table. Supports filtering, sorting, pagination, and raw SQL queries.</p>
        <a href="/rest/users">Browse Data &rarr;</a>
      </div>
      <div class="card">
        <h3>Worker Deploy ${isReadOnly ? '<span class="badge" style="background:#7f1d1d;color:#fca5a5;">Read Only</span>' : ""}</h3>
        <p>Deploy JavaScript workers to the dispatch namespace. Workers are automatically registered in D1.</p>
        <a href="/deploy">Deploy &rarr;</a>
      </div>
      <div class="card">
        <h3>OpenAuth <span class="badge badge-green">OAuth 2.0</span></h3>
        <p>OpenAuth-compatible authentication with password provider, KV session storage, and D1 user management.</p>
        <a href="/auth/.well-known/openid-configuration">Discovery &rarr;</a>
      </div>
      <div class="card">
        <h3>HuggingFace Models</h3>
        <p>Browse available models from the HuggingFace Router for inference in chat sessions.</p>
        <a href="/agents/models">View Models &rarr;</a>
      </div>
    </div>
  </div>
</body>
</html>`);
});

// Worker dispatch - must be last (catch-all)
app.all("/:workerName{[^/]+}/*", async (c) => {
	const workerName = c.req.param("workerName");
	// Skip known routes
	if (
		["auth", "mcp", "agents", "rest", "query", "deploy", "health"].includes(
			workerName,
		)
	) {
		return c.notFound();
	}
	try {
		const worker = c.env.DISPATCHER.get(workerName);
		return await worker.fetch(c.req.raw);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : "Unknown error";
		if (msg.startsWith("Worker not found")) {
			return c.json({ error: `Worker '${workerName}' not found` }, 404);
		}
		return c.json({ error: "Internal error" }, 500);
	}
});

export default app;
