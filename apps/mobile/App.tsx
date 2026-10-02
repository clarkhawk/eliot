import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { useColorScheme, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { parseInvite, type InvitePayload, type Room } from "@ilot/shared";
import { Logo } from "./src/components/Logo";
import { Scanner } from "./src/screens/Scanner";
import { RoomScreen } from "./src/screens/RoomScreen";
import { IlotNetwork } from "./src/native/IlotNetwork";
import { migrateDatabase, saveRoom } from "./src/shared/storage";

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

  const enterRoom = (nextRoom: Room, nextInvite: InvitePayload) => { setRoom(nextRoom); setInvite(nextInvite); setScreen("room"); };
  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar style={dark ? "light" : "dark"} />
      {screen === "home" && <HomeScreen palette={palette} dark={dark} onTheme={() => setDark((value) => !value)} onCreate={() => setScreen("create")} onJoin={() => setScreen("join")} />}
      {screen === "create" && <CreateScreen palette={palette} onBack={() => setScreen("home")} onRoom={enterRoom} />}
      {screen === "join" && <JoinScreen palette={palette} onBack={() => setScreen("home")} onRoom={enterRoom} />}
      {screen === "room" && room && invite && <RoomScreen room={room} invite={invite} pseudo="Moi" onBack={() => setScreen("home")} />}
    </View>
  );
}

function HomeScreen({ palette, dark, onTheme, onCreate, onJoin }: { palette: Palette; dark: boolean; onTheme: () => void; onCreate: () => void; onJoin: () => void }) {
  return <View style={styles.content}>
    <View style={styles.topline}><View style={[styles.logoBox, { backgroundColor: palette.ink }]}><Logo size={42} color={palette.background} /></View><TouchableOpacity onPress={onTheme} style={[styles.themeButton, { borderColor: palette.line }]}><Text style={{ color: palette.ink }}>{dark ? "☼" : "☾"}</Text></TouchableOpacity></View>
    <Text style={[styles.eyebrow, { color: palette.muted }]}>MESSAGERIE LOCALE</Text>
    <Text style={[styles.title, { color: palette.ink }]}>Îlot</Text>
    <Text style={[styles.subtitle, { color: palette.muted }]}>Un espace temporaire pour échanger, même sans internet.</Text>
    <View style={styles.actions}><ActionButton palette={palette} primary onPress={onCreate} label="Créer un salon" /><ActionButton palette={palette} onPress={onJoin} label="Rejoindre un salon" /></View>
    <Text style={[styles.footer, { color: palette.muted }]}>Aucune inscription. Aucun compte.</Text>
  </View>;
}

function ActionButton({ palette, primary, onPress, label }: { palette: Palette; primary?: boolean; onPress: () => void; label: string }) {
  return <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.action, { backgroundColor: primary ? palette.ink : palette.surface, borderColor: palette.line }]}><Text style={{ color: primary ? palette.background : palette.ink, fontSize: 16, fontWeight: "700" }}>{label}</Text><Text style={{ color: primary ? "#f59e0b" : palette.muted, fontSize: 22 }}>{primary ? "↗" : "›"}</Text></TouchableOpacity>;
}

function CreateScreen({ palette, onBack, onRoom }: { palette: Palette; onBack: () => void; onRoom: (room: Room, invite: InvitePayload) => void }) {
  const db = useSQLiteContext();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState({ hours: 0, minutes: 50, seconds: 0 });
  const [error, setError] = useState("");
  const update = (key: keyof typeof duration, value: number) => setDuration((current) => ({ ...current, [key]: value }));
  return <View style={styles.content}>
    <BackButton palette={palette} onPress={onBack} /><Text style={[styles.screenTitle, { color: palette.ink }]}>Créer un salon</Text><Text style={[styles.subtitle, { color: palette.muted }]}>Configurez un espace temporaire pour échanger.</Text>
    <Text style={[styles.label, { color: palette.muted }]}>NOM DU SALON</Text><TextInput maxLength={40} onChangeText={(value) => { setName(value); setError(""); }} placeholder="ex. Révisions Groupe 3" placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.field, color: palette.ink }]} value={name} />
    <Text style={[styles.label, { color: palette.muted }]}>EXPIRATION</Text><View style={styles.wheels}><Wheel palette={palette} label="heures" value={duration.hours} max={23} onChange={(value) => update("hours", value)} /><Wheel palette={palette} label="minutes" value={duration.minutes} max={59} onChange={(value) => update("minutes", value)} /><Wheel palette={palette} label="secondes" value={duration.seconds} max={59} onChange={(value) => update("seconds", value)} /></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <TouchableOpacity activeOpacity={0.8} onPress={async () => { const durationMs = (duration.hours * 3600 + duration.minutes * 60 + duration.seconds) * 1000; if (!name.trim()) return setError("Donnez un nom à votre salon."); if (durationMs < 60000) return setError("Choisissez au moins une minute."); try { const invite = await IlotNetwork.startHost(name.trim(), Date.now() + durationMs); const nextRoom = { code: invite.code, name: invite.salon, createdAt: Date.now(), expiresAt: invite.exp, host: true }; await saveRoom(db, nextRoom); onRoom(nextRoom, invite); } catch (cause) { setError(cause instanceof Error ? cause.message : "Le dev client Android est requis."); } }} style={[styles.action, styles.formButton, { backgroundColor: palette.ink }]}><Text style={{ color: palette.background, fontSize: 16, fontWeight: "700" }}>Continuer</Text><Text style={{ color: "#f59e0b", fontSize: 22 }}>↗</Text></TouchableOpacity>
  </View>;
}

function Wheel({ palette, label, value, max, onChange }: { palette: Palette; label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <View style={styles.wheel}><TouchableOpacity onPress={() => onChange(value === max ? 0 : value + 1)}><Text style={[styles.wheelArrow, { color: palette.muted }]}>▲</Text></TouchableOpacity><Text style={[styles.wheelValue, { color: palette.ink }]}>{String(value).padStart(2, "0")}</Text><TouchableOpacity onPress={() => onChange(value === 0 ? max : value - 1)}><Text style={[styles.wheelArrow, { color: palette.muted }]}>▼</Text></TouchableOpacity><Text style={[styles.wheelLabel, { color: palette.muted }]}>{label}</Text></View>;
}

function JoinScreen({ palette, onBack, onRoom }: { palette: Palette; onBack: () => void; onRoom: (room: Room, invite: InvitePayload) => void }) {
  const db = useSQLiteContext(); const [code, setCode] = useState(""); const [message, setMessage] = useState("");
  const accept = (raw: string) => { const parsed = parseInvite(raw); if (!parsed || typeof parsed === "string" || !parsed.url) return setMessage("Cette invitation est invalide, expirée ou incomplète."); const nextRoom = { code: parsed.code, name: parsed.salon, createdAt: Date.now(), expiresAt: parsed.exp, host: false }; saveRoom(db, nextRoom).then(() => onRoom(nextRoom, parsed)).catch(() => setMessage("Impossible d'enregistrer le salon sur cet appareil.")); };
  return <View style={styles.content}><BackButton palette={palette} onPress={onBack} /><Text style={[styles.screenTitle, { color: palette.ink }]}>Rejoindre</Text><Text style={[styles.subtitle, { color: palette.muted }]}>Scannez l'invitation de l'hôte.</Text><Scanner onScan={accept} /><Text style={[styles.label, { color: palette.muted }]}>CODE D'ACCÈS</Text><TextInput autoCapitalize="characters" maxLength={11} onChangeText={(value) => { setCode(value); setMessage(""); }} placeholder="ex. ILOT-A7K2Q9" placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.field, color: palette.ink }]} value={code} /><TouchableOpacity onPress={() => setMessage("Scannez le QR complet pour rejoindre le réseau local.")} style={[styles.action, styles.formButton, { backgroundColor: palette.ink }]}><Text style={{ color: palette.background, fontSize: 16, fontWeight: "700" }}>Rejoindre le salon</Text><Text style={{ color: "#f59e0b", fontSize: 22 }}>↗</Text></TouchableOpacity>{message ? <Text style={styles.info}>{message}</Text> : null}</View>;
}

function BackButton({ palette, onPress }: { palette: Palette; onPress: () => void }) { return <TouchableOpacity onPress={onPress} style={styles.backButton}><Text style={{ color: palette.muted, fontSize: 15, fontWeight: "700" }}>‹ Accueil</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { flex: 1, justifyContent: "center", paddingHorizontal: 28 }, topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }, logoBox: { alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 18 }, themeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 21 }, eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.6 }, title: { fontSize: 64, fontWeight: "800", marginTop: 4 }, subtitle: { maxWidth: 320, fontSize: 17, lineHeight: 25, marginTop: 10 }, actions: { gap: 12, marginTop: 48 }, action: { minHeight: 58, paddingHorizontal: 20, alignItems: "center", flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderRadius: 17 }, footer: { fontSize: 12, marginTop: 38, textAlign: "center" }, screenTitle: { fontSize: 34, fontWeight: "800", marginTop: 28 }, backButton: { alignSelf: "flex-start", paddingVertical: 8 }, label: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginTop: 32, marginBottom: 8 }, input: { height: 56, paddingHorizontal: 17, borderRadius: 16, fontSize: 16 }, formButton: { marginTop: 24 }, error: { color: "#d0443e", fontSize: 13, marginTop: 10 }, info: { color: "#d0443e", fontSize: 13, lineHeight: 19, marginTop: 16 }, wheels: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 8 }, wheel: { alignItems: "center", minWidth: 82 }, wheelArrow: { fontSize: 13, padding: 4 }, wheelValue: { fontSize: 30, fontWeight: "800", paddingVertical: 4 }, wheelLabel: { fontSize: 11, marginTop: 4 }
});
