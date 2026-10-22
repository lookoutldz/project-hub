const TONES = new Set(["dim", "bright", "inverse"]);
const TYPING_PAUSE = 500;

/**
 * A segment is either plain text or { text, tone?, href?, target? }.
 * A line is a string or an array of segments. Everything is written with textContent.
 */
const renderSegment = (segment) => {
  if (typeof segment === "string") {
    return document.createTextNode(segment);
  }

  const element = document.createElement(segment.href ? "a" : "span");
  element.textContent = segment.text;
  if (segment.tone && TONES.has(segment.tone)) {
    element.classList.add(`tone-${segment.tone}`);
  }
  if (segment.href) {
    element.classList.add("link");
    element.href = segment.href;
    element.dataset.target = segment.target ?? "";
  }
  return element;
};

/** `hang` is a column count: wrapped text continues under that column, like a table cell. */
const createLine = (line, { hang = 0 } = {}) => {
  const element = document.createElement("div");
  element.className = "line";
  if (hang > 0) {
    element.classList.add("line--hang");
    element.style.setProperty("--hang", `${hang}ch`);
  }
  const segments = typeof line === "string" ? [line] : line;
  segments.forEach((segment) => element.append(renderSegment(segment)));
  return element;
};

export const createProjectList = (projects) => {
  const list = document.createElement("ul");
  list.className = "projects";
  projects.forEach((project) => {
    const item = document.createElement("li");
    item.append(
      renderSegment({
        text: `[${project.index}] ${project.name}`,
        href: project.url,
        target: project.name,
      })
    );
    list.append(item);
  });
  return list;
};

export const createTerminal = ({ screen, output, prompt, input, before, cursor, after }) => {
  let typingTimer;

  const scrollToBottom = () => {
    screen.scrollTop = screen.scrollHeight;
  };

  const append = (element) => {
    output.append(element);
    scrollToBottom();
    return element;
  };

  const print = (line = "", options) => append(createLine(line, options));

  const printProjects = (projects) => append(createProjectList(projects));

  const echo = (command) => {
    const line = createLine([]);
    const ps1 = document.createElement("span");
    ps1.textContent = "looko@home:~$ ";
    line.append(ps1, renderSegment({ text: command, tone: "bright" }));
    return append(line);
  };

  const clear = () => {
    output.replaceChildren();
    scrollToBottom();
  };

  const renderInput = () => {
    const { value } = input;
    const position = Math.min(input.selectionStart ?? value.length, value.length);
    const codePoint = value.codePointAt(position);
    const current = codePoint === undefined ? " " : String.fromCodePoint(codePoint);

    before.textContent = value.slice(0, position);
    cursor.textContent = current;
    after.textContent = value.slice(position + (codePoint === undefined ? 0 : current.length));
  };

  // Hold the cursor solid while keys are coming in, like a hardware terminal.
  const markTyping = () => {
    prompt.classList.add("is-typing");
    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => prompt.classList.remove("is-typing"), TYPING_PAUSE);
  };

  const setPromptVisible = (visible) => {
    prompt.classList.toggle("is-busy", !visible);
    if (visible) {
      scrollToBottom();
    }
  };

  const setFocused = (focused) => prompt.classList.toggle("is-focused", focused);

  const columns = () => {
    const probe = document.createElement("span");
    probe.className = "measure";
    probe.textContent = "0".repeat(100);
    output.append(probe);
    const charWidth = probe.getBoundingClientRect().width / 100;
    probe.remove();
    return charWidth > 0 ? Math.floor(output.clientWidth / charWidth) : 80;
  };

  return {
    print,
    printProjects,
    echo,
    clear,
    renderInput,
    markTyping,
    setPromptVisible,
    setFocused,
    scrollToBottom,
    columns,
  };
};
