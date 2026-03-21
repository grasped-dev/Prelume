import type { ScrapeResult, StepResult } from "./types";
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
): Promise<StepResult<string>> {
  return timed("search", async () => {
    if (!companyName) {
      throw new Error("No company name provided for search");
    }

    const queries = [
      `"${companyName}" hiring news 2025 2026`,
      `"${companyName}" funding layoffs expansion`,
      `"${companyName}" ${roleTitle} team`,
    ];

    const results: string[] = [];

    for (const query of queries) {
      try {
        const res = await fetch(`${FIRECRAWL_BASE}/search`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            query,
            limit: 3,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (!res.ok) {
          console.warn(`[search] Query "${query}" failed (${res.status})`);
          continue;
        }

        const json = await res.json();
        const docs = json.data || [];

        for (const doc of docs) {
          const content = doc.markdown || doc.description || "";
          const title = doc.metadata?.title || doc.title || "";
          const url = doc.metadata?.sourceURL || doc.url || "";

          if (content) {
            results.push(
              `Source: ${title} (${url})\n${content.slice(0, 1500)}`
            );
          }
        }
      } catch (err) {
        console.warn(
          `[search] Query "${query}" error:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    if (results.length === 0) {
      throw new Error("No search results found");
    }

    return results.join("\n\n---\n\n");
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

function normalizeExtraction(raw: Record<string, unknown>): SignalExtraction {
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

const EXTRACTION_PROMPT_PREFIX = `You are a high-end career strategist analyzing a job posting and company context.

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

export async function extractSignalPacket(
  jobContent: string,
  companyContext: string
): Promise<StepResult<SignalExtraction>> {
  return timed("extract", async () => {
    const prompt = [
      EXTRACTION_PROMPT_PREFIX,
      "",
      "## Job Posting",
      jobContent,
      "",
      companyContext ? `## Company Context\n${companyContext}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch(`${FIRECRAWL_BASE}/extract`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        urls: ["https://placeholder.firecrawl.dev"],
        prompt,
        schema: SIGNAL_SCHEMA,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Firecrawl extract failed (${res.status}): ${body}`);
    }

    const json = await res.json();
    const raw = json.data;

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
