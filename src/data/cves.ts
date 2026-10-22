export interface CvePreview {
  title: string;
  summary: string;
  lang?: string;
}

// Checked-in English snapshots; no build-time or runtime API requests.
// Official titles and paraphrased summaries verified on 2026-10-22.
export const cvePreviews: Readonly<Partial<Record<string, CvePreview>>> = {
  // https://cveawg.mitre.org/api/cve/CVE-2026-109618
  "CVE-2026-109618": {
    title: "RCE via OOM corruption",
    summary:
      "PHP uses longjmp() to abort requests on out-of-memory errors, which can leave request " +
      "memory uninitialized in some contexts. Cleanup may then read that memory or use it to " +
      "make control-flow decisions, potentially allowing remote code execution.",
    lang: "en",
  },
  // https://cveawg.mitre.org/api/cve/CVE-2026-109619
  "CVE-2026-109619": {
    title: "RCE via stale global state",
    summary:
      "PHP global state can retain pointers to freed request memory when it is not correctly " +
      "reset. Subsequent requests may read or branch on this stale state before it is fully " +
      "initialized, potentially allowing remote code execution.",
    lang: "en",
  },
};
