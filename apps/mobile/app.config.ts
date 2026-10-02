import rootPackage from "../../package.json";

const config = {
  expo: {
    name: "Îlot",
    slug: "ilot",
    version: rootPackage.version,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    android: {
      package: "com.salomon.ilot",
      permissions: ["CAMERA", "NEARBY_WIFI_DEVICES", "CHANGE_WIFI_STATE", "FOREGROUND_SERVICE"],
      adaptiveIcon: {
        backgroundColor: "#0f1623",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false
    },
    web: { favicon: "./assets/favicon.png" },
    plugins: [
      "expo-sqlite",
      "expo-camera",
      ["expo-splash-screen", {
        backgroundColor: "#e9eef1",
        image: "./assets/splash-icon.png",
        imageWidth: 160,
        dark: { backgroundColor: "#101725", image: "./assets/splash-icon.png" }
      }],
      ["expo-build-properties", { android: { usesCleartextTraffic: true } }]
    ]
  }
};

export default config;