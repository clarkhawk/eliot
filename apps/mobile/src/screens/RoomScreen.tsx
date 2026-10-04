import type { ChatMessage, InvitePayload, Room } from "@ilot/shared";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { InviteQrPanel } from "../components/InviteQr";
import { JoinSteps } from "../components/JoinSteps";
import { PseudoSheet } from "../components/PseudoSheet";
import { IlotNetwork } from "ilot-network";
import { formatRemaining, formatTime } from "../shared/format";
import { deleteRoom, getMessages, preferences, saveMessage, saveRoom } from "../shared/storage";
import { formatTransportStatus, type TransportStatus } from "../shared/transportStatus";
import { WebSocketTransport } from "../shared/WebSocketTransport";

type Palette = { ink: string; muted: string; surface: string; line: string; field: string; background: string };

type Props = {
  room: Room;
  invite: InvitePayload;
  palette: Palette;
  guestJoin?: boolean;
  onBack: () => void;
};

function createClientId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.ts - b.ts);
}

function roomStatusLabel(status: TransportStatus, expired: boolean, expiresAt: number, now: number) {
  if (expired) return "salon expiré · lecture seule";
  if (status === "connected") return `Connecté · ${formatRemaining(expiresAt - now)}`;
  return formatTransportStatus(status, expired);
}

export function RoomScreen({ room, invite, palette, guestJoin = false, onBack }: Props) {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const clientIdRef = useRef(createClientId());
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [transportStatus, setTransportStatus] = useState<TransportStatus>("idle");
  const [wifiDone, setWifiDone] = useState(!guestJoin || room.host);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [qrExpanded, setQrExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const transportRef = useRef<WebSocketTransport | null>(null);
  const expired = room.expiresAt <= now;
  const connected = transportStatus === "connected" && sessionId !== null;

  useEffect(() => {
    let active = true;
    preferences.getPseudo().then((stored) => {
      if (!active) return;
      if (stored) setPseudo(stored);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  useEffect(() => {
    let active = true;
    getMessages(db, room.code).then((stored) => { if (active) setMessages(stored); }).catch(() => setError("Impossible de lire l'historique local."));
    if (!invite.url || expired || !pseudo) return () => { active = false; };

    const transport = new WebSocketTransport({
      url: invite.url,
      invite,
      clientId: clientIdRef.current,
      pseudo,
      onStatus: setTransportStatus,
      onError: setError,
      onPacket: (packet) => {
        if (packet.type === "history") {
          Promise.all(packet.messages.map((message) => saveMessage(db, message)))
            .then(() => setMessages((current) => mergeMessages(current, packet.messages)))
            .catch(() => setError("Impossible d'enregistrer l'historique local."));
        }
        if (packet.type === "message") {
          saveMessage(db, packet.message)
            .then(() => setMessages((current) => mergeMessages(current, [packet.message])))
            .catch(() => setError("Impossible d'enregistrer le message localement."));
        }
        if (packet.type === "ready") {
          if (packet.sessionId) setSessionId(packet.sessionId);
          saveRoom(db, packet.room, invite).catch(() => setError("Impossible d'enregistrer le salon localement."));
        }
        if (packet.type === "error") setError(packet.message);
      },
    });
    transportRef.current = transport;
    const connect = async () => {
      if (!room.host && invite.ssid && invite.password) {
        await IlotNetwork.joinNetwork(invite.ssid, invite.password);
        setWifiDone(true);
      }
      transport.connect();
    };
    connect().catch(() => setError("Android n'a pas pu rejoindre le réseau local."));
    return () => { active = false; transport.close(); transportRef.current = null; };
  }, [db, expired, invite, pseudo, room.code, room.host]);

  function send() {
    const value = text.trim();
    if (!value || expired || !invite.url || !sessionId || !pseudo) return;
    const message: Omit<ChatMessage, "roomCode"> = {
      id: `${sessionId}-${Date.now()}`,
      authorId: sessionId,
      author: pseudo,
      text: value.slice(0, 2000),
      ts: Date.now(),
    };
    setText("");
    if (!transportRef.current?.sendMessage(message)) {
      setError("Connexion indisponible. Le message n'a pas été envoyé.");
    }
  }

  async function endRoom() {
    setConfirmEnd(false);
    setMenuOpen(false);
    try {
      if (room.host) await IlotNetwork.stopHost(room.code);
      await deleteRoom(db, room.code);
      onBack();
    } catch {
      setError("Impossible de terminer le salon.");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={[styles.header, { borderBottomColor: palette.line }]}>
        <TouchableOpacity onPress={onBack}><Text style={[styles.back, { color: palette.muted }]}>‹ Accueil</Text></TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: palette.ink }]}>{room.name}</Text>
          <Text style={[styles.status, { color: palette.muted }]}>
            {roomStatusLabel(transportStatus, expired, room.expiresAt, now)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setMenuOpen((value) => !value)}>
          <Text style={[styles.menu, { color: palette.muted }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      {menuOpen ? (
        <View style={[styles.menuSheet, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <TouchableOpacity onPress={() => { setMenuOpen(false); setConfirmEnd(true); }}>
            <Text style={[styles.menuItem, { color: "#b42318" }]}>
              {room.host ? "Terminer le salon" : "Supprimer le salon"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {guestJoin && !room.host ? (
        <JoinSteps
          connected={connected}
          onOpenWifi={() => { IlotNetwork.openWifiSettings().catch(() => setError("Impossible d'ouvrir les paramètres Wi‑Fi.")); }}
          palette={palette}
          pseudoDone={Boolean(pseudo)}
          scanDone
          wifiDone={wifiDone}
        />
      ) : null}

      {room.host && !expired && invite.url ? (
        <InviteQrPanel expanded={qrExpanded} invite={invite} onToggle={() => setQrExpanded((value) => !value)} palette={palette} />
      ) : null}

      <FlatList
        ref={listRef}
        contentContainerStyle={styles.messages}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const mine = sessionId !== null && item.authorId === sessionId;
          const prev = messages[index - 1];
          const showLabel = !prev || prev.authorId !== item.authorId || item.ts - prev.ts > 5 * 60_000;
          return (
            <View style={[styles.row, mine ? styles.rowMine : styles.rowOther, showLabel && index > 0 ? styles.rowGap : null]}>
              {showLabel ? (
                <Text style={[styles.author, { color: palette.muted }, mine && styles.ownAuthor]}>
                  {mine ? "Moi" : item.author}
                </Text>
              ) : null}
              <View style={[styles.bubble, { backgroundColor: palette.surface }, mine && styles.ownBubble]}>
                <Text style={[styles.message, { color: palette.ink }, mine && styles.ownMessage]}>{item.text}</Text>
                <Text style={[styles.time, mine && styles.ownTime]}>{formatTime(item.ts)}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={[styles.empty, { color: palette.muted }]}>Aucun message pour l&apos;instant.</Text>}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.composer}>
        <TextInput
          editable={!expired && Boolean(sessionId)}
          maxLength={2000}
          onChangeText={setText}
          placeholder={expired ? "Ce salon a expiré" : sessionId ? "Votre message…" : "Connexion…"}
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.surface, color: palette.ink }]}
          value={text}
        />
        <TouchableOpacity
          disabled={expired || !text.trim() || !sessionId}
          onPress={send}
          style={[styles.send, { backgroundColor: palette.ink, opacity: expired || !text.trim() || !sessionId ? 0.5 : 1 }]}
        >
          <Text style={[styles.sendText, { color: palette.background }]}>↑</Text>
        </TouchableOpacity>
      </View>

      <PseudoSheet onSubmit={setPseudo} open={!pseudo} palette={palette} />

      <Modal animationType="fade" transparent visible={confirmEnd}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Text style={[styles.modalTitle, { color: palette.ink }]}>
              {room.host ? "Terminer le salon ?" : "Supprimer le salon ?"}
            </Text>
            <Text style={[styles.modalBody, { color: palette.muted }]}>
              {room.host
                ? "Le hotspot et le serveur local seront arrêtés. L'historique local sera supprimé."
                : "Le salon et son historique seront supprimés de cet appareil uniquement."}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setConfirmEnd(false)} style={[styles.modalBtn, { borderColor: palette.line }]}>
                <Text style={{ color: palette.ink, fontWeight: "700" }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={endRoom} style={[styles.modalBtn, styles.modalDanger]}>
                <Text style={{ color: "#ffffff", fontWeight: "700" }}>{room.host ? "Terminer" : "Supprimer"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1 },
  back: { fontSize: 15, fontWeight: "700" },
  headerText: { flex: 1 },
  title: { fontSize: 19, fontWeight: "800" },
  status: { fontSize: 12, marginTop: 3 },
  menu: { fontSize: 22, fontWeight: "800", paddingHorizontal: 4 },
  menuSheet: { marginHorizontal: 16, marginTop: -8, marginBottom: 4, borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  menuItem: { paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontWeight: "600" },
  messages: { flexGrow: 1, justifyContent: "flex-end", gap: 4, padding: 16 },
  row: { maxWidth: "82%" },
  rowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  rowOther: { alignSelf: "flex-start", alignItems: "flex-start" },
  rowGap: { marginTop: 10 },
  author: { fontSize: 11, marginBottom: 4 },
  ownAuthor: { color: "#aeb7c2" },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  ownBubble: { backgroundColor: "#0f1623" },
  message: { fontSize: 15, lineHeight: 21 },
  ownMessage: { color: "#f4f6f8" },
  time: { fontSize: 10, marginTop: 4, color: "#7b8591" },
  ownTime: { color: "#aeb7c2" },
  empty: { alignSelf: "center", fontSize: 13 },
  error: { paddingHorizontal: 16, color: "#b42318", fontSize: 12 },
  composer: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 28 },
  input: { flex: 1, height: 52, paddingHorizontal: 16, borderRadius: 18 },
  send: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  sendText: { fontSize: 22, fontWeight: "700" },
  modalOverlay: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)", padding: 24 },
  modalCard: { borderWidth: 1, borderRadius: 18, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalBody: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, alignItems: "center", justifyContent: "center", height: 46, borderRadius: 12, borderWidth: 1 },
  modalDanger: { backgroundColor: "#b42318", borderColor: "#b42318" },
});
