export interface SignalExtraction {
  role_title: string;
  company_name: string;
  seniority: string;
  must_have_skills: string[];
  hidden_expectations: string[];
  company_signals: string[];
  market_signals: string[];
  candidate_positioning: string[];
  interview_angles: string[];
  risks: string[];
  sources: { title: string; url: string }[];
}

export const SIGNAL_SCHEMA = {
  type: "object",
  properties: {
    role_title: { type: "string" },
    company_name: { type: "string" },
    seniority: { type: "string" },
    must_have_skills: {
      type: "array",
      items: { type: "string" },
    },
    hidden_expectations: {
      type: "array",
      items: { type: "string" },
    },
    company_signals: {
      type: "array",
      items: { type: "string" },
    },
    market_signals: {
      type: "array",
      items: { type: "string" },
    },
    candidate_positioning: {
      type: "array",
      items: { type: "string" },
    },
    interview_angles: {
      type: "array",
      items: { type: "string" },
    },
    risks: {
      type: "array",
      items: { type: "string" },
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
        },
        required: ["title", "url"],
      },
    },
  },
  required: [
    "role_title",
    "company_name",
    "must_have_skills",
    "hidden_expectations",
    "company_signals",
    "market_signals",
    "candidate_positioning",
    "interview_angles",
  ],
} as const;
