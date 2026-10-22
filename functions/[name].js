// Cloudflare Pages Function for single-segment paths such as /moss or /gh.
// Short links come from js/projects.js, the same data the terminal uses;
// any other path (e.g. /robots.txt) falls through to the static file.
import { findShortLink } from "../js/projects.js";

export const onRequestGet = ({ params, next }) => {
  const project = findShortLink(params.name);
  return project ? Response.redirect(project.url, 302) : next();
};
