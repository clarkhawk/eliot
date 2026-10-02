export type Room = {
  code: string;
  name: string;
  createdAt: number;
  expiresAt: number;
  host: boolean;
};

export type InvitePayload = {
  v: 1;
  salon: string;
  code: string;
  exp: number;
};

export function normalizeCode(input: string): string | null {
  const match = input.trim().toUpperCase().match(/^(?:ILOT)?[\s-]*([0-9]{4,6})$/);
  return match ? `ILOT-${match[1]}` : null;
}

export function parseInvite(text: string): InvitePayload | string | null {
  const value = text.trim();
  if (!value) return null;

  try {
    const json = JSON.parse(value) as Partial<InvitePayload>;
    if (json.code && typeof json.exp === "number") {
      const code = normalizeCode(json.code);
      const salon = String(json.salon ?? json.code).trim().slice(0, 40);
      if (code && salon && Number.isFinite(json.exp) && json.exp > Date.now()) {
        return { v: 1, salon, code, exp: json.exp };
      }
    }
  } catch {
    // The input may be a URL or a plain access code.
  }

  try {
    const url = new URL(value);
    const code = url.searchParams.get("code");
    const exp = Number(url.searchParams.get("e"));
    const normalized = code && normalizeCode(code);
    const salon = (url.searchParams.get("n") ?? code ?? "").trim().slice(0, 40);
    if (normalized && salon && Number.isFinite(exp) && exp > Date.now()) {
      return { v: 1, salon, code: normalized, exp };
    }
  } catch {
    // Not a URL.
  }

  return normalizeCode(value) ? value : null;
}
