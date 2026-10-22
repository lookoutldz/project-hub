import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { onRequestGet } from "../functions/[name].js";
import { PROJECTS } from "../js/projects.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const request = (name) => onRequestGet({ params: { name }, next: () => "static" });

// projects.js is the single source of truth; the static HTML must match it.
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

test("every project name and alias is a 302 short link to the project", () => {
  PROJECTS.forEach((project) => {
    [project.name, ...project.aliases].forEach((slug) => {
      const response = request(slug);
      assert.equal(response.status, 302, slug);
      assert.equal(response.headers.get("location"), project.url, slug);
    });
  });
});

test("short links ignore case", () => {
  assert.equal(request("GH").headers.get("location"), "https://github.com/lookoutldz/");
});

test("other single-segment paths fall through to static files", () => {
  assert.equal(request("robots.txt"), "static");
  assert.equal(request("1"), "static");
  assert.equal(request("steamtower"), "static");
});
