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

// Posts as kaizen's browser would read them; no browser runs in these tests.
const POSTS = `[{ text: "Tolong tambah denah 3D", author: "@budi", link: "https://www.threads.com/@budi/post/1", date: "2026-10-10" },
  { text: "Beli rumah murah di sini!", author: "@iklan", link: "https://www.threads.com/@iklan/post/2", date: "2026-10-11" }]`;

test("gather: kaizen's own post text lands in the icebox, picked by number; a used-up plan is recorded, not thrown", () => {
  mkdirSync(join(home, ".kaizen"), { recursive: true });
  writeFileSync(join(home, ".kaizen", "chatgpt.json"), JSON.stringify({ host: "urn:uuid:x", client_id: "oaiapp_1", refresh_token: "r", access_token: "a", expires_at: Date.now() + 3_600_000 }));
  const out = run(`
    const state = ${JSON.stringify(join(home, "p", ".kaizen"))};
    (await import("node:fs")).mkdirSync(state, { recursive: true });
    const url = src.socialUrl("threads", "denah");
    src.addSource(state, url);
    const read = async () => ({ ok: true, posts: ${POSTS} });
    let sent;
    const ev = (o) => "data: " + JSON.stringify(o) + "\\n\\n";
    globalThis.fetch = async (_u, init) => { sent = JSON.parse(init.body);
      return new Response(ev({ type: "response.output_text.delta", delta: "x" }) + ev({ type: "response.completed", response: { output: [{ type: "message", content: [{ type: "output_text", text: '{"keep":[1]}' }] }] } })); };
    const ok = await cg.gatherSource(state, url, "gpt-test", "low", read);
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: "subscription_sharing_usage_limit_exceeded" } }), { status: 429 });
    const capped = await cg.gatherSource(state, url, "gpt-test", "low", read);
    return { ok: [ok.ok, ok.added], capped: [capped.ok, capped.note], ice: src.readIcebox(state).map((s) => [s.text, s.notes]),
      sent: [sent.model, sent.store, sent.stream, sent.reasoning.effort, "tools" in sent], posts: sent.input[0].content[0].text, connected: cg.status().connected };`);
  expect(out.ok).toEqual([true, 1]);
  expect(out.ice).toEqual([["Tolong tambah denah 3D", "@budi · https://www.threads.com/@budi/post/1 · 2026-10-10"]]);
  expect(out.capped).toEqual([false, "Your ChatGPT plan limit for kaizen is used up."]);
  expect(out.sent).toEqual(["gpt-test", false, true, "low", false]);
  expect(out.posts).toContain("Posts:\n1. Tolong tambah denah 3D\n2. Beli rumah murah di sini!");
  expect(out.connected).toBe(true);
});

test("gather: the plan streams items and completes with an empty output; numbers out of range or repeated pick nothing more", () => {
  const out = run(`
    const state = ${JSON.stringify(join(home, "q", ".kaizen"))};
    (await import("node:fs")).mkdirSync(state, { recursive: true });
    const url = src.socialUrl("threads", "bangun rumah");
    src.addSource(state, url);
    const read = async () => ({ ok: true, posts: ${POSTS} });
    const ev = (o) => "data: " + JSON.stringify(o) + "\\n\\n";
    const msg = (text) => ({ type: "message", content: [{ type: "output_text", text }] });
    const stream = (...items) => new Response(items.map((item) => ev({ type: "response.output_item.done", item })).join("")
      + ev({ type: "response.completed", response: { output: [] } }));
    globalThis.fetch = async () => stream(msg("Looking."), msg(JSON.stringify({ keep: [1, 1, 0, -1, 3, 1.5, "2"] })));
    const ok = await cg.gatherSource(state, url, "gpt-test", "low", read);
    globalThis.fetch = async () => stream(msg("These posts look fine."));
    const prose = await cg.gatherSource(state, url, "gpt-test", "low", read);
    globalThis.fetch = async () => stream();
    const empty = await cg.gatherSource(state, url, "gpt-test", "low", read);
    return { ok: [ok.ok, ok.added], prose: [prose.ok, prose.note], empty: empty.note, ice: src.readIcebox(state).map((s) => s.text) };`);
  expect(out.ok).toEqual([true, 1]);
  expect(out.ice).toEqual(["Tolong tambah denah 3D"]);
  expect(out.prose).toEqual([false, "ChatGPT's answer could not be read: These posts look fine."]);
  expect(out.empty).toBe("ChatGPT sent back an empty answer.");
});

test("gather: the plan is told what the project is for; a wall, no posts, and no fit each say so", () => {
  const out = run(`
    const fs = await import("node:fs");
    const root = ${JSON.stringify(join(home, "r"))}, state = root + "/.kaizen";
    fs.mkdirSync(state, { recursive: true });
    fs.writeFileSync(root + "/README.md", '<img src="b.svg"><!-- x -->\\n**Arsir** is a drafting table for [indie architects](https://x.dev), width < 2 m > depth.\\n![shot](s.png)');
    const url = src.socialUrl("threads", "arsitekrumahan");
    src.addSource(state, url);
    let sent, calls = 0;
    const ev = (o) => "data: " + JSON.stringify(o) + "\\n\\n";
    globalThis.fetch = async (_u, init) => { calls++; sent = JSON.parse(init.body);
      return new Response(ev({ type: "response.completed", response: { output: [{ type: "message", content: [{ type: "output_text", text: '{"keep":[]}' }] }] } })); };
    const wall = await cg.gatherSource(state, url, "gpt-test", "low", async () => ({ ok: false, note: "Sign in once: kaizen browser login threads" }));
    const wallLast = src.readSources(state)[0].last.note;
    const none = await cg.gatherSource(state, url, "gpt-test", "low", async () => ({ ok: true, posts: [] }));
    const asked0 = calls;
    const unfit = await cg.gatherSource(state, url, "gpt-test", "low", async () => ({ ok: true, posts: ${POSTS} }));
    const asked = [sent.input[0].content[0].text, sent.instructions];
    fs.rmSync(root + "/README.md");
    const bare = cg.about(state);
    fs.mkdirSync(state + "/notes/Project", { recursive: true });
    fs.writeFileSync(state + "/notes/Project/Index.md", "# arsir — index\\n\\nDrafting table, see [[Workflow|the flow]].\\n\\n## Read first\\n- never run uninstall\\n");
    return { wall: [wall.ok, wall.note, wallLast], none: none.note, asked0, unfit: unfit.note, asked, bare, index: cg.about(state) };`);
  expect(out.wall).toEqual([false, "Sign in once: kaizen browser login threads", "Sign in once: kaizen browser login threads"]);
  expect(out.none).toBe("the page showed no posts");
  expect(out.asked0).toBe(0);
  expect(out.unfit).toBe("read 2 posts, none fit this project");
  expect(out.asked[0]).toStartWith("The project:\n**Arsir** is a drafting table for indie architects, width < 2 m > depth.\n\nPosts:\n1. ");
  expect(out.asked[1]).toContain("this project could answer");
  expect(out.bare).toBe("");
  expect(out.index).toBe("# arsir — index Drafting table, see Workflow.");
});
