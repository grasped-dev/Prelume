import { GoogleGenAI } from "@google/genai";
import type { SignalPacket } from "./types";

export async function generateBriefing(
  packet: SignalPacket
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[briefing] GEMINI_API_KEY not set, using fallback");
    return packet.briefingText;
  }

  const start = Date.now();

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a high-end career strategist.

You are given structured intelligence about a job and company.

Your task is to generate a short, powerful voice briefing that tells the candidate how to win the role.

INPUT:
${JSON.stringify(packet, null, 2)}

REQUIREMENTS:
- 4-6 sentences max
- no fluff
- no generic advice
- focus on what most candidates will miss
- highlight 1-2 key positioning advantages
- use confident, natural spoken language
- sound like a real strategist, not an AI

OUTPUT:
plain text only (no formatting)`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text?.trim();
    const durationMs = Date.now() - start;

    if (!text) {
      console.warn(`[briefing] ${durationMs}ms — empty response, using fallback`);
      return packet.briefingText;
    }

    console.log(`[briefing] ${durationMs}ms — generated (${text.length} chars)`);
    return text;
  } catch (err) {
    const durationMs = Date.now() - start;
    console.error(
      `[briefing] ${durationMs}ms — failed:`,
      err instanceof Error ? err.message : err
    );
    return packet.briefingText;
  }
}
