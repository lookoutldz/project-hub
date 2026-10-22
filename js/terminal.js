const TONES = new Set(["dim", "bright", "inverse"]);
const TYPING_PAUSE = 500;

export const PS1 = "looko@home:~$ ";

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

  const echo = (command, ps1 = PS1) => {
    const line = createLine([]);
    const label = document.createElement("span");
    label.textContent = ps1;
    line.append(label, renderSegment({ text: command, tone: "bright" }));
    return append(line);
  };

  const setPs1 = (text) => {
    prompt.querySelector(".ps1").textContent = text;
  };

  /**
   * A fixed block of unwrapped lines for animations: `update` redraws the text,
   * `moveTo` slides it horizontally by a (fractional) number of columns.
   * The block clips whatever slides past either edge.
   */
  const printBlock = (lines) => {
    const element = document.createElement("div");
    element.className = "line line--block";
    const track = document.createElement("div");
    track.className = "line__track";
    track.textContent = lines.join("\n");
    element.append(track);
    append(element);
    return {
      update: (next) => {
        track.textContent = next.join("\n");
        scrollToBottom();
      },
      moveTo: (column) => {
        track.style.setProperty("--x", `${column}ch`);
      },
      remove: () => element.remove(),
    };
  };

  const nextFrame = () => new Promise((resolve) => window.requestAnimationFrame(resolve));

  // Like a real terminal's alternate screen: full-screen programs draw on a blank
  // screen and the previous output comes back untouched when they exit.
  let savedScreen = null;

  const enterAltScreen = () => {
    savedScreen = [...output.childNodes];
    output.replaceChildren();
  };

  const leaveAltScreen = () => {
    if (savedScreen) {
      output.replaceChildren(...savedScreen);
      savedScreen = null;
    }
    scrollToBottom();
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

  const rows = () => {
    const style = getComputedStyle(screen);
    const lineHeight = parseFloat(getComputedStyle(output).lineHeight);
    const height = screen.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    return lineHeight > 0 ? Math.floor(height / lineHeight) : 24;
  };

  return {
    print,
    printProjects,
    printBlock,
    nextFrame,
    echo,
    setPs1,
    enterAltScreen,
    leaveAltScreen,
    clear,
    renderInput,
    markTyping,
    setPromptVisible,
    setFocused,
    scrollToBottom,
    columns,
    rows,
  };
};
