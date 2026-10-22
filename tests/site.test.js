import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { PROJECTS } from "../js/projects.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

// projects.js is the single source of truth; the static HTML and short links must match it.
test("index.html lists every project as a real link in order", async () => {
  const html = await read("index.html");
  const links = [...html.matchAll(/<a class="link" href="([^"]+)" data-target="([^"]+)">\[(\d+)\] ([^<]+)<\/a>/g)].map(
    ([, href, target, index, name]) => ({ href, target, index: Number(index), name })
  );

  assert.deepEqual(
    links,
    PROJECTS.map((project) => ({ href: project.url, target: project.name, index: project.index, name: project.name }))
  );
  assert.match(html, new RegExp(`Mounting ${PROJECTS.length} routes`));
  assert.match(html, new RegExp(`>${PROJECTS.length} routes<`));
});

test("_redirects has a short link for every project name and alias", async () => {
  const rules = new Map(
    (await read("_redirects"))
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.trim().split(/\s+/))
      .map(([from, to, status]) => [from, { to, status }])
  );

  PROJECTS.forEach((project) => {
    [project.name, ...project.aliases].forEach((key) => {
      assert.deepEqual(rules.get(`/${key}`), { to: project.url, status: "302" }, key);
    });
  });
});
