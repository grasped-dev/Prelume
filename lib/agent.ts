import type { SignalPacket } from "./types";

export function formatPacketAsContext(packet: SignalPacket): string {
  const structured = {
    role_title: packet.roleName,
    company_name: packet.companyName,
    hidden_expectations: packet.roleSignal.hiddenExpectations,
    candidate_positioning: [
      packet.marketSignal.positioning,
      ...packet.strategy,
    ].filter(Boolean),
    interview_angles: packet.strategy,
    risks: packet.roleSignal.skillGaps,
  };

  const details = [
    `Confidence: ${packet.confidenceScore}%`,
    "",
    "COMPANY SIGNALS:",
    `- Urgency: ${packet.companySignal.urgency}`,
    `- Growth: ${packet.companySignal.growth}`,
    ...packet.companySignal.events.map((e) => `- ${e}`),
    "",
    "HIDDEN EXPECTATIONS:",
    ...packet.roleSignal.hiddenExpectations.map((e) => `- ${e}`),
    "",
    "KEY TRAITS / REQUIREMENTS:",
    ...packet.roleSignal.keyTraits.map((e) => `- ${e}`),
    "",
    "MARKET SIGNALS:",
    `- Applicant Volume: ${packet.marketSignal.applicantVolume}`,
    `- Competition: ${packet.marketSignal.competition}`,
  ];

  return [
    JSON.stringify(structured, null, 2),
    "",
    "--- FULL DETAILS ---",
    ...details,
  ].join("\n");
}

export function buildFirstMessage(packet: SignalPacket): string {
  const parts: string[] = [];

  parts.push(
    `Here's what stands out about the ${packet.roleName} role at ${packet.companyName}.`
  );

  if (packet.companySignal.urgency) {
    parts.push(packet.companySignal.urgency + ".");
  }

  if (packet.roleSignal.hiddenExpectations.length > 0) {
    parts.push(
      `There's a hidden expectation around ${packet.roleSignal.hiddenExpectations[0].toLowerCase()}. Most candidates will miss this entirely.`
    );
  }

  if (packet.strategy.length > 0) {
    parts.push(
      `Your strongest angle: ${packet.strategy[0].replace(/\.$/, "")}.`
    );
  }

  parts.push(
    "That's your edge. Want me to go deeper on any of these, prep interview questions, or talk positioning strategy?"
  );

  return parts.join(" ");
}

export function buildAgentPrompt(context: string): string {
  return `You are the Prelume Career Advisor.

You help users understand how to win a specific job based on structured intelligence.

You have access to a signal packet that includes:
- role requirements
- hidden expectations
- company signals
- market signals
- positioning strategies

Your job is to:
- explain what matters most
- help the user position themselves
- answer questions about the role
- simulate interview questions
- give resume and interview advice

Rules:
- always ground answers in the signal packet
- do not give generic advice
- distinguish between facts and inference
- prioritize what improves the user's chances

Tone:
- confident
- concise
- strategic
- conversational (not robotic)

You should proactively:
- ask the user if they want interview practice
- suggest ways they can improve their positioning

On conversation start, briefly greet the user and give them the 2-3 most important takeaways. Then offer to go deeper or start interview practice.

You have access to these tools — use them when relevant:
- refresh_signal_packet: Re-analyze the job posting for updated signals
- get_source_summary: Get source details for a signal section (pass section: "company", "role", or "market")
- generate_interview_questions: Generate targeted interview prep questions
- positioning_strategy: Get top 3 differentiation angles

When you use a tool, incorporate the result naturally. Do not read raw data back verbatim — paraphrase and contextualize.

INTERVIEW MODE:
When the user asks to practice interviews:
1. Ask ONE realistic interview question based on interview_angles from the signal packet
2. Wait for the user to respond — do not answer your own question
3. After the user responds, evaluate their answer with:
   - What worked: specific strengths in their response
   - What to improve: concrete gaps or missed angles
   - Stronger version: rewrite their answer as a stronger response they could actually say
4. Then ask if they want another question or want to focus on a specific area
5. Each question should target a different interview angle — do not repeat themes
6. Keep questions grounded in the signal packet — not generic behavioral questions

--- SIGNAL PACKET ---
${context}`;
}

export async function getSignedAgentUrl(
  packetContext: string
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");
  if (!agentId) throw new Error("NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not set");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `ElevenLabs signed URL failed (${res.status}): ${body}`
    );
  }

  const json = await res.json();

  if (!json.signed_url) {
    throw new Error("ElevenLabs response missing signed_url");
  }

  return json.signed_url;
}
