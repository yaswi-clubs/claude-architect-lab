// app.js — routing, progress and page rendering.
// Routes live in the URL hash (#/lesson/2.3), so GitHub Pages never needs a server.

import { MODULES, EXAM_DRILL_URL } from './content.js';
import { mountLab } from './labs.js';
import { MODELS, getSettings, saveSettings, forgetKey, getUsage, resetUsage, callClaude } from './claude.js';

const main = document.getElementById('main');
const ALL = MODULES.flatMap(m => m.lessons.map(l => ({ ...l, module: m })));

// ---------- progress ----------
function getDone() { try { return JSON.parse(localStorage.getItem('cal_done') || '[]'); } catch (e) { return []; } }
function setDone(id, on) {
  const d = new Set(getDone()); on ? d.add(id) : d.delete(id);
  try { localStorage.setItem('cal_done', JSON.stringify([...d])); } catch (e) {}
}

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- pages ----------
function home() {
  const done = new Set(getDone());
  const { key } = getSettings();
  const total = ALL.length, n = ALL.filter(l => done.has(l.id)).length;
  const next = ALL.find(l => !done.has(l.id));
  main.innerHTML = `
    <section class="hero">
      <h1>Claude Architect Lab</h1>
      <p>Learn to design production systems with Claude, from first principles to the Certified Architect exam. Eight hands-on labs call Claude for real, so you see exactly what goes over the wire.</p>
      <div class="progress"><div style="width:${(n / total) * 100}%"></div></div>
      <p class="meta">${n} of ${total} lessons complete</p>
      ${!key ? '<p class="warn">Start with <a href="#/settings">Settings</a>: add an API key so the labs can run.</p>' : ''}
      ${next ? `<a class="btn" href="#/lesson/${next.id}">${n ? 'Continue' : 'Start'}: ${esc(next.title)}</a>` : '<p class="ok">All lessons complete. Time for the scenario drill.</p>'}
    </section>
    ${MODULES.map(m => `
      <section class="module">
        <div class="modhead"><h2>${esc(m.title)}</h2>${m.weight ? `<span class="weight">${m.weight}% of exam</span>` : ''}</div>
        <p class="meta">${esc(m.intro)}</p>
        <ol class="lessons">${m.lessons.map(l => `
          <li class="${done.has(l.id) ? 'done' : ''}"><a href="#/lesson/${l.id}"><span class="num">${l.id}</span>${esc(l.title)}${l.lab ? '<span class="labtag">lab</span>' : ''}</a></li>`).join('')}
        </ol>
      </section>`).join('')}
    <p class="meta foot">Exam drill with 33 scenario questions: <a href="${EXAM_DRILL_URL}" target="_blank" rel="noopener">open it</a>.</p>`;
}

function quiz(q, mount) {
  const order = shuffle(q.o.map((_, i) => i));
  mount.innerHTML = `<div class="quiz"><p class="qq">${q.q}</p>${order.map(i => `<button class="opt" data-i="${i}">${q.o[i]}</button>`).join('')}<div class="why" hidden></div></div>`;
  mount.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    mount.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.dataset.i === '0') x.classList.add('right'); });
    if (b.dataset.i !== '0') b.classList.add('wrong');
    const w = mount.querySelector('.why'); w.hidden = false;
    w.innerHTML = `<b>${b.dataset.i === '0' ? 'Correct.' : 'Not quite.'}</b> ${q.x}`;
  });
}

function lesson(id) {
  const idx = ALL.findIndex(l => l.id === id);
  if (idx < 0) return notFound();
  const l = ALL[idx], prev = ALL[idx - 1], next = ALL[idx + 1];
  const done = getDone().includes(id);
  main.innerHTML = `
    <article class="lesson">
      <p class="crumb"><a href="#/">All lessons</a> / ${esc(l.module.title)}${l.module.weight ? ` (${l.module.weight}% of exam)` : ''}</p>
      <h1><span class="num">${l.id}</span>${esc(l.title)}</h1>
      <div class="body">${l.body}</div>
      ${l.lab ? '<section class="lab"><h2>Lab</h2><div id="lab"></div></section>' : ''}
      ${l.quiz ? `<section class="check-q"><h2>Check yourself</h2>${l.quiz.map((_, i) => `<div id="q${i}"></div>`).join('')}</section>` : ''}
      <div class="nav">
        ${prev ? `<a class="btn ghost" href="#/lesson/${prev.id}">Previous</a>` : '<span></span>'}
        <button class="btn ${done ? 'ghost' : ''}" id="done">${done ? 'Completed' : 'Mark complete'}</button>
        ${next ? `<a class="btn ghost" href="#/lesson/${next.id}">Next</a>` : '<span></span>'}
      </div>
    </article>`;
  if (l.lab) mountLab(l.lab, document.getElementById('lab'));
  (l.quiz || []).forEach((q, i) => quiz(q, document.getElementById('q' + i)));
  document.getElementById('done').onclick = () => {
    setDone(id, !done);
    if (!done && next) location.hash = `#/lesson/${next.id}`; else lesson(id);
  };
  window.scrollTo(0, 0);
}

function settings() {
  const { key, model } = getSettings();
  const u = getUsage();
  const remembered = (() => { try { return !!localStorage.getItem('cal_key'); } catch (e) { return false; } })();
  main.innerHTML = `
    <article class="lesson">
      <p class="crumb"><a href="#/">All lessons</a></p>
      <h1>Settings</h1>
      <div class="body">
        <p>Labs call the Anthropic API from your browser using your own key. The key is stored only in this browser. It is never sent anywhere except <code>api.anthropic.com</code>, and it is never in the GitHub repo.</p>
        <div class="callout"><b>Before you paste a key:</b> create a dedicated one in the Claude Console (console.anthropic.com) and give it a low monthly spend limit. A lab run on Haiku costs well under a penny.</div>
      </div>
      <label>API key<input id="s-key" type="password" autocomplete="off" placeholder="sk-ant-…" value="${esc(key)}"></label>
      <label class="check"><input type="checkbox" id="s-rem" ${remembered || !key ? 'checked' : ''}> <span>Remember on this device (untick to forget when the tab closes)</span></label>
      <label>Model<select id="s-model">${MODELS.map(m => `<option value="${m.id}" ${m.id === model ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}</select></label>
      <div class="inline">
        <button class="btn" id="s-save">Save</button>
        <button class="btn ghost" id="s-test">Test connection</button>
        <button class="btn ghost" id="s-forget">Forget key</button>
      </div>
      <div id="s-msg"></div>
      <h2>Usage from this browser</h2>
      <p>${u.calls} calls · ${u.input.toLocaleString()} input tokens · ${u.output.toLocaleString()} output tokens</p>
      <button class="btn ghost" id="s-ru">Reset usage counter</button>
      <h2>Progress</h2>
      <button class="btn ghost" id="s-rp">Reset lesson progress</button>
    </article>`;
  const msg = h => { document.getElementById('s-msg').innerHTML = h; };
  const save = () => saveSettings({ key: document.getElementById('s-key').value, model: document.getElementById('s-model').value, remember: document.getElementById('s-rem').checked });
  document.getElementById('s-save').onclick = () => { save(); msg('<p class="ok">Saved.</p>'); };
  document.getElementById('s-forget').onclick = () => { forgetKey(); document.getElementById('s-key').value = ''; msg('<p class="ok">Key removed from this browser.</p>'); };
  document.getElementById('s-test').onclick = async () => {
    save(); msg('<p class="meta">Testing…</p>');
    try {
      const { response } = await callClaude({ max_tokens: 10, messages: [{ role: 'user', content: 'Reply with the word: connected' }] });
      msg(`<p class="ok">Connected to <code>${esc(response.model)}</code>.</p>`);
    } catch (e) { msg(`<p class="err">${esc(e.message)}</p>`); }
  };
  document.getElementById('s-ru').onclick = () => { resetUsage(); settings(); };
  document.getElementById('s-rp').onclick = () => { if (confirm('Clear all lesson progress?')) { try { localStorage.removeItem('cal_done'); } catch (e) {} msg('<p class="ok">Progress cleared.</p>'); } };
}

function notFound() { main.innerHTML = '<p>Page not found. <a href="#/">Back to lessons</a></p>'; }

// ---------- router ----------
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h) return home();
  if (h === 'settings') return settings();
  if (h.startsWith('lesson/')) return lesson(h.slice(7));
  notFound();
}
window.addEventListener('hashchange', route);
route();
