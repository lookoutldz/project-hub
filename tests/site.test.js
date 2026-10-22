import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { onRequestGet } from "../functions/[name].js";
import { PROJECTS } from "../js/projects.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const request = (name) => onRequestGet({ params: { name }, next: () => "static" });

// js/projects.js is the only place projects are defined; the page must not repeat them.
test("index.html does not hardcode the project list", async () => {
  const html = await read("index.html");
  assert.doesNotMatch(html, /data-target=|class="link"|routes/);
  PROJECTS.forEach((project) => {
    assert.ok(!html.includes(`[${project.index}] ${project.name}`), project.name);
  });
});

test("every executable script opts out of Cloudflare Rocket Loader", async () => {
  const html = await read("index.html");
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map(([tag]) => tag);
  const executable = scripts.filter((tag) => !tag.includes("application/ld+json"));
  assert.ok(executable.length > 0);
  executable.forEach((tag) => assert.match(tag, /data-cfasync="false"/, tag));
});

test("the CSP allows Cloudflare Web Analytics and nothing else off-site", async () => {
  const headers = await read("_headers");
  const csp = headers.match(/Content-Security-Policy: (.+)/)[1];
  const directives = Object.fromEntries(
    csp.split(";").map((part) => part.trim().split(/\s+/)).map(([name, ...values]) => [name, values])
  );

  assert.deepEqual(directives["script-src"], ["'self'", "https://static.cloudflareinsights.com"]);
  assert.deepEqual(directives["connect-src"], ["'self'", "https://cloudflareinsights.com"]);
  assert.deepEqual(directives["default-src"], ["'self'"]);
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
