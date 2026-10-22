import { PROJECTS, SITE_HOST, describeTargets, displayUrl, findProject, findShortLink } from "./projects.js";
import { findCommand, parse } from "./shell.js";

export const THEMES = ["amber", "green"];

const error = (text) => [{ text: " ERR ", tone: "inverse" }, ` ${text}`];
const dim = (text) => [{ text, tone: "dim" }];
const bright = (text) => [{ text, tone: "bright" }];

const pad2 = (value) => String(value).padStart(2, "0");

const formatDate = (date, timeZone) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ` +
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} ${timeZone}`;

const formatUptime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) {
    return `${Math.floor(ms / 1000)} secs`;
  }
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"}`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}, ${minutes % 60} mins`;
};

const FASTFETCH_ART = [
  " .------------------------.",
  " | .--------------------. |",
  " | |                    | |",
  " | |  looko@home:~$ _   | |",
  " | |                    | |",
  " | |                    | |",
  " | '--------------------' |",
  " |  ::::::::::      [o]   |",
  " '------------------------'",
  "       _|__________|_",
];

const projectTargets = () => PROJECTS.flatMap((project) => [project.name, ...project.aliases]);

// Shared by `open` and `info`: prints usage or an error and returns undefined when the target is invalid.
const resolveTarget = (ctx, command, args) => {
  if (!args.length) {
    ctx.print(`usage: ${command} <target>`);
    ctx.print(dim(describeTargets()));
    return undefined;
  }

  const project = findProject(args[0]);
  if (!project) {
    ctx.print(error(`${command}: no such target: ${args[0]}`));
    ctx.print(dim(describeTargets()));
  }
  return project;
};

const projectLink = (project) => ({ text: project.name, href: project.url, target: project.name });

const about = (ctx) => {
  ctx.print(bright("Looko"));
  ctx.print("Backend Developer / Full Stack Developer");
  ctx.print("Building useful things.");
};

// The only "files" in the home directory: `ls -a` reveals them and `cat` reads them.
const FILES = [
  { name: "about.md", summary: "about the author", read: about },
  {
    name: ".plan",
    summary: "what's next, finger style",
    read: (ctx) => {
      ctx.print(bright("Plan:"));
      ctx.print("  - keep the garden growing");
      ctx.print("  - ship small things, often");
      ctx.print("  - leave room for curiosity");
    },
  },
];

// Paths that all mean "the current directory", which is always home.
const HOME_PATHS = new Set(["~", "~/", ".", "./", "/home/looko"]);

/** Splits `-lah -l` style arguments into a set of single-letter flags and the remaining operands. */
const parseFlags = (args) => {
  const flags = new Set();
  const operands = [];
  args.forEach((arg) => {
    if (arg.startsWith("-") && arg.length > 1) {
      [...arg.slice(1)].forEach((flag) => flags.add(flag));
    } else {
      operands.push(arg);
    }
  });
  return { flags, operands };
};

const NAME_COLUMN = 12;
const LIST_HANG = 18;

const list = (ctx, args) => {
  const { flags, operands } = parseFlags(args);
  const unknown = [...flags].find((flag) => !"lah".includes(flag));
  if (unknown) {
    ctx.print(error(`ls: invalid option -- '${unknown}'`));
    ctx.print(dim("usage: ls [-lah]"));
    return;
  }
  const missing = operands.find((operand) => !HOME_PATHS.has(operand));
  if (missing) {
    ctx.print(error(`ls: cannot access '${missing}': No such file or directory`));
    return;
  }

  // -h (human-readable sizes) is accepted so `ls -lh` works from habit; there are no sizes to show.
  const all = flags.has("a");
  if (!flags.has("l")) {
    if (all) {
      ctx.print(dim([".", "..", ...FILES.map((file) => file.name)].join("  ")));
    }
    ctx.printProjects(PROJECTS);
    return;
  }

  ctx.print(dim(`total ${PROJECTS.length + (all ? FILES.length : 0)}`));
  if (all) {
    FILES.forEach((file) => {
      ctx.print(
        [`      ${file.name.padEnd(NAME_COLUMN)}`, { text: file.summary, tone: "dim" }],
        { hang: LIST_HANG }
      );
    });
  }
  PROJECTS.forEach((project) => {
    ctx.print(
      [
        `  [${project.index}] `,
        projectLink(project),
        " ".repeat(Math.max(1, NAME_COLUMN - project.name.length)),
        { text: project.summary, tone: "dim" },
      ],
      { hang: LIST_HANG }
    );
  });
};

const UNAME_FIELDS = [
  ["s", "LOOKO"],
  ["n", "home"],
  ["r", "1.0"],
  ["v", "#1 Cloudflare Pages"],
  ["m", "js"],
  ["o", "LOOKO/OS"],
];

const uname = (ctx, args) => {
  const { flags } = parseFlags(args);
  const known = new Set(["a", ...UNAME_FIELDS.map(([flag]) => flag)]);
  const unknown = [...flags].find((flag) => !known.has(flag));
  if (unknown) {
    ctx.print(error(`uname: invalid option -- '${unknown}'`));
    ctx.print(dim("usage: uname [-asnrvmo]"));
    return;
  }

  // Fields always print in the canonical order, whatever order the flags came in.
  const wanted = flags.has("a") ? UNAME_FIELDS : UNAME_FIELDS.filter(([flag]) => flags.has(flag));
  ctx.print((wanted.length ? wanted : UNAME_FIELDS.slice(0, 1)).map(([, value]) => value).join(" "));
};

const tree = (ctx) => {
  ctx.print("~");
  PROJECTS.forEach((project, index) => {
    const branch = index === PROJECTS.length - 1 ? "└── " : "├── ";
    ctx.print([branch, projectLink(project), { text: ` -> ${displayUrl(project)}`, tone: "dim" }], { hang: 4 });
  });
  ctx.print("");
  ctx.print(dim(`${PROJECTS.length} links`));
};

// sl: the classic punishment for typing `sl` instead of `ls`. Our own train, not the original art.
// Moves smoothly by a fraction of a column every display frame; smoke and wheels
// switch at a calm, fixed rate instead of on every frame, which would flicker.
export const SL_SPEED = 30; // columns per second
export const SL_PUFF_INTERVAL = 160; // ms between smoke/wheel frames
const SMOKE = [
  ["          (  )   ( )    (    )", "      (  )", "     ( )"],
  ["           ( )    (  )     (  )", "       ( )", "     (  )"],
];
const TRAIN_BODY = [
  "     ====",
  ` ____|  |${"_".repeat(16)}   ${"_".repeat(14)}`,
  ` |   |  |   LOOKO        | |${" ".repeat(14)}|`,
  " |   |__|   EXPRESS      |=|   ~ home ~   |",
  ` |${"_".repeat(23)}| |${"_".repeat(14)}|`,
];
const WHEELS = ["   (+)   (+)      (+)        (+)      (+)", "   (x)   (x)      (x)        (x)      (x)"];

export const trainFrame = (step) => [...SMOKE[step % 2], ...TRAIN_BODY, WHEELS[step % 2]];

const sl = async (ctx) => {
  if (ctx.reducedMotion) {
    trainFrame(0).forEach((line) => ctx.print(line));
    return;
  }

  // Runs to the end on purpose: like the original, Ctrl+C can't stop it.
  const { columns } = ctx.env;
  const width = Math.max(...trainFrame(0).map((line) => line.length));
  const block = ctx.printBlock(trainFrame(0));
  block.moveTo(columns);

  const start = await ctx.nextFrame();
  let puff = 0;
  for (let now = start; ; now = await ctx.nextFrame()) {
    const elapsed = now - start;
    const offset = columns - (elapsed / 1000) * SL_SPEED;
    if (offset <= -width) {
      break;
    }
    block.moveTo(offset);

    const nextPuff = Math.floor(elapsed / SL_PUFF_INTERVAL);
    if (nextPuff !== puff) {
      puff = nextPuff;
      block.update(trainFrame(puff));
    }
  }
  block.remove();
};

// vim: an alternate screen you can only leave the way vim users eventually learn.
const VIM_EXITS = new Set([":q", ":q!", ":wq", ":wq!", ":x", ":qa", ":qa!", ":wqa", "ZZ"]);
const VIM_INTRO = [
  "VIM - Vi IMproved",
  "",
  "version 9.1, LOOKO edition",
  "",
  "type  :q<Enter>       to exit",
  "type  :help<Enter>    for help",
];

const vimError = (text) => [{ text, tone: "inverse" }];

export const vimMode = {
  prompt: "",
  handle: (ctx, line) => {
    if (VIM_EXITS.has(line)) {
      ctx.leaveAltScreen();
      ctx.exitMode();
      ctx.print(dim("You escaped vim. Not everyone does."));
      return;
    }
    if (line === ":w") {
      ctx.print(vimError("E32: No file name"));
    } else if (line === ":help" || line === ":h") {
      ctx.print(vimError("E149: Sorry, no help for LOOKO Terminal"));
    } else if (line.startsWith(":")) {
      ctx.print(vimError(`E492: Not an editor command: ${line.slice(1)}`));
    } else {
      ctx.print(dim("type  :q<Enter>  to exit"));
    }
  },
  interrupt: (ctx) => ctx.print("Type  :qa!  and press <Enter> to abandon all changes and exit Vim"),
};

const center = (text, width) => " ".repeat(Math.max(0, Math.floor((width - text.length) / 2))) + text;

const vim = (ctx, args) => {
  const { columns, rows } = ctx.env;
  const [file] = args;
  ctx.enterAltScreen();

  // Fill the screen with `~` lines, leaving room for the command line (and the file status).
  const height = Math.max(rows - (file ? 2 : 1), VIM_INTRO.length + 2);
  const top = Math.floor((height - VIM_INTRO.length) / 2);
  for (let row = 0; row < height; row += 1) {
    const text = VIM_INTRO[row - top];
    ctx.print(text ? [{ text: "~", tone: "dim" }, center(text, columns - 1)] : dim("~"));
  }
  if (file) {
    ctx.print(`"${file}" [New]`);
  }
  ctx.enterMode(vimMode);
};

const changeDirectory = (ctx, args) => {
  const [target] = args;
  if (!target || HOME_PATHS.has(target)) {
    return;
  }

  const project = findShortLink(target);
  if (project) {
    ctx.print(`cd: not a directory: ${target}`);
    ctx.print(dim(`try: open ${project.name}`));
    return;
  }
  ctx.print(target === ".." ? "cd: there is nowhere above home" : `cd: no such file or directory: ${target}`);
};

const fastfetch = (ctx) => {
  const { env } = ctx;
  const fields = [
    ["OS", "LOOKO OS 1.0"],
    ["Host", "Cloudflare Pages"],
    ["Kernel", "Vanilla JS (ES modules)"],
    ["Shell", "looko-sh"],
    ["Resolution", `${env.viewport.width}x${env.viewport.height}`],
    ["Theme", `${ctx.getTheme()} phosphor`],
    ["Font", "IBM Plex Mono"],
    ["Uptime", formatUptime(env.uptimeMs)],
    ["Routes", String(PROJECTS.length)],
    ["Locale", env.language],
  ];
  const info = [
    bright("looko@home"),
    ["----------"],
    ...fields.map(([key, value]) => [{ text: `${key}: `, tone: "bright" }, value]),
  ];

  const artWidth = Math.max(...FASTFETCH_ART.map((line) => line.length));
  const infoWidth = 34;
  const gap = 3;

  if (env.columns < artWidth + gap + infoWidth) {
    FASTFETCH_ART.forEach((line) => ctx.print(line));
    ctx.print("");
    info.forEach((line) => ctx.print(line));
    return;
  }

  const rows = Math.max(FASTFETCH_ART.length, info.length);
  for (let row = 0; row < rows; row += 1) {
    const art = (FASTFETCH_ART[row] ?? "").padEnd(artWidth + gap);
    ctx.print([art, ...(info[row] ?? [])]);
  }
};

/**
 * Each command: { name, aliases, usage, summary, hidden, complete, run(ctx, args) }.
 * `help`, `man` and Tab completion are all derived from this list.
 */
export const COMMANDS = [
  {
    name: "help",
    usage: "help",
    summary: "show this help",
    run: (ctx) => {
      ctx.print(bright("AVAILABLE COMMANDS"));
      COMMANDS.filter((command) => !command.hidden).forEach((command) => {
        ctx.print([`  ${command.usage.padEnd(22)}`, { text: command.summary, tone: "dim" }]);
      });
      ctx.print("");
      ctx.print(dim("Click a project, or press Tab to complete a command."));
    },
  },
  {
    name: "ls",
    usage: "ls [-lah]",
    summary: "list projects",
    run: list,
  },
  {
    name: "open",
    usage: "open <target>",
    summary: "open a project",
    complete: projectTargets,
    run: async (ctx, args) => {
      const project = resolveTarget(ctx, "open", args);
      if (!project) {
        return;
      }

      ctx.print(`Opening ${project.name}...`);
      await ctx.navigate(project);
    },
  },
  {
    name: "info",
    usage: "info <target>",
    summary: "show project details",
    complete: projectTargets,
    run: (ctx, args) => {
      const project = resolveTarget(ctx, "info", args);
      if (!project) {
        return;
      }

      const field = (label, value) =>
        ctx.print([{ text: `  ${label.padEnd(9)}`, tone: "dim" }, value], { hang: 11 });
      ctx.print(bright(`[${project.index}] ${project.name}`));
      ctx.print(`  ${project.summary}`, { hang: 2 });
      ctx.print("");
      field("url", { text: project.url, href: project.url, target: project.name });
      if (project.aliases.length) {
        field("aliases", project.aliases.join(", "));
      }
      field("short", `${SITE_HOST}/${project.name}`);
      field("open", `open ${project.name}`);
    },
  },
  {
    name: "about",
    usage: "about",
    summary: "about the author",
    run: about,
  },
  {
    name: "history",
    usage: "history",
    summary: "show command history",
    run: (ctx) => {
      ctx.history.forEach((entry, index) => {
        ctx.print([{ text: String(index + 1).padStart(5), tone: "dim" }, `  ${entry}`]);
      });
    },
  },
  {
    name: "theme",
    usage: "theme [amber|green]",
    summary: "show or switch color theme",
    complete: () => THEMES,
    run: (ctx, args) => {
      if (!args.length) {
        ctx.print(`current theme: ${ctx.getTheme()}`);
        ctx.print(dim(`available: ${THEMES.join(", ")}`));
        return;
      }

      const theme = args[0].toLowerCase();
      if (!THEMES.includes(theme)) {
        ctx.print(error(`theme: unknown theme: ${args[0]}`));
        ctx.print(dim(`available: ${THEMES.join(", ")}`));
        return;
      }

      ctx.setTheme(theme);
      ctx.print(`theme set to ${theme}`);
    },
  },
  {
    name: "man",
    usage: "man <command>",
    summary: "show command usage",
    complete: () => COMMANDS.filter((command) => !command.hidden).map((command) => command.name),
    run: (ctx, args) => {
      if (!args.length) {
        ctx.print("What manual page do you want?");
        ctx.print(dim("usage: man <command>"));
        return;
      }

      const command = findCommand(COMMANDS, args[0]);
      if (!command || command.hidden) {
        ctx.print(`No manual entry for ${args[0]}`);
        return;
      }

      ctx.print(bright("NAME"));
      ctx.print(`  ${command.name} - ${command.summary}`);
      ctx.print("");
      ctx.print(bright("SYNOPSIS"));
      ctx.print(`  ${command.usage}`);
    },
  },
  {
    name: "clear",
    usage: "clear",
    summary: "clear the screen (Ctrl+L)",
    run: (ctx) => ctx.clear(),
  },
  {
    name: "whoami",
    hidden: true,
    run: (ctx) => ctx.print("looko"),
  },
  {
    name: "pwd",
    hidden: true,
    run: (ctx) => ctx.print("/home/looko"),
  },
  {
    name: "date",
    hidden: true,
    run: (ctx) => ctx.print(formatDate(ctx.now(), ctx.env.timeZone)),
  },
  {
    name: "echo",
    hidden: true,
    run: (ctx, args) => ctx.print(args.join(" ")),
  },
  {
    name: "fastfetch",
    aliases: ["neofetch"],
    hidden: true,
    run: fastfetch,
  },
  {
    name: "sudo",
    hidden: true,
    run: (ctx) => ctx.print("You are already root."),
  },
  {
    name: "rm",
    hidden: true,
    run: (ctx, args) => {
      const recursive = args.some((arg) => /^-[a-z]*r/i.test(arg));
      const root = args.some((arg) => arg === "/" || arg === "/*");
      ctx.print(recursive && root ? bright("Nice try :)") : "rm: read-only file system");
    },
  },
  {
    name: "cat",
    hidden: true,
    complete: () => FILES.map((file) => file.name),
    run: (ctx, args) => {
      if (!args.length) {
        ctx.print("usage: cat <file>");
        return;
      }
      const file = FILES.find((entry) => entry.name === args[0]);
      if (!file) {
        ctx.print(`cat: ${args[0]}: No such file or directory`);
        return;
      }
      file.read(ctx);
    },
  },
  {
    name: "ll",
    hidden: true,
    run: (ctx, args) => list(ctx, ["-l", ...args]),
  },
  {
    name: "la",
    hidden: true,
    run: (ctx, args) => list(ctx, ["-a", ...args]),
  },
  {
    name: "tree",
    hidden: true,
    run: tree,
  },
  {
    name: "sl",
    hidden: true,
    run: sl,
  },
  {
    name: "vim",
    aliases: ["vi", "nvim"],
    hidden: true,
    run: vim,
  },
  {
    name: "cd",
    hidden: true,
    complete: projectTargets,
    run: changeDirectory,
  },
  {
    name: "uname",
    hidden: true,
    run: uname,
  },
  {
    name: "uptime",
    hidden: true,
    run: (ctx) => {
      const now = ctx.now();
      const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
      ctx.print(`${clock} up ${formatUptime(ctx.env.uptimeMs)}, 1 user, load average: 0.00, 0.00, 0.00`);
    },
  },
  {
    name: "which",
    hidden: true,
    complete: () => COMMANDS.flatMap((command) => [command.name, ...(command.aliases ?? [])]),
    run: (ctx, args) => {
      if (!args.length) {
        ctx.print("usage: which <command>");
        return;
      }
      args.forEach((arg) => {
        const name = arg.toLowerCase();
        ctx.print(findCommand(COMMANDS, name) ? `/usr/bin/${name}` : `${arg} not found`);
      });
    },
  },
  {
    name: "exit",
    aliases: ["logout"],
    hidden: true,
    run: async (ctx) => {
      ctx.print("logout");
      await ctx.reboot();
    },
  },
];

export const execute = async (ctx, input) => {
  const { name, args } = parse(input);
  if (!name) {
    return;
  }

  const command = findCommand(COMMANDS, name);
  if (!command) {
    ctx.print(error(`command not found: ${input.trim().split(/\s+/)[0]}`));
    ctx.print(dim('Type "help" for available commands.'));
    return;
  }

  await command.run(ctx, args);
};
