import { Hono } from "hono";
import type { Env } from "../types";

const openapi = new Hono<{ Bindings: Env }>();

openapi.get("/openapi.json", async (c) => {
	const origin = new URL(c.req.url).origin;
	return c.json({
		openapi: "3.1.0",
		info: {
			title: "Worker Platform API",
			description:
				"Cloudflare Worker platform with D1 storage, KV namespace, MCP tools, OpenCode/Codex agent SDKs, and OpenAuth integration.",
			version: "1.0.0",
			contact: { name: "Worker Platform" },
		},
		servers: [{ url: origin, description: "Worker Platform" }],
		security: [{ bearerAuth: [] }],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
		paths: {
			"/auth/authorize": {
				get: {
					tags: ["Auth"],
					summary: "OAuth authorize endpoint",
					parameters: [
						{ name: "redirect_uri", in: "query", required: true, schema: { type: "string" } },
						{ name: "client_id", in: "query", required: true, schema: { type: "string" } },
						{ name: "response_type", in: "query", schema: { type: "string", default: "code" } },
					],
					responses: { "200": { description: "Login form" } },
				},
			},
			"/auth/login": {
				post: {
					tags: ["Auth"],
					summary: "Login with email",
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										email: { type: "string" },
										password: { type: "string" },
										redirect_uri: { type: "string" },
										client_id: { type: "string" },
									},
									required: ["email"],
								},
							},
						},
					},
					responses: { "200": { description: "Auth token" } },
				},
			},
			"/auth/token": {
				post: {
					tags: ["Auth"],
					summary: "Exchange code for token",
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										code: { type: "string" },
										grant_type: { type: "string" },
									},
								},
							},
						},
					},
					responses: { "200": { description: "Access token" } },
				},
			},
			"/mcp": {
				get: {
					tags: ["MCP"],
					summary: "MCP server info",
					responses: { "200": { description: "Server capabilities" } },
				},
			},
			"/mcp/tools": {
				get: {
					tags: ["MCP"],
					summary: "List available MCP tools",
					security: [{ bearerAuth: [] }],
					responses: { "200": { description: "Tool list" } },
				},
			},
			"/mcp/tools/call": {
				post: {
					tags: ["MCP"],
					summary: "Call an MCP tool",
					security: [{ bearerAuth: [] }],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: { type: "string" },
										arguments: { type: "object" },
									},
									required: ["name"],
								},
							},
						},
					},
					responses: { "200": { description: "Tool result" } },
				},
			},
			"/mcp/tools/register": {
				post: {
					tags: ["MCP"],
					summary: "Register a new MCP tool",
					security: [{ bearerAuth: [] }],
					responses: { "200": { description: "Tool registered" } },
				},
			},
			"/mcp/resources": {
				get: {
					tags: ["MCP"],
					summary: "List MCP resources",
					security: [{ bearerAuth: [] }],
					responses: { "200": { description: "Resource list" } },
				},
			},
			"/agents/sessions": {
				post: {
					tags: ["Agents"],
					summary: "Create agent session (codex, opencode, or chat)",
					security: [{ bearerAuth: [] }],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										agentType: { type: "string", enum: ["codex", "opencode", "chat"] },
										model: { type: "string" },
										context: { type: "object" },
									},
									required: ["agentType"],
								},
							},
						},
					},
					responses: { "201": { description: "Session created" } },
				},
				get: {
					tags: ["Agents"],
					summary: "List user agent sessions",
					security: [{ bearerAuth: [] }],
					responses: { "200": { description: "Session list" } },
				},
			},
			"/agents/sessions/{id}/messages": {
				post: {
					tags: ["Agents"],
					summary: "Send message to agent session",
					security: [{ bearerAuth: [] }],
					parameters: [
						{ name: "id", in: "path", required: true, schema: { type: "string" } },
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										content: { type: "string" },
										model: { type: "string" },
									},
									required: ["content"],
								},
							},
						},
					},
					responses: { "200": { description: "Agent response" } },
				},
			},
			"/agents/models": {
				get: {
					tags: ["Agents"],
					summary: "List available HuggingFace models",
					responses: { "200": { description: "Model list" } },
				},
			},
			"/rest/{table}": {
				get: {
					tags: ["REST"],
					summary: "List records from a D1 table",
					security: [{ bearerAuth: [] }],
					parameters: [
						{ name: "table", in: "path", required: true, schema: { type: "string" } },
					],
					responses: { "200": { description: "Records" } },
				},
				post: {
					tags: ["REST"],
					summary: "Create record in D1 table",
					security: [{ bearerAuth: [] }],
					parameters: [
						{ name: "table", in: "path", required: true, schema: { type: "string" } },
					],
					responses: { "201": { description: "Created" } },
				},
			},
			"/rest/{table}/{id}": {
				get: {
					tags: ["REST"],
					summary: "Get record by ID",
					security: [{ bearerAuth: [] }],
					parameters: [
						{ name: "table", in: "path", required: true, schema: { type: "string" } },
						{ name: "id", in: "path", required: true, schema: { type: "string" } },
					],
					responses: { "200": { description: "Record" } },
				},
				patch: {
					tags: ["REST"],
					summary: "Update record",
					security: [{ bearerAuth: [] }],
					parameters: [
						{ name: "table", in: "path", required: true, schema: { type: "string" } },
						{ name: "id", in: "path", required: true, schema: { type: "string" } },
					],
					responses: { "200": { description: "Updated" } },
				},
				delete: {
					tags: ["REST"],
					summary: "Delete record",
					security: [{ bearerAuth: [] }],
					parameters: [
						{ name: "table", in: "path", required: true, schema: { type: "string" } },
						{ name: "id", in: "path", required: true, schema: { type: "string" } },
					],
					responses: { "200": { description: "Deleted" } },
				},
			},
			"/deploy": {
				post: {
					tags: ["Workers"],
					summary: "Deploy a worker to dispatch namespace",
					security: [{ bearerAuth: [] }],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										scriptName: { type: "string" },
										code: { type: "string" },
									},
									required: ["scriptName", "code"],
								},
							},
						},
					},
					responses: { "200": { description: "Deployed" } },
				},
			},
			"/{workerName}": {
				get: {
					tags: ["Workers"],
					summary: "Dispatch request to named worker",
					parameters: [
						{ name: "workerName", in: "path", required: true, schema: { type: "string" } },
					],
					responses: { "200": { description: "Worker response" } },
				},
			},
		},
	});
});

export { openapi };
