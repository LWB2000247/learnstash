# Learnstash

A personal learning app for one person. Short idea cards instead of endless scrolling: swipe through them, save the ones worth keeping, and review them with spaced repetition. The interface and the seed library are in German. Everything stays in the browser. There is no account and no server.

## Local development

```bash
npm install
npm test
npm run dev
```

Open http://localhost:5173. Production builds use the base path `/learnstash/` so they match GitHub Pages. The dev server uses `/`.

## Scripts

- `npm test` runs the unit tests, including the spaced-repetition scheduler.
- `npm run build` typechecks and writes `dist/`.
- `npm run preview` serves that build.

## Data

Profile, custom ideas, collections, streaks and review state live in `localStorage` under `learnstash-v1`. Export and import from Einstellungen → Sicherung. The built-in cards live in `src/data/ideas.json` and can be extended there.

Saved ideas are reviewed with an SM-2-style scheduler: the ease factor follows the SuperMemo formula, and Again / Schwer / Gut / Leicht schedule different intervals. The rules are in `src/lib/sm2.ts`.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` runs tests, builds, and deploys on every push to `main`.

GitHub only uses that workflow after Pages is switched to Actions:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

That setting cannot be committed from the repo. After it is on, a push to `main` publishes https://lwb2000247.github.io/learnstash/.

Routes use a hash (`/#/review`, `/#/stash`) so a refresh works on static hosting. The app is a PWA: once opened, it caches itself and works offline.
