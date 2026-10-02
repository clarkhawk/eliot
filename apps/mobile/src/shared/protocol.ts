import type { InvitePayload, Room } from "./invites";

export type ChatMessage = {
  id: string;
  roomCode: string;
  authorId: string;
  author: string;
  text: string;
  ts: number;
};

export type ClientPacket =
  | { type: "hello"; room: InvitePayload; clientId: string; pseudo: string }
  | { type: "message"; message: Pick<ChatMessage, "id" | "authorId" | "author" | "text" | "ts"> };

export type ServerPacket =
  | { type: "ready"; room: Room }
  | { type: "history"; messages: ChatMessage[] }
  | { type: "message"; message: ChatMessage }
  | { type: "error"; message: string };

export function encodePacket(packet: ClientPacket): string {
  return JSON.stringify(packet);
}

export function decodePacket(raw: string): ServerPacket | null {
  try {
    const packet = JSON.parse(raw) as ServerPacket;
    if (!packet || typeof packet !== "object" || typeof packet.type !== "string") return null;
    return packet;
  } catch {
    return null;
  }
}
