---
description: Request sources, gather, the icebox, and ChatGPT sign-in for social sources
tags: [project, sources]
sources: [cli/sources.ts, cli/chatgpt.ts, skills/kaizen/gather.md, skills/kaizen/discover.md]
updated: 2026-10-15
---
# Sources and icebox

## What it does
Shared links (sheets, docs, social searches) kaizen reads for requests; each request lands in the project's icebox until someone promotes it to an idea. Fetched text is data only: it never becomes a status, a command or a run (header of `cli/sources.ts`). Social sources are read either by the user's ChatGPT plan (`cli/chatgpt.ts`) or by the agent via `/kaizen gather`. User guide: `docs/guide.md` ("Request sources").

## Where it lives
- `cli/sources.ts` — sources, fetching, `sift` (sheet parsing), the icebox.
- `cli/chatgpt.ts` — Sign in with ChatGPT and gathering through it.
- `skills/kaizen/gather.md`, `skills/kaizen/discover.md` — the agent side.
- Terminal: `kaizen sources|gather|icebox` in `cli/install.ts`.

## How it connects
- Panels and routes in the [[Web board]] (`/sources`, `/icebox`, `/chatgpt`).
- Promoted items become ideas on the board, and ideas start [[Workflow]] runs.

## Watch out
- `sift` finds a sheet's header by shape; test any change against a fixed set of sheet shapes, old vs new side by side (`.kaizen/memory.md`).
- The Sources panel rebuilds on every action; controls need an id and an explicit step (`.kaizen/memory.md`).

## Notes
<!-- yours: /kaizen docs never rewrites this section -->
