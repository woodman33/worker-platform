import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env, Variables } from "./types";
import { inference } from "./routes/inference";
import { billing } from "./routes/billing";
import { keys } from "./routes/keys";
import { dashboard } from "./routes/dashboard";
import { auth } from "./routes/auth";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global CORS
app.use("*", cors());

// Health check
app.get("/health", (c) =>
  c.json({
    status: "ok",
    version: "2.0.0",
    endpoints: [
      "POST /v1/chat/completions",
      "POST /v1/completions",
      "POST /v1/images/generations",
      "GET  /v1/models",
      "POST /keys",
      "GET  /keys",
      "GET  /billing/usage",
      "POST /billing/checkout",
      "GET  /dashboard",
    ],
  }),
);

// Inference API (OpenAI-compatible) — the core product
app.route("/", inference);

// API key management
app.route("/keys", keys);

// Billing & usage
app.route("/billing", billing);

// Auth (login, session management)
app.route("/auth", auth);

// Dashboard UI
app.route("/dashboard", dashboard);

// Root — redirect to dashboard
app.get("/", (c) => c.redirect("/dashboard"));

export default app;
