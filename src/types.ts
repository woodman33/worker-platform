// Hono context variables set by middleware
export interface Variables {
	user: { id: number; email: string; role: string };
	userId: number;
	apiKeyId: number;
	userCredits: number;
}

export interface Env {
	// Cloudflare bindings
	DB: D1Database;
	KV: KVNamespace;
	AUTH_STORAGE: KVNamespace;
	SESSION_STORE: KVNamespace;
	DISPATCHER: {
		get(name: string): { fetch(request: Request): Promise<Response> };
	};
	CLOUDFLARE_API_TOKEN: string;
	CLOUDFLARE_ACCOUNT_ID: string;

	// Configuration
	READONLY: string | boolean;
	OPENAUTH_ISSUER_URL: string;
	OPENCODE_API_URL: string;
	CODEX_API_URL: string;
	HF_CHAT_UI_URL: string;

	// Secrets
	ANTHROPIC_API_KEY: string;
	HF_API_TOKEN: string;
	OPENROUTER_API_KEY: string;
	STRIPE_SECRET_KEY: string;
	STRIPE_WEBHOOK_SECRET: string;
}

export interface User {
	id: number;
	email: string;
	name: string | null;
	role: string;
	created_at: string;
}

export interface Worker {
	id: number;
	name: string;
	owner_id: number;
	namespace: string;
	status: string;
	code: string | null;
	bindings_json: string | null;
	created_at: string;
}

export interface McpTool {
	id: number;
	name: string;
	description: string;
	input_schema: string;
	handler_worker: string;
	enabled: number;
}

export interface AgentSession {
	id: number;
	user_id: number;
	agent_type: string;
	model: string | null;
	status: string;
	context_json: string | null;
	created_at: string;
}

export interface ChatMessage {
	id: number;
	session_id: number;
	role: string;
	content: string;
	model: string | null;
	metadata_json: string | null;
	created_at: string;
}

export interface HfModel {
	id: number;
	model_id: string;
	description: string | null;
	architecture: string | null;
	capabilities: string | null;
	status: string;
}
