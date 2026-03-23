import type { ScrapeResult, StepResult, CompanySearchResult } from "./types";
import type { SignalExtraction } from "./signalSchema";
import { SIGNAL_SCHEMA } from "./signalSchema";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

function getHeaders(): Record<string, string> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY is not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function timed<T>(
  label: string,
  fn: () => Promise<T>
): Promise<StepResult<T>> {
  const start = Date.now();
  try {
    const data = await fn();
    const durationMs = Date.now() - start;
    console.log(`[${label}] ${durationMs}ms — success`);
    return { data, durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[${label}] ${durationMs}ms — failed: ${error}`);
    return { data: null, durationMs, error };
  }
}

// --- Scrape ---

export async function scrapeJobPage(
  url: string
): Promise<StepResult<ScrapeResult>> {
  return timed("scrape", async () => {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Firecrawl scrape failed (${res.status}): ${body}`);
    }

    const json = await res.json();
    const doc = json.data;

    if (!doc?.markdown) {
      throw new Error("Scrape returned no markdown content");
    }

    return {
      markdown: doc.markdown,
      title: doc.metadata?.title || "",
      sourceUrl: doc.metadata?.sourceURL || url,
    };
  });
}

// --- Search ---

export async function searchCompanyContext(
  companyName: string,
  roleTitle: string
): Promise<StepResult<CompanySearchResult>> {
  return timed("search", async () => {
    if (!companyName) {
      throw new Error("No company name provided for search");
    }

    const queries = [
      `"${companyName}" hiring news 2025 2026`,
      `"${companyName}" funding layoffs expansion`,
      `"${companyName}" ${roleTitle} team`,
    ];

    const seen = new Set<string>();
    const urls: string[] = [];

    for (const query of queries) {
      try {
        const res = await fetch(`${FIRECRAWL_BASE}/search`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            query,
            limit: 3,
          }),
        });

        if (!res.ok) {
          console.warn(`[search] Query "${query}" failed (${res.status})`);
          continue;
        }

        const json = await res.json();
        const docs = json.data || [];

        for (const doc of docs) {
          const url = doc.metadata?.sourceURL || doc.url || "";
          if (url && !seen.has(url)) {
            seen.add(url);
            urls.push(url);
          }
        }
      } catch (err) {
        console.warn(
          `[search] Query "${query}" error:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    if (urls.length === 0) {
      throw new Error("No search results found");
    }

    // Cap at 4 URLs to leave room for the job URL in extract
    const finalUrls = urls.slice(0, 4);
    return { urls: finalUrls, companyName, resultCount: urls.length };
  });
}

// --- Normalize ---

function ensureStringArray(val: unknown, maxLen: number): string[] {
  if (!Array.isArray(val)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of val) {
    const s = typeof item === "string" ? item.trim() : "";
    if (s && !seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
    if (result.length >= maxLen) break;
  }
  return result;
}

function ensureSources(
  val: unknown
): { title: string; url: string }[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter(
      (s): s is { title: string; url: string } =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as Record<string, unknown>).title === "string" &&
        typeof (s as Record<string, unknown>).url === "string"
    )
    .map((s) => ({ title: s.title.trim(), url: s.url.trim() }))
    .slice(0, 10);
}

export function normalizeExtraction(raw: Record<string, unknown>): SignalExtraction {
  return {
    role_title: typeof raw.role_title === "string" ? raw.role_title.trim() : "",
    company_name: typeof raw.company_name === "string" ? raw.company_name.trim() : "",
    seniority: typeof raw.seniority === "string" ? raw.seniority.trim() : "",
    must_have_skills: ensureStringArray(raw.must_have_skills, 8),
    hidden_expectations: ensureStringArray(raw.hidden_expectations, 6),
    company_signals: ensureStringArray(raw.company_signals, 6),
    market_signals: ensureStringArray(raw.market_signals, 5),
    candidate_positioning: ensureStringArray(raw.candidate_positioning, 5),
    interview_angles: ensureStringArray(raw.interview_angles, 5),
    risks: ensureStringArray(raw.risks, 5),
    sources: ensureSources(raw.sources),
  };
}

// --- Extract ---

export const EXTRACTION_PROMPT_PREFIX = `You are a high-end career strategist analyzing a job posting and company context.

You are NOT summarizing. You are extracting the most important signals that determine whether a candidate gets hired.

DEFINITIONS:

hidden_expectations:
- what strong candidates will infer but average candidates will miss
- behavioral or strategic expectations not explicitly stated

company_signals:
- hiring urgency
- growth or instability
- org changes
- product direction

market_signals:
- competitiveness
- saturation
- experience expectations

candidate_positioning:
- SPECIFIC ways to stand out
- NOT generic advice
- must be phrased as actions or framing

interview_angles:
- what the interviewer is likely testing for
- themes behind their questions

risks:
- unclear scope
- unrealistic expectations
- instability
- mismatch signals

STRICT RULES:
- NO generic advice (e.g. "strong communication skills")
- NO fluff
- prioritize insight over completeness
- each bullet must feel specific and intentional
- if unsure, omit rather than guess
- prefer fewer, higher-quality signals
- sources should reference specific URLs or publications where context was found

STYLE:
- concise
- sharp
- specific
- strategic

OUTPUT: VALID JSON ONLY`;

export async function extractSignalPacket(input: {
  jobUrl?: string;
  jobText?: string;
  companyUrls?: string[];
}): Promise<StepResult<SignalExtraction>> {
  return timed("extract", async () => {
    // Prompt: instructions only. Content comes via URLs.
    let prompt = EXTRACTION_PROMPT_PREFIX;

    // Text-only fallback: embed truncated text in prompt
    if (input.jobText && !input.jobUrl) {
      const truncated = input.jobText.slice(0, 7000);
      prompt += `\n\n## Job Posting (pasted text)\n${truncated}`;
    }

    // Build URLs array: job URL + company URLs, max 5 total
    const urls: string[] = [];

    if (input.jobUrl) {
      urls.push(input.jobUrl);
    }

    if (input.companyUrls) {
      const remaining = 5 - urls.length;
      urls.push(...input.companyUrls.slice(0, remaining));
    }

    // Fallback for text-only with no company URLs
    if (urls.length === 0) {
      urls.push("https://placeholder.firecrawl.dev");
    }

    // Start the extract job
    const startRes = await fetch(`${FIRECRAWL_BASE}/extract`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        urls,
        prompt,
        schema: SIGNAL_SCHEMA,
      }),
    });

    if (!startRes.ok) {
      const body = await startRes.text();
      throw new Error(`Firecrawl extract failed (${startRes.status}): ${body}`);
    }

    const startJson = await startRes.json();

    // If data is returned directly (e.g. placeholder URL), use it
    // Otherwise poll until the async job completes
    let raw = startJson.data;

    if ((!raw || typeof raw !== "object") && startJson.id) {
      const jobId = startJson.id as string;
      const maxAttempts = 30;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 2000));

        const pollRes = await fetch(`${FIRECRAWL_BASE}/extract/${jobId}`, {
          method: "GET",
          headers: getHeaders(),
        });

        if (!pollRes.ok) {
          const body = await pollRes.text();
          throw new Error(`Firecrawl extract poll failed (${pollRes.status}): ${body}`);
        }

        const pollJson = await pollRes.json();

        if (pollJson.status === "completed") {
          raw = pollJson.data;
          break;
        }

        if (pollJson.status === "failed" || pollJson.status === "cancelled") {
          throw new Error(`Firecrawl extract ${pollJson.status}: ${pollJson.error || "unknown"}`);
        }

        console.log(`[extract] Polling attempt ${i + 1}/${maxAttempts}, status: ${pollJson.status}`);
      }
    }

    if (!raw || typeof raw !== "object") {
      throw new Error("Extraction returned no data");
    }

    const normalized = normalizeExtraction(raw as Record<string, unknown>);

    if (!normalized.role_title) {
      throw new Error("Extraction returned incomplete data — no role_title");
    }

    return normalized;
  });
}
