export type Room = {
  code: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  host: boolean;
};

export type Message = {
  id: string;
  roomCode: string;
  authorId: string;
  author: string;
  text: string;
  ts: number;
};

export type InvitePayload = {
  v: 1;
  salon: string;
  code: string;
  exp: number;
  ssid?: string;
  password?: string;
  url?: string;
};

export type ChatMessage = Message;

export type ClientPacket =
  | { type: "hello"; room: InvitePayload; clientId: string; pseudo: string }
  | { type: "message"; message: Omit<ChatMessage, "roomCode"> };

export type ServerPacket =
  | { type: "ready"; room: Room; sessionId?: string }
  | { type: "history"; messages: ChatMessage[] }
  | { type: "message"; message: ChatMessage }
  | { type: "error"; message: string };

export function normalizeCode(input: string): string | null {
  const match = input.trim().toUpperCase().match(/^(?:ILOT[\s-]*)?([A-Z0-9]{6})$/);
  return match ? `ILOT-${match[1]}` : null;
}

function validateInvite(input: Partial<InvitePayload>): InvitePayload | null {
  const code = typeof input.code === "string" ? normalizeCode(input.code) : null;
  const salon = String(input.salon ?? input.code ?? "").trim().slice(0, 40);
  if (input.v !== undefined && input.v !== 1) return null;
  if (!code || !salon || typeof input.exp !== "number" || !Number.isFinite(input.exp) || input.exp <= Date.now()) {
    return null;
  }
  return {
    v: 1,
    salon,
    code,
    exp: input.exp,
    ...(typeof input.ssid === "string" ? { ssid: input.ssid } : {}),
    ...(typeof input.password === "string" ? { password: input.password } : {}),
    ...(typeof input.url === "string" ? { url: input.url } : {}),
  };
}

export function parseInvite(text: string): InvitePayload | string | null {
  const value = text.trim();
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<InvitePayload>;
    const invite = validateInvite(parsed);
    if (invite) return invite;
    if (typeof parsed.code === "string" && typeof parsed.exp === "number") return null;
  } catch {
    // Continue with URL and plain-code parsing.
  }

  try {
    const url = new URL(value);
    const code = url.searchParams.get("code");
    const exp = Number(url.searchParams.get("e"));
    const invite = validateInvite({ v: 1, salon: url.searchParams.get("n") ?? code ?? "", code: code ?? "", exp });
    if (invite) return invite;
    if (code && url.searchParams.has("e")) return null;
  } catch {
    // The input may be a plain access code.
  }

  return normalizeCode(value);
}

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
