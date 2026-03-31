import { Hono } from "hono";
import type { Env } from "../types";

const dashboard = new Hono<{ Bindings: Env }>();

dashboard.get("/", (c) => {
  return c.html(DASHBOARD_HTML);
});

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Worker Platform — AI Inference</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --bg: #0a0a0a; --surface: #141414; --border: #262626; --text: #e5e5e5; --muted: #737373; --accent: #f97316; --accent-dim: #7c2d12; --green: #22c55e; --red: #ef4444; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

  /* Nav */
  nav { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0.75rem 1.5rem; display: flex; align-items: center; gap: 2rem; }
  nav h1 { font-size: 1.1rem; color: var(--accent); font-weight: 700; }
  nav .tabs { display: flex; gap: 0.25rem; }
  nav .tab { padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; color: var(--muted); font-size: 0.85rem; border: none; background: none; }
  nav .tab:hover { color: var(--text); background: var(--border); }
  nav .tab.active { color: var(--accent); background: var(--accent-dim); }
  nav .credits { margin-left: auto; font-size: 0.85rem; color: var(--muted); }
  nav .credits b { color: var(--green); }

  /* Layout */
  .container { max-width: 1100px; margin: 0 auto; padding: 1.5rem; }
  .page { display: none; }
  .page.active { display: block; }

  /* Cards */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; }
  .card h2 { font-size: 1rem; margin-bottom: 0.75rem; }

  /* Form elements */
  input, select, textarea { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 0.6rem 0.75rem; border-radius: 6px; font-size: 0.85rem; width: 100%; }
  input:focus, select:focus, textarea:focus { outline: none; border-color: var(--accent); }
  textarea { resize: vertical; min-height: 80px; font-family: inherit; }
  label { font-size: 0.8rem; color: var(--muted); display: block; margin-bottom: 0.25rem; }
  .row { display: flex; gap: 0.75rem; margin-bottom: 0.75rem; }
  .row > * { flex: 1; }

  /* Buttons */
  btn, .btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; font-size: 0.85rem; }
  .btn:hover { border-color: var(--accent); }
  .btn-primary { background: var(--accent); color: #000; border-color: var(--accent); font-weight: 600; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-danger { color: var(--red); }
  .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.75rem; }

  /* Chat */
  #chat-messages { height: 400px; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .msg { max-width: 80%; padding: 0.6rem 0.9rem; border-radius: 10px; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; }
  .msg.user { align-self: flex-end; background: var(--accent-dim); color: var(--text); border-bottom-right-radius: 2px; }
  .msg.assistant { align-self: flex-start; background: var(--border); border-bottom-left-radius: 2px; }
  .msg.error { color: var(--red); font-size: 0.8rem; }
  #chat-input-row { display: flex; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }
  #chat-input { flex: 1; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  th { text-align: left; color: var(--muted); font-weight: 600; padding: 0.5rem; border-bottom: 1px solid var(--border); }
  td { padding: 0.5rem; border-bottom: 1px solid var(--border); }

  /* Usage bars */
  .usage-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .usage-bar-fill { height: 100%; background: var(--accent); border-radius: 3px; }

  /* Pricing cards */
  .pricing { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
  .price-card { text-align: center; padding: 1.5rem; }
  .price-card h3 { color: var(--accent); margin-bottom: 0.5rem; }
  .price-card .amount { font-size: 2rem; font-weight: 700; }
  .price-card .credits { color: var(--muted); font-size: 0.9rem; margin: 0.5rem 0 1rem; }

  /* API key reveal */
  .key-reveal { background: var(--bg); padding: 0.75rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; word-break: break-all; margin: 0.5rem 0; border: 1px solid var(--green); }

  /* Quick start */
  pre { background: var(--bg); padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.8rem; line-height: 1.6; border: 1px solid var(--border); }
  code { font-family: 'SF Mono', Consolas, monospace; }
</style>
</head>
<body>

<nav>
  <h1>Worker Platform</h1>
  <div class="tabs">
    <button class="tab active" onclick="showPage('playground')">Playground</button>
    <button class="tab" onclick="showPage('keys')">API Keys</button>
    <button class="tab" onclick="showPage('usage')">Usage</button>
    <button class="tab" onclick="showPage('billing')">Billing</button>
    <button class="tab" onclick="showPage('docs')">Quick Start</button>
  </div>
  <div class="credits">Credits: <b id="nav-credits">—</b></div>
</nav>

<div class="container">

<!-- ============ PLAYGROUND ============ -->
<div id="page-playground" class="page active">
  <div class="card">
    <h2>Model Playground</h2>
    <div class="row">
      <div>
        <label>Model</label>
        <select id="model-select"></select>
      </div>
      <div>
        <label>Temperature</label>
        <input type="range" id="temperature" min="0" max="2" step="0.1" value="0.7" oninput="document.getElementById('temp-val').textContent=this.value">
        <span id="temp-val" style="font-size:0.8rem;color:var(--muted)">0.7</span>
      </div>
    </div>
    <div class="row">
      <div>
        <label>System prompt (optional)</label>
        <input type="text" id="system-prompt" placeholder="You are a helpful assistant...">
      </div>
      <div>
        <label>API Key</label>
        <input type="password" id="api-key-input" placeholder="sk-wp-...">
      </div>
    </div>
  </div>
  <div class="card" style="padding:0;">
    <div id="chat-messages"></div>
    <div style="padding:0.75rem 1.25rem;">
      <div id="chat-input-row">
        <textarea id="chat-input" rows="2" placeholder="Type a message... (Shift+Enter for newline)"></textarea>
        <button class="btn btn-primary" onclick="sendMessage()" id="send-btn">Send</button>
      </div>
    </div>
  </div>
</div>

<!-- ============ API KEYS ============ -->
<div id="page-keys" class="page">
  <div class="card">
    <h2>Create API Key</h2>
    <div class="row">
      <div><label>Name</label><input type="text" id="key-name" placeholder="My App"></div>
      <div><label>Rate Limit (req/min)</label><input type="number" id="key-rpm" value="60"></div>
      <div style="display:flex;align-items:flex-end;"><button class="btn btn-primary" onclick="createKey()">Create Key</button></div>
    </div>
    <div id="new-key-display" style="display:none;">
      <div class="key-reveal" id="new-key-value"></div>
      <p style="font-size:0.75rem;color:var(--red);">Copy this key now — it won't be shown again.</p>
    </div>
  </div>
  <div class="card">
    <h2>Your API Keys</h2>
    <table>
      <thead><tr><th>Name</th><th>Prefix</th><th>Rate Limit</th><th>Last Used</th><th>Created</th><th></th></tr></thead>
      <tbody id="keys-table"></tbody>
    </table>
  </div>
</div>

<!-- ============ USAGE ============ -->
<div id="page-usage" class="page">
  <div class="card">
    <h2>Today's Usage</h2>
    <div class="row">
      <div><label>Requests</label><div id="usage-today-requests" style="font-size:1.5rem;font-weight:700;">—</div></div>
      <div><label>Tokens</label><div id="usage-today-tokens" style="font-size:1.5rem;font-weight:700;">—</div></div>
      <div><label>Cost</label><div id="usage-today-cost" style="font-size:1.5rem;font-weight:700;color:var(--accent);">—</div></div>
    </div>
  </div>
  <div class="card">
    <h2>Usage by Model (This Month)</h2>
    <table>
      <thead><tr><th>Model</th><th>Requests</th><th>Tokens</th><th>Credits</th></tr></thead>
      <tbody id="usage-month-table"></tbody>
    </table>
  </div>
  <div class="card">
    <h2>Recent Requests</h2>
    <table>
      <thead><tr><th>Model</th><th>Endpoint</th><th>Tokens</th><th>Cost</th><th>Latency</th><th>Time</th></tr></thead>
      <tbody id="usage-recent-table"></tbody>
    </table>
  </div>
</div>

<!-- ============ BILLING ============ -->
<div id="page-billing" class="page">
  <div class="card">
    <h2>Credit Balance</h2>
    <div style="font-size:2.5rem;font-weight:700;color:var(--green);" id="billing-credits">—</div>
    <p style="color:var(--muted);font-size:0.85rem;margin-top:0.25rem;">Plan: <span id="billing-plan">—</span></p>
  </div>
  <div class="card">
    <h2>Buy Credits</h2>
    <div class="pricing" id="pricing-cards"></div>
  </div>
  <div class="card">
    <h2>Transaction History</h2>
    <table>
      <thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>Balance After</th><th>Date</th></tr></thead>
      <tbody id="txn-table"></tbody>
    </table>
  </div>
</div>

<!-- ============ DOCS ============ -->
<div id="page-docs" class="page">
  <div class="card">
    <h2>Quick Start</h2>
    <p style="color:var(--muted);margin-bottom:1rem;">This API is OpenAI-compatible. Use any OpenAI SDK or HTTP client.</p>
    <h3 style="font-size:0.9rem;margin-bottom:0.5rem;">cURL</h3>
    <pre><code>curl ORIGIN/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta-llama/Llama-3.2-3B-Instruct",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 512
  }'</code></pre>

    <h3 style="font-size:0.9rem;margin:1rem 0 0.5rem;">Python (OpenAI SDK)</h3>
    <pre><code>from openai import OpenAI

client = OpenAI(
    base_url="ORIGIN/v1",
    api_key="YOUR_API_KEY",
)

response = client.chat.completions.create(
    model="meta-llama/Llama-3.3-70B-Instruct",
    messages=[{"role": "user", "content": "Explain quantum computing"}],
)
print(response.choices[0].message.content)</code></pre>

    <h3 style="font-size:0.9rem;margin:1rem 0 0.5rem;">JavaScript (OpenAI SDK)</h3>
    <pre><code>import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "ORIGIN/v1",
  apiKey: "YOUR_API_KEY",
});

const completion = await client.chat.completions.create({
  model: "deepseek-ai/DeepSeek-R1",
  messages: [{ role: "user", content: "Write a haiku about code" }],
});
console.log(completion.choices[0].message.content);</code></pre>

    <h3 style="font-size:0.9rem;margin:1rem 0 0.5rem;">Image Generation</h3>
    <pre><code>curl ORIGIN/v1/images/generations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "black-forest-labs/FLUX.1-dev",
    "prompt": "A futuristic city at sunset, cyberpunk style"
  }'</code></pre>

    <h3 style="font-size:0.9rem;margin:1rem 0 0.5rem;">Available Endpoints</h3>
    <table>
      <tr><td><code>POST /v1/chat/completions</code></td><td>Chat (streaming supported)</td></tr>
      <tr><td><code>POST /v1/completions</code></td><td>Text completions</td></tr>
      <tr><td><code>POST /v1/images/generations</code></td><td>Image generation</td></tr>
      <tr><td><code>GET /v1/models</code></td><td>List models</td></tr>
    </table>
  </div>
</div>

</div>

<script>
const API = window.location.origin;
let apiKey = localStorage.getItem("wp_api_key") || "";
let sessionKey = ""; // session cookie or token for dashboard auth
let chatHistory = [];

// Init
document.getElementById("api-key-input").value = apiKey;
document.getElementById("api-key-input").addEventListener("change", (e) => {
  apiKey = e.target.value;
  localStorage.setItem("wp_api_key", apiKey);
});

// Replace ORIGIN placeholders in docs
document.querySelectorAll("#page-docs pre code").forEach(el => {
  el.textContent = el.textContent.replace(/ORIGIN/g, API);
});

// Chat input: Enter sends, Shift+Enter newline
document.getElementById("chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// Load models (only 'available' status models are returned by the API)
fetch(API + "/v1/models").then(r => r.json()).then(data => {
  const select = document.getElementById("model-select");
  data.data.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.id;
    select.appendChild(opt);
  });
  // Default to Qwen 3.5 flagship
  const preferred = ["Qwen/Qwen3.5-397B-A17B", "Qwen/Qwen3.5-122B-A10B", "Qwen/Qwen3.5-35B-A3B", "deepseek-ai/DeepSeek-V3.2"];
  for (const p of preferred) {
    const found = data.data.find(m => m.id === p);
    if (found) { select.value = found.id; break; }
  }
});

function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById("page-" + name).classList.add("active");
  event.target.classList.add("active");
  if (name === "keys") loadKeys();
  if (name === "usage") loadUsage();
  if (name === "billing") loadBilling();
}

// ========== CHAT ==========
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;
  if (!apiKey) { addMsg("error", "Set your API key first."); return; }

  const systemPrompt = document.getElementById("system-prompt").value.trim();
  const model = document.getElementById("model-select").value;
  const temp = parseFloat(document.getElementById("temperature").value);

  chatHistory.push({ role: "user", content: text });
  addMsg("user", text);
  input.value = "";

  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push(...chatHistory);

  const msgEl = addMsg("assistant", "");
  document.getElementById("send-btn").disabled = true;

  try {
    const resp = await fetch(API + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({ model, messages, temperature: temp, max_tokens: 2048, stream: true }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      msgEl.textContent = "Error: " + (err.error?.message || resp.statusText);
      msgEl.classList.add("error");
      return;
    }

    // Read SSE stream
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
        try {
          const chunk = JSON.parse(line.slice(6));
          const delta = chunk.choices?.[0]?.delta?.content || "";
          fullText += delta;
          msgEl.textContent = fullText;
        } catch {}
      }
    }

    chatHistory.push({ role: "assistant", content: fullText });
    // Update credits display
    const remaining = resp.headers.get("X-Credits-Remaining");
    if (remaining) document.getElementById("nav-credits").textContent = parseFloat(remaining).toFixed(2);
  } catch (e) {
    msgEl.textContent = "Network error: " + e.message;
    msgEl.classList.add("error");
  } finally {
    document.getElementById("send-btn").disabled = false;
  }
}

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.textContent = text;
  const container = document.getElementById("chat-messages");
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

// ========== API KEYS ==========
async function createKey() {
  const name = document.getElementById("key-name").value.trim();
  const rpm = parseInt(document.getElementById("key-rpm").value) || 60;
  if (!name) return;

  const resp = await fetch(API + "/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ name, rate_limit_rpm: rpm }),
  });
  const data = await resp.json();
  if (data.key) {
    document.getElementById("new-key-display").style.display = "block";
    document.getElementById("new-key-value").textContent = data.key;
    // Auto-set as current key
    apiKey = data.key;
    localStorage.setItem("wp_api_key", apiKey);
    document.getElementById("api-key-input").value = apiKey;
    loadKeys();
  }
}

async function loadKeys() {
  try {
    const resp = await fetch(API + "/keys", { headers: { "Authorization": "Bearer " + apiKey } });
    const data = await resp.json();
    const tbody = document.getElementById("keys-table");
    tbody.innerHTML = (data.keys || []).map(k =>
      "<tr><td>" + esc(k.name) + "</td><td><code>" + esc(k.key_prefix) + "...</code></td>" +
      "<td>" + k.rate_limit_rpm + "/min</td><td>" + (k.last_used_at || "Never") + "</td>" +
      "<td>" + k.created_at + "</td>" +
      '<td><button class="btn btn-sm btn-danger" onclick="revokeKey(' + k.id + ')">Revoke</button></td></tr>'
    ).join("");
  } catch {}
}

async function revokeKey(id) {
  await fetch(API + "/keys/" + id, { method: "DELETE", headers: { "Authorization": "Bearer " + apiKey } });
  loadKeys();
}

// ========== USAGE ==========
async function loadUsage() {
  try {
    const resp = await fetch(API + "/billing/usage", { headers: { "Authorization": "Bearer " + apiKey } });
    const data = await resp.json();
    document.getElementById("nav-credits").textContent = parseFloat(data.credits).toFixed(2);
    document.getElementById("usage-today-requests").textContent = data.today.requests || 0;
    document.getElementById("usage-today-tokens").textContent = (data.today.tokens || 0).toLocaleString();
    document.getElementById("usage-today-cost").textContent = (data.today.cost || 0).toFixed(2) + " credits";

    document.getElementById("usage-month-table").innerHTML = (data.this_month || []).map(m =>
      "<tr><td>" + esc(m.model) + "</td><td>" + m.requests + "</td><td>" + (m.tokens||0).toLocaleString() + "</td><td>" + (m.cost||0).toFixed(2) + "</td></tr>"
    ).join("") || "<tr><td colspan=4 style='color:var(--muted)'>No usage this month</td></tr>";

    document.getElementById("usage-recent-table").innerHTML = (data.recent || []).map(r =>
      "<tr><td>" + esc(r.model) + "</td><td>" + r.endpoint + "</td><td>" + r.total_tokens + "</td><td>" + (r.cost_credits||0).toFixed(3) + "</td><td>" + r.latency_ms + "ms</td><td>" + r.created_at + "</td></tr>"
    ).join("") || "<tr><td colspan=6 style='color:var(--muted)'>No requests yet</td></tr>";
  } catch {}
}

// ========== BILLING ==========
async function loadBilling() {
  try {
    const [usageResp, pkgResp, txnResp] = await Promise.all([
      fetch(API + "/billing/usage", { headers: { "Authorization": "Bearer " + apiKey } }),
      fetch(API + "/billing/packages"),
      fetch(API + "/billing/transactions", { headers: { "Authorization": "Bearer " + apiKey } }),
    ]);
    const usage = await usageResp.json();
    const pkgs = await pkgResp.json();
    const txns = await txnResp.json();

    document.getElementById("billing-credits").textContent = parseFloat(usage.credits).toFixed(2);
    document.getElementById("billing-plan").textContent = usage.plan;
    document.getElementById("nav-credits").textContent = parseFloat(usage.credits).toFixed(2);

    document.getElementById("pricing-cards").innerHTML = (pkgs.packages || []).map(p =>
      '<div class="card price-card"><h3>' + esc(p.name) + '</h3>' +
      '<div class="amount">$' + (p.price_cents / 100) + '</div>' +
      '<div class="credits">' + p.credits.toLocaleString() + ' credits</div>' +
      '<button class="btn btn-primary" onclick="buyCredits(\\'' + p.id + '\\')">Purchase</button></div>'
    ).join("");

    document.getElementById("txn-table").innerHTML = (txns.transactions || []).map(t =>
      "<tr><td>" + esc(t.type) + "</td><td style='color:" + (t.amount > 0 ? "var(--green)" : "var(--red)") + "'>" +
      (t.amount > 0 ? "+" : "") + t.amount.toFixed(2) + "</td><td>" + esc(t.description||"") + "</td><td>" +
      (t.balance_after||0).toFixed(2) + "</td><td>" + t.created_at + "</td></tr>"
    ).join("") || "<tr><td colspan=5 style='color:var(--muted)'>No transactions</td></tr>";
  } catch {}
}

async function buyCredits(packageId) {
  const resp = await fetch(API + "/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ package_id: packageId }),
  });
  const data = await resp.json();
  if (data.checkout_url) window.location.href = data.checkout_url;
  else alert(data.error || "Failed to create checkout session");
}

function esc(s) { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; }
</script>
</body>
</html>`;

export { dashboard };
