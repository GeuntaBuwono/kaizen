<div align="center">
<img src="https://raw.githubusercontent.com/hfadhlullah/kaizen/main/assets/banner.png" alt="kaizen" width="760">
</div>

<p align="center"><b>See the plan before your AI starts. Get a second opinion when it is done.</b></p>

## Install

### macOS and Linux

```bash
curl -fsSL https://bun.sh/install | bash && ~/.bun/bin/bunx kaizen-agent
```

Already have Bun? Run `bunx kaizen-agent`.

You also need an AI coding agent such as [Claude Code](https://docs.claude.com/en/docs/claude-code), and Git for the board's commit and push.

### Windows

Windows support is still in progress.

## Use the board

```bash
kaizen web
```

The board opens in your browser. From there you can start a run, approve or revise its plan, pick which review findings to fix, then commit and push.

To add a launcher (Spotlight on macOS, the app menu on Linux), run `kaizen web --shortcut` once.

## License

MIT
