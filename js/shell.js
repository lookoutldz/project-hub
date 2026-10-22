export const tokenize = (input) => String(input ?? "").trim().split(/\s+/).filter(Boolean);

export const parse = (input) => {
  const [name = "", ...args] = tokenize(input);
  return { name: name.toLowerCase(), args };
};

export const MAX_QUERY_COMMAND_LENGTH = 200;

/** Reads the command from a share link such as `?cmd=ls+-l`; returns "" when absent. */
export const commandFromQuery = (search) => {
  const value = new URLSearchParams(search).get("cmd") ?? "";
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, MAX_QUERY_COMMAND_LENGTH);
};

export const findCommand = (registry, name) => {
  const key = String(name ?? "").toLowerCase();
  return registry.find((command) => command.name === key || command.aliases?.includes(key));
};

export const commonPrefix = (values) => {
  if (!values.length) {
    return "";
  }

  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
    }
  }
  return prefix;
};

const completeWord = (prefix, options) => {
  const lower = prefix.toLowerCase();
  const matches = [...new Set(options)].filter((option) => option.startsWith(lower)).sort();
  if (!matches.length) {
    return { word: prefix, candidates: [], unique: false };
  }
  if (matches.length === 1) {
    return { word: matches[0], candidates: [], unique: true };
  }

  const shared = commonPrefix(matches);
  return { word: shared.length > prefix.length ? shared : prefix, candidates: matches, unique: false };
};

/**
 * Tab completion for the first word (command name) and the first argument.
 * Returns the new input value and, when ambiguous, the candidates to list.
 */
export const complete = (input, registry) => {
  const value = String(input ?? "");
  const tokens = tokenize(value);
  const endsWithSpace = /\s$/.test(value);

  if (!tokens.length) {
    return {
      value,
      candidates: registry.filter((command) => !command.hidden).map((command) => command.name),
    };
  }

  if (tokens.length === 1 && !endsWithSpace) {
    const names = registry.flatMap((command) => [command.name, ...(command.aliases ?? [])]);
    const { word, candidates, unique } = completeWord(tokens[0], names);
    return { value: unique ? `${word} ` : word, candidates };
  }

  const command = findCommand(registry, tokens[0]);
  const argIndex = endsWithSpace ? tokens.length - 1 : tokens.length - 2;
  if (!command?.complete || argIndex !== 0) {
    return { value, candidates: [] };
  }

  const prefix = endsWithSpace ? "" : tokens[1];
  const { word, candidates, unique } = completeWord(prefix, command.complete());
  if (word === prefix && !unique) {
    return { value, candidates };
  }
  return { value: `${tokens[0]} ${word}${unique ? " " : ""}`, candidates };
};
