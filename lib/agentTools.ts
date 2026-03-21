import type { SignalPacket } from "./types";
import { formatPacketAsContext } from "./agent";

interface AgentToolsOptions {
  onRefresh?: (jobInput: string) => Promise<SignalPacket | null>;
  sources?: { title: string; url: string }[];
}

export function createAgentTools(
  packet: SignalPacket,
  opts: AgentToolsOptions
): Record<string, (params: Record<string, unknown>) => string | Promise<string>> {
  return {
    refresh_signal_packet: async () => {
      if (!opts.onRefresh) {
        return "Refresh is not available in this session.";
      }
      try {
        const updated = await opts.onRefresh(packet.companyName);
        if (!updated) {
          return "Refresh failed — could not re-analyze the role.";
        }
        return `Signal packet refreshed successfully.\n\n${formatPacketAsContext(updated)}`;
      } catch (err) {
        return `Refresh failed: ${err instanceof Error ? err.message : "unknown error"}`;
      }
    },

    get_source_summary: (params) => {
      const section = typeof params.section === "string" ? params.section.toLowerCase() : "all";
      const sources = opts.sources || [];

      if (sources.length === 0) {
        return "No sources were collected during this analysis.";
      }

      const lines = sources.map(
        (s, i) => `${i + 1}. ${s.title} — ${s.url}`
      );

      return `Sources used for ${section} analysis (${sources.length} total):\n${lines.join("\n")}`;
    },

    generate_interview_questions: () => {
      const questions: string[] = [];

      if (packet.roleSignal.hiddenExpectations.length > 0) {
        questions.push(
          `Based on the hidden expectation "${packet.roleSignal.hiddenExpectations[0]}" — how would you describe your experience with this, and can you give a specific example?`
        );
      }

      if (packet.roleSignal.keyTraits.length > 0) {
        questions.push(
          `This role values "${packet.roleSignal.keyTraits[0]}" — tell me about a time you demonstrated this trait under pressure.`
        );
      }

      if (packet.companySignal.events.length > 0) {
        questions.push(
          `${packet.companyName} recently experienced "${packet.companySignal.events[0]}" — how would you approach joining a team during this kind of transition?`
        );
      }

      if (packet.strategy.length > 0) {
        questions.push(
          `One of your key strategy angles is: "${packet.strategy[0]}" — can you walk through how you'd present this in an interview setting?`
        );
      }

      if (packet.roleSignal.skillGaps.length > 0) {
        questions.push(
          `A potential risk area is "${packet.roleSignal.skillGaps[0]}" — how would you address this if it comes up?`
        );
      }

      if (questions.length === 0) {
        return "Not enough signal data to generate targeted interview questions.";
      }

      return questions
        .map((q, i) => `${i + 1}. ${q}`)
        .join("\n\n");
    },

    positioning_strategy: () => {
      const angles: string[] = [];

      if (packet.marketSignal.positioning) {
        angles.push(packet.marketSignal.positioning);
      }

      for (const s of packet.strategy.slice(0, 2)) {
        angles.push(s);
      }

      if (angles.length < 3 && packet.roleSignal.hiddenExpectations.length > 0) {
        angles.push(
          `Leverage your knowledge of "${packet.roleSignal.hiddenExpectations[0]}" — most candidates won't address this unspoken expectation.`
        );
      }

      if (angles.length === 0) {
        return "Not enough data to generate positioning angles.";
      }

      return angles
        .slice(0, 3)
        .map((a, i) => `Angle ${i + 1}: ${a}`)
        .join("\n\n");
    },
  };
}
