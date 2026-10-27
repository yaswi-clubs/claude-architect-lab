// claude.js — the only file that talks to the Anthropic API.
// Keeping network code in one place is a software engineering habit called
// "separation of concerns": labs describe WHAT to ask, this file handles HOW.

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export const MODELS = [
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5 (cheapest, fine for every lab)' },
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5 (stronger, costs more)' },
  { id: 'claude-opus-5-5', label: 'Opus 5.5 (strongest, most expensive)' }
];

// ---------- settings (stored only in this browser) ----------
function store(kind) {
  try { return kind === 'session' ? window.sessionStorage : window.localStorage; } catch (e) { return null; }
}

export function getSettings() {
  const ls = store('local'), ss = store('session');
  const key = (ss && ss.getItem('cal_key')) || (ls && ls.getItem('cal_key')) || '';
  const model = (ls && ls.getItem('cal_model')) || MODELS[0].id;
  return { key, model };
}

export function saveSettings({ key, model, remember }) {
  const ls = store('local'), ss = store('session');
  if (ls) { ls.removeItem('cal_key'); if (model) ls.setItem('cal_model', model); }
  if (ss) ss.removeItem('cal_key');
  if (key) {
    const target = remember ? ls : ss;
    if (target) target.setItem('cal_key', key.trim());
  }
}

export function forgetKey() {
  const ls = store('local'), ss = store('session');
  if (ls) ls.removeItem('cal_key');
  if (ss) ss.removeItem('cal_key');
}

// ---------- usage tracking ----------
export function getUsage() {
  try { return JSON.parse(localStorage.getItem('cal_usage') || '{"input":0,"output":0,"calls":0}'); }
  catch (e) { return { input: 0, output: 0, calls: 0 }; }
}
function addUsage(u) {
  const t = getUsage();
  t.input += u?.input_tokens || 0;
  t.output += u?.output_tokens || 0;
  t.calls += 1;
  try { localStorage.setItem('cal_usage', JSON.stringify(t)); } catch (e) {}
}
export function resetUsage() { try { localStorage.removeItem('cal_usage'); } catch (e) {} }

// ---------- errors ----------
// A structured error, the same idea as Domain 2's "structured tool errors":
// a category the code can act on, a retryable flag, and a readable message.
export class ClaudeError extends Error {
  constructor(category, message, status, retryable = false) {
    super(message);
    this.category = category;
    this.status = status;
    this.retryable = retryable;
  }
}

function classify(status) {
  if (status === 401 || status === 403) return ['auth', false, 'Your API key was rejected. Check it in Settings.'];
  if (status === 400) return ['validation', false, 'The request was malformed.'];
  if (status === 404) return ['validation', false, 'Model or endpoint not found. Try another model in Settings.'];
  if (status === 429) return ['rate_limit', true, 'Rate limited. Wait a few seconds and try again.'];
  if (status >= 500) return ['transient', true, 'Anthropic’s API had a temporary problem. Try again.'];
  return ['unknown', false, 'Unexpected error.'];
}

// ---------- the call ----------
// body = anything the Messages API accepts (system, messages, tools, tool_choice…)
// Returns { request, response } so labs can show both sides of the exchange.
export async function callClaude(body) {
  const { key, model } = getSettings();
  if (!key) throw new ClaudeError('no_key', 'Add your API key in Settings before running a lab.');

  const request = { model, max_tokens: 1024, ...body };

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': API_VERSION,
        // Required for calls made directly from a browser. The name is a warning:
        // anyone with access to this page in your browser could read your key.
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(request)
    });
  } catch (e) {
    throw new ClaudeError('network', 'Could not reach the API. Check your connection.', 0, true);
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* non-JSON body */ }

  if (!res.ok) {
    const [category, retryable, hint] = classify(res.status);
    const detail = data?.error?.message ? ` (${data.error.message})` : '';
    throw new ClaudeError(category, `${res.status}: ${hint}${detail}`, res.status, retryable);
  }

  addUsage(data.usage);
  return { request, response: data };
}

// Show a request with the key-free parts only. Handy for "view the raw JSON" panels.
export function redactedHeaders() {
  return {
    'content-type': 'application/json',
    'x-api-key': 'sk-ant-…(hidden)',
    'anthropic-version': API_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true'
  };
}
