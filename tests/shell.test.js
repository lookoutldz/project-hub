import assert from "node:assert/strict";
import { test } from "node:test";

import { COMMANDS } from "../js/commands.js";
import {
  MAX_QUERY_COMMAND_LENGTH,
  commandFromQuery,
  commonPrefix,
  complete,
  findCommand,
  parse,
  tokenize,
} from "../js/shell.js";

test("tokenize splits on any whitespace and drops empties", () => {
  assert.deepEqual(tokenize("  open   moss \t"), ["open", "moss"]);
  assert.deepEqual(tokenize(""), []);
});

test("parse lowercases the command name but keeps argument case", () => {
  assert.deepEqual(parse("ECHO Hello World"), { name: "echo", args: ["Hello", "World"] });
  assert.deepEqual(parse("   "), { name: "", args: [] });
});

test("findCommand matches names and aliases case-insensitively", () => {
  assert.equal(findCommand(COMMANDS, "HELP").name, "help");
  assert.equal(findCommand(COMMANDS, "neofetch").name, "fastfetch");
  assert.equal(findCommand(COMMANDS, "nope"), undefined);
});

test("commonPrefix", () => {
  assert.equal(commonPrefix(["history", "help"]), "h");
  assert.equal(commonPrefix(["the-moss"]), "the-moss");
  assert.equal(commonPrefix([]), "");
});

test("empty input lists only public commands", () => {
  const { value, candidates } = complete("", COMMANDS);
  assert.equal(value, "");
  assert.ok(candidates.includes("open"));
  assert.ok(!candidates.includes("whoami"));
});

test("unique command prefix completes with a trailing space", () => {
  assert.deepEqual(complete("op", COMMANDS), { value: "open ", candidates: [] });
  assert.deepEqual(complete("FASTF", COMMANDS), { value: "fastfetch ", candidates: [] });
});

test("ambiguous command prefix lists candidates", () => {
  const { value, candidates } = complete("h", COMMANDS);
  assert.equal(value, "h");
  assert.deepEqual(candidates, ["help", "history", "home"]);
});

test("open completes project names and aliases", () => {
  assert.deepEqual(complete("open te", COMMANDS), { value: "open terra", candidates: ["terra-echo", "terraecho"] });
  assert.deepEqual(complete("info gi", COMMANDS), { value: "info github ", candidates: [] });
  assert.deepEqual(complete("open MO", COMMANDS), { value: "open moss ", candidates: [] });

  const { value, candidates } = complete("open ", COMMANDS);
  assert.equal(value, "open ");
  assert.ok(candidates.includes("the-moss"));
});

test("theme and man complete their arguments", () => {
  assert.deepEqual(complete("theme g", COMMANDS), { value: "theme green ", candidates: [] });
  assert.deepEqual(complete("man cl", COMMANDS), { value: "man clear ", candidates: [] });
  assert.deepEqual(complete("cat .p", COMMANDS), { value: "cat .plan ", candidates: [] });
});

test("no completion for unknown commands, extra arguments or no matches", () => {
  assert.deepEqual(complete("foo b", COMMANDS), { value: "foo b", candidates: [] });
  assert.deepEqual(complete("open moss x", COMMANDS), { value: "open moss x", candidates: [] });
  assert.deepEqual(complete("open zzz", COMMANDS), { value: "open zzz", candidates: [] });
  assert.deepEqual(complete("zzz", COMMANDS), { value: "zzz", candidates: [] });
});

test("commandFromQuery decodes the cmd parameter from a share link", () => {
  assert.equal(commandFromQuery("?cmd=ls+-l"), "ls -l");
  assert.equal(commandFromQuery("?cmd=open%20moss&utm=x"), "open moss");
  assert.equal(commandFromQuery("?cmd=%20%20fastfetch%20"), "fastfetch");
  assert.equal(commandFromQuery("?cmd=echo%20a%0Ab"), "echo a b");
});

test("commandFromQuery returns empty for missing or blank commands and caps length", () => {
  assert.equal(commandFromQuery(""), "");
  assert.equal(commandFromQuery("?utm=x"), "");
  assert.equal(commandFromQuery("?cmd=+++"), "");
  assert.equal(commandFromQuery(`?cmd=echo+${"a".repeat(500)}`).length, MAX_QUERY_COMMAND_LENGTH);
});
