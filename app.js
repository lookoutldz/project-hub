const PROJECTS = [
  {
    id: "moss",
    index: 1,
    icon: "🌿",
    label: "The Moss",
    url: "https://moss.lookoutldz.top/",
    aliases: ["the moss", "1"],
  },
  {
    id: "arkvoice",
    index: 2,
    icon: "🎵",
    label: "arkvoice",
    url: "https://arkvoice.top/",
    aliases: ["2"],
  },
  {
    id: "steamtower",
    index: 3,
    icon: "🎮",
    label: "steamtower",
    url: "https://steamtower.top/",
    aliases: ["3"],
  },
  {
    id: "github",
    index: 4,
    icon: "🌏",
    label: "GitHub",
    url: "https://github.com/lookoutldz/",
    aliases: ["4"],
  },
  {
    id: "blog",
    index: 5,
    icon: "🌏",
    label: "BLOG",
    url: "https://juejin.cn/user/4341288062690398",
    aliases: ["5"],
  },
];

const COMMANDS = [
  "help",
  "ls",
  "about",
  "clear",
  "date",
  "time",
  "whoami",
  "pwd",
  "fastfetch",
  "neofetch",
  "sudo",
  "rm -rf /",
];

const HELP_COMMANDS = [
  "help",
  "ls",
  "about",
  "clear",
  "date",
  "time",
];

const FASTFETCH = String.raw`
              _,,>#b&HMHd&&bb>\_                    looko@home
          _oHMMMMMMMMMMMMMMMMH**H:.                 ------------
        oHMMMMMMMMMMMMMMMMMMMM#v\`? \`.              OS: LOOKO Terminal 1.0
     .dMMMMMMMMMMMMMMMMMMMMMMH*\`+|     .            Host: Personal Navigation Shell
    ,MMMMMMMMMMMMMMMMMMMMMb|?+.,H        -.          Kernel: Vanilla JavaScript
   ddHMMMMMMMMMMMMMMMMMMMMMb  '\`          .         Uptime: Session active
  HMMkZ**HMMMMMMMMMMMMMMMMH\  -   .         :        Packages: 5 mounted targets
 dTMMM*  \`9MMMP'"*MMMMPT"\` ..              :       Shell: Looko-Shell
|M6H''    4MP'   \`"HMMM|   !|.      .        .      Display: CRT phosphor mode
1MHp'      #L      $ *"'  .-:&.               .      WM: Single Terminal Layout
MMM'        "     q:H.  .o#-\`\`'             :      Theme: Amber / Cathode Blue
MM'                ?H?.|MMH::::-o,_.          -      Font: IBM Plex Mono / JetBrains Mono
M[                  \`*?:::'|\` \`"\`:9MH\~-.\`      Cursor: Block Blink
&M.                     ""'\`'^'.:.\`?'\`. '|-:      Runtime: Browser
\`M|d,                       .dbHM[.1?     .. :      Engine: DOM + CSS + ES Modules
 9||| .                  _obMMMMMMMMH,   .   :       Input: Keyboard + click navigation
  H.^                    MMMMMMMMMMMM}      -        Mode: Personal OS
   \                     |MMH#*HMMMMH'     .'        Status: Ready
    .                    \`      \`#*'  ,:-          Locale: zh_CN.UTF-8
     \`                           '' .-'.            Mission: Everything starts from the terminal.
       \`.                           .-
          '- .                   .-\`
              '\`\bqHMMMMMMHHb--\`
`;

const terminalViewport = document.querySelector("#terminalViewport");
const terminalHistory = document.querySelector("#terminalHistory");
const promptForm = document.querySelector("#promptForm");
const terminalInput = document.querySelector("#terminalInput");

const state = {
  booting: true,
  navigating: false,
  history: [],
  historyIndex: -1,
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const scrollToBottom = () => {
  window.requestAnimationFrame(() => {
    terminalViewport.scrollTop = terminalViewport.scrollHeight;
  });
};

const focusInput = () => {
  if (!terminalInput.disabled) {
    terminalInput.focus();
  }
};

const createLine = (text, tone = "") => {
  const line = document.createElement("div");
  line.className = `terminal-line${tone ? ` terminal-line--${tone}` : ""}`;
  line.textContent = text;
  return line;
};

const appendGroup = (nodes) => {
  const group = document.createElement("div");
  group.className = "terminal-group";
  nodes.forEach((node) => group.append(node));
  terminalHistory.append(group);
  scrollToBottom();
};

const appendLines = (lines) => {
  appendGroup(
    lines.map((entry) =>
      typeof entry === "string"
        ? createLine(entry)
        : createLine(entry.text, entry.tone || "")
    )
  );
};

const createPromptPrefix = () => {
  const prefix = document.createElement("span");
  prefix.className = "prompt-label";

  const user = document.createElement("span");
  user.className = "prompt-label__user";
  user.textContent = "looko";

  const separator = document.createElement("span");
  separator.textContent = "@";

  const host = document.createElement("span");
  host.className = "prompt-label__host";
  host.textContent = "home";

  const suffix = document.createElement("span");
  suffix.textContent = ":~$";

  prefix.append(user, separator, host, suffix);
  return prefix;
};

const appendCommandEcho = (input) => {
  const group = document.createElement("div");
  group.className = "terminal-group";

  const line = document.createElement("div");
  line.className = "terminal-line";
  const command = document.createElement("span");
  command.className = "terminal-command__input";
  command.textContent = ` ${input}`;

  line.append(createPromptPrefix(), command);

  group.append(line);
  terminalHistory.append(group);
  scrollToBottom();
};

const appendProjectsBlock = (title = "PROJECTS") => {
  const group = document.createElement("div");
  group.className = "terminal-group";

  const heading = createLine(title, "heading");
  const projects = document.createElement("div");
  projects.className = "terminal-projects";

  PROJECTS.forEach((project) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "terminal-link";
    button.dataset.projectId = project.id;
    button.setAttribute("aria-label", `Open ${project.label}`);

    const icon = document.createElement("span");
    icon.textContent = project.icon;

    const index = document.createElement("span");
    index.className = "terminal-link__index";
    index.textContent = `${project.index}.`;

    const label = document.createElement("span");
    label.textContent = project.label;

    button.append(icon, index, label);
    projects.append(button);
  });

  group.append(heading, projects);
  terminalHistory.append(group);
  scrollToBottom();
};

const appendFastfetch = () => {
  const pre = document.createElement("pre");
  pre.className = "terminal-pre";
  pre.textContent = FASTFETCH.trimEnd();
  appendGroup([pre]);
};

const resetPrompt = () => {
  terminalInput.value = "";
  focusInput();
  scrollToBottom();
};

const printWelcome = () => {
  appendProjectsBlock();
  appendLines(['Type "help" to begin.']);
};

const completeInput = () => {
  const current = terminalInput.value;
  const trimmed = current.trimStart();

  if (!trimmed) {
    appendLines([{ text: `${HELP_COMMANDS.join("   ")}   1   2   3   4   5`, tone: "muted" }]);
    return;
  }

  if (/^\d+$/.test(trimmed)) {
    const candidates = PROJECTS.filter((project) =>
      String(project.index).startsWith(trimmed)
    );
    if (candidates.length === 1) {
      terminalInput.value = String(candidates[0].index);
    } else if (candidates.length > 1) {
      appendLines([
        { text: candidates.map((project) => String(project.index)).join("   "), tone: "muted" },
      ]);
    }
    return;
  }

  const candidates = COMMANDS.filter((command) => command.startsWith(parts[0]));
  if (candidates.length === 1) {
    terminalInput.value = `${candidates[0]}${candidates[0] === "open" ? " " : ""}`;
  } else if (candidates.length > 1) {
    appendLines([{ text: candidates.join("   "), tone: "muted" }]);
  }

};

const clearTerminal = () => {
  terminalHistory.innerHTML = "";
  scrollToBottom();
};

const openProject = async (project) => {
  state.navigating = true;
  terminalInput.disabled = true;

  appendLines([
    { text: `Opening ${project.label} in a new tab...`, tone: "info" },
    { text: `Target: ${project.url}`, tone: "muted" },
  ]);

  await wait(640);
  window.open(project.url, "_blank", "noopener,noreferrer");
  state.navigating = false;
  terminalInput.disabled = false;
  resetPrompt();
};

const runCommand = async (rawInput) => {
  const input = rawInput.trim();

  if (!input) {
    return;
  }

  if (input === "clear") {
    clearTerminal();
    return;
  }

  if (input === "help") {
    appendLines([
      { text: "Available commands", tone: "heading" },
      ...HELP_COMMANDS,
      "",
      { text: "Quick open", tone: "heading" },
      "1  2  3  4  5",
    ]);
    return;
  }

  if (input === "ls") {
    appendProjectsBlock();
    return;
  }

  if (input === "about") {
    appendLines([
      "Looko",
      "Backend Developer / Full Stack Developer",
      "Building useful things.",
    ]);
    return;
  }

  if (input === "whoami") {
    appendLines(["Looko"]);
    return;
  }

  if (input === "pwd") {
    appendLines(["/home/looko"]);
    return;
  }

  if (input === "date" || input === "time") {
    appendLines([
      new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    ]);
    return;
  }

  if (input === "fastfetch" || input === "neofetch") {
    appendFastfetch();
    return;
  }

  if (input === "sudo") {
    appendLines(["You are already root."]);
    return;
  }

  if (input === "rm -rf /") {
    appendLines([{ text: "Nice try :)", tone: "danger" }]);
    return;
  }

  if (/^\d+$/.test(input)) {
    const project = PROJECTS.find((item) => String(item.index) === input);
    if (!project) {
      appendLines([
        { text: `Target not found: ${input}`, tone: "danger" },
        { text: "Use 1-5 to open a mounted target.", tone: "muted" },
      ]);
      return;
    }

    await openProject(project);
    return;
  }

  appendLines([
    { text: "Command not found.", tone: "danger" },
    { text: 'Type "help".', tone: "muted" },
  ]);
};

const bootTerminal = async () => {
  terminalInput.disabled = true;

  const bootLines = [
    "LOOKO Terminal Version 1.0",
    { text: "Initializing...", tone: "muted" },
    { text: "Mounting personal routes...", tone: "muted" },
    { text: "Ready.", tone: "info" },
  ];

  for (const line of bootLines) {
    appendLines([line]);
    await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 220);
  }

  appendLines([""]);
  printWelcome();

  state.booting = false;
  terminalInput.disabled = false;
  resetPrompt();
};

promptForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (state.booting || state.navigating) {
    return;
  }

  const rawInput = terminalInput.value;
  appendCommandEcho(rawInput);

  if (rawInput.trim()) {
    state.history.push(rawInput);
  }
  state.historyIndex = state.history.length;

  terminalInput.disabled = true;
  await wait(100);
  await runCommand(rawInput);

  if (!state.navigating) {
    terminalInput.disabled = false;
    resetPrompt();
  }
});

terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    completeInput();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!state.history.length) {
      return;
    }

    state.historyIndex = Math.max(0, state.historyIndex - 1);
    terminalInput.value = state.history[state.historyIndex] || "";
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!state.history.length) {
      return;
    }

    state.historyIndex = Math.min(state.history.length, state.historyIndex + 1);
    terminalInput.value = state.history[state.historyIndex] || "";
    return;
  }

  if (event.ctrlKey && event.key.toLowerCase() === "l") {
    event.preventDefault();
    clearTerminal();
  }
});

terminalHistory.addEventListener("click", async (event) => {
  const target = event.target.closest(".terminal-link");
  if (!target || state.booting || state.navigating) {
    return;
  }

  const project = PROJECTS.find((item) => item.id === target.dataset.projectId);
  if (!project) {
    return;
  }

  appendCommandEcho(String(project.index));
  terminalInput.disabled = true;
  await wait(80);
  await openProject(project);
});

terminalViewport.addEventListener("mousedown", (event) => {
  if (event.target.closest(".terminal-link")) {
    return;
  }

  window.setTimeout(focusInput, 0);
});

window.addEventListener("load", bootTerminal);
