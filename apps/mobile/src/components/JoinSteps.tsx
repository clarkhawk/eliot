import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Palette = { ink: string; muted: string; surface: string; line: string; accent?: string };

type Props = {
  palette: Palette;
  scanDone: boolean;
  wifiDone: boolean;
  connected: boolean;
  pseudoDone: boolean;
  onOpenWifi: () => void;
};

function StepRow({
  done,
  active,
  label,
  palette,
  action,
}: {
  done: boolean;
  active: boolean;
  label: string;
  palette: Palette;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={[styles.row, { borderColor: palette.line, backgroundColor: palette.surface }]}>
      <Text style={[styles.bullet, { color: done ? "#16a34a" : active ? "#f59e0b" : palette.muted }]}>
        {done ? "✓" : active ? "●" : "○"}
      </Text>
      <Text style={[styles.label, { color: palette.ink, flex: 1 }]}>{label}</Text>
      {action && !done ? (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={[styles.action, { color: palette.ink }]}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function JoinSteps({ palette, scanDone, wifiDone, connected, pseudoDone, onOpenWifi }: Props) {
  if (scanDone && wifiDone && connected && pseudoDone) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: palette.muted }]}>REJOINDRE LE SALON</Text>
      <StepRow active={!scanDone} done={scanDone} label="Invitation scannée" palette={palette} />
      <StepRow
        action={{ label: "Wi‑Fi", onPress: onOpenWifi }}
        active={scanDone && !wifiDone}
        done={wifiDone}
        label="Réseau local de l'hôte"
        palette={palette}
      />
      <StepRow active={wifiDone && !connected} done={connected} label="Connexion au salon" palette={palette} />
      <StepRow active={connected && !pseudoDone} done={pseudoDone} label="Choix du pseudo" palette={palette} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 12 },
  bullet: { fontSize: 14, fontWeight: "800", width: 18, textAlign: "center" },
  label: { fontSize: 13 },
  action: { fontSize: 12, fontWeight: "700", textDecorationLine: "underline" },
});
