export type RepositoryProvider = "github" | "gitlab" | "forgejo" | "gitea";
export type LanguageUnit = "bytes" | "percent";

export interface RepositoryOptions {
  repo: string;
  provider?: RepositoryProvider;
  apiBase?: string;
}

export interface Repository {
  url: string;
  name: string;
  provider: RepositoryProvider;
  languagesUrl: string;
  unit: LanguageUnit;
}

export interface RepositoryLanguages {
  unit: LanguageUnit;
  languages: { language: string; value: number; share: number }[];
}

function httpsUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Repository and API URLs must use HTTPS without credentials, query, or fragment.",
    );
  }
  return url;
}

export function resolveRepository({
  repo,
  provider,
  apiBase,
}: RepositoryOptions): Repository {
  const url = httpsUrl(repo);
  const segments = url.pathname
    .replace(/\/$/, "")
    .slice(1)
    .split("/")
    .map(decodeURIComponent);
  if (segments.some((segment) => !segment || /[/\\]/.test(segment))) {
    throw new Error(
      "Expected a repository URL with an owner/group and repository name.",
    );
  }
  segments[segments.length - 1] = segments[segments.length - 1].replace(
    /\.git$/,
    "",
  );
  const name = segments.join("/");
  const detected = {
    "github.com": "github",
    "gitlab.com": "gitlab",
    "codeberg.org": "forgejo",
  } as const;
  const resolvedProvider =
    provider ?? detected[url.hostname as keyof typeof detected];
  if (!["github", "gitlab", "forgejo", "gitea"].includes(resolvedProvider)) {
    throw new Error(
      "Set provider to github, gitlab, forgejo, or gitea for this repository host.",
    );
  }
  if (
    segments.length < 2 ||
    (resolvedProvider !== "gitlab" && segments.length !== 2) ||
    !segments[segments.length - 1]
  ) {
    throw new Error(
      "Expected an owner/repository path (GitLab also supports nested groups).",
    );
  }

  const defaultBase =
    resolvedProvider === "github"
      ? url.hostname === "github.com"
        ? "https://api.github.com"
        : `${url.origin}/api/v3`
      : `${url.origin}/api/${resolvedProvider === "gitlab" ? "v4" : "v1"}`;
  const base = httpsUrl(apiBase ?? defaultBase).href.replace(/\/$/, "");
  const path =
    resolvedProvider === "gitlab"
      ? `projects/${encodeURIComponent(name)}`
      : `repos/${segments.map(encodeURIComponent).join("/")}`;

  return {
    url: `${url.origin}/${segments.map(encodeURIComponent).join("/")}`,
    name,
    provider: resolvedProvider,
    languagesUrl: `${base}/${path}/languages`,
    unit: resolvedProvider === "gitlab" ? "percent" : "bytes",
  };
}

/** Preserve the source unit; GitLab percentages are not fabricated byte counts. */
export function normalizeLanguages(
  data: unknown,
  unit: LanguageUnit,
): RepositoryLanguages {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Expected a language-to-number object.");
  }
  const entries = Object.entries(data);
  for (const [language, value] of entries) {
    if (
      !language.trim() ||
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      (unit === "percent" && value > 100)
    ) {
      throw new Error("Invalid repository language statistics.");
    }
  }
  const values = entries as [string, number][];
  const total = values.reduce((sum, [, value]) => sum + value, 0);
  if (!Number.isFinite(total) || (unit === "percent" && total > 100.1)) {
    throw new Error("Invalid repository language total.");
  }
  return {
    unit,
    languages: values
      .filter(([, value]) => value > 0)
      .map(([language, value]) => ({
        language,
        value,
        share: unit === "percent" ? value : (value / total) * 100,
      }))
      .sort(
        (a, b) => b.share - a.share || a.language.localeCompare(b.language),
      ),
  };
}

// Share in-flight requests across repeated MDX uses and localized static pages.
const requests = new Map<string, Promise<RepositoryLanguages>>();

export function fetchRepositoryLanguages(
  repository: Repository,
  token?: string,
): Promise<RepositoryLanguages> {
  const key = JSON.stringify([repository.languagesUrl, repository.unit, token]);
  let request = requests.get(key);
  if (!request) {
    request = (async () => {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) {
        if (repository.provider === "gitlab") headers["PRIVATE-TOKEN"] = token;
        else headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(repository.languagesUrl, {
        headers,
        signal: AbortSignal.timeout(8000),
        // Do not forward private repository credentials through API redirects.
        redirect: "error",
        credentials: "omit",
      });
      if (!response.ok) {
        throw new Error(
          `Repository language API returned HTTP ${response.status}.`,
        );
      }
      return normalizeLanguages(await response.json(), repository.unit);
    })();
    requests.set(key, request);
  }
  return request;
}
