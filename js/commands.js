import { PROJECTS, SITE_HOST, describeTargets, findProject } from "./projects.js";
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
    usage: "ls [-l]",
    summary: "list projects",
    run: (ctx, args) => {
      if (!args.length) {
        ctx.printProjects(PROJECTS);
        return;
      }
      if (args.length === 1 && args[0] === "-l") {
        ctx.print(dim(`total ${PROJECTS.length}`));
        PROJECTS.forEach((project) => {
          ctx.print([
            `  [${project.index}] `,
            projectLink(project),
            " ".repeat(Math.max(1, 12 - project.name.length)),
            { text: project.summary, tone: "dim" },
          ]);
        });
        return;
      }
      ctx.print(error(`ls: invalid option: ${args.join(" ")}`));
      ctx.print(dim("usage: ls [-l]"));
    },
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

      const field = (label, value) => [{ text: `  ${label.padEnd(9)}`, tone: "dim" }, value];
      ctx.print(bright(`[${project.index}] ${project.name}`));
      ctx.print(`  ${project.summary}`);
      ctx.print("");
      ctx.print(field("url", { text: project.url, href: project.url, target: project.name }));
      if (project.aliases.length) {
        ctx.print(field("aliases", project.aliases.join(", ")));
      }
      ctx.print(field("short", `${SITE_HOST}/${project.name}`));
      ctx.print(field("open", `open ${project.name}`));
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
    run: (ctx, args) => {
      if (!args.length) {
        ctx.print("usage: cat <file>");
        return;
      }
      if (args[0] === "about.md") {
        about(ctx);
        return;
      }
      ctx.print(`cat: ${args[0]}: No such file or directory`);
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
