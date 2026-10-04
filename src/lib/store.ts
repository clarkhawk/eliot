"use client";

/**
 * Stockage 100 % local (localStorage) — équivalent web de la base `Room` du README.
 * - Les salons rejoints et l'historique des messages survivent à l'expiration.
 * - L'événement `storage` synchronise les onglets d'un même navigateur,
 *   ce qui permet de tester le temps réel avec deux onglets.
 *
 * Point d'extension : `addMessage()` est le seul endroit à brancher sur un
 * vrai transport (WebSocket local) pour relayer les messages entre appareils.
 */
import { useMemo, useSyncExternalStore } from "react";
import { normalizeCode, parseInvite } from "@ilot/shared";
export { normalizeCode, parseInvite } from "@ilot/shared";
import type { InvitePayload, Message, Room } from "@ilot/shared";

const K_ROOMS = "ilot:rooms";
const K_MSGS = (code: string) => `ilot:msgs:${code}`;
const K_PSEUDO_LAST = "ilot:pseudo-last";
const K_PSEUDO_TAB = "ilot:pseudo-tab";
const K_CLIENT = "ilot:client-id";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export class StorageWriteError extends Error {
  constructor() {
    super("Impossible d'enregistrer les données sur cet appareil.");
    this.name = "StorageWriteError";
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", emit);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function read(key: string, session = false): string | null {
  try {
    return (session ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string, session = false) {
  try {
    (session ? sessionStorage : localStorage).setItem(key, value);
  } catch {
    throw new StorageWriteError();
  }
  emit();
}

function useRaw(key: string, session = false) {
  return useSyncExternalStore(
    subscribe,
    () => read(key, session),
    () => null,
  );
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ───────── Identité (un id par onglet, un pseudo par onglet) ───────── */

export function getClientId(): string {
  let id = read(K_CLIENT, true);
  if (!id) {
    id = crypto.randomUUID();
    try {
      sessionStorage.setItem(K_CLIENT, id);
    } catch {
      throw new StorageWriteError();
    }
  }
  return id;
}

export function usePseudo() {
  const raw = useRaw(K_PSEUDO_TAB, true);
  const last = useRaw(K_PSEUDO_LAST);
  return { pseudo: raw, lastPseudo: last };
}

export function setPseudo(p: string) {
  write(K_PSEUDO_TAB, p, true);
  write(K_PSEUDO_LAST, p);
}

/* ───────── Salons ───────── */

export function useRooms(): Room[] {
  const raw = useRaw(K_ROOMS);
  return useMemo(() => {
    const list = parse<Room[]>(raw, []);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [raw]);
}

export function useRoom(code: string): Room | undefined {
  const rooms = useRooms();
  return rooms.find((r) => r.code.toUpperCase() === code.toUpperCase());
}

export function getRooms(): Room[] {
  return parse<Room[]>(read(K_ROOMS), []);
}

export function saveRoom(room: Room) {
  const rooms = getRooms().filter((r) => r.code !== room.code);
  write(K_ROOMS, JSON.stringify([room, ...rooms]));
}

export function deleteRoom(code: string) {
  write(K_ROOMS, JSON.stringify(getRooms().filter((r) => r.code !== code)));
  try {
    localStorage.removeItem(K_MSGS(code));
  } catch {}
}

export function generateCode(): string {
  const taken = new Set(getRooms().map((r) => r.code));
  for (let i = 0; i < 50; i++) {
    const code = `ILOT-${Array.from({ length: 6 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("")}`;
    if (!taken.has(code)) return code;
  }
  return `ILOT-${Date.now().toString().slice(-6)}`;
}

export function createRoom(input: {
  name: string;
  durationMs: number;
}): Room {
  const now = Date.now();
  const room: Room = {
    code: generateCode(),
    name: input.name.trim(),
    createdAt: now,
    expiresAt: now + input.durationMs,
    host: true,
  };
  saveRoom(room);
  return room;
}

/* ───────── Rejoindre ───────── */

export type JoinResult =
  | { ok: true; room: Room }
  | { ok: false; error: string };

/** Rejoint un salon via un code, un nom (historique local) ou une invitation (QR / lien). */
export function joinRoom(input: string | InvitePayload): JoinResult {
  const rooms = getRooms();

  if (typeof input !== "string") {
    const invite = parseInvite(JSON.stringify(input));
    if (!invite || typeof invite === "string") return { ok: false, error: "Cette invitation est invalide ou expirée." };
    const existing = rooms.find((r) => r.code === invite.code);
    if (existing && existing.expiresAt > Date.now()) return { ok: true, room: existing };
    const room: Room = {
      code: invite.code,
      name: invite.salon,
      createdAt: Date.now(),
      expiresAt: invite.exp,
      host: false,
    };
    saveRoom(room);
    return { ok: true, room };
  }

  const text = input.trim();
  if (!text) return { ok: false, error: "Entrez un code d'accès ou le nom d'un salon." };

  const code = normalizeCode(text);
  const found = code
    ? rooms.find((r) => r.code === code)
    : rooms.find((r) => r.name.trim().toLowerCase() === text.toLowerCase());

  if (!found) {
    return {
      ok: false,
      error: code
        ? "Salon introuvable. Scannez le QR code de l'hôte pour le rejoindre."
        : "Aucun salon déjà rejoint ne porte ce nom.",
    };
  }
  if (found.expiresAt <= Date.now()) {
    return { ok: false, error: "Ce salon a expiré. Son historique reste consultable depuis l'accueil." };
  }
  return { ok: true, room: found };
}

/* ───────── Messages ───────── */

export function useMessages(code: string): Message[] {
  const raw = useRaw(K_MSGS(code));
  return useMemo(() => parse<Message[]>(raw, []), [raw]);
}

export function addMessage(m: Omit<Message, "id" | "ts">) {
  const text = m.text.trim().slice(0, 2000);
  if (!text) return;
  const key = K_MSGS(m.roomCode);
  const list = parse<Message[]>(read(key), []);
  list.push({ ...m, text, id: crypto.randomUUID(), ts: Date.now() });
  write(key, JSON.stringify(list));
}
