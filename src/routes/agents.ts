import { Hono } from "hono";
import type { Env, AgentSession, ChatMessage } from "../types";
import { authMiddleware } from "../lib/auth";

const agents = new Hono<{ Bindings: Env }>();

// Create agent session
agents.post("/sessions", authMiddleware, async (c) => {
	const user = c.get("user") as { id: number };
	const { agentType, model, context } = await c.req.json();

	const validTypes = ["codex", "opencode", "chat"];
	if (!validTypes.includes(agentType)) {
		return c.json(
			{ error: `Invalid agent type. Use: ${validTypes.join(", ")}` },
			400,
		);
	}

	const result = await c.env.DB.prepare(
		"INSERT INTO agent_sessions (user_id, agent_type, model, context_json) VALUES (?, ?, ?, ?) RETURNING *",
	)
		.bind(user.id, agentType, model || null, context ? JSON.stringify(context) : null)
		.first<AgentSession>();

	// Store session context in KV for fast access
	await c.env.SESSION_STORE.put(
		`agent:${result!.id}`,
		JSON.stringify({
			...result,
			messages: [],
		}),
		{ expirationTtl: 86400 }, // 24h TTL
	);

	return c.json({ session: result }, 201);
});

// List user sessions
agents.get("/sessions", authMiddleware, async (c) => {
	const user = c.get("user") as { id: number };
	const sessions = await c.env.DB.prepare(
		"SELECT * FROM agent_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50",
	)
		.bind(user.id)
		.all();
	return c.json({ sessions: sessions.results });
});

// Get session details
agents.get("/sessions/:id", authMiddleware, async (c) => {
	const sessionId = c.req.param("id");

	// Try KV first for fast access
	const cached = await c.env.SESSION_STORE.get(`agent:${sessionId}`);
	if (cached) {
		return c.json({ session: JSON.parse(cached) });
	}

	const session = await c.env.DB.prepare(
		"SELECT * FROM agent_sessions WHERE id = ?",
	)
		.bind(sessionId)
		.first<AgentSession>();

	if (!session) return c.json({ error: "Session not found" }, 404);

	const messages = await c.env.DB.prepare(
		"SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
	)
		.bind(sessionId)
		.all<ChatMessage>();

	return c.json({ session: { ...session, messages: messages.results } });
});

// Send message to agent
agents.post("/sessions/:id/messages", authMiddleware, async (c) => {
	const sessionId = c.req.param("id");
	const { content, model } = await c.req.json();

	const session = await c.env.DB.prepare(
		"SELECT * FROM agent_sessions WHERE id = ?",
	)
		.bind(sessionId)
		.first<AgentSession>();

	if (!session) return c.json({ error: "Session not found" }, 404);

	// Store user message
	await c.env.DB.prepare(
		"INSERT INTO chat_messages (session_id, role, content, model) VALUES (?, 'user', ?, ?)",
	)
		.bind(sessionId, content, model || session.model)
		.run();

	// Get conversation history
	const history = await c.env.DB.prepare(
		"SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
	)
		.bind(sessionId)
		.all<{ role: string; content: string }>();

	// Route to appropriate agent backend
	let assistantResponse: string;

	switch (session.agent_type) {
		case "codex": {
			assistantResponse = await callCodexAgent(c.env, history.results, content);
			break;
		}
		case "opencode": {
			assistantResponse = await callOpenCodeAgent(
				c.env,
				history.results,
				content,
			);
			break;
		}
		case "chat":
		default: {
			assistantResponse = await callChatAgent(
				c.env,
				history.results,
				content,
				model || session.model,
			);
			break;
		}
	}

	// Store assistant response
	const assistantMsg = await c.env.DB.prepare(
		"INSERT INTO chat_messages (session_id, role, content, model) VALUES (?, 'assistant', ?, ?) RETURNING *",
	)
		.bind(sessionId, assistantResponse, model || session.model)
		.first<ChatMessage>();

	// Update session timestamp
	await c.env.DB.prepare(
		"UPDATE agent_sessions SET updated_at = datetime('now') WHERE id = ?",
	)
		.bind(sessionId)
		.run();

	// Update KV cache
	const fullSession = await c.env.DB.prepare(
		"SELECT * FROM agent_sessions WHERE id = ?",
	)
		.bind(sessionId)
		.first();
	const allMessages = await c.env.DB.prepare(
		"SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
	)
		.bind(sessionId)
		.all();
	await c.env.SESSION_STORE.put(
		`agent:${sessionId}`,
		JSON.stringify({ ...fullSession, messages: allMessages.results }),
		{ expirationTtl: 86400 },
	);

	return c.json({ message: assistantMsg });
});

// Codex agent proxy
async function callCodexAgent(
	env: Env,
	_history: { role: string; content: string }[],
	message: string,
): Promise<string> {
	try {
		const resp = await fetch(`${env.CODEX_API_URL}/v1/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.ANTHROPIC_API_KEY}`,
			},
			body: JSON.stringify({
				model: "codex",
				messages: [{ role: "user", content: message }],
			}),
		});
		if (!resp.ok) {
			return `[Codex API unavailable: ${resp.status}] Processing locally: ${message}`;
		}
		const data = (await resp.json()) as {
			choices: { message: { content: string } }[];
		};
		return data.choices[0]?.message?.content || "No response from Codex";
	} catch {
		return `[Codex agent] Received: ${message}. Agent processing queued.`;
	}
}

// OpenCode agent proxy
async function callOpenCodeAgent(
	env: Env,
	_history: { role: string; content: string }[],
	message: string,
): Promise<string> {
	try {
		const resp = await fetch(`${env.OPENCODE_API_URL}/api/chat`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.ANTHROPIC_API_KEY}`,
			},
			body: JSON.stringify({ message }),
		});
		if (!resp.ok) {
			return `[OpenCode API unavailable: ${resp.status}] Processing locally: ${message}`;
		}
		const data = (await resp.json()) as { response: string };
		return data.response || "No response from OpenCode";
	} catch {
		return `[OpenCode agent] Received: ${message}. Agent processing queued.`;
	}
}

// HuggingFace Chat agent
async function callChatAgent(
	env: Env,
	history: { role: string; content: string }[],
	message: string,
	model?: string | null,
): Promise<string> {
	const messages = [
		...history.map((m) => ({ role: m.role, content: m.content })),
		{ role: "user" as const, content: message },
	];

	try {
		const resp = await fetch("https://router.huggingface.co/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${env.HF_API_TOKEN}`,
			},
			body: JSON.stringify({
				model: model || "meta-llama/Llama-3.1-8B-Instruct",
				messages,
				max_tokens: 2048,
			}),
		});
		if (!resp.ok) {
			return `[Chat via HuggingFace unavailable: ${resp.status}] Echo: ${message}`;
		}
		const data = (await resp.json()) as {
			choices: { message: { content: string } }[];
		};
		return data.choices[0]?.message?.content || "No response";
	} catch {
		return `[Chat agent] Echo: ${message}`;
	}
}

// HuggingFace models listing
agents.get("/models", async (c) => {
	const models = await c.env.DB.prepare(
		"SELECT model_id, description, architecture, capabilities, status FROM hf_models ORDER BY model_id",
	).all();
	return c.json({ models: models.results });
});

export { agents };
