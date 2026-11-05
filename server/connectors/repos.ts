import { execFile } from "node:child_process";
import { remoteRepo } from "../../shared/connectors";
import type { Project } from "../../shared/model";
import { findRepos } from "../git-stats";

/**
 * Repositories of a project on a connection's host (CONNECTORS-SPEC §4.3):
 * the git remotes of the project root and its first-level child
 * repositories. Cached per root for five minutes.
 */
const CACHE_MS = 5 * 60_000;
const cache = new Map<string, { at: number; remotes: Promise<string[]> }>();

function remotes(dir: string): Promise<string[]> {
  return new Promise((resolve) => {
    execFile("git", ["-C", dir, "remote", "-v"], { timeout: 5_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } }, (error, stdout) =>
      resolve(error ? [] : stdout.split("\n").map((line) => line.split(/\s+/)[1] || "").filter(Boolean)),
    );
  });
}

async function allRemotes(root: string) {
  const repos = await findRepos(root).catch(() => [] as string[]);
  return (await Promise.all(repos.map(remotes))).flat();
}

export async function projectRepos(root: string, baseUrl: string, clock = () => Date.now()): Promise<string[]> {
  let hit = cache.get(root);
  if (!hit || clock() - hit.at > CACHE_MS) {
    hit = { at: clock(), remotes: allRemotes(root) };
    cache.set(root, hit);
  }
  const out: string[] = [];
  for (const remote of await hit.remotes) {
    const repo = remoteRepo(remote, baseUrl);
    if (repo && !out.includes(repo)) out.push(repo);
  }
  return out;
}

/** CONNECTORS-SPEC §4.3: a picked item's repository vs a project's repositories. */
export type RepoVerdict = "member" | "foreign" | "unknown";

/**
 * Whether `container` (an item's `ExternalSummary.container`) is among `repos`.
 * Case-insensitive (GitHub and GitLab paths are); an empty container or an empty
 * list can't be judged, so they stay "unknown" and never warn.
 */
export function repoVerdict(container: string, repos: readonly string[]): RepoVerdict {
  const repo = container.trim().toLowerCase();
  if (!repo || !repos.length) return "unknown";
  return repos.some((r) => r.trim().toLowerCase() === repo) ? "member" : "foreign";
}

/**
 * CONNECTORS-SPEC §4.3: `repo` vs a project's repositories, plus the other live
 * projects that have it (at most 3, the repo-check RPC's `others`). `reposOf` is
 * injectable for tests and defaults to the cached `projectRepos`.
 */
export async function repoMembership(
  repo: string,
  project: Pick<Project, "id" | "primaryPath">,
  others: readonly Pick<Project, "id" | "primaryPath" | "title" | "archivedAt">[],
  baseUrl: string,
  reposOf: (root: string, baseUrl: string) => Promise<string[]> = projectRepos,
): Promise<{ state: RepoVerdict; owners: { id: string; title: string }[] }> {
  const state = repoVerdict(repo, await reposOf(project.primaryPath, baseUrl).catch(() => []));
  if (state !== "foreign") return { state, owners: [] };
  const owners: { id: string; title: string }[] = [];
  for (const other of others) {
    if (other.id === project.id || other.archivedAt || owners.length >= 3) continue;
    if (repoVerdict(repo, await reposOf(other.primaryPath, baseUrl).catch(() => [])) === "member")
      owners.push({ id: other.id, title: other.title });
  }
  return { state, owners };
}
