import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import { parseInvite, type InvitePayload, type Room } from "@ilot/shared";
import { IlotNetwork } from "ilot-network";
import { Logo } from "./src/components/Logo";
import { Scanner } from "./src/screens/Scanner";
import { RoomScreen } from "./src/screens/RoomScreen";
import { formatRemaining } from "./src/shared/format";
import { getInvite, getRooms, migrateDatabase, saveRoom } from "./src/shared/storage";

SplashScreen.preventAutoHideAsync();

const LIGHT = { background: "#e9eef1", surface: "#ffffff", ink: "#0f1623", muted: "#5f6b78", line: "#cbd4db", field: "#f5f7f9" };
const DARK = { background: "#101725", surface: "#182233", ink: "#f4f6f8", muted: "#aeb7c2", line: "#344154", field: "#202d40" };
type Palette = typeof LIGHT;
type Screen = "home" | "create" | "join" | "room";

export default function App() {
  return <SQLiteProvider databaseName="ilot.db" onInit={migrateDatabase}><MobileApp /></SQLiteProvider>;
}

function MobileApp() {
  const systemDark = useColorScheme() === "dark";
  const [dark, setDark] = useState(systemDark);
  const [screen, setScreen] = useState<Screen>("home");
  const [room, setRoom] = useState<Room | null>(null);
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const palette = dark ? DARK : LIGHT;

  useEffect(() => { SplashScreen.hideAsync(); }, []);

  const [guestJoin, setGuestJoin] = useState(false);

  const enterRoom = useCallback((nextRoom: Room, nextInvite: InvitePayload, options?: { guestJoin?: boolean }) => {
    setRoom(nextRoom);
    setInvite(nextInvite);
    setGuestJoin(Boolean(options?.guestJoin));
    setScreen("room");
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar style={dark ? "light" : "dark"} />
      {screen === "home" && (
        <HomeScreen
          palette={palette}
          dark={dark}
          onCreate={() => setScreen("create")}
          onJoin={() => setScreen("join")}
          onRoom={enterRoom}
          onTheme={() => setDark((value) => !value)}
        />
      )}
      {screen === "create" && <CreateScreen palette={palette} onBack={() => setScreen("home")} onRoom={enterRoom} />}
      {screen === "join" && <JoinScreen palette={palette} onBack={() => setScreen("home")} onRoom={enterRoom} />}
      {screen === "room" && room && invite && (
        <RoomScreen guestJoin={guestJoin} invite={invite} onBack={() => setScreen("home")} palette={palette} room={room} />
      )}
    </View>
  );
}

function HomeScreen({
  palette,
  dark,
  onTheme,
  onCreate,
  onJoin,
  onRoom,
}: {
  palette: Palette;
  dark: boolean;
  onTheme: () => void;
  onCreate: () => void;
  onJoin: () => void;
  onRoom: (room: Room, invite: InvitePayload, options?: { guestJoin?: boolean }) => void;
}) {
  const db = useSQLiteContext();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    getRooms(db).then(setRooms).catch(() => setRooms([]));
  }, [db]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  async function openRoom(entry: Room) {
    const stored = await getInvite(db, entry.code);
    const fallback: InvitePayload = { v: 1, salon: entry.name, code: entry.code, exp: entry.expiresAt };
    onRoom(entry, stored ?? fallback);
  }

  return (
    <ScrollView contentContainerStyle={styles.homeScroll} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topline}>
          <View style={[styles.logoBox, { backgroundColor: palette.ink }]}>
            <Logo color={palette.background} size={42} />
          </View>
          <TouchableOpacity onPress={onTheme} style={[styles.themeButton, { borderColor: palette.line }]}>
            <Text style={{ color: palette.ink }}>{dark ? "☼" : "☾"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.eyebrow, { color: palette.muted }]}>MESSAGERIE LOCALE</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Îlot</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>Un espace temporaire pour échanger, même sans internet.</Text>
        <View style={styles.actions}>
          <ActionButton label="Créer un salon" onPress={onCreate} palette={palette} primary />
          <ActionButton label="Rejoindre un salon" onPress={onJoin} palette={palette} />
        </View>
        {rooms.length > 0 ? (
          <View style={styles.recent}>
            <Text style={[styles.recentTitle, { color: palette.muted }]}>SALONS RÉCENTS</Text>
            {rooms.slice(0, 6).map((entry) => {
              const left = entry.expiresAt - now;
              const expired = left <= 0;
              return (
                <TouchableOpacity
                  key={entry.code}
                  onPress={() => openRoom(entry)}
                  style={[styles.recentRow, { borderColor: palette.line, backgroundColor: palette.surface }]}
                >
                  <View style={[styles.recentDot, { backgroundColor: expired ? palette.muted : "#f59e0b" }]} />
                  <View style={styles.recentText}>
                    <Text numberOfLines={1} style={[styles.recentName, { color: palette.ink }]}>{entry.name}</Text>
                    <Text style={[styles.recentMeta, { color: palette.muted }]}>
                      {entry.code} · {expired ? "expiré" : formatRemaining(left)}
                    </Text>
                  </View>
                  <Text style={{ color: palette.muted, fontSize: 20 }}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
        <Text style={[styles.footer, { color: palette.muted }]}>Aucune inscription. Aucun compte.</Text>
      </View>
    </ScrollView>
  );
}

function ActionButton({ palette, primary, onPress, label }: { palette: Palette; primary?: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.action, { backgroundColor: primary ? palette.ink : palette.surface, borderColor: palette.line }]}>
      <Text style={{ color: primary ? palette.background : palette.ink, fontSize: 16, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: primary ? "#f59e0b" : palette.muted, fontSize: 22 }}>{primary ? "↗" : "›"}</Text>
    </TouchableOpacity>
  );
}

function CreateScreen({ palette, onBack, onRoom }: { palette: Palette; onBack: () => void; onRoom: (room: Room, invite: InvitePayload, options?: { guestJoin?: boolean }) => void }) {
  const db = useSQLiteContext();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState({ hours: 0, minutes: 50, seconds: 0 });
  const [error, setError] = useState("");
  const update = (key: keyof typeof duration, value: number) => setDuration((current) => ({ ...current, [key]: value }));
  return (
    <View style={styles.content}>
      <BackButton onPress={onBack} palette={palette} />
      <Text style={[styles.screenTitle, { color: palette.ink }]}>Créer un salon</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>Configurez un espace temporaire pour échanger.</Text>
      <Text style={[styles.label, { color: palette.muted }]}>NOM DU SALON</Text>
      <TextInput maxLength={40} onChangeText={(value) => { setName(value); setError(""); }} placeholder="ex. Révisions Groupe 3" placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.field, color: palette.ink }]} value={name} />
      <Text style={[styles.label, { color: palette.muted }]}>EXPIRATION</Text>
      <View style={styles.wheels}>
        <Wheel label="heures" max={23} onChange={(value) => update("hours", value)} palette={palette} value={duration.hours} />
        <Wheel label="minutes" max={59} onChange={(value) => update("minutes", value)} palette={palette} value={duration.minutes} />
        <Wheel label="secondes" max={59} onChange={(value) => update("seconds", value)} palette={palette} value={duration.seconds} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={async () => {
          const durationMs = (duration.hours * 3600 + duration.minutes * 60 + duration.seconds) * 1000;
          if (!name.trim()) return setError("Donnez un nom à votre salon.");
          if (durationMs < 60000) return setError("Choisissez au moins une minute.");
          try {
            const nextInvite = await IlotNetwork.startHost(name.trim(), Date.now() + durationMs);
            const nextRoom = { code: nextInvite.code, name: nextInvite.salon, createdAt: Date.now(), expiresAt: nextInvite.exp, host: true };
            await saveRoom(db, nextRoom, nextInvite);
            onRoom(nextRoom, nextInvite);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Le dev client Android est requis.");
          }
        }}
        style={[styles.action, styles.formButton, { backgroundColor: palette.ink }]}
      >
        <Text style={{ color: palette.background, fontSize: 16, fontWeight: "700" }}>Continuer</Text>
        <Text style={{ color: "#f59e0b", fontSize: 22 }}>↗</Text>
      </TouchableOpacity>
    </View>
  );
}

function Wheel({ palette, label, value, max, onChange }: { palette: Palette; label: string; value: number; max: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.wheel}>
      <TouchableOpacity onPress={() => onChange(value === max ? 0 : value + 1)}><Text style={[styles.wheelArrow, { color: palette.muted }]}>▲</Text></TouchableOpacity>
      <Text style={[styles.wheelValue, { color: palette.ink }]}>{String(value).padStart(2, "0")}</Text>
      <TouchableOpacity onPress={() => onChange(value === 0 ? max : value - 1)}><Text style={[styles.wheelArrow, { color: palette.muted }]}>▼</Text></TouchableOpacity>
      <Text style={[styles.wheelLabel, { color: palette.muted }]}>{label}</Text>
    </View>
  );
}

function JoinScreen({ palette, onBack, onRoom }: { palette: Palette; onBack: () => void; onRoom: (room: Room, invite: InvitePayload, options?: { guestJoin?: boolean }) => void }) {
  const db = useSQLiteContext();
  const [message, setMessage] = useState("");
  const accept = (raw: string) => {
    const parsed = parseInvite(raw);
    if (!parsed || typeof parsed === "string" || !parsed.url) {
      return setMessage("Cette invitation est invalide, expirée ou incomplète.");
    }
    const nextRoom = { code: parsed.code, name: parsed.salon, createdAt: Date.now(), expiresAt: parsed.exp, host: false };
    saveRoom(db, nextRoom, parsed)
      .then(() => onRoom(nextRoom, parsed, { guestJoin: true }))
      .catch(() => setMessage("Impossible d'enregistrer le salon sur cet appareil."));
  };
  return (
    <View style={styles.content}>
      <BackButton onPress={onBack} palette={palette} />
      <Text style={[styles.screenTitle, { color: palette.ink }]}>Rejoindre</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>Scannez l&apos;invitation de l&apos;hôte.</Text>
      <Scanner onScan={accept} />
      <Text style={[styles.info, { color: palette.muted, marginTop: 24 }]}>
        Le QR code contient les paramètres réseau. La saisie manuelle du code seul ne suffit pas pour rejoindre un salon distant.
      </Text>
      {message ? <Text style={styles.info}>{message}</Text> : null}
    </View>
  );
}

function BackButton({ palette, onPress }: { palette: Palette; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backButton}>
      <Text style={{ color: palette.muted, fontSize: 15, fontWeight: "700" }}>‹ Accueil</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  homeScroll: { flexGrow: 1 },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 32 },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  logoBox: { alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 18 },
  themeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 21 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.6 },
  title: { fontSize: 64, fontWeight: "800", marginTop: 4 },
  subtitle: { maxWidth: 320, fontSize: 17, lineHeight: 25, marginTop: 10 },
  actions: { gap: 12, marginTop: 48 },
  action: { minHeight: 58, paddingHorizontal: 20, alignItems: "center", flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderRadius: 17 },
  footer: { fontSize: 12, marginTop: 38, textAlign: "center" },
  recent: { marginTop: 36, gap: 8 },
  recentTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 16 },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentText: { flex: 1, minWidth: 0 },
  recentName: { fontSize: 15, fontWeight: "700" },
  recentMeta: { fontSize: 11, marginTop: 2, fontFamily: "monospace" },
  screenTitle: { fontSize: 34, fontWeight: "800", marginTop: 28 },
  backButton: { alignSelf: "flex-start", paddingVertical: 8 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginTop: 32, marginBottom: 8 },
  input: { height: 56, paddingHorizontal: 17, borderRadius: 16, fontSize: 16 },
  formButton: { marginTop: 24 },
  error: { color: "#d0443e", fontSize: 13, marginTop: 10 },
  info: { color: "#d0443e", fontSize: 13, lineHeight: 19, marginTop: 16 },
  wheels: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8 },
  wheel: { alignItems: "center", minWidth: 82 },
  wheelArrow: { fontSize: 13, padding: 4 },
  wheelValue: { fontSize: 30, fontWeight: "800", paddingVertical: 4 },
  wheelLabel: { fontSize: 11, marginTop: 4 },
});
