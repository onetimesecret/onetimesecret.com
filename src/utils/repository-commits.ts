import type { Repository } from "@/utils/repository";
import { requestCacheKey, requestRepositoryApi } from "@/utils/repository";

export interface RepositoryCommits {
  count: number | null;
  latestCommitAt: string | null;
}

const invalid = (): Error => new Error("Invalid repository commit statistics.");
const empty = (): RepositoryCommits => ({ count: 0, latestCommitAt: null });

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw invalid();
  return value as Record<string, unknown>;
}

export function normalizeRepositoryCommits(value: unknown): RepositoryCommits {
  const { count, latestCommitAt } = object(value);
  if (
    count !== null &&
    (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0)
  ) {
    throw invalid();
  }
  let date: string | null = null;
  if (latestCommitAt !== null) {
    if (typeof latestCommitAt !== "string") throw invalid();
    const parts =
      /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(
        latestCommitAt,
      );
    if (!parts) throw invalid();
    const [year, month, day] = parts.slice(1).map(Number);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const timestamp = Date.parse(latestCommitAt);
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > days[month - 1] ||
      !Number.isFinite(timestamp)
    ) {
      throw invalid();
    }
    date = new Date(timestamp).toISOString();
  }
  return { count, latestCommitAt: date };
}

async function json(
  repository: Repository,
  url: string,
  token?: string,
  allowEmpty = false,
): Promise<{ data: unknown; headers: Headers }> {
  let response: Response;
  try {
    response = await requestRepositoryApi(repository, url, token);
  } catch {
    // Transport errors can contain URLs or credentials; do not expose their messages.
    throw new Error("Repository commit API request failed.");
  }
  if (response.status === 409 && allowEmpty) {
    try {
      const { message } = object(await response.json());
      if (
        typeof message === "string" &&
        /^(?:git )?repository is empty[.!]?$/i.test(message)
      ) {
        return { data: [], headers: response.headers };
      }
    } catch {
      // Unrecognized conflicts retain only the status, never the response body.
    }
  }
  if (!response.ok) {
    throw new Error(`Repository commit API returned HTTP ${response.status}.`);
  }
  try {
    return { data: await response.json(), headers: response.headers };
  } catch {
    throw invalid();
  }
}

function integer(value: string): number {
  if (!/^\d+$/.test(value)) throw invalid();
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 1) throw invalid();
  return count;
}

function githubCount(headers: Headers): number | null {
  const link = headers.get("Link");
  if (!link) return 1;
  for (const match of link.matchAll(
    /<([^>]+)>\s*;\s*rel=(?:"([^"]+)"|([^;,\s]+))/g,
  )) {
    if (!(match[2] ?? match[3]).split(/\s+/).includes("last")) continue;
    let url: URL;
    try {
      url = new URL(match[1]);
    } catch {
      throw invalid();
    }
    const pageSize = url.searchParams.get("per_page");
    if (pageSize !== null && pageSize !== "1") throw invalid();
    return integer(url.searchParams.get("page") ?? "");
  }
  return null;
}

async function fetchStats(
  repository: Repository,
  token?: string,
): Promise<RepositoryCommits> {
  const base = repository.languagesUrl.replace(/\/languages$/, "");
  let url = `${base}/commits?per_page=1&page=1`;
  if (repository.provider === "gitlab") {
    url = `${base}/repository/commits?per_page=1`;
  } else if (
    repository.provider === "forgejo" ||
    repository.provider === "gitea"
  ) {
    const metadata = object((await json(repository, base, token)).data);
    if (metadata.empty === true) return empty();
    if (metadata.empty !== undefined && typeof metadata.empty !== "boolean")
      throw invalid();
    if (
      typeof metadata.default_branch !== "string" ||
      !metadata.default_branch.trim()
    ) {
      throw invalid();
    }
    const branch = encodeURIComponent(metadata.default_branch);
    url =
      `${base}/commits?sha=${branch}&limit=1&page=1` +
      "&stat=false&files=false&verification=false";
  }
  const { data, headers } = await json(repository, url, token, true);
  if (!Array.isArray(data) || data.length > 1) throw invalid();
  if (!data.length) return empty();
  const commit = object(data[0]);
  const date =
    repository.provider === "gitlab"
      ? commit.committed_date
      : object(object(commit.commit).committer).date;
  if (typeof date !== "string") throw invalid();
  const result = normalizeRepositoryCommits({
    count: null,
    latestCommitAt: date,
  });
  if (repository.provider === "gitlab") {
    if (typeof commit.id !== "string" || !/^[a-f\d]{7,64}$/i.test(commit.id))
      throw invalid();
    try {
      const sequence = await json(
        repository,
        `${base}/repository/commits/${commit.id}/sequence?first_parent=false`,
        token,
      );
      const count = object(sequence.data).count;
      if (typeof count !== "number" || count < 1) throw invalid();
      return normalizeRepositoryCommits({ ...result, count });
    } catch {
      // Older servers and restricted sequence endpoints still provide a useful tip date.
      return result;
    }
  }
  if (repository.provider === "github") result.count = githubCount(headers);
  else {
    const total = headers.get("X-Total-Count") ?? headers.get("X-Total");
    result.count = total === null ? null : integer(total);
  }
  return result;
}

// Retain rejected promises too, so localized builds do not repeatedly hit a failing API.
const requests = new Map<string, Promise<RepositoryCommits>>();

export function fetchRepositoryCommits(
  repository: Repository,
  token?: string,
): Promise<RepositoryCommits> {
  const key = requestCacheKey(
    [repository.languagesUrl, repository.provider],
    token,
  );
  let request = requests.get(key);
  if (!request) {
    request = fetchStats(repository, token);
    requests.set(key, request);
  }
  return request;
}
