---
description: `kaizen web`: the browser board, its HTTP routes, and the shared state layer
tags: [project, web-board]
sources: [cli/web.ts, cli/state.ts, cli/pty.ts, web/board.html, web/term.ts, design.md]
updated: 2026-10-15
---
# Web board

## What it does
`kaizen web` runs a loopback HTTP server over `cli/state.ts` and serves one HTML page that only ever sees JSON (header of `cli/web.ts`). From it you start runs, approve or revise plans, pick findings to fix, commit and push, and open Notes, the icebox and settings. User-facing tour: `docs/guide.md` ("In a browser"). Look and feel: `design.md`.

## Where it lives
- `cli/web.ts` — the server: routes such as `/state`, `/run`, `/decide`, `/fix`, `/commit`, `/events`, `/vault`, `/pty`.
- `cli/state.ts` — everything kaizen knows about a project's `.kaizen/`, shared with the [[Terminal board]]: runs, cards, findings, backlog, git, launching agents.
- `cli/pty.ts` + `web/term.ts` — the in-card terminal (agent runs inside the board). When that agent ends, the footer offers Resume: `/resume` continues an in-flight run with a prompt, and on a waiting or done run reopens its conversation with nothing sent (refused when none is on disk).
- `web/board.html` — the page.
- Update alert: `GET /version` (running vs npm `latest`, cached 6 h) puts a dot on the Settings menu item and an Update bar at the top of Settings; `POST /upgrade` runs `install.ts upgrade` in the server, then spawns a new board on the same port, which stops this one through the stale-board path in `web()`; the page reloads on the new boot id.

## How it connects
- [[Notebook]] is served from the same server (`/notebook`, `/vault`).
- [[Sources and icebox]] routes: `/sources`, `/icebox`, `/reply`, `/chatgpt`.
- Kaizen Bot calls these routes ([[Kaizen bot]], `bot/src/board.ts`).

## Watch out
- `web/board.html` is not served verbatim: `notifier()` from `state.ts` is written over a `/*notifier*/` marker (`.kaizen/memory.md`).
- `render()` rebuilds `#board` on every `changed` event; fields need a `draft()` key (`.kaizen/memory.md`).
- Commit & push stages the whole working tree, and runs commit the paths backticked in `03-impl.md` (`runGit()`; `.kaizen/memory.md`).
- Card fields needing git go in `cardsGit` (`/state`), not `boardCards()` (`.kaizen/memory.md`).
- A global `ul{display:flex}` in `board.html` hits lists in rendered markdown (`.kaizen/memory.md`).
- Settings and the Icebox share one panel and fill it after a fetch: `openSettings()` / `openSources()` must keep the `pageGen` check (`go()` bumps it), or a slow answer paints one page under the other's title. Switching to one of them clears the body to a Loading line before the fetch, or the old page shows under the new title until it answers.
- Settings and the Icebox are full width: `aside.docked` header and body pad 28px each side (16px under 900px), no centred column.

## Notes
<!-- yours: /kaizen docs never rewrites this section -->
