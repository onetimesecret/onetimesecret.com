// @vitest-environment node

import { rejects } from "node:assert/strict";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RepositoryProvider } from "@/utils/repository";
import { resolveRepository } from "@/utils/repository";
import { normalizeRepositoryCommits as normalize } from "@/utils/repository-commits";

const date = "2026-10-22T15:52:09+02:00";
const iso = "2026-10-22T13:52:09.000Z";
const sha = "ddd0f15ae83993f5cb66a927a28673882e99100b";
const tip = { commit: { committer: { date } } };
const gitlabTip = { id: sha, committed_date: date };
const providers = ["github", "gitlab", "forgejo", "gitea"] as const;
const source = (provider: RepositoryProvider = "github", apiBase?: string) =>
  resolveRepository({
    repo: `https://${provider}.example/team/project`,
    provider,
    apiBase,
  });
const response = (data: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(data), { status, headers });

describe("normalizeRepositoryCommits", () => {
  it("normalizes dates without mutating pinned data", () => {
    const input = { count: 47, latestCommitAt: date };
    expect(normalize(input)).toEqual({ count: 47, latestCommitAt: iso });
    expect(input.latestCommitAt).toBe(date);
    expect(normalize({ count: null, latestCommitAt: null })).toEqual({
      count: null,
      latestCommitAt: null,
    });
    expect(normalize({ count: 0, latestCommitAt: null }).count).toBe(0);
    expect(
      normalize({ count: Number.MAX_SAFE_INTEGER, latestCommitAt: iso }).count,
    ).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("rejects invalid shapes and counts rather than inventing zeros", () => {
    for (const input of [null, undefined, [], true, "47", {}, { count: 1 }]) {
      expect(() => normalize(input)).toThrow(/Invalid repository commit/);
    }
    for (const count of [
      undefined,
      "47",
      -1,
      1.5,
      NaN,
      Infinity,
      2 ** 53,
      {},
      false,
    ]) {
      expect(() => normalize({ count, latestCommitAt: null })).toThrow();
    }
  });

  it("accepts leap dates and rejects invalid or non-ISO timestamps", () => {
    expect(
      normalize({ count: null, latestCommitAt: "2024-02-29T12:00:00Z" }),
    ).toEqual({
      count: null,
      latestCommitAt: "2024-02-29T12:00:00.000Z",
    });
    for (const latestCommitAt of [
      undefined,
      123,
      {},
      "",
      "yesterday",
      "2026-10-22",
      "2026-10-22T12:00:00",
      "2026-02-29T12:00:00Z",
      "2026-04-31T12:00:00Z",
      "2026-00-01T12:00:00Z",
      "2026-10-22T25:00:00Z",
      "2026-10-22T12:60:00Z",
    ]) {
      expect(() => normalize({ count: 1, latestCommitAt })).toThrow();
    }
  });
});

describe("fetchRepositoryCommits", () => {
  const originalFetch = globalThis.fetch;
  let load: typeof import("@/utils/repository-commits").fetchRepositoryCommits;
  let fetchMock: ReturnType<
    typeof vi.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>
  >;
  let controller: AbortController;

  function replies(...items: Response[]): void {
    fetchMock.mockImplementation(async () => {
      const next = items.shift();
      if (!next) throw new Error("Unexpected request");
      return next;
    });
  }

  beforeEach(async () => {
    vi.resetModules();
    ({ fetchRepositoryCommits: load } =
      await import("@/utils/repository-commits"));
    fetchMock = vi
      .fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
      .mockImplementation(async () => response([tip]));
    globalThis.fetch = fetchMock;
    controller = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("gets GitHub's last page count and the committer date, ignoring relation order", async () => {
    const repo = source("github", "https://api.example/custom");
    const base = repo.languagesUrl.replace(/\/languages$/, "");
    replies(
      response([{ ...tip, author: { date: "2000-01-01T00:00:00Z" } }], 200, {
        Link:
          `<${base}/commits?per_page=1&page=47>; rel="last", ` +
          `<${base}/commits?per_page=1&page=2>; rel="next"`,
      }),
    );
    expect(await load(repo)).toEqual({ count: 47, latestCommitAt: iso });
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${base}/commits?per_page=1&page=1`,
    );
  });

  it("counts a single GitHub commit without pagination links", async () => {
    expect(await load(source())).toEqual({ count: 1, latestCommitAt: iso });
  });

  it("keeps GitHub's date but no count when only a next link is available", async () => {
    replies(
      response([tip], 200, {
        Link: '<https://api.example/commits?page=2>; rel="next"',
      }),
    );
    expect(await load(source())).toEqual({ count: null, latestCommitAt: iso });
  });

  it.each(["0", "-1", "1.5", "9007199254740992", "unknown"])(
    "rejects an invalid GitHub last page: %s",
    async (page) => {
      replies(
        response([tip], 200, {
          Link: `<https://api.example/commits?per_page=1&page=${page}>; rel="last"`,
        }),
      );
      await rejects(load(source()), /Invalid repository commit/);
    },
  );

  it.each(["forgejo", "gitea"] as const)(
    "fetches %s's actual default branch and total",
    async (provider) => {
      const repo = source(provider);
      const base = repo.languagesUrl.replace(/\/languages$/, "");
      replies(
        response({ default_branch: "release/next & café", empty: false }),
        response([tip], 200, { "X-Total-Count": "47", "X-Total": "99" }),
      );
      expect(await load(repo)).toEqual({ count: 47, latestCommitAt: iso });
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        base,
        `${base}/commits?sha=release%2Fnext%20%26%20caf%C3%A9&limit=1&page=1` +
          "&stat=false&files=false&verification=false",
      ]);
    },
  );

  it.each(["47", null])(
    "uses legacy totals or an unavailable count: %s",
    async (total) => {
      replies(
        response({ default_branch: "main" }),
        response([tip], 200, total === null ? {} : { "X-Total": total }),
      );
      expect(await load(source("gitea"))).toEqual({
        count: total === null ? null : 47,
        latestCommitAt: iso,
      });
    },
  );

  it.each(["", "0", "-1", "1.5", "47x", "9007199254740992"])(
    "rejects malformed forge totals: %s",
    async (total) => {
      replies(
        response({ default_branch: "main" }),
        response([tip], 200, { "X-Total-Count": total, "X-Total": "47" }),
      );
      await rejects(load(source("forgejo")), /Invalid repository commit/);
    },
  );

  it("does not guess a branch when metadata is missing or malformed", async () => {
    for (const metadata of [
      [],
      null,
      {},
      { default_branch: " " },
      { empty: "true" },
    ]) {
      replies(response(metadata));
      await rejects(
        load(source("gitea"), JSON.stringify(metadata)),
        /Invalid repository commit/,
      );
    }
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("rejects failed metadata requests without attempting commits", async () => {
    replies(response({ message: "private" }, 403));
    await rejects(load(source("forgejo")), {
      message: "Repository commit API returned HTTP 403.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("pins GitLab sequence to the default branch's returned SHA", async () => {
    const repo = resolveRepository({
      repo: "https://gitlab.com/group/sub/project",
    });
    const base = repo.languagesUrl.replace(/\/languages$/, "");
    replies(response([gitlabTip]), response({ count: 47 }));
    expect(await load(repo)).toEqual({ count: 47, latestCommitAt: iso });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${base}/repository/commits?per_page=1`,
      `${base}/repository/commits/${sha}/sequence?first_parent=false`,
    ]);
  });

  it.each([403, 404, 409, 500])(
    "retains GitLab's date on sequence HTTP %s",
    async (status) => {
      replies(response([gitlabTip]), response({ message: "private" }, status));
      expect(await load(source("gitlab"))).toEqual({
        count: null,
        latestCommitAt: iso,
      });
    },
  );

  it("retains GitLab's date on malformed or unreachable sequence responses", async () => {
    for (const count of [undefined, "47", 0, -1, 1.5, 2 ** 53]) {
      replies(response([gitlabTip]), response({ count }));
      expect(await load(source("gitlab"), String(count))).toEqual({
        count: null,
        latestCommitAt: iso,
      });
    }
    replies(response([gitlabTip]), new Response("not JSON"));
    expect((await load(source("gitlab"), "bad-json")).count).toBeNull();
    replies(response([gitlabTip]));
    expect((await load(source("gitlab"), "network")).count).toBeNull();
  });

  it.each([
    "HEAD",
    "abcdef",
    "abcdefg",
    "a".repeat(65),
    "../private?token=secret",
  ])(
    "rejects invalid GitLab SHAs before requesting a sequence: %s",
    async (id) => {
      replies(response([{ ...gitlabTip, id }]));
      await rejects(load(source("gitlab")), /Invalid repository commit/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each(providers)(
    "recognizes confirmed empty %s lists and explicit empty conflicts",
    async (provider) => {
      const forge = provider === "forgejo" || provider === "gitea";
      for (const status of [200, 409]) {
        const list =
          status === 200 ? [] : { message: "Git Repository is empty." };
        replies(
          ...(forge ? [response({ default_branch: "main" })] : []),
          response(list, status),
        );
        expect(await load(source(provider), String(status))).toEqual({
          count: 0,
          latestCommitAt: null,
        });
      }
    },
  );

  it("recognizes explicit empty forge metadata without requesting commits", async () => {
    replies(response({ empty: true }));
    expect(await load(source("forgejo"))).toEqual({
      count: 0,
      latestCommitAt: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 404, 409, 429, 500])(
    "does not swallow list HTTP %s or leak secrets",
    async (status) => {
      const token = "synthetic-private-token";
      replies(
        new Response(JSON.stringify({ message: `private ${token}` }), {
          status,
          statusText: token,
        }),
      );
      await rejects(load(source(), token), {
        message: `Repository commit API returned HTTP ${status}.`,
      });
    },
  );

  it("rejects unverified empty conflicts, including invalid JSON", async () => {
    for (const body of [
      "not JSON",
      '"Repository is empty."',
      '{"message":"not empty"}',
    ]) {
      replies(new Response(body, { status: 409 }));
      await rejects(load(source(), body), {
        message: "Repository commit API returned HTTP 409.",
      });
    }
  });

  it("rejects malformed list shapes and dates", async () => {
    for (const data of [
      {},
      null,
      [tip, tip],
      [null],
      [{}],
      [{ commit: { committer: { date: "bad" } } }],
    ]) {
      replies(response(data));
      await rejects(
        load(source(), JSON.stringify(data)),
        /Invalid repository commit/,
      );
    }
    replies(new Response("not JSON"));
    await rejects(load(source(), "bad-json"), /Invalid repository commit/);
  });

  it.each(providers)(
    "reuses shared secure request options for %s",
    async (provider) => {
      const repo = source(provider);
      const token = "synthetic-token";
      if (provider === "gitlab")
        replies(response([gitlabTip]), response({ count: 47 }));
      if (provider === "forgejo" || provider === "gitea") {
        replies(response({ default_branch: "main" }), response([tip]));
      }
      await load(repo, token);
      for (const [, options] of fetchMock.mock.calls) {
        expect(options).toEqual({
          headers: {
            Accept: "application/json",
            ...(provider === "gitlab"
              ? { "PRIVATE-TOKEN": token }
              : { Authorization: `Bearer ${token}` }),
          },
          signal: controller.signal,
          redirect: "error",
          credentials: "omit",
        });
      }
      expect(AbortSignal.timeout).toHaveBeenCalledWith(8000);
    },
  );

  it("shares in-flight and successful promises for equivalent repository objects", async () => {
    let respond!: (value: Response) => void;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        respond = resolve;
      }),
    );
    const repo = source();
    const first = load(repo, "synthetic-token");
    expect(load({ ...repo }, "synthetic-token")).toBe(first);
    respond(response([tip]));
    await first;
    expect(load(repo, "synthetic-token")).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("isolates cache by URL, provider, and token", async () => {
    const repo = source();
    const variants = [
      [repo, undefined],
      [repo, "a"],
      [repo, "b"],
      [source("github", "https://api.example/custom"), "a"],
      [{ ...repo, provider: "gitlab" }, "a"],
    ] satisfies [typeof repo, string | undefined][];
    const requests = variants.map(([repository, token]) =>
      load(repository, token),
    );
    await Promise.allSettled(requests);
    expect(new Set(requests).size).toBe(5);
    variants.forEach(([repository, token], index) => {
      expect(load(repository, token)).toBe(requests[index]);
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("sanitizes transport errors and caches failures", async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error("private synthetic-token");
    });
    const repo = source();
    const first = load(repo, "synthetic-token");
    await rejects(first, { message: "Repository commit API request failed." });
    expect(load({ ...repo }, "synthetic-token")).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
