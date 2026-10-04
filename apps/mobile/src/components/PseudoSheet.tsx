import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { preferences } from "../shared/storage";

type Props = {
  open: boolean;
  initial?: string;
  onSubmit: (pseudo: string) => void;
  palette: { ink: string; muted: string; surface: string; line: string; field: string; background: string };
};

export function PseudoSheet({ open, initial = "", onSubmit, palette }: Props) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && !value && initial) setValue(initial);
  }, [open, initial, value]);

  function submit() {
    const trimmed = value.trim().slice(0, 20);
    if (!trimmed) return;
    try {
      preferences.setPseudo(trimmed);
      onSubmit(trimmed);
      setError("");
    } catch {
      setError("Impossible d'enregistrer le pseudo sur cet appareil.");
    }
  }

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.title, { color: palette.ink }]}>Votre pseudo</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            Choisissez le nom affiché aux autres participants.
          </Text>
          <Text style={[styles.label, { color: palette.muted }]}>PSEUDO</Text>
          <TextInput
            autoFocus
            maxLength={20}
            onChangeText={setValue}
            onSubmitEditing={submit}
            placeholder="ex. Rossi"
            placeholderTextColor={palette.muted}
            returnKeyType="done"
            style={[styles.input, { backgroundColor: palette.field, color: palette.ink }]}
            value={value}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            disabled={!value.trim()}
            onPress={submit}
            style={[styles.button, { backgroundColor: palette.ink, opacity: value.trim() ? 1 : 0.5 }]}
          >
            <Text style={[styles.buttonText, { color: palette.background }]}>Entrer dans le salon</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 36 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginTop: 20, marginBottom: 8 },
  input: { height: 52, paddingHorizontal: 16, borderRadius: 14, fontSize: 16 },
  error: { color: "#d0443e", fontSize: 13, marginTop: 8 },
  button: { marginTop: 20, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  buttonText: { fontSize: 15, fontWeight: "700" },
});
