// @vitest-environment node

import type { RepositoryOptions, RepositoryProvider } from "@/utils/repository";
import {
  normalizeLanguages as normalize,
  requestCacheKey,
  resolveRepository as resolve,
} from "@/utils/repository";
import { rejects } from "node:assert/strict";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repo = "https://github.com/team/project";
const endpoint = "https://api.github.com/repos/team/project/languages";
const providers = ["github", "gitlab", "forgejo", "gitea"] as const;
const units = ["bytes", "percent"] as const;
type ProviderCase = [string, RepositoryOptions, RepositoryProvider, string];
// prettier-ignore
const cases: ProviderCase[] = [
  ["GitHub", { repo }, "github", endpoint],
  ["GitLab nested groups", { repo: "https://gitlab.com/group/sub/project" }, "gitlab",
    "https://gitlab.com/api/v4/projects/group%2Fsub%2Fproject/languages"],
  ["Codeberg", { repo: "https://codeberg.org/team/project" }, "forgejo",
    "https://codeberg.org/api/v1/repos/team/project/languages"],
  ["Forgejo", { repo: "https://forge.example:8443/team/project", provider: "forgejo" },
    "forgejo", "https://forge.example:8443/api/v1/repos/team/project/languages"],
  ["Gitea", { repo: "https://gitea.example/team/project", provider: "gitea" }, "gitea",
    "https://gitea.example/api/v1/repos/team/project/languages"],
  ["GitHub Enterprise", { repo: "https://github.example/team/project", provider: "github" },
    "github", "https://github.example/api/v3/repos/team/project/languages"],
  ["self-hosted GitLab", { repo: "https://gitlab.example/group/sub/project", provider: "gitlab" },
    "gitlab", "https://gitlab.example/api/v4/projects/group%2Fsub%2Fproject/languages"],
];
// prettier-ignore
const encodedCases: [string, string, string, string][] = [
  ["https://github.com/my%20team/caf%C3%A9%25.git/", "my team/café%",
    "https://github.com/my%20team/caf%C3%A9%25",
    "https://api.github.com/repos/my%20team/caf%C3%A9%25/languages"],
  ["https://gitlab.com/my%20group/sub%25/caf%C3%A9.git", "my group/sub%/café",
    "https://gitlab.com/my%20group/sub%25/caf%C3%A9",
    "https://gitlab.com/api/v4/projects/my%20group%2Fsub%25%2Fcaf%C3%A9/languages"],
  ["https://github.com/team/project%252Fname", "team/project%2Fname",
    "https://github.com/team/project%252Fname",
    "https://api.github.com/repos/team/project%252Fname/languages"],
];

describe("resolveRepository", () => {
  it.each(providers)("honors provider and API overrides: %s", (provider) => {
    const apiBase = "https://api.example/custom/";
    const result = resolve({ repo, provider, apiBase });
    const path =
      provider === "gitlab" ? "projects/team%2Fproject" : "repos/team/project";
    expect(result.url).toBe(repo);
    expect(result.name).toBe("team/project");
    expect(result.provider).toBe(provider);
    expect(result.languagesUrl).toBe(`${apiBase}${path}/languages`);
  });

  it.each(["unknown.example", "github.com.example", "www.github.com"])(
    "requires a provider for %s",
    (host) => {
      for (const apiBase of [undefined, "https://api.example/v1"]) {
        const options = { repo: `https://${host}/team/project`, apiBase };
        expect(() => resolve(options)).toThrow("Set provider");
      }
    },
  );

  it("rejects an unsupported runtime provider", () => {
    const provider = "bitbucket" as unknown as RepositoryProvider;
    expect(() => resolve({ repo, provider })).toThrow("Set provider");
  });

  it.each(encodedCases)(
    "normalizes and encodes once: %s",
    (input, name, url, languagesUrl) => {
      expect(resolve({ repo: input })).toMatchObject({
        name,
        url,
        languagesUrl,
      });
    },
  );

  it.each([
    "http://github.com/team/project",
    "ftp://github.com/team/project",
    "https://user@github.com/team/project",
    "https://user:password@github.com/team/project",
    `${repo}?access_token=synthetic-token`,
    `${repo}#fragment`,
    "/team/project",
    "not a URL",
  ])("rejects unsafe repository and API URLs: %s", (input) => {
    expect(() => resolve({ repo: input })).toThrow();
    expect(() => resolve({ repo, apiBase: input })).toThrow();
  });

  it.each([
    "https://github.com/",
    "https://github.com/team",
    "https://github.com/team/",
    `${repo}/extra`,
    "https://codeberg.org/team/sub/project",
    "https://github.com//project",
    "https://gitlab.com/group//project",
    `${repo}//`,
    "https://github.com/team/.git",
    "https://gitlab.com/group/sub/.git",
    "https://github.com/team%2Fsub/project",
    `${repo}%2fname`,
    `${repo}%5Cname`,
    `${repo}%ZZ`,
    `${repo}%E0%A4`,
  ])("rejects invalid paths: %s", (input) => {
    expect(() => resolve({ repo: input })).toThrow();
  });

  it.each([`${repo}%ZZ`, `${repo}%E0%A4`])(
    "reports malformed escapes as invalid paths: %s",
    (input) => {
      expect(() => resolve({ repo: input })).toThrow(
        "Expected a repository URL with an owner/group and repository name.",
      );
    },
  );
});

describe("requestCacheKey", () => {
  it("distinguishes tokens without retaining them", () => {
    const anonymous = requestCacheKey([endpoint]);
    const a = requestCacheKey([endpoint], "synthetic-a");
    expect(
      new Set([anonymous, a, requestCacheKey([endpoint], "synthetic-b")]).size,
    ).toBe(3);
    expect(requestCacheKey([endpoint], "synthetic-a")).toBe(a);
    expect(a).not.toContain("synthetic-a");
  });
});

describe("normalizeLanguages", () => {
  it.each(units)("preserves %s values and shares", (unit) => {
    const data = { Ruby: 12.5, TypeScript: 37.5, CSS: 0 };
    const result = normalize(data, unit);
    expect(result.unit).toBe(unit);
    expect(
      result.languages.map(({ language, value }) => [language, value]),
    ).toEqual([
      ["TypeScript", 37.5],
      ["Ruby", 12.5],
    ]);
    const shares = unit === "bytes" ? [75, 25] : [37.5, 12.5];
    expect(result.languages.map(({ share }) => share)).toEqual(shares);
    expect(data).toEqual({ Ruby: 12.5, TypeScript: 37.5, CSS: 0 });
  });

  it.each(units)("handles empty maps and %s ties", (unit) => {
    for (const data of [{}, { Ruby: 0 }, { Ruby: 0, CSS: 0 }]) {
      expect(normalize(data, unit)).toEqual({ unit, languages: [] });
    }
    const result = normalize({ Ruby: 20, CSS: 20, JavaScript: 20 }, unit);
    expect(result.languages.map(({ language }) => language)).toEqual([
      "CSS",
      "JavaScript",
      "Ruby",
    ]);
  });

  it("rejects non-map payloads and invalid entries in either unit", () => {
    const bad = ["1", null, undefined, false, {}, [], -1, NaN, Infinity];
    const nonMaps = [null, undefined, "x", 1, true, [], [["Ruby", 1]]];
    for (const unit of units) {
      for (const data of nonMaps) {
        expect(() => normalize(data, unit)).toThrow(/language-to-number/);
      }
      for (const value of bad) {
        expect(() => normalize({ Ruby: 10, CSS: value }, unit)).toThrow(
          /statistics/,
        );
      }
      for (const language of ["", " \t "]) {
        expect(() => normalize({ [language]: 1 }, unit)).toThrow(/statistics/);
      }
    }
  });

  it("enforces individual percentages and total rounding/overflow limits", () => {
    expect(normalize({ Ruby: 100 }, "percent").languages[0].share).toBe(100);
    const rounded = normalize({ Ruby: 50.05, CSS: 50.05 }, "percent");
    const shares = rounded.languages.map(({ share }) => share);
    expect(shares).toEqual([50.05, 50.05]);
    expect(rounded.languages[0].value).toBe(50.05);
    expect(() => normalize({ Ruby: 100.05 }, "percent")).toThrow(/statistics/);
    const tooMuch = { Ruby: 50.06, CSS: 50.05 };
    expect(() => normalize(tooMuch, "percent")).toThrow(/language total/);
    const overflow = { Ruby: Number.MAX_VALUE, CSS: Number.MAX_VALUE };
    expect(() => normalize(overflow, "bytes")).toThrow(/language total/);
  });
});

describe("fetchRepositoryLanguages", () => {
  const originalFetch = globalThis.fetch;
  let load: typeof import("@/utils/repository").fetchRepositoryLanguages;
  let fetchMock: ReturnType<
    typeof vi.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>
  >;
  let controller: AbortController;
  let source: ReturnType<typeof resolve>;

  beforeEach(async () => {
    vi.resetModules();
    ({ fetchRepositoryLanguages: load } = await import("@/utils/repository"));
    fetchMock = vi
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
      .mockImplementation(async () => new Response('{"Ruby":25}'));
    globalThis.fetch = fetchMock;
    controller = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    source = resolve({ repo });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it.each(cases)(
    "resolves and fetches %s safely",
    async (_label, options, provider, languagesUrl) => {
      const token = "synthetic-private-token";
      const repository = resolve(options);
      const unit = provider === "gitlab" ? "percent" : "bytes";
      expect(repository).toMatchObject({
        url: options.repo,
        provider,
        unit,
        languagesUrl,
      });
      const result = await load(repository, token);
      const header = provider === "gitlab" ? "PRIVATE-TOKEN" : "Authorization";
      const auth = provider === "gitlab" ? token : `Bearer ${token}`;
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(languagesUrl, {
        headers: { Accept: "application/json", [header]: auth },
        signal: controller.signal,
        redirect: "error",
        credentials: "omit",
      });
      expect(AbortSignal.timeout).toHaveBeenCalledTimes(1);
      expect(AbortSignal.timeout).toHaveBeenCalledWith(8000);
      expect(result.unit).toBe(unit);
      expect(result.languages).toEqual([
        { language: "Ruby", value: 25, share: unit === "percent" ? 25 : 100 },
      ]);
      expect(JSON.stringify({ repository, result })).not.toContain(token);
    },
  );

  it.each([undefined, ""])(
    "omits auth (%s) and fetches the API override",
    async (token) => {
      const apiBase = "https://api.example/custom/";
      await load(resolve({ repo, apiBase }), token);
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiBase}repos/team/project/languages`,
        expect.objectContaining({ headers: { Accept: "application/json" } }),
      );
    },
  );

  it("shares in-flight and successful promises for equivalent repository objects", async () => {
    let respond!: (response: Response) => void;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        respond = resolve;
      }),
    );
    const first = load(source, "synthetic-token");
    const second = load({ ...source }, "synthetic-token");
    expect(second).toBe(first);
    respond(new Response('{"Ruby":25}'));
    const result = await first;
    expect(await second).toBe(result);
    expect(load(source, "synthetic-token")).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("isolates cache by token, endpoint, and unit without logging credentials", async () => {
    const logs = (["log", "info", "warn", "error", "debug"] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => {}),
    );
    const variants = [
      [source, undefined],
      [source, "synthetic-a"],
      [source, "synthetic-b"],
      [resolve({ repo: `${repo}-other` }), "synthetic-a"],
      [{ ...source, unit: "percent" }, "synthetic-a"],
    ] satisfies [typeof source, string | undefined][];
    const requests = variants.map(([value, token]) => load(value, token));
    const results = await Promise.all(requests);
    expect(new Set(requests).size).toBe(5);
    expect(results[4].languages[0].share).toBe(25);
    variants.forEach(([value, token], index) => {
      expect(load(value, token)).toBe(requests[index]);
      expect(fetchMock.mock.calls[index][0]).toBe(value.languagesUrl);
      const headers = fetchMock.mock.calls[index][1]?.headers;
      expect(headers).toEqual({
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      });
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404, 429, 500])(
    "reports HTTP %s without leaking body/auth",
    async (status) => {
      const token = "synthetic-private-token";
      const response = new Response(`private response: ${token}`, {
        status,
        statusText: token,
      });
      fetchMock.mockResolvedValue(response);
      await rejects(load(source, token), {
        message: `Repository language API returned HTTP ${status}.`,
      });
      expect(response.bodyUsed).toBe(false);
    },
  );

  it("propagates network failures and caches rejected promises", async () => {
    const error = new TypeError("Network unavailable");
    fetchMock.mockImplementation(async () => {
      throw error;
    });
    const first = load(source, "synthetic-token");
    await rejects(first, (reason) => reason === error);
    const second = load({ ...source }, "synthetic-token");
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("forwards the timeout signal and propagates its abort reason", async () => {
    const error = new DOMException("Request timed out", "TimeoutError");
    fetchMock.mockReturnValue(
      new Promise<Response>((_resolve, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(controller.signal.reason),
        );
      }),
    );
    const request = load(source);
    const assertion = rejects(request, (reason) => reason === error);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
    controller.abort(error);
    await assertion;
  });

  it.each([
    ["JSON", "not JSON", SyntaxError],
    ["non-map", "[]", /language-to-number/],
    ["value", '{"Ruby":"100"}', /language statistics/],
    ["total", '{"Ruby":70,"CSS":40}', /language total/],
  ] satisfies [string, string, typeof SyntaxError | RegExp][])(
    "rejects malformed API data: %s",
    async (_label, body, error) => {
      fetchMock.mockResolvedValue(new Response(body));
      const repository = resolve({ repo: "https://gitlab.com/team/project" });
      await rejects(load(repository), error);
    },
  );
});
