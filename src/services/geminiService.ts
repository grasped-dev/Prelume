import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function generateSignalPacket(jobUrl: string): Promise<SignalPacket> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze this job URL (or description if URL is invalid) and generate a Career Intelligence Signal Packet: ${jobUrl}. 
    Focus on "hidden" signals, market positioning, and strategic advice. 
    The briefingText should be a concise, professional intelligence summary (approx 100 words) that can be read aloud.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roleName: { type: Type.STRING },
          companyName: { type: Type.STRING },
          confidenceScore: { type: Type.NUMBER },
          companySignal: {
            type: Type.OBJECT,
            properties: {
              urgency: { type: Type.STRING },
              growth: { type: Type.STRING },
              events: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["urgency", "growth", "events"],
          },
          roleSignal: {
            type: Type.OBJECT,
            properties: {
              hiddenExpectations: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
              skillGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["hiddenExpectations", "keyTraits", "skillGaps"],
          },
          marketSignal: {
            type: Type.OBJECT,
            properties: {
              applicantVolume: { type: Type.STRING },
              competition: { type: Type.STRING },
              positioning: { type: Type.STRING },
            },
            required: ["applicantVolume", "competition", "positioning"],
          },
          strategy: { type: Type.ARRAY, items: { type: Type.STRING } },
          briefingText: { type: Type.STRING },
        },
        required: ["roleName", "companyName", "confidenceScore", "companySignal", "roleSignal", "marketSignal", "strategy", "briefingText"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function generateAudioBriefing(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this intelligence briefing with a professional, calm, slightly futuristic tone: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio");
  return `data:audio/mp3;base64,${base64Audio}`;
}
