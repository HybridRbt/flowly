import { describe, expect, test } from "vitest";
import { repoMembership, repoVerdict } from "./repos";

/** CONNECTORS-SPEC §4.3: a picked GitHub/GitLab item's repository vs a project's repositories. */
describe("repoVerdict", () => {
  test("a repository of the project is a member, whatever the case", () => {
    expect(repoVerdict("acme/web", ["acme/web", "other/app"])).toBe("member");
    expect(repoVerdict("Acme/Web", ["acme/web"])).toBe("member");
    // GitLab paths keep their nested groups.
    expect(repoVerdict("group/sub/proj", ["group/sub/proj"])).toBe("member");
  });

  test("a repository the project does not have is foreign", () => {
    expect(repoVerdict("hybrid/paseo-sync", ["jasprw/flowly"])).toBe("foreign");
    expect(repoVerdict("acme/web ", ["acme/other"])).toBe("foreign");
  });

  test("an empty container or an empty repository list cannot be judged and never warns", () => {
    expect(repoVerdict("", ["acme/web"])).toBe("unknown");
    expect(repoVerdict("   ", ["acme/web"])).toBe("unknown");
    expect(repoVerdict("acme/web", [])).toBe("unknown");
  });
});

/** CONNECTORS-SPEC §4.3: a repository vs a project, and the other projects that have it. */
describe("repoMembership", () => {
  const project = { id: "p", primaryPath: "/p" };
  const others = [
    { id: "p", primaryPath: "/p", title: "Project", archivedAt: null },
    { id: "q", primaryPath: "/q", title: "Other", archivedAt: null },
    { id: "r", primaryPath: "/r", title: "Gone", archivedAt: "2026-11-05T00:00:00.000Z" },
  ];

  test("a member stays silent; a foreign names the projects that have it", async () => {
    const reposOf = async (root: string) => (root === "/p" ? ["jasprw/flowly"] : root === "/q" ? ["acme/web"] : []);
    expect(await repoMembership("jasprw/flowly", project, others, "https://github.com", reposOf)).toEqual({ state: "member", owners: [] });
    expect(await repoMembership("acme/web", project, others, "https://github.com", reposOf)).toEqual({ state: "foreign", owners: [{ id: "q", title: "Other" }] });
    expect(await repoMembership("acme/web", project, [], "https://github.com", reposOf)).toEqual({ state: "foreign", owners: [] });
  });

  test("no repositories on the host cannot be judged; an archived project is never an owner", async () => {
    const empty = async () => [] as string[];
    expect(await repoMembership("acme/web", project, others, "https://github.com", empty)).toEqual({ state: "unknown", owners: [] });
    const onlyArchived = async (root: string) => (root === "/r" ? ["acme/web"] : []);
    expect(await repoMembership("acme/web", project, others, "https://github.com", onlyArchived)).toEqual({ state: "unknown", owners: [] });
  });
});
