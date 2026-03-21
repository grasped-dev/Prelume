import type { SignalPacket } from "./types";

const GENERIC_PATTERNS = [
  /^strong\s+(communication|leadership|analytical|problem.solving)\s+skills?$/i,
  /^excellent\s+(written|verbal|oral)\s+(and\s+\w+\s+)?communication$/i,
  /^ability\s+to\s+work\s+(in\s+a\s+)?fast.paced\s+environment$/i,
  /^team\s+player$/i,
  /^self.starter$/i,
  /^detail.oriented$/i,
  /^passionate\s+about\s+technology$/i,
  /^strong\s+work\s+ethic$/i,
  /^ability\s+to\s+multitask$/i,
  /^good\s+(at\s+)?time\s+management$/i,
  /^results.driven$/i,
  /^proactive$/i,
  /^strong\s+interpersonal\s+skills$/i,
  /^excellent\s+organizational\s+skills$/i,
  /^ability\s+to\s+work\s+independently$/i,
];

const FILLER_PREFIXES = [
  /^(the\s+candidate\s+(should|must|will)\s+)/i,
  /^(it\s+is\s+(important|essential|critical)\s+(that|to)\s+)/i,
  /^(we\s+are\s+looking\s+for\s+(someone|a\s+candidate)\s+(who|that)\s+)/i,
  /^(the\s+ideal\s+candidate\s+(will|should)\s+)/i,
  /^(you\s+(should|will|must)\s+(be\s+able\s+to\s+)?)/i,
  /^(demonstrated\s+ability\s+to\s+)/i,
  /^(proven\s+(track\s+record|experience)\s+(in|of|with)\s+)/i,
];

function isGeneric(text: string): boolean {
  const cleaned = text.trim();
  return GENERIC_PATTERNS.some((p) => p.test(cleaned));
}

function cleanText(text: string): string {
  let cleaned = text.trim();

  for (const prefix of FILLER_PREFIXES) {
    cleaned = cleaned.replace(prefix, "");
  }

  // Capitalize first letter after prefix removal
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Remove trailing period for consistency
  cleaned = cleaned.replace(/\.\s*$/, "");

  return cleaned;
}

function cleanArray(items: string[], max: number): string[] {
  return items
    .map(cleanText)
    .filter((item) => item.length > 0 && !isGeneric(item))
    .slice(0, max);
}

function cleanString(text: string): string {
  const cleaned = cleanText(text);
  return isGeneric(cleaned) ? "" : cleaned;
}

export function cleanSignalPacket(packet: SignalPacket): SignalPacket {
  return {
    ...packet,
    companySignal: {
      urgency: cleanString(packet.companySignal.urgency) || packet.companySignal.urgency,
      growth: cleanString(packet.companySignal.growth) || packet.companySignal.growth,
      events: cleanArray(packet.companySignal.events, 5),
    },
    roleSignal: {
      hiddenExpectations: cleanArray(packet.roleSignal.hiddenExpectations, 5),
      keyTraits: cleanArray(packet.roleSignal.keyTraits, 5),
      skillGaps: cleanArray(packet.roleSignal.skillGaps, 4),
    },
    marketSignal: {
      applicantVolume: cleanString(packet.marketSignal.applicantVolume) || packet.marketSignal.applicantVolume,
      competition: cleanString(packet.marketSignal.competition) || packet.marketSignal.competition,
      positioning: cleanString(packet.marketSignal.positioning) || packet.marketSignal.positioning,
    },
    strategy: cleanArray(packet.strategy, 5),
  };
}
