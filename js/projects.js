export const PROJECTS = [
  {
    index: 1,
    name: "the-moss",
    aliases: ["moss"],
    url: "https://moss.lookoutldz.top/",
  },
  {
    index: 2,
    name: "arkvoice",
    aliases: [],
    url: "https://arkvoice.top/",
  },
  {
    index: 3,
    name: "steamtower",
    aliases: [],
    url: "https://steamtower.top/",
  },
  {
    index: 4,
    name: "github",
    aliases: ["gh"],
    url: "https://github.com/lookoutldz/",
  },
  {
    index: 5,
    name: "blog",
    aliases: ["juejin"],
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

export const displayUrl = (project) =>
  project.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export const describeTargets = (projects = PROJECTS) =>
  `targets: 1-${projects.length}, ${projects.map((project) => project.name).join(", ")}`;
