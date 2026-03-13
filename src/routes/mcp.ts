import { Hono } from "hono";
import type { Env } from "../types";
import { authMiddleware } from "../lib/auth";

const mcp = new Hono<{ Bindings: Env }>();

// MCP Server Info endpoint
mcp.get("/", async (c) => {
	return c.json({
		protocolVersion: "2024-11-05",
		serverInfo: {
			name: "worker-platform-mcp",
			version: "1.0.0",
		},
		capabilities: {
			tools: { listChanged: true },
			resources: { subscribe: true, listChanged: true },
			prompts: { listChanged: true },
		},
	});
});

// List MCP tools
mcp.get("/tools", authMiddleware, async (c) => {
	const tools = await c.env.DB.prepare(
		"SELECT * FROM mcp_tools WHERE enabled = 1",
	).all();
	return c.json({
		tools: tools.results.map((t: Record<string, unknown>) => ({
			name: t.name,
			description: t.description,
			inputSchema: t.input_schema ? JSON.parse(t.input_schema as string) : {},
		})),
	});
});

// Call MCP tool
mcp.post("/tools/call", authMiddleware, async (c) => {
	const { name, arguments: args } = await c.req.json();
	const tool = await c.env.DB.prepare(
		"SELECT * FROM mcp_tools WHERE name = ? AND enabled = 1",
	)
		.bind(name)
		.first();

	if (!tool) {
		return c.json({ error: `Tool '${name}' not found` }, 404);
	}

	// If tool has a handler worker, dispatch to it
	if (tool.handler_worker) {
		try {
			const worker = c.env.DISPATCHER.get(tool.handler_worker as string);
			const resp = await worker.fetch(
				new Request("https://internal/tool-call", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ tool: name, arguments: args }),
				}),
			);
			const result = await resp.json();
			return c.json({
				content: [{ type: "text", text: JSON.stringify(result) }],
			});
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Unknown error";
			return c.json(
				{ content: [{ type: "text", text: `Error: ${msg}` }], isError: true },
				500,
			);
		}
	}

	// Built-in tool handlers
	switch (name) {
		case "d1_query": {
			const results = await c.env.DB.prepare(args.query)
				.bind(...(args.params || []))
				.all();
			return c.json({
				content: [{ type: "text", text: JSON.stringify(results) }],
			});
		}
		case "kv_get": {
			const value = await c.env.KV.get(args.key);
			return c.json({
				content: [
					{ type: "text", text: value ?? `Key '${args.key}' not found` },
				],
			});
		}
		case "kv_put": {
			await c.env.KV.put(args.key, args.value);
			return c.json({
				content: [{ type: "text", text: `Stored '${args.key}'` }],
			});
		}
		case "list_workers": {
			const workers = await c.env.DB.prepare(
				"SELECT name, status, created_at FROM workers",
			).all();
			return c.json({
				content: [{ type: "text", text: JSON.stringify(workers.results) }],
			});
		}
		default:
			return c.json(
				{
					content: [{ type: "text", text: `Unknown tool: ${name}` }],
					isError: true,
				},
				400,
			);
	}
});

// List MCP resources
mcp.get("/resources", authMiddleware, async (c) => {
	const resources = await c.env.DB.prepare(
		"SELECT * FROM mcp_resources",
	).all();
	return c.json({
		resources: resources.results.map((r: Record<string, unknown>) => ({
			uri: r.uri,
			name: r.name,
			description: r.description,
			mimeType: r.mime_type,
		})),
	});
});

// Read MCP resource
mcp.get("/resources/read", authMiddleware, async (c) => {
	const uri = c.req.query("uri");
	if (!uri) return c.json({ error: "URI required" }, 400);

	const resource = await c.env.DB.prepare(
		"SELECT * FROM mcp_resources WHERE uri = ?",
	)
		.bind(uri)
		.first();

	if (!resource) {
		return c.json({ error: `Resource '${uri}' not found` }, 404);
	}

	// Dynamic resource resolution from KV
	if (uri.startsWith("kv://")) {
		const key = uri.replace("kv://", "");
		const value = await c.env.KV.get(key);
		return c.json({
			contents: [
				{
					uri,
					mimeType: resource.mime_type || "text/plain",
					text: value ?? "",
				},
			],
		});
	}

	// Dynamic resource from D1
	if (uri.startsWith("d1://")) {
		const [table, id] = uri.replace("d1://", "").split("/");
		const result = id
			? await c.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`)
					.bind(id)
					.first()
			: await c.env.DB.prepare(`SELECT * FROM ${table}`).all();
		return c.json({
			contents: [
				{
					uri,
					mimeType: "application/json",
					text: JSON.stringify(id ? result : (result as D1Result).results),
				},
			],
		});
	}

	return c.json({ error: "Cannot resolve resource" }, 400);
});

// Register tool
mcp.post("/tools/register", authMiddleware, async (c) => {
	const { name, description, inputSchema, handlerWorker } = await c.req.json();
	await c.env.DB.prepare(
		"INSERT INTO mcp_tools (name, description, input_schema, handler_worker) VALUES (?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET description=?, input_schema=?, handler_worker=?",
	)
		.bind(
			name,
			description,
			JSON.stringify(inputSchema),
			handlerWorker || null,
			description,
			JSON.stringify(inputSchema),
			handlerWorker || null,
		)
		.run();
	return c.json({ message: "Tool registered", name });
});

// Register resource
mcp.post("/resources/register", authMiddleware, async (c) => {
	const { uri, name, description, mimeType, handlerWorker } =
		await c.req.json();
	await c.env.DB.prepare(
		"INSERT INTO mcp_resources (uri, name, description, mime_type, handler_worker) VALUES (?, ?, ?, ?, ?) ON CONFLICT(uri) DO UPDATE SET name=?, description=?, mime_type=?, handler_worker=?",
	)
		.bind(
			uri,
			name,
			description,
			mimeType || "application/json",
			handlerWorker || null,
			name,
			description,
			mimeType || "application/json",
			handlerWorker || null,
		)
		.run();
	return c.json({ message: "Resource registered", uri });
});

export { mcp };
