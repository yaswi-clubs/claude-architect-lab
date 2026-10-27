# Claude Architect Lab

A static learning app (no build step, no backend) that teaches Claude solution architecture
from scratch and prepares for the Claude Certified Architect – Foundations exam.
Hosted on GitHub Pages. Owner: Hannah. She is learning software engineering through this repo,
so explain what you change and why in plain language.

## Structure
- `index.html` — shell page; loads `js/app.js` as an ES module
- `styles.css` — all styling; colours only via CSS variables on `:root` (light + dark)
- `js/app.js` — hash router (`#/`, `#/lesson/<id>`, `#/settings`), progress, page rendering
- `js/content.js` — the curriculum as data (modules → lessons). No logic here.
- `js/labs.js` — interactive labs that call Claude
- `js/claude.js` — the ONLY file that calls the Anthropic API

## Rules
- Never put an API key, or any secret, in any file. Keys live only in the user's browser storage.
- All network calls go through `callClaude()` in `js/claude.js`.
- No build tools, frameworks or npm packages. Plain HTML, CSS and JavaScript modules only.
- Default to the cheapest model; keep `max_tokens` small in labs.
- User-facing text: British English, sentence case, typographic apostrophes (’).

## Running locally
ES modules don't load from `file://`. From the repo folder run `python3 -m http.server 8000`
and open http://localhost:8000.

@.claude/rules/content.md
