import assert from "node:assert/strict";
import { test } from "node:test";

import { COMMANDS, execute } from "../js/commands.js";
import { PROJECTS, findProject } from "../js/projects.js";

const lineText = (line) =>
  (typeof line === "string" ? [line] : line)
    .map((segment) => (typeof segment === "string" ? segment : segment.text))
    .join("");

const createCtx = (overrides = {}) => {
  const calls = { lines: [], projects: [], navigated: [], cleared: 0, rebooted: 0, theme: "amber" };
  const ctx = {
    print: (line = "") => calls.lines.push(line),
    printProjects: (projects) => calls.projects.push(projects),
    clear: () => {
      calls.cleared += 1;
    },
    history: ["ls", "history"],
    getTheme: () => calls.theme,
    setTheme: (theme) => {
      calls.theme = theme;
    },
    now: () => new Date(2026, 9, 22, 9, 5, 3),
    env: {
      columns: 120,
      viewport: { width: 1440, height: 900 },
      language: "zh-CN",
      timeZone: "Asia/Shanghai",
      uptimeMs: 125000,
    },
    navigate: async (project) => {
      calls.navigated.push(project.name);
    },
    reboot: async () => {
      calls.rebooted += 1;
    },
    ...overrides,
  };
  return { ctx, calls, text: () => calls.lines.map(lineText) };
};

test("findProject resolves index, name and alias case-insensitively", () => {
  assert.equal(findProject("1").name, "the-moss");
  assert.equal(findProject("MOSS").name, "the-moss");
  assert.equal(findProject("gh").name, "github");
  assert.equal(findProject("6"), undefined);
  assert.equal(findProject(""), undefined);
});

test("help lists every public command and no hidden ones", async () => {
  const { ctx, text } = createCtx();
  await execute(ctx, "help");
  const output = text().join("\n");
  COMMANDS.filter((command) => !command.hidden).forEach((command) => {
    assert.match(output, new RegExp(`^  ${command.usage.replace(/[[\]|<>]/g, "\\$&")}`, "m"));
  });
  assert.doesNotMatch(output, /whoami|fastfetch/);
});

test("ls prints the project list and ls -l prints one linked row per project", async () => {
  const short = createCtx();
  await execute(short.ctx, "ls");
  assert.deepEqual(short.calls.projects, [PROJECTS]);

  const long = createCtx();
  await execute(long.ctx, "ls -l");
  assert.equal(long.text()[0], `total ${PROJECTS.length}`);
  assert.equal(long.calls.lines.length, PROJECTS.length + 1);
  const link = long.calls.lines[1].find((segment) => segment.href);
  assert.deepEqual(link, { text: "the-moss", href: PROJECTS[0].url, target: "the-moss" });
  assert.match(long.text()[5], /\[5\] blog\s+juejin\.cn\/user\/4341288062690398/);
});

test("ls rejects unknown options", async () => {
  const { ctx, text } = createCtx();
  await execute(ctx, "ls -a");
  assert.deepEqual(text(), [" ERR  ls: invalid option: -a", "usage: ls [-l]"]);
});

test("open navigates by index, name or alias", async () => {
  for (const target of ["1", "the-moss", "Moss"]) {
    const { ctx, calls, text } = createCtx();
    await execute(ctx, `open ${target}`);
    assert.deepEqual(text(), ["Opening the-moss..."]);
    assert.deepEqual(calls.navigated, ["the-moss"]);
  }
});

test("open without a target prints usage and does not navigate", async () => {
  const { ctx, calls, text } = createCtx();
  await execute(ctx, "open");
  assert.deepEqual(text(), [
    "usage: open <target>",
    "targets: 1-5, the-moss, arkvoice, steamtower, github, blog",
  ]);
  assert.deepEqual(calls.navigated, []);
});

test("open with an unknown target reports an error", async () => {
  const { ctx, calls, text } = createCtx();
  await execute(ctx, "open foo");
  assert.equal(text()[0], " ERR  open: no such target: foo");
  assert.deepEqual(calls.navigated, []);
});

test("unknown commands keep the typed name in the error", async () => {
  const { ctx, text } = createCtx();
  await execute(ctx, "  FooBar baz");
  assert.deepEqual(text(), [" ERR  command not found: FooBar", 'Type "help" for available commands.']);
});

test("blank input prints nothing", async () => {
  const { ctx, calls } = createCtx();
  await execute(ctx, "   ");
  assert.deepEqual(calls.lines, []);
});

test("theme shows, switches and rejects themes", async () => {
  const show = createCtx();
  await execute(show.ctx, "theme");
  assert.deepEqual(show.text(), ["current theme: amber", "available: amber, green"]);

  const change = createCtx();
  await execute(change.ctx, "theme GREEN");
  assert.equal(change.calls.theme, "green");
  assert.deepEqual(change.text(), ["theme set to green"]);

  const bad = createCtx();
  await execute(bad.ctx, "theme pink");
  assert.equal(bad.calls.theme, "amber");
  assert.equal(bad.text()[0], " ERR  theme: unknown theme: pink");
});

test("man documents public commands only", async () => {
  const known = createCtx();
  await execute(known.ctx, "man open");
  assert.deepEqual(known.text(), ["NAME", "  open - open a project", "", "SYNOPSIS", "  open <target>"]);

  const hidden = createCtx();
  await execute(hidden.ctx, "man whoami");
  assert.deepEqual(hidden.text(), ["No manual entry for whoami"]);

  const empty = createCtx();
  await execute(empty.ctx, "man");
  assert.equal(empty.text()[0], "What manual page do you want?");
});

test("history, clear and exit use the terminal context", async () => {
  const history = createCtx();
  await execute(history.ctx, "history");
  assert.deepEqual(history.text(), ["    1  ls", "    2  history"]);

  const clear = createCtx();
  await execute(clear.ctx, "clear");
  assert.equal(clear.calls.cleared, 1);

  const exit = createCtx();
  await execute(exit.ctx, "exit");
  assert.deepEqual(exit.text(), ["logout"]);
  assert.equal(exit.calls.rebooted, 1);
});

test("easter eggs", async () => {
  const cases = [
    ["whoami", ["looko"]],
    ["pwd", ["/home/looko"]],
    ["date", ["2026-10-22 09:05:03 Asia/Shanghai"]],
    ["echo Hello  <b>World</b>", ["Hello <b>World</b>"]],
    ["sudo rm -rf /", ["You are already root."]],
    ["rm -rf /", ["Nice try :)"]],
    ["rm -fr /*", ["Nice try :)"]],
    ["rm notes.txt", ["rm: read-only file system"]],
    ["cat secrets.txt", ["cat: secrets.txt: No such file or directory"]],
    ["cat about.md", ["Looko", "Backend Developer / Full Stack Developer", "Building useful things."]],
    ["about", ["Looko", "Backend Developer / Full Stack Developer", "Building useful things."]],
  ];

  for (const [input, expected] of cases) {
    const { ctx, text } = createCtx();
    await execute(ctx, input);
    assert.deepEqual(text(), expected, input);
  }
});

test("fastfetch puts info beside the art when wide and below it when narrow", async () => {
  const wide = createCtx();
  await execute(wide.ctx, "neofetch");
  assert.match(wide.text()[0], /^ \.-+\.\s+looko@home$/);
  assert.ok(wide.text().some((line) => line.endsWith("Resolution: 1440x900")));
  assert.ok(wide.text().some((line) => line.endsWith("Uptime: 2 mins")));

  const narrow = createCtx();
  narrow.ctx.env = { ...narrow.ctx.env, columns: 40 };
  await execute(narrow.ctx, "fastfetch");
  const lines = narrow.text();
  const blank = lines.indexOf("");
  assert.ok(blank > 0);
  assert.equal(lines[blank + 1], "looko@home");
  assert.ok(lines.every((line) => line.length <= 40));
});
