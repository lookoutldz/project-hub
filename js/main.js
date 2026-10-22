import { COMMANDS, THEMES, execute } from "./commands.js";
import { PROJECTS, findProject } from "./projects.js";
import { commandFromQuery, complete } from "./shell.js";
import { createTerminal } from "./terminal.js";

const BOOT_LINE_DELAY = 120;
const COMMAND_DELAY = 80;
const TYPE_DELAY = 30;
const NAVIGATE_DELAY = 500;
const STATUS_RESET_DELAY = 3000;
const THEME_KEY = "looko.theme";
const BOOTED_KEY = "looko.booted";

const root = document.documentElement;
const screen = document.getElementById("screen");
const output = document.getElementById("output");
const prompt = document.getElementById("prompt");
const input = document.getElementById("input");
const statusMessage = document.getElementById("status-msg");
const statusClock = document.getElementById("status-clock");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");
const startedAt = Date.now();
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const storage = {
  get(area, key) {
    try {
      return window[area].getItem(key);
    } catch {
      return null;
    }
  },
  set(area, key, value) {
    try {
      window[area].setItem(key, value);
    } catch {
      // Storage is a convenience only; the terminal works without it.
    }
  },
};

const terminal = createTerminal({
  screen,
  output,
  prompt,
  input,
  before: document.getElementById("typed-before"),
  cursor: document.getElementById("cursor"),
  after: document.getElementById("typed-after"),
});

const state = {
  locked: true,
  running: false,
  queue: [],
  history: [],
  historyIndex: 0,
  draft: "",
};

let statusTimer;

const resetStatus = () => {
  window.clearTimeout(statusTimer);
  statusMessage.textContent = `${PROJECTS.length} routes`;
};

const updateClock = () => {
  const now = new Date();
  statusClock.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

const currentTheme = () => root.dataset.theme ?? "amber";

const applyTheme = (theme) => {
  if (theme === "amber") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }
  const background = getComputedStyle(root).getPropertyValue("--bg").trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
};

const setInput = (value) => {
  input.value = value;
  input.setSelectionRange(value.length, value.length);
  terminal.renderInput();
};

const focusInput = () => {
  input.focus({ preventScroll: true });
};

const revealGradually = async (nodes) => {
  let skipped = false;
  const skip = () => {
    skipped = true;
  };
  window.addEventListener("keydown", skip, { capture: true });
  window.addEventListener("pointerdown", skip, { capture: true });

  for (const node of nodes) {
    node.hidden = false;
    terminal.scrollToBottom();
    if (!skipped && node.textContent.trim()) {
      await wait(BOOT_LINE_DELAY);
    }
  }

  window.removeEventListener("keydown", skip, { capture: true });
  window.removeEventListener("pointerdown", skip, { capture: true });
};

// The boot screen, project list included, is printed from PROJECTS so projects.js is the only place to edit.
const printBootScreen = () => [
  terminal.print([{ text: "LOOKO OS 1.0 (tty1)", tone: "bright" }]),
  terminal.print([{ text: "Initializing... ok", tone: "dim" }]),
  terminal.print([{ text: `Mounting ${PROJECTS.length} routes... ok`, tone: "dim" }]),
  terminal.print("Ready."),
  terminal.print(""),
  terminal.print([{ text: "PROJECTS", tone: "bright" }]),
  terminal.printProjects(PROJECTS),
  terminal.print(""),
  terminal.print([{ text: 'Type "help" for commands, or click a project.', tone: "dim" }]),
];

const boot = async ({ animate }) => {
  state.locked = true;
  prompt.hidden = true;

  terminal.clear();
  const nodes = printBootScreen();
  if (animate) {
    // Hidden in the same task they were printed in, so the full screen never flashes.
    nodes.forEach((node) => {
      node.hidden = true;
    });
    await revealGradually(nodes);
  }

  prompt.hidden = false;
  terminal.setPromptVisible(true);
  terminal.renderInput();
  state.locked = false;
  if (finePointer.matches) {
    focusInput();
  }
};

const ctx = {
  print: (line, options) => terminal.print(line, options),
  printProjects: (projects) => terminal.printProjects(projects),
  printBlock: (lines) => terminal.printBlock(lines),
  clear: () => terminal.clear(),
  sleep: wait,
  get reducedMotion() {
    return reducedMotion.matches;
  },
  get history() {
    return state.history;
  },
  getTheme: currentTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    storage.set("localStorage", THEME_KEY, theme);
  },
  now: () => new Date(),
  get env() {
    return {
      columns: terminal.columns(),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      uptimeMs: Date.now() - startedAt,
    };
  },
  navigate: async (project) => {
    statusMessage.textContent = `OPENING ${project.name}`;
    await wait(NAVIGATE_DELAY);
    window.location.assign(project.url);
    statusTimer = window.setTimeout(resetStatus, STATUS_RESET_DELAY);
  },
  reboot: async () => {
    await wait(400);
    await boot({ animate: !reducedMotion.matches });
  },
};

const run = async (value) => {
  terminal.echo(value);
  setInput("");
  state.historyIndex = state.history.length;
  state.draft = "";

  if (!value.trim()) {
    return;
  }

  state.history.push(value);
  state.historyIndex = state.history.length;
  state.locked = true;
  state.running = true;
  terminal.setPromptVisible(false);

  await wait(COMMAND_DELAY);
  try {
    await execute(ctx, value);
  } catch (error) {
    console.error(error);
    terminal.print([{ text: " ERR ", tone: "inverse" }, " looko-sh: internal error"]);
  }

  state.running = false;
  state.locked = false;
  terminal.setPromptVisible(true);
  terminal.renderInput();

  // Lines entered while this command ran execute next, like terminal type-ahead.
  if (state.queue.length) {
    await run(state.queue.shift());
  }
};

const typeCommand = async (command) => {
  if (reducedMotion.matches) {
    setInput(command);
    return;
  }

  // Builds from `command` alone, so keys pressed meanwhile can't get mixed into it.
  const chars = [...command];
  for (let count = 1; count <= chars.length; count += 1) {
    setInput(chars.slice(0, count).join(""));
    terminal.markTyping();
    await wait(TYPE_DELAY);
  }
};

const browseHistory = (direction) => {
  if (!state.history.length) {
    return;
  }
  if (state.historyIndex === state.history.length) {
    state.draft = input.value;
  }

  state.historyIndex = Math.min(Math.max(state.historyIndex + direction, 0), state.history.length);
  setInput(state.historyIndex === state.history.length ? state.draft : state.history[state.historyIndex]);
};

const completeInput = () => {
  const { value, candidates } = complete(input.value, COMMANDS);
  if (candidates.length) {
    terminal.echo(input.value);
    terminal.print([{ text: candidates.join("  "), tone: "dim" }]);
  }
  setInput(value);
};

input.addEventListener("keydown", (event) => {
  // Let the IME finish composing (e.g. Chinese input) before handling Enter or Tab.
  if (event.isComposing || event.keyCode === 229) {
    return;
  }

  if (event.key === "Enter" || event.key === "Tab") {
    event.preventDefault();
  }
  if (event.key === "Enter" && state.running) {
    state.queue.push(input.value);
    setInput("");
    return;
  }
  if (state.locked) {
    return;
  }

  if (event.key === "Enter") {
    run(input.value);
    return;
  }
  if (event.key === "Tab") {
    completeInput();
    return;
  }
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    browseHistory(event.key === "ArrowUp" ? -1 : 1);
    return;
  }

  if (event.ctrlKey && !event.metaKey && !event.altKey) {
    const key = event.key.toLowerCase();
    if (key === "l") {
      event.preventDefault();
      terminal.clear();
    } else if (key === "u") {
      event.preventDefault();
      const position = input.selectionStart ?? 0;
      input.value = input.value.slice(position);
      input.setSelectionRange(0, 0);
      terminal.renderInput();
    } else if (key === "c" && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
      terminal.echo(`${input.value}^C`);
      state.historyIndex = state.history.length;
      setInput("");
    }
  }
});

input.addEventListener("input", () => {
  terminal.renderInput();
  terminal.markTyping();
});
["keyup", "select", "click"].forEach((type) => input.addEventListener(type, terminal.renderInput));
document.addEventListener("selectionchange", () => {
  if (document.activeElement === input) {
    terminal.renderInput();
  }
});
input.addEventListener("focus", () => terminal.setFocused(true));
input.addEventListener("blur", () => terminal.setFocused(false));

// Typing anywhere on the page goes to the prompt.
window.addEventListener("keydown", (event) => {
  if (event.target === input || prompt.hidden || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (event.key.length === 1 && !event.target.closest?.("a")) {
    focusInput();
  }
});

screen.addEventListener("click", (event) => {
  if (prompt.hidden || event.target.closest("a")) {
    return;
  }
  // Leave an active text selection alone so output can be copied.
  if (!window.getSelection()?.isCollapsed) {
    return;
  }
  focusInput();
});

output.addEventListener("click", async (event) => {
  const link = event.target.closest("a.link[data-target]");
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const project = findProject(link.dataset.target);
  if (!project) {
    return;
  }

  event.preventDefault();
  if (state.locked || prompt.hidden) {
    return;
  }

  const command = `open ${project.name}`;
  state.locked = true;
  await typeCommand(command);
  await run(command);
});

// Coming back from a project via the back button restores this page from bfcache.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    resetStatus();
    updateClock();
  }
});

const syncViewport = () => {
  const viewport = window.visualViewport;
  if (!viewport || viewport.scale > 1.01) {
    return;
  }
  root.style.setProperty("--app-height", `${viewport.height}px`);
  terminal.scrollToBottom();
};

// theme-init.js already applied the saved theme; this validates it and syncs theme-color.
const savedTheme = storage.get("localStorage", THEME_KEY);
applyTheme(THEMES.includes(savedTheme) ? savedTheme : "amber");

resetStatus();
updateClock();
window.setInterval(updateClock, 10000);
window.visualViewport?.addEventListener("resize", syncViewport);
syncViewport();

// A share link like `/?cmd=fastfetch` types and runs that command once the terminal is ready.
const runQueryCommand = async () => {
  const command = commandFromQuery(window.location.search);
  if (!command) {
    return;
  }

  state.locked = true;
  await typeCommand(command);
  await run(command);
};

const animateBoot = !reducedMotion.matches && !storage.get("sessionStorage", BOOTED_KEY);
storage.set("sessionStorage", BOOTED_KEY, "1");
boot({ animate: animateBoot }).then(runQueryCommand);
