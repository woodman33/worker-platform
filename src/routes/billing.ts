import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { authMiddleware } from "../lib/auth";

const billing = new Hono<{ Bindings: Env; Variables: Variables }>();

// Credit packages
const PACKAGES = [
  { id: "starter", name: "Starter", credits: 500, price_cents: 500, description: "$5 for 500 credits" },
  { id: "pro", name: "Pro", credits: 2500, price_cents: 2000, description: "$20 for 2,500 credits" },
  { id: "business", name: "Business", credits: 10000, price_cents: 5000, description: "$50 for 10,000 credits" },
];

// GET /billing/packages - List credit packages
billing.get("/packages", (c) => c.json({ packages: PACKAGES }));

// POST /billing/checkout - Create Stripe checkout session
billing.post("/checkout", authMiddleware, async (c) => {
  const { package_id } = await c.req.json();
  const pkg = PACKAGES.find(p => p.id === package_id);
  if (!pkg) return c.json({ error: "Invalid package" }, 400);

  const user = c.get("user") as any;
  const origin = new URL(c.req.url).origin;

  // Ensure user has a Stripe customer ID
  let stripeCustomerId = (await c.env.DB.prepare(
    "SELECT stripe_customer_id FROM users WHERE id = ?"
  ).bind(user.id).first<{ stripe_customer_id: string }>())?.stripe_customer_id;

  if (!stripeCustomerId) {
    const customerResp = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(c.env.STRIPE_SECRET_KEY + ":")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: user.email,
        metadata: JSON.stringify({ user_id: String(user.id) }),
      }),
    });
    const customer = await customerResp.json() as any;
    stripeCustomerId = customer.id;
    await c.env.DB.prepare(
      "UPDATE users SET stripe_customer_id = ? WHERE id = ?"
    ).bind(stripeCustomerId, user.id).run();
  }

  // Create checkout session
  const params = new URLSearchParams({
    "mode": "payment",
    "customer": stripeCustomerId!,
    "success_url": `${origin}/dashboard?purchased=${pkg.id}`,
    "cancel_url": `${origin}/dashboard`,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": `${pkg.name} Credits`,
    "line_items[0][price_data][product_data][description]": pkg.description,
    "line_items[0][price_data][unit_amount]": String(pkg.price_cents),
    "line_items[0][quantity]": "1",
    "metadata[user_id]": String(user.id),
    "metadata[package_id]": pkg.id,
    "metadata[credits]": String(pkg.credits),
  });

  const sessionResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(c.env.STRIPE_SECRET_KEY + ":")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const session = await sessionResp.json() as any;
  if (session.error) {
    return c.json({ error: session.error.message }, 400);
  }

  return c.json({ checkout_url: session.url, session_id: session.id });
});

// POST /billing/webhook - Stripe webhook handler
billing.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.json({ error: "Missing signature" }, 400);

  // Verify webhook signature
  const body = await c.req.text();
  const isValid = await verifyStripeSignature(body, signature, c.env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) return c.json({ error: "Invalid signature" }, 400);

  const event = JSON.parse(body);

  // Idempotency check
  const existing = await c.env.DB.prepare(
    "SELECT id FROM stripe_events WHERE id = ?"
  ).bind(event.id).first();
  if (existing) return c.json({ received: true });

  // Record event
  await c.env.DB.prepare(
    "INSERT INTO stripe_events (id, type) VALUES (?, ?)"
  ).bind(event.id, event.type).run();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = parseInt(session.metadata.user_id);
    const credits = parseFloat(session.metadata.credits);

    // Add credits
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE users SET credits = credits + ? WHERE id = ?").bind(credits, userId),
      c.env.DB.prepare(
        `INSERT INTO credit_transactions (user_id, amount, type, description, stripe_payment_id, balance_after)
         VALUES (?, ?, 'topup', ?, ?, (SELECT credits FROM users WHERE id = ?))`
      ).bind(userId, credits, `Purchased ${credits} credits`, session.payment_intent, userId),
    ]);
  }

  return c.json({ received: true });
});

// GET /billing/usage - Get usage stats for current user
billing.get("/usage", authMiddleware, async (c) => {
  const user = c.get("user") as any;

  const [credits, todayUsage, monthUsage, recentLogs] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT credits, plan FROM users WHERE id = ?").bind(user.id),
    c.env.DB.prepare(
      `SELECT COUNT(*) as requests, SUM(total_tokens) as tokens, SUM(cost_credits) as cost
       FROM usage_logs WHERE user_id = ? AND created_at >= date('now')`
    ).bind(user.id),
    c.env.DB.prepare(
      `SELECT model, COUNT(*) as requests, SUM(total_tokens) as tokens, SUM(cost_credits) as cost
       FROM usage_logs WHERE user_id = ? AND created_at >= date('now', 'start of month')
       GROUP BY model ORDER BY cost DESC`
    ).bind(user.id),
    c.env.DB.prepare(
      `SELECT model, endpoint, total_tokens, cost_credits, latency_ms, created_at
       FROM usage_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(user.id),
  ]);

  return c.json({
    credits: (credits.results[0] as any)?.credits || 0,
    plan: (credits.results[0] as any)?.plan || "free",
    today: todayUsage.results[0] || { requests: 0, tokens: 0, cost: 0 },
    this_month: monthUsage.results,
    recent: recentLogs.results,
  });
});

// GET /billing/transactions - Credit history
billing.get("/transactions", authMiddleware, async (c) => {
  const user = c.get("user") as any;
  const txns = await c.env.DB.prepare(
    `SELECT amount, type, description, balance_after, created_at
     FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
  ).bind(user.id).all();

  return c.json({ transactions: txns.results });
});

// Stripe signature verification
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const parts = signature.split(",").reduce((acc: Record<string, string>, part) => {
    const [key, value] = part.split("=");
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;

  // Check timestamp is within 5 minutes
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");

  return expected === sig;
}

export { billing };
