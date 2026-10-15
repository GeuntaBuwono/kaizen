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
- `cli/pty.ts` + `web/term.ts` — the in-card terminal (agent runs inside the board).
- `web/board.html` — the page.

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

## Notes
<!-- yours: /kaizen docs never rewrites this section -->
