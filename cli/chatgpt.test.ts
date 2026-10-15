// The ChatGPT plan gathering a social source, against a throwaway HOME and a faked
// OpenAI: no network, no real sign-in. Runs in its own process so `home` is the fake one.
import { test, expect, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const repo = join(import.meta.dir, "..");
const home = mkdtempSync(join(tmpdir(), "kaizen-cg-"));
afterAll(() => rmSync(home, { recursive: true, force: true }));

const run = (code: string) => {
  const script = `import * as cg from ${JSON.stringify(join(repo, "cli/chatgpt.ts"))};
import * as src from ${JSON.stringify(join(repo, "cli/sources.ts"))};
console.log(JSON.stringify(await (async () => { ${code} })()));`;
  const p = Bun.spawnSync(["bun", "-e", script], { cwd: home, env: { ...process.env, HOME: home, USERPROFILE: home } });
  if (p.exitCode !== 0) throw new Error(p.stderr.toString());
  return JSON.parse(p.stdout.toString());
};

test("gather: a streamed answer lands in the icebox; a used-up plan is recorded, not thrown", () => {
  mkdirSync(join(home, ".kaizen"), { recursive: true });
  writeFileSync(join(home, ".kaizen", "chatgpt.json"), JSON.stringify({ host: "urn:uuid:x", client_id: "oaiapp_1", refresh_token: "r", access_token: "a", expires_at: Date.now() + 3_600_000 }));
  const out = run(`
    const state = ${JSON.stringify(join(home, "p", ".kaizen"))};
    (await import("node:fs")).mkdirSync(state, { recursive: true });
    const url = src.socialUrl("x", "dark mode");
    src.addSource(state, url);
    let sent;
    const answer = JSON.stringify({ requests: [{ text: "Please add dark mode", notes: "@ana · https://x.com/ana/status/1 · 2026-10-01" }] });
    const ev = (o) => "data: " + JSON.stringify(o) + "\\n\\n";
    globalThis.fetch = async (_u, init) => { sent = JSON.parse(init.body);
      return new Response(ev({ type: "response.output_text.delta", delta: "x" }) + ev({ type: "response.completed", response: { output: [{ type: "message", content: [{ type: "output_text", text: answer }] }] } })); };
    const ok = await cg.gatherSource(state, url, "gpt-test", "low");
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: "subscription_sharing_usage_limit_exceeded" } }), { status: 429 });
    const capped = await cg.gatherSource(state, url, "gpt-test");
    return { ok: [ok.ok, ok.added], capped: [capped.ok, capped.note], ice: src.readIcebox(state).map((s) => s.text),
      sent: [sent.model, sent.store, sent.stream, sent.reasoning.effort, sent.tools[0].type], connected: cg.status().connected };`);
  expect(out.ok).toEqual([true, 1]);
  expect(out.ice).toEqual(["Please add dark mode"]);
  expect(out.capped).toEqual([false, "Your ChatGPT plan limit for kaizen is used up."]);
  expect(out.sent).toEqual(["gpt-test", false, true, "low", "web_search"]);
  expect(out.connected).toBe(true);
});
