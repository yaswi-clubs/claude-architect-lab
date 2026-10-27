# Claude Architect Lab

Learn to design production systems with Claude, from software basics to the
Claude Certified Architect – Foundations exam. 26 lessons, 7 live labs, quizzes.

The labs call the real Claude API using **your own key, stored only in your browser**.
There is no server and nothing secret in this repo.

## Put it online (GitHub Pages, about 5 minutes)

1. On github.com, click **New repository**. Name it `claude-architect-lab`. Public. Create.
2. On the empty repo page, click **uploading an existing file**.
3. Unzip the download on your computer, open the `claude-architect-lab` folder, select
   **everything inside it** and drag it onto the upload page.
   - The `.claude` folder and `.nojekyll` file are hidden on Mac/Windows. On Mac press
     `Cmd + Shift + .` in Finder to show them. They're optional for the site to work,
     but you'll want `.claude` for the Claude Code lessons.
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment*, set Source to
   **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
6. After a minute your app is live at `https://<your-username>.github.io/claude-architect-lab/`.

## Get an API key

1. Go to console.anthropic.com → API keys → Create key. Name it "architect-lab".
2. Set a low monthly spend limit for it (Billing / Limits).
3. In the app, open **Settings**, paste the key, press **Test connection**.

## Run it locally instead

```
cd claude-architect-lab
python3 -m http.server 8000
```
Open http://localhost:8000. (Opening `index.html` directly won't work: browsers block
JavaScript modules from `file://`. That's lesson-worthy in itself.)

## Use the repo with Claude Code (Module 5)

```
cd claude-architect-lab
claude
```
Then try `/memory` to see which CLAUDE.md files loaded, `/add-lesson m2 "Prompt caching"`,
and ask it to change something in `js/labs.js` to watch the path-scoped rule apply.

## How the code is organised

| File | Job |
|---|---|
| `index.html` | The page shell |
| `styles.css` | Look and feel, light and dark |
| `js/app.js` | Navigation, progress, settings |
| `js/content.js` | All lesson text and quizzes |
| `js/labs.js` | The interactive labs |
| `js/claude.js` | The one place that talks to the API |
| `CLAUDE.md`, `.claude/` | Instructions for Claude Code (and examples for Module 5) |
