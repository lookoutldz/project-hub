import assert from "node:assert/strict";
import { test } from "node:test";

import { COMMANDS, SL_PUFF_INTERVAL, SL_SPEED, execute, trainFrame, vimMode } from "../js/commands.js";
import { PROJECTS, findProject } from "../js/projects.js";

const lineText = (line) =>
  (typeof line === "string" ? [line] : line)
    .map((segment) => (typeof segment === "string" ? segment : segment.text))
    .join("");

const createCtx = (overrides = {}) => {
  const calls = {
    lines: [],
    projects: [],
    images: [],
    navigated: [],
    cleared: 0,
    homed: 0,
    rebooted: 0,
    theme: "amber",
    frames: [],
    moves: [],
    blockRemoved: false,
    altScreen: false,
    mode: null,
  };
  const ctx = {
    print: (line = "") => calls.lines.push(line),
    printProjects: (projects) => calls.projects.push(projects),
    printImage: (image) => calls.images.push(image),
    printBlock: (lines) => {
      calls.frames.push(lines);
      return {
        update: (next) => calls.frames.push(next),
        moveTo: (column) => calls.moves.push(column),
        remove: () => {
          calls.blockRemoved = true;
        },
      };
    },
    // A 60 Hz display: each frame is 1000 / 60 ms after the previous one.
    nextFrame: async () => {
      calls.clock = (calls.clock ?? 0) + 1000 / 60;
      return calls.clock;
    },
    clear: () => {
      calls.cleared += 1;
    },
    enterAltScreen: () => {
      calls.altScreen = true;
    },
    leaveAltScreen: () => {
      calls.altScreen = false;
    },
    enterMode: (mode) => {
      calls.mode = mode;
    },
    exitMode: () => {
      calls.mode = null;
    },
    reducedMotion: false,
    history: ["ls", "history"],
    getTheme: () => calls.theme,
    setTheme: (theme) => {
      calls.theme = theme;
    },
    now: () => new Date(2026, 9, 22, 9, 5, 3),
    env: {
      columns: 120,
      rows: 30,
      viewport: { width: 1440, height: 900 },
      language: "zh-CN",
      timeZone: "Asia/Shanghai",
      uptimeMs: 125000,
    },
    navigate: async (project) => {
      calls.navigated.push(project.name);
    },
    home: () => {
      calls.homed += 1;
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
  assert.equal(findProject(String(PROJECTS.length + 1)), undefined);
  assert.equal(findProject("steamtower"), undefined);
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
  assert.equal(long.text()[4], "  [4] blog        technical writing on Juejin");
});

test("every project has a short one-line summary", () => {
  PROJECTS.forEach((project) => {
    assert.ok(project.summary.length > 0 && project.summary.length <= 40, project.name);
  });
});

test("ls accepts combined and separate flags; -h changes nothing", async () => {
  const outputs = [];
  for (const input of ["ls -l", "ls -lh", "ls -h -l", "ll", "ll -h", "ls -l ~"]) {
    const { ctx, text } = createCtx();
    await execute(ctx, input);
    outputs.push(text());
  }
  outputs.forEach((output) => assert.deepEqual(output, outputs[0]));
});

test("ls -a reveals the hidden files, in both short and long form", async () => {
  const short = createCtx();
  await execute(short.ctx, "la");
  assert.deepEqual(short.text(), [".  ..  about.md  .plan"]);
  assert.deepEqual(short.calls.projects, [PROJECTS]);

  const long = createCtx();
  await execute(long.ctx, "ls -lah");
  assert.deepEqual(long.text().slice(0, 3), [
    `total ${PROJECTS.length + 2}`,
    "      about.md    about the author",
    "      .plan       what's next, finger style",
  ]);
  assert.equal(long.calls.lines.length, PROJECTS.length + 3);
});

test("ls rejects unknown options and paths", async () => {
  const option = createCtx();
  await execute(option.ctx, "ls -lz");
  assert.deepEqual(option.text(), [" ERR  ls: invalid option -- 'z'", "usage: ls [-lah]"]);

  const path = createCtx();
  await execute(path.ctx, "ls /etc");
  assert.deepEqual(path.text(), [" ERR  ls: cannot access '/etc': No such file or directory"]);
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
    "targets: 1-6, the-moss, terra-echo, github, blog, byteriot, choicelab",
  ]);
  assert.deepEqual(calls.navigated, []);
});

test("info shows project details with a link to the project", async () => {
  const { ctx, calls, text } = createCtx();
  await execute(ctx, "info moss");
  assert.deepEqual(text(), [
    "[1] the-moss",
    "  a digital garden of notes and thoughts",
    "",
    "  url      https://moss.lookoutldz.top/",
    "  aliases  moss",
    "  short    lookoutldz.top/the-moss",
    "  open     open the-moss",
  ]);
  assert.deepEqual(calls.lines[3][1], {
    text: "https://moss.lookoutldz.top/",
    href: "https://moss.lookoutldz.top/",
    target: "the-moss",
  });
  assert.deepEqual(calls.images, [
    {
      src: "/assets/thumbs/the-moss.webp",
      alt: "the-moss screenshot",
      href: "https://moss.lookoutldz.top/",
      target: "the-moss",
    },
  ]);
  assert.deepEqual(calls.navigated, []);
});

test("info prints usage or an error for missing and unknown targets", async () => {
  const missing = createCtx();
  await execute(missing.ctx, "info");
  assert.equal(missing.text()[0], "usage: info <target>");

  const unknown = createCtx();
  await execute(unknown.ctx, "info steamtower");
  assert.equal(unknown.text()[0], " ERR  info: no such target: steamtower");
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

test("history, clear, home and exit use the terminal context", async () => {
  const history = createCtx();
  await execute(history.ctx, "history");
  assert.deepEqual(history.text(), ["    1  ls", "    2  history"]);

  const clear = createCtx();
  await execute(clear.ctx, "clear");
  assert.equal(clear.calls.cleared, 1);

  const home = createCtx();
  await execute(home.ctx, "home");
  assert.deepEqual(home.text(), []);
  assert.equal(home.calls.homed, 1);

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

test("cat reads the hidden .plan file", async () => {
  const { ctx, text } = createCtx();
  await execute(ctx, "cat .plan");
  assert.equal(text()[0], "Plan:");
  assert.equal(text().length, 4);
});

test("tree lists every project as a link to its address", async () => {
  const { ctx, calls, text } = createCtx();
  await execute(ctx, "tree");
  assert.deepEqual(text(), [
    "~",
    "├── the-moss -> moss.lookoutldz.top",
    "├── terra-echo -> terraecho.top",
    "├── github -> github.com/lookoutldz",
    "├── blog -> juejin.cn/user/4341288062690398",
    "├── byteriot -> byteriot.top",
    "└── choicelab -> choicelab.lookoutldz.top",
    "",
    "6 links",
  ]);
  assert.deepEqual(calls.lines[1][1], { text: "the-moss", href: PROJECTS[0].url, target: "the-moss" });
});

test("cd stays home, points projects to open, and rejects everything else", async () => {
  const cases = [
    ["cd", []],
    ["cd ~", []],
    ["cd moss", ["cd: not a directory: moss", "try: open the-moss"]],
    ["cd ..", ["cd: there is nowhere above home"]],
    ["cd /tmp", ["cd: no such file or directory: /tmp"]],
  ];
  for (const [input, expected] of cases) {
    const { ctx, text } = createCtx();
    await execute(ctx, input);
    assert.deepEqual(text(), expected, input);
  }
});

test("uname prints requested fields in canonical order", async () => {
  const cases = [
    ["uname", ["LOOKO"]],
    ["uname -a", ["LOOKO home 1.0 #1 Cloudflare Pages js LOOKO/OS"]],
    ["uname -rs", ["LOOKO 1.0"]],
    ["uname -x", [" ERR  uname: invalid option -- 'x'", "usage: uname [-asnrvmo]"]],
  ];
  for (const [input, expected] of cases) {
    const { ctx, text } = createCtx();
    await execute(ctx, input);
    assert.deepEqual(text(), expected, input);
  }
});

test("uptime reports the clock and how long the session has run", async () => {
  const { ctx, text } = createCtx();
  await execute(ctx, "uptime");
  assert.deepEqual(text(), ["09:05:03 up 2 mins, 1 user, load average: 0.00, 0.00, 0.00"]);
});

test("which resolves commands and aliases", async () => {
  const { ctx, text } = createCtx();
  await execute(ctx, "which ls ll NEOFETCH vim emacs");
  assert.deepEqual(text(), ["/usr/bin/ls", "/usr/bin/ll", "/usr/bin/neofetch", "/usr/bin/vim", "emacs not found"]);

  const empty = createCtx();
  await execute(empty.ctx, "which");
  assert.deepEqual(empty.text(), ["usage: which <command>"]);
});

test("sl drives the train from the right edge until it has fully left the screen", async () => {
  const { ctx, calls } = createCtx({ env: { columns: 60, rows: 30 } });
  await execute(ctx, "sl");

  const width = Math.max(...trainFrame(0).map((line) => line.length));
  const { moves } = calls;
  assert.equal(moves[0], 60, "starts just off the right edge");
  assert.ok(moves.at(-1) > -width, "last drawn position still shows the tail");
  assert.equal(calls.blockRemoved, true);

  // Smooth: every display frame moves the same small fraction of a column.
  const steps = moves.slice(1).map((column, index) => moves[index] - column);
  const perFrame = SL_SPEED / 60;
  steps.slice(1).forEach((step) => assert.ok(Math.abs(step - perFrame) < 1e-9));
  assert.ok(perFrame < 1, "never jumps a whole column at once");

  // The whole run takes as long as crossing the screen at SL_SPEED, ±1 frame.
  const expectedFrames = ((60 + width) / SL_SPEED) * 60;
  assert.ok(Math.abs(moves.length - 1 - expectedFrames) <= 2);
});

test("sl switches smoke and wheels at a calm fixed rate, not every frame", async () => {
  const { ctx, calls } = createCtx({ env: { columns: 60, rows: 30 } });
  await execute(ctx, "sl");

  const durationMs = (calls.moves.length - 1) * (1000 / 60);
  const expectedRedraws = Math.floor(durationMs / SL_PUFF_INTERVAL);
  assert.ok(Math.abs(calls.frames.length - 1 - expectedRedraws) <= 1);
  calls.frames.slice(1).forEach((frame, index) => assert.notDeepEqual(frame, calls.frames[index]));
});

test("sl prints one still frame when motion is reduced", async () => {
  const { ctx, calls, text } = createCtx({ reducedMotion: true });
  await execute(ctx, "sl");
  assert.deepEqual(text(), trainFrame(0));
  assert.deepEqual(calls.frames, []);
});

test("vim opens a full alternate screen and hands input to vim mode", async () => {
  const { ctx, calls, text } = createCtx();
  await execute(ctx, "vi notes.txt");
  assert.equal(calls.altScreen, true);
  assert.equal(calls.mode, vimMode);
  assert.equal(text().length, 30 - 1);
  assert.ok(text().some((line) => line.includes("VIM - Vi IMproved")));
  assert.equal(text().at(-1), '"notes.txt" [New]');
});

test("vim mode only lets you out with a quit command", async () => {
  const { ctx, calls, text } = createCtx();
  await execute(ctx, "vim");
  calls.lines.length = 0;

  for (const line of [":w", ":help", ":wat", "hello"]) {
    vimMode.handle(ctx, line);
  }
  vimMode.interrupt(ctx);
  assert.deepEqual(text(), [
    "E32: No file name",
    "E149: Sorry, no help for LOOKO Terminal",
    "E492: Not an editor command: wat",
    "type  :q<Enter>  to exit",
    "Type  :qa!  and press <Enter> to abandon all changes and exit Vim",
  ]);
  assert.equal(calls.mode, vimMode);

  vimMode.handle(ctx, ":q!");
  assert.equal(calls.altScreen, false);
  assert.equal(calls.mode, null);
  assert.equal(text().at(-1), "You escaped vim. Not everyone does.");
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
