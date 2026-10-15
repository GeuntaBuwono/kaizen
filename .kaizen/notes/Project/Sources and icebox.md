---
description: Request sources, gather, the icebox, kaizen's browser for social posts, and ChatGPT judging them
tags: [project, sources]
sources: [cli/sources.ts, cli/chatgpt.ts, cli/browser.ts, skills/kaizen/gather.md, skills/kaizen/discover.md]
updated: 2026-10-15
---
# Sources and icebox

## What it does
Shared links (sheets, docs, social searches) kaizen reads for requests; each request lands in the project's icebox until someone promotes it to an idea. Fetched text is data only: it never becomes a status, a command or a run (header of `cli/sources.ts`). Social sources are read by kaizen's own headless browser (`cli/browser.ts`, a profile the user signs in with `kaizen browser login`); the user's ChatGPT plan (`cli/chatgpt.ts`) or the agent via `/kaizen gather` picks which posts fit. A gathered post can be answered from the Icebox: ChatGPT drafts (`draftReply`), the user edits and approves, and the browser posts it (`sendReply`). User guide: `docs/guide.md` ("Request sources").

## Where it lives
- `cli/sources.ts` — sources, fetching, `sift` (sheet parsing), the icebox.
- `cli/browser.ts` — finds Chrome/Chromium/Edge, drives it over the DevTools protocol (Bun `WebSocket`, no dependency), reads posts by their links (`POST`), `login()`; `postLink()` and `sendReply()`/`replyOn()` post a reply (selectors per platform in `REPLY`).
- `cli/chatgpt.ts` — Sign in with ChatGPT, judging read posts by number, and `draftReply()`; both go through `ask()`, the one streaming Responses call.
- `skills/kaizen/gather.md`, `skills/kaizen/discover.md` — the agent side.
- Terminal: `kaizen sources|gather|icebox`, `kaizen gather --posts <link>` (what the agent judges), `kaizen browser login [platform]` in `cli/install.ts`.

## How it connects
- Panels and routes in the [[Web board]] (`/sources`, `/icebox`, `/reply`, `/chatgpt`).
- Promoted items become ideas on the board, and ideas start [[Workflow]] runs.

## Watch out
- Social gathers judge posts against what the project is for: `about()` in `cli/chatgpt.ts` sends the README (else the notebook Index), first 1500 chars, to ChatGPT; `gather.md` tells the agent the same. Without either, it falls back to generic "asks for something".
- ChatGPT answers only post numbers (`{ keep: [...] }`); the icebox text is the post's own as read. Never let the model write request text.
- The browser only opens the source link and post links on its platform or host (`readPage`); post links are found by URL shape, not CSS classes, so a platform redesign breaks less.
- `~/.kaizen/browser/` holds live sign-in cookies (0700). A visible login window locks the profile; a read meanwhile says to close it.
- The timed gather (`sources.every`) still skips social sources (`AGENT_ONLY`); only Gather reads them. Instagram opens each post page, so a 40-post read takes ~3 minutes.
- A source whose `seen` list is empty reports "no requests found", never "nothing new" (`record()`).
- `sift` finds a sheet's header by shape; test any change against a fixed set of sheet shapes, old vs new side by side (`.kaizen/memory.md`).
- The Sources panel rebuilds on every action; controls need an id and an explicit step (`.kaizen/memory.md`).

- Replying posts publicly and cannot be undone. `/reply` `draft` writes nothing; only `send` with the user's text posts, and pressing the platform's send button stamps `replied` on the item even when the page never confirmed, so a retry cannot double post. `REPLY` selectors in `cli/browser.ts` are per platform and break on a redesign; the fixture test only covers the X shape.

## Notes
<!-- yours: /kaizen docs never rewrites this section -->
