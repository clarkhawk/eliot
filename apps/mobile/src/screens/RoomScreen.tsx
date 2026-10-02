import type { ChatMessage, InvitePayload, Room } from "@ilot/shared";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useId, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WebSocketTransport } from "../shared/WebSocketTransport";
import { getMessages, saveMessage, saveRoom } from "../shared/storage";
import { IlotNetwork } from "../native/IlotNetwork";

type Props = { room: Room; invite: InvitePayload; pseudo: string; onBack: () => void };

export function RoomScreen({ room, invite, pseudo, onBack }: Props) {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const clientId = useId();
  const [sessionId, setSessionId] = useState(clientId);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("hors ligne");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const transportRef = useRef<WebSocketTransport | null>(null);
  const expired = room.expiresAt <= now;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    getMessages(db, room.code).then((stored) => { if (active) setMessages(stored); }).catch(() => setError("Impossible de lire l'historique local."));
    if (!invite.url || expired) return () => { active = false; };

    const transport = new WebSocketTransport({
      url: invite.url,
      invite,
      clientId,
      pseudo,
      onStatus: setStatus,
      onError: setError,
      onPacket: (packet) => {
        if (packet.type === "history") {
          Promise.all(packet.messages.map((message) => saveMessage(db, message))).then(() => setMessages(packet.messages)).catch(() => setError("Impossible d'enregistrer l'historique local."));
        }
        if (packet.type === "message") {
          saveMessage(db, packet.message).then(() => setMessages((current) => current.some((item) => item.id === packet.message.id) ? current : [...current, packet.message])).catch(() => setError("Impossible d'enregistrer le message localement."));
        }
        if (packet.type === "ready") {
          if (packet.sessionId) setSessionId(packet.sessionId);
          saveRoom(db, packet.room).catch(() => setError("Impossible d'enregistrer le salon localement."));
        }
        if (packet.type === "error") setError(packet.message);
      },
    });
    transportRef.current = transport;
    const connect = async () => {
      if (invite.ssid && invite.password) await IlotNetwork.joinNetwork(invite.ssid, invite.password);
      transport.connect();
    };
    connect().catch(() => setError("Android n'a pas pu rejoindre le réseau local."));
    return () => { active = false; transport.close(); transportRef.current = null; };
  }, [clientId, db, expired, invite, pseudo, room.code]);

  function send() {
    const value = text.trim();
    if (!value || expired || !invite.url) return;
    const message: Omit<ChatMessage, "roomCode"> = {
      id: `${clientId}-${Date.now()}`,
      authorId: clientId,
      author: pseudo,
      text: value.slice(0, 2000),
      ts: Date.now(),
    };
    setText("");
    transportRef.current?.sendMessage(message);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.back}>‹ Accueil</Text></TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{room.name}</Text>
          <Text style={styles.status}>{expired ? "salon expiré · lecture seule" : status}</Text>
        </View>
      </View>
      <FlatList
        contentContainerStyle={styles.messages}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <View style={[styles.bubble, item.authorId === clientId && styles.ownBubble]}><Text style={styles.author}>{item.author}</Text><Text style={styles.message}>{item.text}</Text></View>}
        ListEmptyComponent={<Text style={styles.empty}>Aucun message pour l’instant.</Text>}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.composer}>
        <TextInput editable={!expired} maxLength={2000} onChangeText={setText} placeholder={expired ? "Ce salon a expiré" : "Votre message…"} style={styles.input} value={text} />
        <TouchableOpacity disabled={expired || !text.trim()} onPress={send} style={styles.send}><Text style={styles.sendText}>↑</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e9eef1" },
  header: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#cbd4db" },
  back: { color: "#53606d", fontSize: 15, fontWeight: "700" },
  headerText: { flex: 1 },
  title: { color: "#0f1623", fontSize: 19, fontWeight: "800" },
  status: { color: "#7b8591", fontSize: 12, marginTop: 3 },
  messages: { flexGrow: 1, justifyContent: "flex-end", gap: 8, padding: 16 },
  bubble: { alignSelf: "flex-start", maxWidth: "82%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: "#ffffff" },
  ownBubble: { alignSelf: "flex-end", backgroundColor: "#0f1623" },
  author: { color: "#7b8591", fontSize: 11, marginBottom: 3 },
  message: { color: "#0f1623", fontSize: 15 },
  empty: { alignSelf: "center", color: "#7b8591", fontSize: 13 },
  error: { paddingHorizontal: 16, color: "#b42318", fontSize: 12 },
  composer: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 28 },
  input: { flex: 1, height: 52, paddingHorizontal: 16, borderRadius: 18, backgroundColor: "#ffffff", color: "#0f1623" },
  send: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#0f1623" },
  sendText: { color: "#ffffff", fontSize: 22, fontWeight: "700" },
});
