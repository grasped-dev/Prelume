"use server";

import type { SignalPacket } from "@/lib/types";
import { formatPacketAsContext, getSignedAgentUrl } from "@/lib/agent";

export async function startAgentSession(
  packet: SignalPacket
): Promise<{ signedUrl: string; context: string }> {
  const context = formatPacketAsContext(packet);

  console.log(
    `[agent] Starting session for "${packet.roleName}" at "${packet.companyName}"`
  );

  const signedUrl = await getSignedAgentUrl(context);

  console.log("[agent] Signed URL obtained");

  return { signedUrl, context };
}
