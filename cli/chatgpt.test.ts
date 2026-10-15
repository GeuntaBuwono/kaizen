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

test("gather: the plan streams items and completes with an empty output; prose is quoted, not ingested", () => {
  const out = run(`
    const state = ${JSON.stringify(join(home, "q", ".kaizen"))};
    (await import("node:fs")).mkdirSync(state, { recursive: true });
    const url = src.socialUrl("threads", "bangun rumah");
    src.addSource(state, url);
    const ev = (o) => "data: " + JSON.stringify(o) + "\\n\\n";
    const msg = (text) => ({ type: "message", content: [{ type: "output_text", text }] });
    const stream = (...items) => new Response(ev({ type: "response.output_item.done", item: { type: "web_search_call", status: "completed" } })
      + items.map((item) => ev({ type: "response.output_item.done", item })).join("")
      + ev({ type: "response.completed", response: { output: [] } }));
    globalThis.fetch = async () => stream(msg("Looking at Threads."), msg(JSON.stringify({ requests: [{ text: "Tolong tambah denah 3D", notes: "@budi · https://www.threads.net/@budi/post/1 · 2026-10-10" }] })));
    const ok = await cg.gatherSource(state, url, "gpt-test");
    globalThis.fetch = async () => stream(msg("Threads needs a sign-in, so I found nothing."));
    const prose = await cg.gatherSource(state, url, "gpt-test");
    globalThis.fetch = async () => stream(msg('{"requests":"none"}'));
    const shape = await cg.gatherSource(state, url, "gpt-test");
    globalThis.fetch = async () => stream();
    const empty = await cg.gatherSource(state, url, "gpt-test");
    return { ok: [ok.ok, ok.added], prose: [prose.ok, prose.note], empty: empty.note, shape: [shape.ok, shape.added], ice: src.readIcebox(state).map((s) => s.text) };`);
  expect(out.ok).toEqual([true, 1]);
  expect(out.ice).toEqual(["Tolong tambah denah 3D"]);
  expect(out.prose).toEqual([false, "ChatGPT's answer could not be read: Threads needs a sign-in, so I found nothing."]);
  expect(out.empty).toBe("ChatGPT sent back an empty answer.");
  expect(out.shape).toEqual([false, 0]);
});

test("gather: the plan is told what the project is for; a source that never found anything says so", () => {
  const out = run(`
    const fs = await import("node:fs");
    const root = ${JSON.stringify(join(home, "r"))}, state = root + "/.kaizen";
    fs.mkdirSync(state, { recursive: true });
    fs.writeFileSync(root + "/README.md", '<img src="b.svg"><!-- x -->\\n**Arsir** is a drafting table for [indie architects](https://x.dev), width < 2 m > depth.\\n![shot](s.png)');
    const url = src.socialUrl("threads", "arsitekrumahan");
    src.addSource(state, url);
    let sent;
    const ev = (o) => "data: " + JSON.stringify(o) + "\\n\\n";
    const answer = (requests) => async (_u, init) => { sent = JSON.parse(init.body);
      return new Response(ev({ type: "response.completed", response: { output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ requests }) }] }] } })); };
    globalThis.fetch = answer([]);
    const none = await cg.gatherSource(state, url, "gpt-test");
    const asked = [sent.input[0].content[0].text, sent.instructions];
    globalThis.fetch = answer([{ text: "Butuh denah rumah 2 lantai", notes: "@ina · https://www.threads.net/@ina/post/1 · 2026-10-14" },
      { text: "Floor plan feedback please", notes: "@bo · https://www.reddit.com/r/floorplan/1 · 2026-10-14" }, { text: "No link at all" }]);
    await cg.gatherSource(state, url, "gpt-test");
    globalThis.fetch = answer([]);
    const again = await cg.gatherSource(state, url, "gpt-test");
    fs.rmSync(root + "/README.md");
    const bare = cg.about(state);
    fs.mkdirSync(state + "/notes/Project", { recursive: true });
    fs.writeFileSync(state + "/notes/Project/Index.md", "# arsir — index\\n\\nDrafting table, see [[Workflow|the flow]].\\n\\n## Read first\\n- never run uninstall\\n");
    return { none: none.note, again: again.note, asked, bare, index: cg.about(state), ice: src.readIcebox(state).map((i) => i.text) };`);
  expect(out.none).toBe("no requests found");
  expect(out.again).toBe("nothing new");
  expect(out.asked[0]).toStartWith("The project:\n**Arsir** is a drafting table for indie architects, width < 2 m > depth.\n\nSource: ");
  expect(out.asked[1]).toContain("this project could answer");
  expect(out.bare).toBe("");
  expect(out.ice).toEqual(["Butuh denah rumah 2 lantai"]);
  expect(out.index).toBe("# arsir — index Drafting table, see Workflow.");
});
