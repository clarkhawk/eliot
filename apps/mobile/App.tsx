import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Screen = "home" | "create" | "join";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.grid} />
      {screen === "home" && <HomeScreen onCreate={() => setScreen("create")} onJoin={() => setScreen("join")} />}
      {screen === "create" && <CreateScreen onBack={() => setScreen("home")} />}
      {screen === "join" && <JoinScreen onBack={() => setScreen("home")} />}
    </View>
  );
}

function HomeScreen({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <View style={styles.content}>
      <View style={styles.mark}>
        <Text style={styles.markText}>Î</Text>
      </View>
      <Text style={styles.eyebrow}>MESSAGERIE LOCALE</Text>
      <Text style={styles.title}>Îlot</Text>
      <Text style={styles.subtitle}>Un espace temporaire pour échanger, même sans internet.</Text>

      <View style={styles.actions}>
        <TouchableOpacity activeOpacity={0.8} onPress={onCreate} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Créer un salon</Text>
          <Text style={styles.buttonArrow}>↗</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={onJoin} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Rejoindre un salon</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Aucune inscription. Aucun compte.</Text>
    </View>
  );
}

function CreateScreen({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <View style={styles.content}>
      <BackButton onPress={onBack} />
      <Text style={styles.screenTitle}>Créer un salon</Text>
      <Text style={styles.subtitle}>Configurez un espace temporaire pour échanger.</Text>
      <Text style={styles.label}>NOM DU SALON</Text>
      <TextInput
        autoCapitalize="sentences"
        maxLength={40}
        onChangeText={(value) => { setName(value); setError(""); }}
        placeholder="ex. Révisions Groupe 3"
        placeholderTextColor="#8a94a0"
        style={styles.input}
        value={name}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setError(name.trim() ? "Le réseau local sera configuré dans l'étape Android." : "Donnez un nom à votre salon.")}
        style={[styles.primaryButton, styles.formButton]}
      >
        <Text style={styles.primaryButtonText}>Continuer</Text>
        <Text style={styles.buttonArrow}>↗</Text>
      </TouchableOpacity>
    </View>
  );
}

function JoinScreen({ onBack }: { onBack: () => void }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  return (
    <View style={styles.content}>
      <BackButton onPress={onBack} />
      <Text style={styles.screenTitle}>Rejoindre</Text>
      <Text style={styles.subtitle}>Scannez une invitation ou saisissez son code.</Text>
      <View style={styles.scanPlaceholder}>
        <Text style={styles.scanTitle}>Scanner un QR code</Text>
        <Text style={styles.scanText}>Le scanner natif sera ajouté avec la permission caméra.</Text>
      </View>
      <Text style={styles.label}>CODE D'ACCÈS</Text>
      <TextInput
        autoCapitalize="characters"
        maxLength={9}
        onChangeText={(value) => { setCode(value); setMessage(""); }}
        placeholder="ex. ILOT-8924"
        placeholderTextColor="#8a94a0"
        style={styles.input}
        value={code}
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setMessage(code.trim() ? "La connexion réseau sera ajoutée avec le module Android." : "Entrez un code d'accès.")}
        style={[styles.primaryButton, styles.formButton]}
      >
        <Text style={styles.primaryButtonText}>Rejoindre le salon</Text>
        <Text style={styles.buttonArrow}>↗</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.info}>{message}</Text> : null}
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backButton}>
      <Text style={styles.backText}>‹ Accueil</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e9eef1",
  },
  grid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.18,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#0f1623",
    margin: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    marginBottom: 28,
    borderRadius: 16,
    backgroundColor: "#0f1623",
  },
  markText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  eyebrow: {
    color: "#7b8591",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  title: {
    color: "#0f1623",
    fontSize: 64,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 4,
  },
  subtitle: {
    maxWidth: 300,
    color: "#53606d",
    fontSize: 17,
    lineHeight: 25,
    marginTop: 10,
  },
  screenTitle: {
    color: "#0f1623",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 28,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  backText: {
    color: "#53606d",
    fontSize: 15,
    fontWeight: "700",
  },
  label: {
    color: "#7b8591",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 42,
    marginBottom: 8,
  },
  input: {
    height: 56,
    paddingHorizontal: 17,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    color: "#0f1623",
    fontSize: 16,
  },
  formButton: {
    marginTop: 24,
  },
  error: {
    color: "#b42318",
    fontSize: 13,
    marginTop: 10,
  },
  info: {
    color: "#53606d",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },
  scanPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
    marginTop: 30,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#cbd4db",
    backgroundColor: "#f5f7f9",
  },
  scanTitle: {
    color: "#0f1623",
    fontSize: 16,
    fontWeight: "700",
  },
  scanText: {
    maxWidth: 240,
    color: "#7b8591",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: "center",
  },
  actions: {
    gap: 12,
    marginTop: 48,
  },
  primaryButton: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    height: 58,
    paddingHorizontal: 20,
    borderRadius: 17,
    backgroundColor: "#0f1623",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonArrow: {
    color: "#f59e0b",
    fontSize: 24,
  },
  secondaryButton: {
    alignItems: "center",
    height: 58,
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#cbd4db",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: "#0f1623",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    color: "#7b8591",
    fontSize: 12,
    marginTop: 38,
    textAlign: "center",
  },
});
