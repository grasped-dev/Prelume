export type { SignalExtraction } from "./signalSchema";

export interface SignalPacket {
  roleName: string;
  companyName: string;
  confidenceScore: number;
  companySignal: {
    urgency: string;
    growth: string;
    events: string[];
  };
  roleSignal: {
    hiddenExpectations: string[];
    keyTraits: string[];
    skillGaps: string[];
  };
  marketSignal: {
    applicantVolume: string;
    competition: string;
    positioning: string;
  };
  strategy: string[];
  briefingText: string;
}


export interface ScrapeResult {
  markdown: string;
  title: string;
  sourceUrl: string;
}

export interface StepResult<T> {
  data: T | null;
  durationMs: number;
  error?: string;
}

export interface CompanySearchResult {
  urls: string[];
  companyName: string;
  resultCount: number;
}
