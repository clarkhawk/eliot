import type { InvitePayload } from "@ilot/shared";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type Props = { invite: InvitePayload; label?: string };

export function InviteQr({ invite, label = "Faites scanner ce QR code pour rejoindre le salon." }: Props) {
  const payload = JSON.stringify(invite);
  return (
    <View style={styles.wrap}>
      <View style={styles.qrBox}>
        <QRCode backgroundColor="#ffffff" color="#0f1623" size={168} value={payload} />
      </View>
      <Text style={styles.code}>{invite.code}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  qrBox: { padding: 12, borderRadius: 16, backgroundColor: "#ffffff" },
  code: { fontFamily: "monospace", fontSize: 13, fontWeight: "700", color: "#53606d", letterSpacing: 0.5 },
  label: { fontSize: 12, lineHeight: 17, textAlign: "center", color: "#7b8591", maxWidth: 260 },
});
