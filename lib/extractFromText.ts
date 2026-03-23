import { GoogleGenAI } from "@google/genai";
import type { SignalExtraction } from "./signalSchema";
import { SIGNAL_SCHEMA } from "./signalSchema";
import { EXTRACTION_PROMPT_PREFIX, normalizeExtraction } from "./firecrawl";

export async function extractFromText(
  jobText: string,
  companyContext?: string
): Promise<SignalExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const start = Date.now();

  const prompt = [
    EXTRACTION_PROMPT_PREFIX,
    "",
    "## Job Posting",
    jobText.slice(0, 8000),
    "",
    companyContext ? `## Company Context\n${companyContext.slice(0, 4000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: SIGNAL_SCHEMA,
    },
  });

  const text = response.text?.trim();
  const durationMs = Date.now() - start;

  if (!text) {
    console.error(`[extractFromText] ${durationMs}ms — empty response`);
    throw new Error("Gemini returned empty response");
  }

  console.log(`[extractFromText] ${durationMs}ms — extracted (${text.length} chars)`);

  const raw = JSON.parse(text);
  return normalizeExtraction(raw as Record<string, unknown>);
}
