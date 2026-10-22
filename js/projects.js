export const SITE_HOST = "lookoutldz.top";

export const PROJECTS = [
  {
    index: 1,
    name: "the-moss",
    aliases: ["moss"],
    summary: "a digital garden of notes and thoughts",
    url: "https://moss.lookoutldz.top/",
  },
  {
    index: 2,
    name: "terra-echo",
    aliases: ["terraecho"],
    summary: "a music archive from the world of Terra",
    url: "https://terraecho.top/",
  },
  {
    index: 3,
    name: "github",
    aliases: ["gh"],
    summary: "source code and side projects",
    url: "https://github.com/lookoutldz/",
  },
  {
    index: 4,
    name: "blog",
    aliases: ["juejin"],
    summary: "technical writing on Juejin",
    url: "https://juejin.cn/user/4341288062690398",
  },
];

export const findProject = (query, projects = PROJECTS) => {
  const key = String(query ?? "").trim().toLowerCase();
  if (!key) {
    return undefined;
  }

  return projects.find(
    (project) =>
      String(project.index) === key ||
      project.name === key ||
      project.aliases.includes(key)
  );
};

/**
 * Short links (`lookoutldz.top/moss`) resolve by name or alias only, never by index,
 * so a shared link keeps pointing at the same project when the list is reordered.
 */
export const findShortLink = (slug, projects = PROJECTS) => {
  const key = String(slug ?? "").trim().toLowerCase();
  return projects.find((project) => project.name === key || project.aliases.includes(key));
};

export const displayUrl = (project) => project.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export const describeTargets = (projects = PROJECTS) =>
  `targets: 1-${projects.length}, ${projects.map((project) => project.name).join(", ")}`;
