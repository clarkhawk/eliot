import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = { onScan: (value: string) => void };

export function Scanner({ onScan }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  function handleScan(data: string) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    onScan(data);
  }

  if (!permission?.granted) {
    return (
      <TouchableOpacity onPress={requestPermission} style={styles.permission}>
        <Text style={styles.permissionText}>Autoriser la caméra pour scanner</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.frame}>
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => handleScan(data)}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.corner} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 190, overflow: "hidden", borderRadius: 22, backgroundColor: "#dce3e8" },
  corner: { position: "absolute", inset: 28, borderWidth: 2, borderColor: "#ffffff", borderRadius: 12 },
  permission: { height: 190, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#f5f7f9" },
  permissionText: { color: "#0f1623", fontWeight: "700" },
});
