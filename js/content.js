// content.js — the curriculum. Pure data: no logic lives here.
// Each lesson: id, title, body (HTML), optional lab (id from labs.js), optional quiz.
// Quiz options: o[0] is always the correct answer; the app shuffles them.

export const EXAM_DRILL_URL = 'https://claude.ai/artifact/TaS1CVDRWsQjnwGAxC6MCG';

export const MODULES = [
{
  id: 'm0', title: 'Software foundations', weight: null,
  intro: 'The minimum engineering you need so everything after this makes sense.',
  lessons: [
  {
    id: '0.1', title: 'How the web works',
    body: `
<p>Every app you use is a conversation between a <b>client</b> (your browser or phone) and a <b>server</b> (a computer somewhere else). The client sends a <b>request</b>; the server sends back a <b>response</b>. That pattern is called HTTP.</p>
<p>A request has four parts:</p>
<ul>
<li><b>URL</b>: where it goes, e.g. <code>https://api.anthropic.com/v1/messages</code>.</li>
<li><b>Method</b>: what kind of action. <code>GET</code> reads; <code>POST</code> sends data to be processed. Every Claude call is a POST.</li>
<li><b>Headers</b>: metadata, such as who you are (your API key) and what format you’re sending.</li>
<li><b>Body</b>: the actual content, usually JSON.</li>
</ul>
<p>The response comes back with a <b>status code</b>. Learn these five:</p>
<ul>
<li><code>200</code>: it worked.</li>
<li><code>400</code>: you sent something malformed. Your fault; retrying the same thing won’t help.</li>
<li><code>401</code>: not authorised. Usually a bad key.</li>
<li><code>429</code>: too many requests. Wait and retry.</li>
<li><code>500</code>/<code>529</code>: the server had a problem. Usually temporary; retry later.</li>
</ul>
<div class="callout"><b>Why this matters for the exam.</b> The split between “retry might work” (429, 5xx) and “retry won’t help” (400, 401) is the same split Domain 2 tests for tool errors: transient vs validation vs permission.</div>
<p>This app is a <b>static site</b>: GitHub Pages just hands your browser some files. There’s no server of yours involved. Your browser talks to Anthropic’s server directly.</p>`,
    quiz: [{ q: 'A call returns <code>429</code>. What should your code do?', o: ['Wait, then retry', 'Show “invalid request” and stop', 'Ask the user for a new API key', 'Retry immediately in a tight loop'], x: '429 means rate limited, which is transient. Back off, then retry. Hammering immediately makes it worse.' }]
  },
  {
    id: '0.2', title: 'JSON, APIs and schemas',
    body: `
<p><b>JSON</b> is the language APIs speak. You already know the ideas from data modelling: it’s just entities and attributes written as text.</p>
<pre>{
  "customer_id": "C001",
  "name": "Hannah",
  "orders": [ { "id": "O1001", "total": 45.00 } ],
  "notes": null
}</pre>
<p>Curly braces are an <b>object</b> (a record). Square brackets are an <b>array</b> (a list). Values are strings, numbers, <code>true</code>/<code>false</code>, or <code>null</code> (“known to be empty”).</p>
<p>An <b>API</b> (application programming interface) is a contract: send JSON shaped like <i>this</i> to <i>that</i> URL, and you’ll get JSON shaped like <i>this</i> back.</p>
<p>A <b>JSON Schema</b> describes what shape is allowed, the same way a semantic model or table definition does:</p>
<pre>{
  "type": "object",
  "properties": {
    "invoice_number": { "type": "string" },
    "due_date": { "type": ["string", "null"] },
    "total": { "type": "number" }
  },
  "required": ["invoice_number", "due_date", "total"]
}</pre>
<p>Note <code>due_date</code> allows <code>null</code>. That one design choice turns out to be an exam question: if a field is required and can’t be null, the model will <i>invent</i> a value when the document doesn’t have one.</p>
<div class="callout"><b>Your edge.</b> Schema design for Claude is data modelling. Required vs optional, nullable, enums with an “other” bucket: you’ve made all these calls before in Dataverse.</div>`,
    quiz: [{ q: 'In a schema, why make <code>due_date</code> nullable?', o: ['So the model can say “not present” instead of inventing a date', 'To make the JSON smaller', 'Because dates can’t be validated', 'To make the field optional for the API'], x: 'A non-nullable required field pressures the model to fabricate. Null is a legitimate “absent” answer.' }]
  },
  {
    id: '0.3', title: 'Just enough JavaScript', lab: 'hello',
    body: `
<p>You won’t need to write JavaScript to use this app, but you should be able to <i>read</i> it, because exam scenarios describe code behaviour. Five concepts cover almost everything:</p>
<p><b>Variables</b> hold values: <code>const model = "claude-haiku-5-5";</code></p>
<p><b>Functions</b> are reusable steps: <code>function add(a, b) { return a + b; }</code></p>
<p><b>Objects and arrays</b> are the JSON you just learned, in code form.</p>
<p><b>Conditionals and loops</b>: <code>if (x) {…}</code> and <code>while (x) {…}</code>. The agent loop in Module 4 is literally a <code>while</code> loop.</p>
<p><b>async / await</b>: network calls take time, so JavaScript doesn’t freeze waiting. <code>await</code> means “pause this function until the answer arrives”.</p>
<pre>const res = await fetch(url, {
  method: "POST",
  headers: { "x-api-key": key, "content-type": "application/json" },
  body: JSON.stringify(request)
});
const data = await res.json();</pre>
<p>That’s a complete Claude call. <code>fetch</code> sends the request; <code>JSON.stringify</code> turns an object into text; <code>res.json()</code> turns the reply back into an object.</p>
<p>Run the lab below. It makes exactly this call and shows you the request and the raw response. Look for <code>content</code>, <code>stop_reason</code> and <code>usage</code> in the response; you’ll meet each of them again.</p>`
  },
  {
    id: '0.4', title: 'Secrets, keys and CORS',
    body: `
<p>An <b>API key</b> is a password that spends money. Anyone who has it can make calls billed to you.</p>
<p><b>The rule:</b> a key must never sit anywhere the public can read it. Everything in a static website (HTML, JavaScript, files in your GitHub repo) is public. So you can never put a key in this repo’s code.</p>
<p><b>How this app handles it.</b> You paste your key into Settings. It’s stored in <i>your</i> browser’s local storage and sent directly from your browser to Anthropic. It never touches GitHub. That’s acceptable for a personal learning tool, but it has limits:</p>
<ul>
<li>Anyone using your browser profile could read it.</li>
<li>You can’t share this app with others using your key.</li>
<li>Browser-to-API calls need a special opt-in header, <code>anthropic-dangerous-direct-browser-access</code>. The name is the warning.</li>
</ul>
<p><b>The production pattern</b> is a small <b>backend</b> (for example a serverless function) that holds the key as an environment variable. The browser calls your backend, your backend calls Anthropic. Users never see the key, and you can add logins, rate limits and logging there.</p>
<p><b>CORS</b> (cross-origin resource sharing) is the browser’s safety rule: a page from <code>yourname.github.io</code> may only call another domain if that domain says it’s allowed. Anthropic allows it only when you send the opt-in header above.</p>
<div class="callout"><b>Do this now.</b> In the Claude Console, create a key just for this app and set a low monthly spend limit on it. A single lab call on Haiku costs a fraction of a penny.</div>
<p>Exam link: Domain 2 expects <code>\${ENV_VAR}</code> expansion in shared <code>.mcp.json</code> files for exactly this reason. Config gets committed; secrets don’t.</p>`,
    quiz: [{ q: 'Your team wants a shared app that calls Claude for 200 colleagues. Where does the key live?', o: ['In a backend, as an environment variable, never sent to the browser', 'In the JavaScript, minified so it’s hard to read', 'In each user’s browser storage, distributed by email', 'In a private GitHub repo'], x: 'Secrets stay server-side. Minified code is still public; emailing keys spreads them; private repos still get cloned and leaked.' }]
  },
  {
    id: '0.5', title: 'Git, GitHub and deploying',
    body: `
<p><b>Git</b> tracks every change to a folder of files. Each saved snapshot is a <b>commit</b>, with a message saying what changed. You can always go back.</p>
<p><b>GitHub</b> hosts git folders (<b>repositories</b>) online. <b>GitHub Pages</b> turns a repo into a website.</p>
<p>The vocabulary you’ll hit in Claude Code and the exam:</p>
<ul>
<li><b>Branch</b>: a parallel line of work, so you can try changes without breaking the main version.</li>
<li><b>Pull request (PR)</b>: a proposal to merge a branch into main, where review happens. Automated Claude reviews run on PRs in Domain 3.</li>
<li><b>CI/CD</b> (continuous integration/deployment): scripts that run automatically on every push or PR, like tests, reviews and deploys. GitHub Actions is GitHub’s CI system.</li>
<li><b>Version-controlled</b>: lives in the repo, so the whole team gets it. This is why a project <code>CLAUDE.md</code> is shared and your user-level one isn’t.</li>
</ul>
<p>This app’s repo includes a <code>CLAUDE.md</code> and a <code>.claude/</code> folder on purpose. In Module 5 you’ll open the repo in Claude Code and watch them work.</p>`
  }
  ]
},
{
  id: 'm1', title: 'The Messages API', weight: null,
  intro: 'One endpoint does everything. Learn its shape cold.',
  lessons: [
  {
    id: '1.1', title: 'Anatomy of a request', lab: 'chat',
    body: `
<p>Every Claude interaction, from a chatbot to a multi-agent system, is built from the same request:</p>
<pre>{
  "model": "claude-haiku-5-5",
  "max_tokens": 1024,
  "system": "You are a concise analyst.",
  "messages": [
    { "role": "user", "content": "What is a cap rate?" },
    { "role": "assistant", "content": "Net operating income divided by…" },
    { "role": "user", "content": "And a good one for London logistics?" }
  ]
}</pre>
<ul>
<li><b>system</b>: standing instructions, the role and rules. Not part of the back-and-forth.</li>
<li><b>messages</b>: the conversation, alternating <code>user</code> and <code>assistant</code>.</li>
<li><b>max_tokens</b>: a hard ceiling on the reply length.</li>
</ul>
<p><b>The big idea: the API is stateless.</b> Claude remembers nothing between calls. A “conversation” is your code resending the entire history every time. Watch the messages array grow in the lab.</p>
<p>Three consequences that run through the whole exam:</p>
<ul>
<li>You pay for the whole history on every call, so long conversations get expensive.</li>
<li>You control exactly what Claude sees. That’s the whole of context management (Domain 5).</li>
<li>A subagent knows <i>only</i> what you put in its messages. That’s context isolation (Domain 1).</li>
</ul>`,
    quiz: [{ q: 'A chatbot “forgets” what the user said three messages ago. Most likely cause?', o: ['The code isn’t resending the earlier messages in the history', 'Claude’s memory was full', 'The system prompt was too long', 'max_tokens was too low'], x: 'The API is stateless. If earlier turns aren’t in the messages array, Claude never sees them.' }]
  },
  {
    id: '1.2', title: 'Stop reasons, tokens and cost',
    body: `
<p>Every response tells you <b>why</b> Claude stopped, in <code>stop_reason</code>:</p>
<ul>
<li><code>end_turn</code>: it finished naturally.</li>
<li><code>max_tokens</code>: it hit your ceiling mid-thought. Output is cut off.</li>
<li><code>tool_use</code>: it wants you to run a tool and send back the result. This is the engine of every agent.</li>
<li><code>stop_sequence</code>: it produced a string you told it to stop at.</li>
</ul>
<p>Try the chat lab with max_tokens set to 20 and see <code>max_tokens</code> appear.</p>
<p><b>Tokens</b> are chunks of text, roughly ¾ of a word. <code>usage</code> in each response reports <code>input_tokens</code> (everything you sent) and <code>output_tokens</code> (what came back). Output tokens cost several times more than input tokens.</p>
<div class="callout"><b>Exam pattern.</b> Code that decides “the agent is done” by checking for text, or by looking for a phrase like “TASK COMPLETE”, is wrong. The correct signal is <code>stop_reason</code>. You’ll build this in Module 4.</div>
<p>Cost levers worth knowing: smaller models for simple sub-tasks, trimming what you resend, and the Message Batches API (half price, slower) for work that can wait. More in 2.4.</p>`,
    quiz: [{ q: 'Your extraction output is sometimes cut off mid-JSON. What do you check first?', o: ['Whether <code>stop_reason</code> is <code>max_tokens</code>', 'Whether the model is hallucinating', 'Whether the system prompt is too short', 'Whether the API key has expired'], x: 'Truncated output with <code>stop_reason: "max_tokens"</code> means the ceiling was too low.' }]
  }
  ]
},
{
  id: 'm2', title: 'Prompting and structured output', weight: 20,
  intro: 'Exam Domain 4. Reliable prompts, guaranteed structure, and validation.',
  lessons: [
  {
    id: '2.1', title: 'Explicit criteria beat vague instructions', lab: 'ab',
    body: `
<p>The most common prompt failure in production isn’t bad wording. It’s <b>vagueness</b>. Instructions like “be conservative”, “only flag important issues” or “high-confidence only” sound precise to you, but give the model nothing to measure against.</p>
<p>Compare:</p>
<pre>Vague:    Review this code. Only report high-confidence issues.

Explicit: Report only:
          - bugs that would cause incorrect output or a crash
          - security issues (injection, exposed secrets)
          Do NOT report: style, naming, missing comments,
          or "consider refactoring" suggestions.
          For each issue give: line, category, one-sentence fix.</pre>
<p>The explicit version defines <i>what counts</i>, <i>what doesn’t</i>, and <i>what shape</i> the answer takes. The lab runs both on the same input, side by side.</p>
<p><b>Production tactic:</b> if an automated reviewer has lost developers’ trust through false positives, temporarily switch off the noisiest categories while you tighten criteria. Precision rebuilds trust faster than recall.</p>`,
    quiz: [{ q: 'A reviewer produces too many false positives. The prompt says “be conservative”. Best next step?', o: ['Define what to report and what to skip, with examples', 'Change it to “be extremely conservative”', 'Filter on the model’s self-rated confidence', 'Switch to a bigger model'], x: 'Vague calibration words don’t move precision; explicit criteria do. Self-rated confidence is poorly calibrated for this.' }]
  },
  {
    id: '2.2', title: 'Few-shot examples',
    body: `
<p><b>Few-shot</b> means showing the model worked examples, not just describing the task. Instructions tell it the rule; examples show it where the edges are.</p>
<p>Use 2–4 examples, chosen for the <b>ambiguous cases</b>, not the obvious ones. Show the reasoning, not just the label:</p>
<pre>Input: "Unit 4B, rent reviewed to £42k pa from Mar"
Reasoning: a rent review is a change to an existing lease,
not a new letting.
Output: { "event": "rent_review", "new_rent": 42000 }</pre>
<p>Few-shot is strongest for:</p>
<ul>
<li>consistent judgement on borderline cases (is this a bug or a style issue?)</li>
<li>consistent output format across very different inputs</li>
<li>documents with varied structure, where the model should find data in unusual places rather than invent it</li>
</ul>
<p><b>Not</b> the right tool when you need a guaranteed structure (use a schema, next lesson) or 100% compliance with a business rule (use code, Module 4).</p>`,
    quiz: [{ q: 'Which examples should you include in a few-shot prompt?', o: ['The ambiguous edge cases, with the reasoning shown', 'The most common, easiest cases', 'As many as fit in the context window', 'Random samples from production'], x: 'Examples earn their place on cases where instructions alone leave the answer unclear.' }]
  },
  {
    id: '2.3', title: 'Structured output with tool_use', lab: 'extract',
    body: `
<p>Asking “please reply in JSON” works most of the time. In production, most of the time isn’t enough. The reliable pattern is a trick:</p>
<ol>
<li>Define a <b>tool</b> whose <code>input_schema</code> is exactly the structure you want.</li>
<li>Force Claude to “call” it with <code>tool_choice</code>.</li>
<li>Read the tool’s <i>input</i>. That’s your data. You never actually run the tool.</li>
</ol>
<pre>tools: [{
  name: "record_invoice",
  description: "Record the fields extracted from an invoice.",
  input_schema: { …your JSON Schema… }
}],
tool_choice: { type: "tool", name: "record_invoice" }</pre>
<p>This <b>eliminates syntax errors</b>: no stray prose, no broken JSON. But it does <b>not</b> eliminate <b>semantic errors</b>: line items that don’t add up, a value in the wrong field, an invented date.</p>
<p>Defences against semantic errors are schema design and validation:</p>
<ul>
<li>Nullable fields for data that may be absent.</li>
<li>Enums with an <code>"other"</code> value plus a free-text detail field.</li>
<li>Self-check fields, e.g. extract both line items and the stated total, then compare in code.</li>
</ul>
<p>The lab lets you flip <code>due_date</code> between nullable and required on an invoice that has no due date. Watch what happens.</p>`,
    quiz: [{ q: 'Extraction JSON is always valid but totals sometimes don’t match line items. Why?', o: ['Schemas prevent syntax errors, not semantic ones', 'The schema isn’t strict enough', 'tool_choice should be "auto"', 'Temperature is too high'], x: 'tool_use guarantees structure, not correctness. Add cross-checks and validate in code.' }]
  },
  {
    id: '2.4', title: 'Validation, retries and batch processing',
    body: `
<p><b>Validation-retry loop.</b> When your code finds a problem in extracted data, send it back with specifics:</p>
<ol>
<li>the original document</li>
<li>the failed extraction</li>
<li>the exact error (“line items sum to 1,180 but total says 1,250”)</li>
</ol>
<p>This fixes misreadings and format slips. It <b>cannot</b> fix information that isn’t in the source. If the PO number isn’t in the document, retrying three times just burns money; return null and route to a human. The extraction lab includes a retry button so you can see both outcomes.</p>
<p><b>Message Batches API.</b> Submit thousands of requests in one go:</p>
<ul>
<li>50% cheaper</li>
<li>results within up to 24 hours, with no latency guarantee</li>
<li>each request has a <code>custom_id</code> so you can match results back</li>
<li>no multi-turn tool use inside one request</li>
</ul>
<p>Good fit: overnight document processing, weekly audits. Bad fit: anything someone is waiting on, like a pre-merge check that blocks a PR. Test your prompt on a small sample first, and resubmit only the failed items.</p>
<p><b>Self-review.</b> A session that generated something is poor at reviewing it; it still carries the reasoning that produced it. Use an independent instance. For large reviews, run per-file passes, then a separate cross-file integration pass.</p>`,
    quiz: [{ q: 'Which workload suits the Message Batches API?', o: ['A nightly audit of 10,000 documents', 'A blocking pre-merge security check', 'A live customer support chat', 'An agent that calls tools across several turns'], x: 'Batches is for non-blocking work. Up to 24h, no SLA, no multi-turn tool calling within a request.' }]
  }
  ]
},
{
  id: 'm3', title: 'Tools and MCP', weight: 18,
  intro: 'Exam Domain 2. How Claude reaches the outside world, and how to design that reach.',
  lessons: [
  {
    id: '3.1', title: 'How tool use works',
    body: `
<p>Claude can’t run code or reach your systems. What it <i>can</i> do is ask <b>you</b> to. The exchange:</p>
<ol>
<li>You send tool definitions (name, description, input schema) with your request.</li>
<li>Claude replies with <code>stop_reason: "tool_use"</code> and a <code>tool_use</code> block: which tool, which inputs, and an <code>id</code>.</li>
<li><b>Your code</b> runs the tool.</li>
<li>You send back a user message containing a <code>tool_result</code> block with the same <code>tool_use_id</code>.</li>
<li>Claude continues: another tool call, or a final answer.</li>
</ol>
<pre>// Claude's turn
{ "type": "tool_use", "id": "toolu_01A", "name": "lookup_order",
  "input": { "order_id": "O1001" } }

// Your reply
{ "role": "user", "content": [
  { "type": "tool_result", "tool_use_id": "toolu_01A",
    "content": "{\\"status\\": \\"delivered\\", \\"total\\": 45}" } ] }</pre>
<p>Key point: <b>you are always in control</b>. Claude proposes; your code decides whether to execute. That’s what makes hooks and policy gates possible (Module 4).</p>`,
    quiz: [{ q: 'Who executes a tool when Claude returns a tool_use block?', o: ['Your application code', 'Anthropic’s servers', 'Claude, inside the model', 'The MCP specification'], x: 'Claude only requests a call. Your code runs it and returns a tool_result. MCP servers are code you (or someone) run, too.' }]
  },
  {
    id: '3.2', title: 'Tool descriptions and tool_choice', lab: 'router',
    body: `
<p>The <b>description</b> is the main thing Claude uses to decide which tool to call. Vague, overlapping descriptions are the number-one cause of wrong tool selection.</p>
<p>A good description says:</p>
<ul>
<li>what it does and what it returns</li>
<li>what input format it expects, with an example</li>
<li>when to use it, and when <b>not</b> to (especially vs similar tools)</li>
</ul>
<pre>Weak:   "Retrieves information."
Strong: "Look up a single order by its order ID (format O1234).
         Returns status, items, total and delivery date.
         Use for questions about a specific order. Do not use
         to find a customer; use get_customer for that."</pre>
<p><b>Too many tools</b> also degrades selection. Give each agent the 4–5 it needs for its role, not all 18.</p>
<p><code>tool_choice</code> controls whether Claude must call a tool:</p>
<ul>
<li><code>{"type":"auto"}</code>: may call a tool or answer in text (default).</li>
<li><code>{"type":"any"}</code>: must call some tool, Claude picks which. Use when output must be structured but the right schema varies.</li>
<li><code>{"type":"tool","name":"x"}</code>: must call that tool. Use for a fixed first step or a single extraction schema.</li>
</ul>`,
    quiz: [{ q: 'You must always get structured output, but the document could be one of three types, each with its own schema tool. Which tool_choice?', o: ['<code>any</code>', '<code>auto</code>', 'Forced to the first tool', 'None'], x: 'any guarantees a tool call and lets Claude pick the matching schema.' }]
  },
  {
    id: '3.3', title: 'Designing tool errors',
    body: `
<p>When a tool fails, what you send back decides whether the agent recovers sensibly or confidently says something false.</p>
<p><b>The classic bug:</b> the search API times out, the tool returns an empty list, and the agent reports “there are no results”. It can’t tell <i>failure</i> from <i>nothing found</i>.</p>
<p>Return structured errors instead:</p>
<pre>{
  "isError": true,
  "category": "transient",      // transient | validation | business | permission
  "retryable": true,
  "message": "Search API timed out after 10s",
  "attempted": { "query": "London logistics yields 2026" }
}</pre>
<ul>
<li><b>transient</b>: try again.</li>
<li><b>validation</b>: bad input; fix the input, don’t repeat it.</li>
<li><b>business</b>: a rule says no (refund window closed). Explain to the user.</li>
<li><b>permission</b>: not allowed; escalate or stop.</li>
</ul>
<p>In the API, set <code>"is_error": true</code> on the <code>tool_result</code> block too. The agent should retry transient failures locally, and pass up only what it can’t resolve, with any partial results.</p>
<p>This app does the same thing: <code>js/claude.js</code> turns HTTP failures into a <code>ClaudeError</code> with a category and a retryable flag. Go read it; it’s short.</p>`,
    quiz: [{ q: 'A tool times out. What should it return?', o: ['A structured error marked transient and retryable', 'An empty result list', 'A generic “something went wrong”', 'Nothing, and stop the whole workflow'], x: 'The agent needs to distinguish failure from an empty result, and know whether retrying makes sense.' }]
  },
  {
    id: '3.4', title: 'MCP: servers, primitives and scopes',
    body: `
<p>The <b>Model Context Protocol</b> is a standard plug for connecting AI apps to tools and data, so you write an integration once and any MCP-aware app can use it.</p>
<p>Three roles:</p>
<ul>
<li><b>Host</b>: the app the user is in (Claude Code, Claude Desktop).</li>
<li><b>Client</b>: the connector inside the host, one per server.</li>
<li><b>Server</b>: the program that exposes capabilities (a GitHub server, a Dataverse server you might write).</li>
</ul>
<p>Three primitives a server can offer:</p>
<ul>
<li><b>Tools</b>: actions the model can call.</li>
<li><b>Resources</b>: readable content (catalogues, schemas, documents). Use these to let the agent see what exists without burning exploratory tool calls.</li>
<li><b>Prompts</b>: reusable templates.</li>
</ul>
<p>Transports: <b>stdio</b> (the server runs locally as a process) or <b>HTTP</b> (a remote server).</p>
<p><b>Scopes in Claude Code:</b></p>
<ul>
<li>Project: <code>.mcp.json</code> in the repo, shared with the team. Put secrets in environment variables: <code>"token": "\${GITHUB_TOKEN}"</code>.</li>
<li>User: <code>~/.claude.json</code>, personal servers and experiments.</li>
</ul>
<p>All configured servers’ tools are available at once, so their descriptions compete. If the agent keeps using built-in Grep instead of your richer MCP search, improve your tool’s description.</p>
<p><b>Build vs reuse:</b> use existing servers for standard integrations (GitHub, Jira); build your own for workflows specific to your team.</p>`,
    quiz: [{ q: 'An agent wastes calls listing things just to see which database schemas exist. What MCP feature fixes this?', o: ['Expose the schemas as resources', 'Add more list tools', 'Use the stdio transport', 'Add a prompt template'], x: 'Resources give the agent visibility of available content up front.' }]
  }
  ]
},
{
  id: 'm4', title: 'Agentic architecture', weight: 27,
  intro: 'Exam Domain 1, the heaviest. Loops, hooks, coordinators and subagents.',
  lessons: [
  {
    id: '4.1', title: 'The agent loop', lab: 'agent',
    body: `
<p>An <b>agent</b> is tool use in a loop. That’s all. The code is short enough to memorise:</p>
<pre>messages = [ user's request ]
while (true) {
  response = callClaude(system, tools, messages)
  messages.push(assistant: response.content)
  if (response.stop_reason !== "tool_use") break   // done
  results = run each tool_use block
  messages.push(user: tool_results)
}</pre>
<p>Notice what decides when to stop: <code>stop_reason</code>. Not the presence of text (Claude often writes text <i>and</i> calls a tool in the same turn), not a magic phrase, not an iteration count. A maximum iteration count is still sensible, but as a <b>safety net</b>, not the stop condition.</p>
<p>The lab is a customer support agent with three fake back-office tools running inside your browser. Ask it something like “What’s the status of order O1001? My email is hannah@example.com” and read the trace: each iteration, what Claude asked for, what the tool returned.</p>
<p>Try to break it: ask for a refund on O1002 without giving your email. Then read the next lesson.</p>`,
    quiz: [{ q: 'An agent sometimes stops early. The code treats any response with a text block as “done”. Fix?', o: ['Loop while stop_reason is "tool_use"; stop on "end_turn"', 'Cap at five iterations', 'Parse for “TASK COMPLETE”', 'Tell it in the prompt to always call a tool'], x: 'stop_reason is the signal. Text can appear alongside a tool call.' }]
  },
  {
    id: '4.2', title: 'Hooks: when code beats prompts', lab: 'agent',
    body: `
<p>Prompts are <b>advisory</b>. Even an excellent instruction will be missed some small percentage of the time. For most behaviour, that’s fine. For some, it isn’t:</p>
<ul>
<li>Never refund before identity is verified.</li>
<li>Never refund over $500 without a human.</li>
<li>Never touch the production database.</li>
</ul>
<p>For these, enforce in <b>code</b>. Because your code runs every tool (3.1), it can inspect each call first:</p>
<ul>
<li><b>Prerequisite gate</b>: block <code>process_refund</code> until <code>get_customer</code> has returned a verified customer.</li>
<li><b>Interception hook</b>: before a call executes, check it against policy; block or redirect (e.g. “over limit, use escalate_to_human”).</li>
<li><b>Post-tool hook</b>: after a call, transform the result, e.g. normalise date formats from three different systems before Claude sees them.</li>
</ul>
<p>In the lab, switch the hooks on and off and retry the refund. With hooks off, you’re relying on the prompt. With hooks on, the block is guaranteed, and the agent receives a clear error explaining why, so it can respond sensibly.</p>
<div class="callout"><b>The test.</b> If a single failure would be unacceptable (money, safety, compliance), it’s a hook. If you’d trust a sensible junior to use judgement, it’s a prompt.</div>`,
    quiz: [{ q: 'Refunds over $500 must never be executed by the agent. Which mechanism?', o: ['An interception hook that blocks the call and redirects to escalation', 'A clear rule in the system prompt', 'A post-tool hook that normalises amounts', 'Few-shot examples of escalating'], x: 'Deterministic requirement, so enforce before execution. Post-tool hooks run after the action has happened.' }]
  },
  {
    id: '4.3', title: 'Coordinators and subagents', lab: 'multi',
    body: `
<p>One agent doing everything degrades: its context fills with detail, too many tools look relevant, and it loses track. The fix is <b>hub-and-spoke</b>:</p>
<ul>
<li>A <b>coordinator</b> breaks the task down, delegates, collects results and handles errors.</li>
<li><b>Subagents</b> each do one focused piece, in their own fresh context, with only the tools they need.</li>
<li>Subagents return <b>structured summaries</b>, not their full working.</li>
</ul>
<p><b>Context isolation is the point, and the trap.</b> A subagent knows nothing except what you pass it. It doesn’t see the coordinator’s conversation. If the synthesis step needs earlier findings, you must put them in its prompt explicitly, with sources attached.</p>
<p>In the Agent SDK, subagents are launched with the <code>Task</code> tool, so the coordinator must be allowed to use it. Independent subagents should be launched together in one coordinator turn so they run in parallel.</p>
<p><b>Failure to recognise:</b> if every subagent did its job well but the final report misses whole areas, the coordinator’s decomposition was too narrow. Don’t blame the workers.</p>
<p>The lab runs a real coordinator → parallel subagents → synthesis pipeline and shows you exactly what each agent was given. Switch off “pass findings to synthesis” to watch isolation bite.</p>`,
    quiz: [{ q: 'The synthesis agent writes claims unrelated to what the search agents found. Most likely?', o: ['The findings weren’t passed explicitly into its prompt', 'Its context window is too small', 'It needs a bigger model', 'The search agents ran in parallel'], x: 'Subagents don’t inherit context. Pass what they need, explicitly.' }]
  },
  {
    id: '4.4', title: 'Sessions, decomposition and handoff',
    body: `
<p><b>Two ways to decompose work:</b></p>
<ul>
<li><b>Fixed chain</b>: the same steps every time (extract → validate → summarise). Predictable and testable. Use when the shape of the task is known.</li>
<li><b>Dynamic</b>: the coordinator decides the steps as it learns. Use for open-ended investigation.</li>
</ul>
<p>Watch the size of pieces: over-splitting into dozens of tiny subagents makes orchestration cost more than it saves. Each subagent should own a coherent piece with clear inputs and outputs.</p>
<p><b>Sessions in Claude Code and the Agent SDK:</b></p>
<ul>
<li><code>--resume</code> continues a named session.</li>
<li><code>fork_session</code> branches from a point to explore an alternative without disturbing the original.</li>
<li>If files have changed since the session read them, its old tool results are stale. Start fresh with a summary of findings, and tell it what changed.</li>
</ul>
<p><b>Handing off to a human:</b> the human hasn’t read the transcript. Give a structured summary: who the customer is, what’s happened, root cause, amounts, what you recommend.</p>`,
    quiz: [{ q: 'Resuming yesterday’s session, but the code has since been refactored. Best approach?', o: ['New session seeded with a summary, pointed at what changed', 'Resume as-is', 'Fork the old session', 'Compact the old session and continue'], x: 'Resumed sessions carry stale reads that look current. A fresh, briefed session avoids that.' }]
  }
  ]
},
{
  id: 'm5', title: 'Claude Code', weight: 20,
  intro: 'Exam Domain 3. Configuration you can only really learn by doing, using this repo.',
  lessons: [
  {
    id: '5.1', title: 'CLAUDE.md and rules',
    body: `
<p><b>CLAUDE.md</b> is a markdown file of standing instructions Claude Code loads automatically. Three levels:</p>
<ul>
<li><b>User</b>: <code>~/.claude/CLAUDE.md</code>. Your personal preferences across all projects. <i>Not in any repo</i>, so not shared.</li>
<li><b>Project</b>: <code>CLAUDE.md</code> (or <code>.claude/CLAUDE.md</code>) in the repo. Shared with everyone who clones it.</li>
<li><b>Directory</b>: a <code>CLAUDE.md</code> in a subfolder, for that folder.</li>
</ul>
<p>Classic exam scenario: a new team member’s Claude ignores standards everyone else gets. Answer: the standards are in someone’s user-level file. Move them to the project file.</p>
<p><b>Useful tools:</b> <code>@path/to/file.md</code> inside CLAUDE.md imports another file (keeps it modular). The <code>/memory</code> command shows which memory files are actually loaded.</p>
<p><b>Path-scoped rules.</b> Files in <code>.claude/rules/</code> can start with frontmatter naming which files they apply to:</p>
<pre>---
paths: ["js/labs.js"]
---
Every lab must show the raw request and response…</pre>
<p>They load only when Claude works on matching files. Ideal for conventions that cut across many folders, like all <code>**/*.test.tsx</code> files.</p>
<div class="callout"><b>Hands-on.</b> This repo has a project <code>CLAUDE.md</code> and two path-scoped rules in <code>.claude/rules/</code>. Install Claude Code, open the repo folder, run <code>/memory</code>, then ask it to edit <code>js/labs.js</code> and watch it follow the labs rule.</div>`,
    quiz: [{ q: 'Conventions apply to every <code>*.test.tsx</code> file across 40 folders. Best place?', o: ['A <code>.claude/rules/</code> file with a <code>paths</code> glob', 'A CLAUDE.md in each of the 40 folders', 'The user-level CLAUDE.md', 'A slash command'], x: 'Path-scoped rules load conditionally on the glob, with one source of truth.' }]
  },
  {
    id: '5.2', title: 'Commands, skills and plan mode',
    body: `
<p><b>Slash commands</b> are saved prompts you trigger by name:</p>
<ul>
<li><code>.claude/commands/</code> in the repo: shared with the team.</li>
<li><code>~/.claude/commands/</code>: personal.</li>
</ul>
<p>This repo has <code>/add-lesson</code>. Try it in Claude Code.</p>
<p><b>Skills</b> are folders with a <code>SKILL.md</code> that Claude loads <i>on demand</i> when a task matches, unlike CLAUDE.md, which is always loaded. Useful frontmatter:</p>
<ul>
<li><code>context: fork</code>: run in an isolated sub-context so verbose output doesn’t flood the main conversation.</li>
<li><code>allowed-tools</code>: restrict which tools the skill can use.</li>
<li><code>argument-hint</code>: prompts the user for the right input.</li>
</ul>
<p><b>Plan mode vs direct execution:</b></p>
<ul>
<li><b>Plan mode</b> for big, ambiguous or architectural changes touching many files. Claude explores and proposes; nothing is edited until you agree.</li>
<li><b>Direct execution</b> for small, clear changes.</li>
</ul>
<p>The <b>Explore</b> subagent does verbose codebase discovery in its own context and returns a summary, keeping your main session clean.</p>
<p><b>Working iteratively:</b> concrete input/output examples beat prose descriptions; tests make a good spec; for fuzzy requirements, ask Claude to interview you first.</p>`,
    quiz: [{ q: 'A skill’s exploration output clutters the main conversation. What do you add?', o: ['<code>context: fork</code>', '<code>allowed-tools</code>', 'A CLAUDE.md rule asking for brevity', 'Run /compact afterwards'], x: 'fork isolates the skill’s working context; only the result comes back.' }]
  },
  {
    id: '5.3', title: 'Claude Code in CI/CD',
    body: `
<p>Claude Code can run inside automated pipelines, e.g. reviewing every pull request.</p>
<ul>
<li><code>claude -p "…"</code>: <b>print mode</b>, non-interactive. Without it the job waits for input forever and times out.</li>
<li><code>--output-format json</code> (optionally with a JSON schema): output your pipeline can parse, instead of scraping free text.</li>
<li>The project <code>CLAUDE.md</code> gives the CI run the same project context developers get.</li>
</ul>
<p>Design patterns the exam tests:</p>
<ul>
<li><b>Independent reviewer.</b> The review should be a separate instance from whatever generated the code.</li>
<li><b>No duplicate comments.</b> Give the reviewer the previous findings and ask only for new or still-unfixed issues.</li>
<li><b>No duplicate test suggestions.</b> Give it the existing tests.</li>
<li><b>Blocking checks need speed</b>, so use the normal API, not Batches.</li>
</ul>`,
    quiz: [{ q: 'A CI job calling <code>claude "review this"</code> hangs. Fix?', o: ['Add <code>-p</code>', 'Add <code>--output-format json</code>', 'Set a headless environment variable', 'Pipe <code>yes</code> into it'], x: 'Print mode runs once and exits.' }]
  }
  ]
},
{
  id: 'm6', title: 'Context and reliability', weight: 15,
  intro: 'Exam Domain 5. Keeping systems accurate as conversations and pipelines grow.',
  lessons: [
  {
    id: '6.1', title: 'Keeping the important facts',
    body: `
<p>Because every call resends history (1.1), long sessions get summarised or trimmed. That causes predictable failures:</p>
<ul>
<li><b>Summaries lose specifics.</b> “Customer wants a refund” survives; “order O1002, £720, agreed on 14 Oct” doesn’t. Fix: keep a <b>case facts</b> block (IDs, amounts, dates, decisions) and include it in every call, outside the part that gets summarised.</li>
<li><b>Lost in the middle.</b> Models attend best to the start and end of long inputs. Put key findings first; use clear headers.</li>
<li><b>Bloated tool output.</b> An order lookup returning 40 fields when 5 matter. Trim before it enters context.</li>
<li><b>Verbose subagents.</b> Subagents should return structured findings, not their reasoning transcript.</li>
</ul>
<p>For long investigations: scratchpad files to note findings, delegate deep reading to subagents, <code>/compact</code> in Claude Code, and state manifests so a coordinator can recover if something crashes.</p>
<div class="callout"><b>Wrong answer to spot.</b> “Use a bigger context window.” It puts more into the same weak middle and costs more.</div>`,
    quiz: [{ q: 'After history is summarised, the agent forgets the agreed refund amount. Fix?', o: ['A persistent case-facts block included in every call', 'Summarise less often', 'A bigger context window', 'Ask the customer again'], x: 'Keep transactional facts structured and outside the summarised history.' }]
  },
  {
    id: '6.2', title: 'Escalation and ambiguity',
    body: `
<p>When should an agent hand over to a human? Three reliable triggers:</p>
<ul>
<li>The customer <b>explicitly asks</b> for a person. Do it straight away, even if the issue looks simple.</li>
<li>The <b>policy is silent or ambiguous</b>, or an exception is needed (e.g. a competitor price-match request when policy only covers your own prices).</li>
<li>The agent <b>can’t make meaningful progress</b>.</li>
</ul>
<p>Two unreliable triggers the exam offers as distractors:</p>
<ul>
<li><b>Sentiment scores.</b> Frustration doesn’t equal complexity. A frustrated customer with a simple problem should get the fix (escalate if they then ask for a human).</li>
<li><b>Self-reported confidence.</b> The model’s own “I’m 70% sure” is poorly calibrated for this decision.</li>
</ul>
<p><b>Ambiguous matches:</b> if a customer lookup returns three John Smiths, ask for another identifier. Never pick one by heuristic (most recent, most orders); acting on the wrong account is worse than one more question.</p>`,
    quiz: [{ q: 'Which is a reliable escalation trigger?', o: ['The policy doesn’t cover the request', 'Sentiment below a threshold', 'Model confidence under 0.7', 'The conversation exceeds ten turns'], x: 'Explicit request, policy gap, no progress. Sentiment and self-confidence aren’t reliable.' }]
  },
  {
    id: '6.3', title: 'Errors, provenance and human review',
    body: `
<p><b>Error propagation in multi-agent systems.</b> When a subagent fails, the coordinator needs to know what failed, what was tried, any partial results, and alternatives. Avoid all three bad extremes:</p>
<ul>
<li>silently returning empty results as if they were real</li>
<li>a generic “search unavailable” with no context</li>
<li>killing the entire workflow because one part failed</li>
</ul>
<p>The final output should say where coverage is incomplete.</p>
<p><b>Provenance.</b> Subagents should return <b>claim → source</b> pairs (URL or document, excerpt, date) and synthesis should keep them. When two sources disagree, show both with attribution and dates; often a 2023 vs 2025 figure explains the “contradiction”. Never quietly pick one or average them.</p>
<p><b>Human review of automated extraction.</b> “97% accurate overall” can hide a document type that’s 60% accurate. Before reducing review:</p>
<ul>
<li>measure accuracy by document type <i>and</i> by field</li>
<li>calibrate field-level confidence scores against a labelled validation set</li>
<li>keep stratified random sampling of high-confidence outputs to catch drift</li>
</ul>
<p>This one should feel familiar: it’s data quality management, applied to model output.</p>`,
    quiz: [{ q: 'Two sources give different market sizes (2023 vs 2025). What should synthesis do?', o: ['Show both, attributed and dated', 'Average them', 'Keep the newer one silently', 'Keep the more authoritative one'], x: 'Preserve provenance; dates often explain the difference.' }]
  }
  ]
},
{
  id: 'm7', title: 'Exam prep', weight: null,
  intro: 'Turn knowledge into decisions under time pressure.',
  lessons: [
  {
    id: '7.1', title: 'How to sit the exam',
    body: `
<p><b>Format:</b> 60 scenario-based multiple-choice questions in 120 minutes, scored out of 1000, 720 to pass. Questions are grouped under production scenarios: customer support agent, code generation with Claude Code, multi-agent research, developer productivity tooling, Claude Code in CI/CD, and structured data extraction. You’ve now built or studied every one of them.</p>
<p><b>How the wrong answers are built.</b> Most distractors are real techniques applied to the wrong problem:</p>
<ul>
<li>a stronger prompt where a deterministic hook is needed</li>
<li>a bigger model or bigger context where the design is wrong</li>
<li>a heuristic guess where the system should ask</li>
<li>a broad redesign where one targeted fix addresses the root cause</li>
</ul>
<p><b>Method per question:</b> name the root cause in your own words <i>before</i> reading the options. Then pick the option that fixes exactly that, most directly.</p>
<p><b>Pacing:</b> 2 minutes per question on average. Flag and move on after 3.</p>
<p><b>Practise:</b> the scenario drill has 33 exam-style questions with explanations and tracks your accuracy by domain.</p>
<p><a class="btn" href="${EXAM_DRILL_URL}" target="_blank" rel="noopener">Open the scenario drill</a></p>`
  }
  ]
}
];
