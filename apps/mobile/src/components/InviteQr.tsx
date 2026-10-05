import type { InvitePayload } from "@ilot/shared";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type Palette = { ink: string; muted: string; surface: string; line: string };

type Props = {
  invite: InvitePayload;
  palette: Palette;
  expanded: boolean;
  onToggle: () => void;
};

export function InviteQrPanel({ invite, palette, expanded, onToggle }: Props) {
  const payload = JSON.stringify(invite);

  async function shareInvite() {
    await Share.share({ message: payload, title: `Invitation ${invite.code}` });
  }

  return (
    <View style={[styles.wrap, { borderBottomColor: palette.line }]}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={onToggle} style={styles.toggle}>
          <Text style={[styles.toggleText, { color: palette.ink }]}>
            {expanded ? "Masquer l'invitation ▲" : "Inviter · QR code ▼"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={shareInvite}>
          <Text style={[styles.share, { color: palette.muted }]}>Partager</Text>
        </TouchableOpacity>
      </View>
      {expanded ? (
        <View style={styles.body}>
          <View style={styles.qrBox}>
            <QRCode backgroundColor="#ffffff" color="#0f1623" size={148} value={payload} />
          </View>
          <Text style={[styles.code, { color: palette.muted }]}>{invite.code}</Text>
          <Text style={[styles.label, { color: palette.muted }]}>
            Faites scanner ce QR code pour rejoindre le salon.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: 1 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  toggle: { flex: 1 },
  toggleText: { fontSize: 14, fontWeight: "700" },
  share: { fontSize: 13, fontWeight: "700" },
  body: { alignItems: "center", paddingBottom: 12, paddingHorizontal: 16, gap: 8 },
  qrBox: { padding: 10, borderRadius: 16, backgroundColor: "#ffffff" },
  code: { fontFamily: "monospace", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  label: { fontSize: 12, lineHeight: 17, textAlign: "center", maxWidth: 260 },
});
