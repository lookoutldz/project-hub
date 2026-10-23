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

/** Screenshots are 640×400; the fixed size reserves their space before they load. */
const createThumbImage = (src, alt) => {
  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.width = 640;
  image.height = 400;
  image.decoding = "async";
  return image;
};

/**
 * Each project is a `[n] name` link. With `gallery`, a project with a screenshot also carries it:
 * style.css shows the screenshots as cards only on wide screens, so narrow screens keep the plain text list.
 */
export const createProjectList = (projects, { gallery = false } = {}) => {
  const list = document.createElement("ul");
  list.className = gallery ? "projects projects--gallery" : "projects";
  projects.forEach((project) => {
    const item = document.createElement("li");
    const link = renderSegment({
      text: `[${project.index}] ${project.name}`,
      href: project.url,
      target: project.name,
    });
    if (gallery && project.thumb) {
      const label = document.createElement("span");
      label.className = "card__label";
      label.textContent = link.textContent;
      const frame = document.createElement("span");
      frame.className = "thumb";
      // The label already names the link, so the screenshot is decorative.
      const image = createThumbImage(project.thumb, "");
      image.addEventListener("error", () => frame.remove(), { once: true });
      frame.append(image);
      link.classList.add("card");
      link.replaceChildren(frame, label);
    }
    item.append(link);
    list.append(item);
  });
  return list;
};

/**
 * Spreads gallery cards evenly over the fewest rows: when one row cannot hold them all,
 * 6 cards become 3 + 3 rather than 5 + 1. Card width and gap come from style.css,
 * which lays the gallery out only on wide screens; elsewhere this leaves it alone.
 */
const balanceGallery = (list) => {
  const card = list.firstElementChild;
  if (!card) {
    return;
  }
  const style = getComputedStyle(list);
  const cardWidth = parseFloat(getComputedStyle(card).minWidth);
  const gap = parseFloat(style.columnGap);
  const width = list.clientWidth - parseFloat(style.paddingLeft);
  if (!(cardWidth > 0) || width <= 0) {
    return;
  }

  const count = list.children.length;
  const perRow = Math.max(1, Math.floor((width + gap) / (cardWidth + gap)));
  const rows = Math.ceil(count / perRow);
  list.style.setProperty("--columns", String(Math.ceil(count / rows)));
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

  // Only the latest gallery is on screen: `home` and reboots clear the old one first.
  const galleryObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => balanceGallery(entry.target));
  });

  const printProjects = (projects, options) => {
    const list = append(createProjectList(projects, options));
    if (options?.gallery) {
      galleryObserver.disconnect();
      galleryObserver.observe(list);
    }
    return list;
  };

  /**
   * A screenshot linked like a project name; style.css draws it in the phosphor colour.
   * A broken image leaves no trace.
   */
  const printImage = ({ src, alt, href, target }) => {
    const element = document.createElement("div");
    element.className = "line line--image";
    const link = document.createElement("a");
    link.className = "link thumb";
    link.href = href;
    link.dataset.target = target ?? "";
    const image = createThumbImage(src, alt);
    image.addEventListener("error", () => element.remove(), { once: true });
    link.append(image);
    element.append(link);
    return append(element);
  };

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
    printImage,
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
