import type { SignalPacket } from "./types";

export interface SharedPacket {
  signalPacket: SignalPacket;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

const store = new Map<string, SharedPacket>();

export function savePacket(data: SharedPacket): string {
  const id = Math.random().toString(36).slice(2, 10);
  store.set(id, data);
  return id;
}

export function getPacket(id: string): SharedPacket | undefined {
  return store.get(id);
}
