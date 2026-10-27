// labs.js — hands-on labs. Each lab is a function that builds its own UI
// inside the element it is given. Every lab shows the raw request/response,
// because seeing the real JSON is how the concepts stick.

import { callClaude, redactedHeaders, getSettings } from './claude.js';

// ---------- small helpers ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pretty = o => esc(JSON.stringify(o, null, 2));
const $ = (root, sel) => root.querySelector(sel);

function json(label, obj, open = false) {
  return `<details class="raw"${open ? ' open' : ''}><summary>${esc(label)}</summary><pre>${pretty(obj)}</pre></details>`;
}
function errBox(e) {
  const cat = e.category ? `<span class="tag">${esc(e.category)}${e.retryable ? ', retryable' : ''}</span> ` : '';
  return `<div class="err">${cat}${esc(e.message || e)}</div>`;
}
function textOf(response) {
  return (response.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}
async function busy(btn, fn) {
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Running…';
  try { await fn(); } finally { btn.disabled = false; btn.textContent = label; }
}
function usageLine(r) {
  const u = r.usage || {};
  return `<p class="meta">stop_reason: <code>${esc(r.stop_reason)}</code> · input ${u.input_tokens ?? '?'} tokens · output ${u.output_tokens ?? '?'} tokens</p>`;
}

// =====================================================================
// LAB: hello — your first API call
// =====================================================================
function hello(el) {
  el.innerHTML = `
    <label>Your message<textarea id="h-msg" rows="2">In one sentence, what is a cap rate in commercial real estate?</textarea></label>
    <button class="btn" id="h-run">Send request</button>
    <div id="h-out"></div>`;
  $(el, '#h-run').onclick = e => busy(e.target, async () => {
    const out = $(el, '#h-out');
    const body = { max_tokens: 200, messages: [{ role: 'user', content: $(el, '#h-msg').value }] };
    try {
      const { request, response } = await callClaude(body);
      out.innerHTML = `<div class="reply">${esc(textOf(response))}</div>${usageLine(response)}
        ${json('1. Headers sent (key hidden)', redactedHeaders())}
        ${json('2. Request body sent', request)}
        ${json('3. Raw response received', response, true)}`;
    } catch (err) { out.innerHTML = errBox(err); }
  });
}

// =====================================================================
// LAB: chat — statelessness, the growing messages array, stop_reason
// =====================================================================
function chat(el) {
  let messages = [];
  el.innerHTML = `
    <label>System prompt<textarea id="c-sys" rows="2">You are a concise real estate analyst. Answer in at most three sentences.</textarea></label>
    <label>max_tokens: <b id="c-mtv">300</b><input type="range" id="c-mt" min="10" max="600" step="10" value="300"></label>
    <div id="c-log" class="chatlog"></div>
    <div class="inline"><input id="c-in" placeholder="Ask something, then ask a follow-up"><button class="btn" id="c-send">Send</button></div>
    <div class="inline"><button class="btn ghost" id="c-reset">Start new conversation</button></div>
    <div id="c-raw"></div>`;
  const mt = $(el, '#c-mt');
  mt.oninput = () => { $(el, '#c-mtv').textContent = mt.value; };
  const draw = (last) => {
    $(el, '#c-log').innerHTML = messages.map(m =>
      `<div class="bubble ${m.role}"><span>${m.role}</span>${esc(typeof m.content === 'string' ? m.content : textOf({ content: m.content }))}</div>`).join('') || '<p class="meta">No messages yet.</p>';
    $(el, '#c-raw').innerHTML = last ? `${usageLine(last.response)}${json(`messages array sent this call (${last.request.messages.length} items)`, last.request.messages, true)}${json('Raw response', last.response)}` : '';
  };
  draw();
  const send = () => busy($(el, '#c-send'), async () => {
    const input = $(el, '#c-in'); const text = input.value.trim(); if (!text) return;
    messages.push({ role: 'user', content: text }); input.value = ''; draw();
    try {
      const r = await callClaude({ system: $(el, '#c-sys').value, max_tokens: +mt.value, messages });
      messages.push({ role: 'assistant', content: r.response.content });
      draw(r);
    } catch (err) { messages.pop(); $(el, '#c-raw').innerHTML = errBox(err); draw(); }
  });
  $(el, '#c-send').onclick = send;
  $(el, '#c-in').onkeydown = e => { if (e.key === 'Enter') send(); };
  $(el, '#c-reset').onclick = () => { messages = []; draw(); };
}

// =====================================================================
// LAB: ab — vague vs explicit criteria
// =====================================================================
const AB_CODE = `function applyDiscount(price, pct) {
  var result = price - price * pct / 100
  if (pct > 100) { console.log("bad pct") }
  const apiKey = "sk-live-12345";
  return result
}`;
function ab(el) {
  el.innerHTML = `
    <label>Code to review<textarea id="ab-in" rows="7" class="mono">${esc(AB_CODE)}</textarea></label>
    <div class="cols">
      <label>Prompt A (vague)<textarea id="ab-a" rows="5">Review this code. Only report high-confidence, important issues.</textarea></label>
      <label>Prompt B (explicit)<textarea id="ab-b" rows="5">Review this code. Report ONLY:
- bugs that cause wrong output or a crash
- security issues (e.g. exposed secrets)
Do NOT report style, naming, semicolons, var vs const, or refactoring ideas.
Format each issue as: [category] line N: problem. Fix: one sentence.
If there are none, say "No issues."</textarea></label>
    </div>
    <button class="btn" id="ab-run">Run both</button>
    <div id="ab-out" class="cols"></div>`;
  $(el, '#ab-run').onclick = e => busy(e.target, async () => {
    const code = $(el, '#ab-in').value, out = $(el, '#ab-out');
    out.innerHTML = '';
    const run = sys => callClaude({ system: sys, max_tokens: 500, messages: [{ role: 'user', content: code }] });
    const results = await Promise.allSettled([run($(el, '#ab-a').value), run($(el, '#ab-b').value)]);
    out.innerHTML = results.map((r, i) => `<div><h4>${i ? 'B (explicit)' : 'A (vague)'}</h4>${
      r.status === 'fulfilled' ? `<div class="reply">${esc(textOf(r.value.response))}</div>${usageLine(r.value.response)}` : errBox(r.reason)}</div>`).join('');
  });
}

// =====================================================================
// LAB: extract — structured output via forced tool_use, nullable fields,
// validation in code, and a validation-retry loop
// =====================================================================
const INVOICE = `NORTHGATE FACILITIES LTD
Invoice no: NF-2291          Date: 3 October 2026
Bill to: Ashby Property Partners, 12 Wharf Road, London

Quarterly HVAC maintenance, Unit 4B ......... £850.00
Emergency call-out, 19 Sept ................. £240.00
Filter replacement (x6) ..................... £90.00

TOTAL DUE ................................... £1,250.00
Thank you for your business.`;

function invoiceTool(nullableDue) {
  return {
    name: 'record_invoice',
    description: 'Record the fields extracted from one supplier invoice. Use null for any field not present in the document.',
    input_schema: {
      type: 'object',
      properties: {
        supplier: { type: 'string' },
        invoice_number: { type: 'string' },
        invoice_date: { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD' },
        due_date: nullableDue
          ? { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD, or null if the invoice does not state one' }
          : { type: 'string', description: 'ISO date YYYY-MM-DD' },
        line_items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, amount: { type: 'number' } }, required: ['description', 'amount'] } },
        stated_total: { type: 'number', description: 'The total exactly as printed on the invoice' },
        currency: { type: 'string', enum: ['GBP', 'EUR', 'USD', 'other'] }
      },
      required: ['supplier', 'invoice_number', 'invoice_date', 'due_date', 'line_items', 'stated_total', 'currency']
    }
  };
}

function validate(data) {
  const issues = [];
  const sum = (data.line_items || []).reduce((a, li) => a + (Number(li.amount) || 0), 0);
  if (Math.abs(sum - data.stated_total) > 0.01) issues.push(`Line items sum to ${sum.toFixed(2)} but stated_total is ${data.stated_total}.`);
  if (data.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.due_date)) issues.push(`due_date "${data.due_date}" is not YYYY-MM-DD.`);
  return { sum, issues };
}

function extract(el) {
  let convo = null; // kept so the retry can continue the same exchange
  el.innerHTML = `
    <label>Document<textarea id="x-doc" rows="11" class="mono">${esc(INVOICE)}</textarea></label>
    <label class="check"><input type="checkbox" id="x-null" checked> <span><code>due_date</code> is nullable (uncheck to make it required, non-null)</span></label>
    <button class="btn" id="x-run">Extract</button>
    <div id="x-out"></div>`;

  const show = (request, response, note) => {
    const call = response.content.find(b => b.type === 'tool_use');
    const data = call ? call.input : {};
    const { sum, issues } = validate(data);
    const dueNote = data.due_date === null
      ? '<p class="ok">due_date is null: the model reported it as absent instead of inventing one.</p>'
      : `<p class="warn">due_date = <code>${esc(data.due_date)}</code>. The invoice has no due date. If this is filled in, the model fabricated it.</p>`;
    $(el, '#x-out').innerHTML = `${note || ''}
      <h4>Extracted data (the tool’s input)</h4><pre>${pretty(data)}</pre>
      ${dueNote}
      <h4>Validation in code</h4>
      ${issues.length ? `<ul class="warn">${issues.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        <p>Send the error back and ask for a corrected extraction? Think first: is the problem in the extraction, or in the document itself?</p>
        <button class="btn ghost" id="x-retry">Retry with validation error</button>` : `<p class="ok">Line items (${sum.toFixed(2)}) match the stated total.</p>`}
      ${usageLine(response)}
      ${json('Request sent (note tools and tool_choice)', request)}
      ${json('Raw response', response)}`;
    convo = { request, response, call, issues };
    const retry = $(el, '#x-retry');
    if (retry) retry.onclick = e => busy(e.target, doRetry);
  };

  const doRetry = async () => {
    const { request, response, call, issues } = convo;
    const messages = [...request.messages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: call.id, is_error: true,
        content: `Validation failed: ${issues.join(' ')} Re-read the document and extract again. If the document itself is inconsistent, extract exactly what it states.` }] }];
    try {
      const { model, ...rest } = request; // keep the current model from Settings
      const r = await callClaude({ ...rest, messages });
      show(r.request, r.response, `<div class="callout"><b>After retry.</b> If the mismatch is still there, that’s the lesson: the document really does disagree with itself (850 + 240 + 90 = 1,180, not 1,250). Retries can fix misreadings, not the source. In production you’d flag this for a human.</div>`);
    } catch (err) { $(el, '#x-out').insertAdjacentHTML('afterbegin', errBox(err)); }
  };

  $(el, '#x-run').onclick = e => busy(e.target, async () => {
    const tool = invoiceTool($(el, '#x-null').checked);
    try {
      const { request, response } = await callClaude({
        max_tokens: 800,
        tools: [tool],
        tool_choice: { type: 'tool', name: 'record_invoice' },
        messages: [{ role: 'user', content: `Extract the invoice fields.\n\n<document>\n${$(el, '#x-doc').value}\n</document>` }]
      });
      show(request, response);
    } catch (err) { $(el, '#x-out').innerHTML = errBox(err); }
  });
}

// =====================================================================
// LAB: router — tool descriptions drive tool selection
// =====================================================================
const WEAK = { cust: 'Retrieves information.', order: 'Retrieves information.' };
const STRONG = {
  cust: 'Find a customer account by email address. Returns customer ID, name and verification status. Use when you need to identify WHO the customer is. Do not use for questions about a specific order.',
  order: 'Look up one order by order ID (format O1234). Returns status, items, total and delivery date. Use for any question about a specific order. Do not use to identify a customer.'
};
function router(el) {
  el.innerHTML = `
    <label><code>get_customer</code> description<textarea id="r-c" rows="3">${esc(WEAK.cust)}</textarea></label>
    <label><code>lookup_order</code> description<textarea id="r-o" rows="3">${esc(WEAK.order)}</textarea></label>
    <div class="inline"><button class="btn ghost" id="r-weak">Use weak descriptions</button><button class="btn ghost" id="r-strong">Use strong descriptions</button></div>
    <label>tool_choice<select id="r-tc"><option value="any">any (must call a tool)</option><option value="auto">auto (may answer in text)</option></select></label>
    <label>User message<input id="r-q" value="Has O1002 shipped yet?"></label>
    <button class="btn" id="r-run">Ask</button>
    <div id="r-out"></div>`;
  $(el, '#r-weak').onclick = () => { $(el, '#r-c').value = WEAK.cust; $(el, '#r-o').value = WEAK.order; };
  $(el, '#r-strong').onclick = () => { $(el, '#r-c').value = STRONG.cust; $(el, '#r-o').value = STRONG.order; };
  $(el, '#r-run').onclick = e => busy(e.target, async () => {
    const tools = [
      { name: 'get_customer', description: $(el, '#r-c').value, input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'lookup_order', description: $(el, '#r-o').value, input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } }
    ];
    try {
      const { request, response } = await callClaude({ max_tokens: 300, tools, tool_choice: { type: $(el, '#r-tc').value }, messages: [{ role: 'user', content: $(el, '#r-q').value }] });
      const call = response.content.find(b => b.type === 'tool_use');
      $(el, '#r-out').innerHTML = `<div class="reply">${call ? `Chose <b>${esc(call.name)}</b> with input <code>${esc(JSON.stringify(call.input))}</code>` : `No tool called. Replied: ${esc(textOf(response))}`}</div>
        <p class="meta">Run it a few times with each set of descriptions. With weak ones, selection is a coin toss; it may even look right by luck.</p>
        ${usageLine(response)}${json('Request', request)}${json('Raw response', response)}`;
    } catch (err) { $(el, '#r-out').innerHTML = errBox(err); }
  });
}

// =====================================================================
// LAB: agent — the loop, local tools, and policy hooks
// =====================================================================
const DB = {
  customers: { 'hannah@example.com': { customer_id: 'C001', name: 'Hannah', verified: true } },
  orders: {
    O1001: { order_id: 'O1001', customer_id: 'C001', status: 'delivered', total: 45.0, items: ['Desk lamp'] },
    O1002: { order_id: 'O1002', customer_id: 'C001', status: 'delivered', total: 720.0, items: ['Office chair'] }
  }
};
const AGENT_TOOLS = [
  { name: 'get_customer', description: 'Find and verify a customer by email. Returns customer_id and verified status. Must be used before any refund.', input_schema: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] } },
  { name: 'lookup_order', description: 'Look up an order by ID (format O1234). Returns status, items, total and customer_id.', input_schema: { type: 'object', properties: { order_id: { type: 'string' } }, required: ['order_id'] } },
  { name: 'process_refund', description: 'Refund an order. Requires a verified customer who owns the order.', input_schema: { type: 'object', properties: { order_id: { type: 'string' }, amount: { type: 'number' }, reason: { type: 'string' } }, required: ['order_id', 'amount', 'reason'] } },
  { name: 'escalate_to_human', description: 'Hand the case to a human agent with a structured summary.', input_schema: { type: 'object', properties: { summary: { type: 'string' }, customer_id: { type: ['string', 'null'] }, recommended_action: { type: 'string' } }, required: ['summary', 'recommended_action'] } }
];

function agent(el) {
  el.innerHTML = `
    <label>System prompt<textarea id="a-sys" rows="3">You are a customer support agent for an office supplies company. Always verify the customer with get_customer before processing a refund. Refunds over $500 must be escalated to a human.</textarea></label>
    <div class="checks">
      <label class="check"><input type="checkbox" id="a-gate"> <span><b>Hook:</b> block refunds until get_customer has verified someone</span></label>
      <label class="check"><input type="checkbox" id="a-limit"> <span><b>Hook:</b> block refunds over $500, redirect to escalation</span></label>
    </div>
    <label>Customer message<textarea id="a-msg" rows="2">Hi, please refund order O1002, the chair arrived broken. I'm in a rush.</textarea></label>
    <p class="meta">Mock data: hannah@example.com; orders O1001 ($45) and O1002 ($720). Tools run in your browser.</p>
    <button class="btn" id="a-run">Run agent</button>
    <div id="a-out"></div>`;

  $(el, '#a-run').onclick = e => busy(e.target, async () => {
    const out = $(el, '#a-out'); out.innerHTML = '';
    const gate = $(el, '#a-gate').checked, limit = $(el, '#a-limit').checked;
    const state = { verified: null };
    const log = html => out.insertAdjacentHTML('beforeend', html);

    // The hooks: plain code that runs BEFORE a tool executes.
    const preToolHook = (name, input) => {
      if (name !== 'process_refund') return null;
      if (gate && !state.verified) return { isError: true, category: 'permission', retryable: false, message: 'Blocked by policy hook: verify the customer with get_customer before any refund.' };
      if (limit && input.amount > 500) return { isError: true, category: 'business', retryable: false, message: `Blocked by policy hook: refund of $${input.amount} exceeds the $500 limit. Use escalate_to_human.` };
      return null;
    };
    const runTool = (name, input) => {
      if (name === 'get_customer') {
        const c = DB.customers[(input.email || '').toLowerCase()];
        if (!c) return { isError: true, category: 'validation', retryable: false, message: 'No customer with that email.' };
        state.verified = c.customer_id; return c;
      }
      if (name === 'lookup_order') return DB.orders[input.order_id] || { isError: true, category: 'validation', retryable: false, message: 'No such order.' };
      if (name === 'process_refund') return { success: true, refund_id: 'R' + Math.floor(Math.random() * 9000 + 1000), order_id: input.order_id, amount: input.amount };
      if (name === 'escalate_to_human') return { success: true, ticket: 'H' + Math.floor(Math.random() * 900 + 100), queued_for: 'human support' };
      return { isError: true, category: 'validation', message: 'Unknown tool' };
    };

    const messages = [{ role: 'user', content: $(el, '#a-msg').value }];
    const MAX_ITER = 8; // safety net, NOT the stop condition
    try {
      for (let i = 1; i <= MAX_ITER; i++) {
        const { response } = await callClaude({ system: $(el, '#a-sys').value, tools: AGENT_TOOLS, max_tokens: 800, messages });
        messages.push({ role: 'assistant', content: response.content });
        const text = textOf(response);
        let step = `<div class="step"><div class="stephead">Iteration ${i} · stop_reason <code>${esc(response.stop_reason)}</code></div>${text ? `<div class="reply">${esc(text)}</div>` : ''}`;
        if (response.stop_reason !== 'tool_use') { log(step + '<p class="ok">Loop ended because stop_reason is not tool_use.</p></div>'); break; }
        const results = [];
        for (const b of response.content.filter(b => b.type === 'tool_use')) {
          const blocked = preToolHook(b.name, b.input);
          const result = blocked || runTool(b.name, b.input);
          const isErr = !!result.isError;
          step += `<div class="toolcall${isErr ? ' blocked' : ''}"><b>${esc(b.name)}</b>(${esc(JSON.stringify(b.input))})<br>→ ${blocked ? '<b>HOOK BLOCKED</b> ' : ''}${esc(JSON.stringify(result))}</div>`;
          if (b.name === 'process_refund' && !blocked && !state.verified) step += '<p class="warn">Refund executed with no verified customer. The prompt rule was ignored and nothing stopped it.</p>';
          if (b.name === 'process_refund' && !blocked && b.input.amount > 500) step += '<p class="warn">Refund over $500 executed. Prompt guidance alone did not hold.</p>';
          results.push({ type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(result), ...(isErr ? { is_error: true } : {}) });
        }
        log(step + '</div>');
        messages.push({ role: 'user', content: results });
        if (i === MAX_ITER) log('<p class="warn">Stopped by the safety cap.</p>');
      }
      log(json('Full messages history at the end', messages));
    } catch (err) { log(errBox(err)); }
  });
}

// =====================================================================
// LAB: multi — coordinator, parallel subagents, synthesis, isolation
// =====================================================================
function multi(el) {
  el.innerHTML = `
    <label>Research question<input id="m-q" value="What should a UK real estate consultancy consider before deploying AI agents on its client data?"></label>
    <label class="check"><input type="checkbox" id="m-pass" checked> <span>Pass subagent findings to the synthesis agent</span></label>
    <p class="meta">Subagents use Claude’s own knowledge (no web search) to keep the lab cheap. Four to five calls in total.</p>
    <button class="btn" id="m-run">Run pipeline</button>
    <div id="m-out"></div>`;

  $(el, '#m-run').onclick = e => busy(e.target, async () => {
    const out = $(el, '#m-out'); out.innerHTML = '';
    const log = h => out.insertAdjacentHTML('beforeend', h);
    const question = $(el, '#m-q').value;
    try {
      // 1. Coordinator decomposes, with a forced tool for a structured plan
      const plan = await callClaude({
        max_tokens: 600,
        system: 'You are a research coordinator. Break the question into 2 or 3 distinct, non-overlapping sub-questions that together cover it fully. Each brief must be self-contained: the analyst who receives it sees nothing else.',
        tools: [{ name: 'plan_research', description: 'Record the research plan.', input_schema: { type: 'object', properties: { subtasks: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'object', properties: { title: { type: 'string' }, brief: { type: 'string' } }, required: ['title', 'brief'] } } }, required: ['subtasks'] } }],
        tool_choice: { type: 'tool', name: 'plan_research' },
        messages: [{ role: 'user', content: question }]
      });
      const subtasks = plan.response.content.find(b => b.type === 'tool_use').input.subtasks;
      log(`<div class="step"><div class="stephead">1 · Coordinator plan</div><ol>${subtasks.map(s => `<li><b>${esc(s.title)}</b>: ${esc(s.brief)}</li>`).join('')}</ol>${json('Coordinator request', plan.request)}</div>`);

      // 2. Subagents run in PARALLEL, each in its own isolated context
      const findingsTool = { name: 'report_findings', description: 'Return findings as structured data.', input_schema: { type: 'object', properties: { key_points: { type: 'array', items: { type: 'string' } }, caveats: { type: 'string' } }, required: ['key_points', 'caveats'] } };
      const subs = await Promise.all(subtasks.map(s => callClaude({
        max_tokens: 700,
        system: 'You are a specialist analyst. You know only what is in your brief. Return 3 to 5 concise key points and any caveats.',
        tools: [findingsTool], tool_choice: { type: 'tool', name: 'report_findings' },
        messages: [{ role: 'user', content: `Brief: ${s.title}\n${s.brief}` }]
      })));
      const findings = subs.map((r, i) => ({ subtask: subtasks[i].title, ...r.response.content.find(b => b.type === 'tool_use').input }));
      log(`<div class="step"><div class="stephead">2 · Subagents (ran in parallel)</div>${findings.map((f, i) => `<h4>${esc(f.subtask)}</h4><ul>${f.key_points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>${json('Everything this subagent saw', subs[i].request.messages)}`).join('')}</div>`);

      // 3. Synthesis: gets findings ONLY if we pass them explicitly
      const pass = $(el, '#m-pass').checked;
      const synthInput = pass
        ? `Question: ${question}\n\nFindings from analysts (JSON):\n${JSON.stringify(findings, null, 2)}\n\nWrite a short synthesis (max 150 words) using ONLY these findings. Name which analyst each point came from.`
        : `Question: ${question}\n\nWrite a short synthesis (max 150 words) of the analysts’ findings. Name which analyst each point came from.`;
      const synth = await callClaude({ max_tokens: 500, system: 'You are a synthesis agent.', messages: [{ role: 'user', content: synthInput }] });
      log(`<div class="step"><div class="stephead">3 · Synthesis ${pass ? '' : '(findings NOT passed)'}</div><div class="reply">${esc(textOf(synth.response))}</div>
        ${pass ? '' : '<p class="warn">The synthesis agent never saw the findings. It either admits that or invents content. That’s context isolation.</p>'}
        ${json('Everything the synthesis agent saw', synth.request.messages)}</div>`);
    } catch (err) { log(errBox(err)); }
  });
}

export const LABS = { hello, chat, ab, extract, router, agent, multi };

export function mountLab(id, el) {
  const fn = LABS[id];
  if (!fn) { el.innerHTML = '<p class="err">Lab not found.</p>'; return; }
  const { key } = getSettings();
  if (!key) el.insertAdjacentHTML('beforebegin', '<p class="warn">Add your API key in <a href="#/settings">Settings</a> to run this lab.</p>');
  fn(el);
}
