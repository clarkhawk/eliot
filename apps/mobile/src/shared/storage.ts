import type { SQLiteDatabase } from "expo-sqlite";
import Storage from "expo-sqlite/kv-store";
import type { ChatMessage, InvitePayload, Room } from "@ilot/shared";

export class StorageWriteError extends Error {
  constructor() {
    super("Impossible d'enregistrer les données sur cet appareil.");
    this.name = "StorageWriteError";
  }
}

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      is_host INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      room_code TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (room_code) REFERENCES rooms(code) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS messages_room_time ON messages(room_code, timestamp);
  `);

  const version = (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? 0;
  if (version < 2) {
    await db.execAsync(`
      ALTER TABLE rooms ADD COLUMN invite_json TEXT;
      PRAGMA user_version = 2;
    `);
  }
}

export async function saveRoom(db: SQLiteDatabase, room: Room, invite?: InvitePayload) {
  await db.runAsync(
    `INSERT INTO rooms (code, name, created_at, expires_at, is_host, invite_json)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       expires_at = excluded.expires_at,
       is_host = excluded.is_host,
       invite_json = COALESCE(excluded.invite_json, rooms.invite_json)`,
    room.code,
    room.name,
    room.createdAt,
    room.expiresAt,
    room.host ? 1 : 0,
    invite ? JSON.stringify(invite) : null,
  );
}

export async function getInvite(db: SQLiteDatabase, code: string): Promise<InvitePayload | null> {
  const row = await db.getFirstAsync<{ invite_json: string | null }>(
    "SELECT invite_json FROM rooms WHERE code = ?",
    code,
  );
  if (!row?.invite_json) return null;
  try {
    return JSON.parse(row.invite_json) as InvitePayload;
  } catch {
    return null;
  }
}

export async function getRooms(db: SQLiteDatabase): Promise<Room[]> {
  const rows = await db.getAllAsync<{
    code: string;
    name: string;
    created_at: number;
    expires_at: number;
    is_host: number;
  }>("SELECT code, name, created_at, expires_at, is_host FROM rooms ORDER BY created_at DESC");
  return rows.map((row) => ({
    code: row.code,
    name: row.name,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    host: row.is_host === 1,
  }));
}

export async function saveMessage(db: SQLiteDatabase, message: ChatMessage) {
  await db.runAsync(
    `INSERT OR IGNORE INTO messages (id, room_code, author_id, author, text, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    message.id,
    message.roomCode,
    message.authorId,
    message.author,
    message.text,
    message.ts,
  );
}

export async function getMessages(db: SQLiteDatabase, roomCode: string): Promise<ChatMessage[]> {
  const rows = await db.getAllAsync<{
    id: string;
    room_code: string;
    author_id: string;
    author: string;
    text: string;
    timestamp: number;
  }>("SELECT * FROM messages WHERE room_code = ? ORDER BY timestamp ASC", roomCode);
  return rows.map((row) => ({
    id: row.id,
    roomCode: row.room_code,
    authorId: row.author_id,
    author: row.author,
    text: row.text,
    ts: row.timestamp,
  }));
}

export async function deleteRoom(db: SQLiteDatabase, code: string) {
  await db.runAsync("DELETE FROM rooms WHERE code = ?", code);
}

export const preferences = {
  getPseudo: () => Storage.getItem("ilot:pseudo"),
  setPseudo: (pseudo: string) => Storage.setItem("ilot:pseudo", pseudo),
};
