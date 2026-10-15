<div align="center">
<img src="https://raw.githubusercontent.com/hfadhlullah/kaizen/main/assets/banner.png" alt="kaizen" width="760">
</div>

<p align="center"><b>See the plan before your AI starts. Get a second opinion when it is done.</b></p>

**The problem:** an AI agent starts writing before you agree on what it should do, then grades its own work.

**Kaizen:** it plans first and waits for your approval, then an agent that never saw the work reviews it.

## Install

### macOS and Linux

```bash
curl -fsSL https://bun.sh/install | bash && ~/.bun/bin/bunx kaizen-agent
```

Already have Bun? Run `bunx kaizen-agent`.

You also need an AI coding agent such as [Claude Code](https://docs.claude.com/en/docs/claude-code), and Git for the board's commit and push.

### Windows

Windows support is still in beta. In PowerShell:

```powershell
irm bun.sh/install.ps1 | iex; & "$env:USERPROFILE\.bun\bin\bunx.exe" kaizen-agent
```

Already have Bun? Run `bunx kaizen-agent`. As on macOS and Linux you need an AI coding agent; Git is only needed for the board's commit and push.

## Use the board

```bash
kaizen web
```

<img src="https://raw.githubusercontent.com/hfadhlullah/kaizen/main/assets/board-v2.png" alt="kaizen board" width="760">

The board opens in your browser. The side menu holds the board, notes, the icebox of gathered requests and settings, with a light and dark switch. From there you can start a run, approve or revise its plan, pick which review findings to fix, then commit and push.

To add a launcher (Spotlight on macOS, the app menu on Linux, a Desktop shortcut on Windows), run `kaizen web --shortcut` once.

## License

MIT
