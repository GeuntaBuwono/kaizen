---
description: How to test, build the web bundles, and publish a release
tags: [project, release]
sources: [package.json, cli/release.sh, cli/publish-gh.sh, .github/workflows/test.yml, cli/build-web.ts]
updated: 2026-10-15
---
# Release and testing

## What it does
Tests are `bun test` (all `*.test.ts`, `cli/` and `bot/`), run in CI on the OS matrix in `.github/workflows/test.yml` (Ubuntu, macOS, Windows). The package is `kaizen-agent` on npm; `bun run release` publishes to npm and then GitHub Packages (`package.json` scripts).

## Where it lives
- `package.json` — `test`, `build:web`, `release`, `prepublishOnly` (tests), `postpublish` (`cli/release.sh`: tag + GitHub release).
- `cli/publish-gh.sh` — same tarball as `@hfadhlullah/kaizen-agent` on GitHub Packages.
- `cli/build-web.ts` — bundles `web/notebook.js` and `web/term.js`, committed.

## How it connects
- Bundles feed the [[Notebook]] and the [[Web board]]'s terminal.

## Watch out
- npm serves a new version only after its automated review finishes — minutes after `bun publish` says success; a re-publish answers 409 (`.kaizen/memory.md`).
- Tests that touch install/uninstall must use scratch `HOME` and `KAIZEN_HOME` ([[CLI]]).
- To exercise the board without real state: copy `.kaizen/` to scratch, `kaizen web --port N --no-open` with a scratch `HOME`; stop it with `fuser -k N/tcp` (`.kaizen/memory.md`).

## Notes
<!-- yours: /kaizen docs never rewrites this section -->
