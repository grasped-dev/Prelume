"use server";

import {
  scrapeJobPage,
  searchCompanyContext,
} from "@/lib/firecrawl";
import { extractFromText } from "@/lib/extractFromText";
import type { SignalPacket, SignalExtraction } from "@/lib/types";
import { generateBriefing } from "@/lib/generateBriefing";
import { cleanSignalPacket } from "@/lib/cleanSignals";

export interface AnalyzeResult {
  signalPacket: SignalPacket;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

function transformToSignalPacket(extraction: SignalExtraction): SignalPacket {
  return {
    roleName: extraction.role_title,
    companyName: extraction.company_name,
    confidenceScore: Math.min(
      95,
      Math.max(
        40,
        60 +
          extraction.company_signals.length * 3 +
          extraction.market_signals.length * 2 +
          extraction.hidden_expectations.length * 2
      )
    ),
    companySignal: {
      urgency:
        extraction.company_signals[0] ||
        "Insufficient data to determine urgency",
      growth:
        extraction.company_signals[1] || "No growth indicators detected",
      events: extraction.company_signals.slice(2),
    },
    roleSignal: {
      hiddenExpectations: extraction.hidden_expectations,
      keyTraits: extraction.must_have_skills,
      skillGaps: extraction.risks,
    },
    marketSignal: {
      applicantVolume:
        extraction.market_signals[0] ||
        "Unable to estimate applicant volume",
      competition:
        extraction.market_signals[1] || "Competition data unavailable",
      positioning:
        extraction.candidate_positioning.join(". ") ||
        "No positioning data available",
    },
    strategy: extraction.interview_angles,
    briefingText: [
      `Analysis of ${extraction.role_title} at ${extraction.company_name}.`,
      extraction.candidate_positioning.length
        ? `Key positioning: ${extraction.candidate_positioning[0]}.`
        : "",
      extraction.hidden_expectations.length
        ? `Hidden expectations include ${extraction.hidden_expectations.slice(0, 3).join(", ")}.`
        : "",
      extraction.interview_angles.length
        ? `Lead with: ${extraction.interview_angles[0]}.`
        : "",
      extraction.risks.length ? `Watch for: ${extraction.risks[0]}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export async function analyzeRole(input: {
  jobUrl?: string;
  jobText?: string;
}): Promise<AnalyzeResult> {
  const { jobUrl, jobText } = input;

  if (!jobUrl && !jobText) {
    throw new Error("Provide jobUrl or jobText");
  }

  const start = Date.now();
  console.log("[analyze] Starting pipeline", { jobUrl, hasText: !!jobText });

  // Step 1: Get job content
  let jobContent = jobText || "";

  if (jobUrl) {
    const scrapeResult = await scrapeJobPage(jobUrl);
    if (scrapeResult.data) {
      jobContent = scrapeResult.data.markdown;
      console.log(`[analyze] Scraped "${scrapeResult.data.title}" (${jobContent.length} chars)`);
    } else {
      console.warn("[analyze] Scrape failed, using URL as minimal context");
      jobContent = `Job posting URL: ${jobUrl}`;
    }
  }

  // Step 2: Extract signals via Gemini
  const initialExtraction = await extractFromText(jobContent);
  const companyName = initialExtraction.company_name || "";
  const roleTitle = initialExtraction.role_title || "";

  console.log(`[analyze] Identified: "${roleTitle}" at "${companyName}"`);

  // Step 3: Search for company context
  let companyContext = "";

  if (companyName) {
    const searchResult = await searchCompanyContext(companyName, roleTitle);
    if (searchResult.data) {
      // Fetch markdown from top company URLs for context
      const contextParts: string[] = [];
      for (const url of searchResult.data.urls.slice(0, 3)) {
        const result = await scrapeJobPage(url);
        if (result.data) {
          contextParts.push(result.data.markdown.slice(0, 2000));
        }
      }
      companyContext = contextParts.join("\n\n---\n\n");
    }
  } else {
    console.warn("[analyze] No company name — skipping search");
  }

  // Step 4: Full extraction with company context
  let finalExtraction = initialExtraction;

  if (companyContext) {
    try {
      finalExtraction = await extractFromText(jobContent, companyContext);
      console.log("[analyze] Full extraction with company context succeeded");
    } catch {
      console.warn("[analyze] Full extraction failed, using initial result");
    }
  }

  if (!finalExtraction.role_title) {
    throw new Error("Failed to extract signal packet: no role_title found");
  }

  const extractionData = finalExtraction;

  // Step 5: Transform to UI-compatible SignalPacket
  const signalPacket = cleanSignalPacket(
    transformToSignalPacket(extractionData)
  );

  // Step 6: Generate strategic briefing via Gemini
  signalPacket.briefingText = await generateBriefing(signalPacket);

  const totalMs = Date.now() - start;

  console.log(`[analyze] Pipeline complete in ${totalMs}ms`);

  return {
    signalPacket,
    sources: extractionData.sources,
    generatedAt: new Date().toISOString(),
  };
}
