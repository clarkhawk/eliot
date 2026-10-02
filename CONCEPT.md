# Îlot

Îlot est une messagerie temporaire en réseau local. La pile retenue est **React Native avec Expo**, complétée par un **module natif Kotlin Android** pour les fonctions que JavaScript ne peut pas fournir : hotspot, association Wi-Fi et service réseau en premier plan.

Le web est une démonstration locale. Il conserve les messages dans le navigateur et n'établit pas de connexion entre appareils.

## Périmètre du MVP

- créer un salon Android avec une expiration ;
- démarrer un `LocalOnlyHotspot` et un serveur WebSocket local ;
- rejoindre avec un QR scanné par `expo-camera` ;
- connecter le client mobile au Wi-Fi puis au WebSocket ;
- afficher l'historique SQLite et les nouveaux messages ;
- passer automatiquement en lecture seule après expiration ;
- conserver une règle unique : une invitation expirée est refusée partout.

## Architecture mobile

### JavaScript / TypeScript

`apps/mobile` contient l'application Expo, l'écran de salon, le scanner QR, `WebSocketTransport` et le stockage SQLite (`expo-sqlite`). Le paquet `packages/shared` contient les types, le protocole de paquets et `parseInvite`, utilisé par le web et le mobile.

### Module Kotlin

`apps/mobile/modules/ilot-network` est un module Expo local, inclus dans les builds EAS du dev client.

| Responsabilité | API Android |
|---|---|
| Créer le réseau hôte | `WifiManager.LocalOnlyHotspot` |
| Rejoindre le réseau invité | `WifiNetworkSuggestion` |
| Maintenir le serveur actif | `ForegroundService` |
| Relayer le chat | `Java-WebSocket` embarqué |

Le service garde en mémoire les messages du salon et renvoie `ready`, `history` et `message`. Chaque client persiste ensuite l'historique dans SQLite. Le stockage local reste disponible après expiration, mais l'envoi et la reconnexion sont bloqués.

## Flux réseau

1. L'hôte demande un hotspot local, puis démarre le service premier plan et le serveur WebSocket.
2. Le module renvoie une invitation JSON contenant le salon, le code, l'expiration, le SSID, le mot de passe et l'URL `ws://` locale.
3. L'invité scanne le QR, `parseInvite` valide l'expiration, puis `WifiNetworkSuggestion` demande à Android de rejoindre le réseau.
4. `WebSocketTransport` envoie un paquet `hello`, reçoit l'historique, puis échange les paquets de messages.

## Choix assumés

- **Android en priorité** : les APIs de hotspot et de connexion Wi-Fi n'ont pas d'équivalent web fiable et leur équivalent iOS impose une autre architecture.
- **Dev client EAS** : Expo Go ne contient pas le module Kotlin. Utiliser `npm run build:preview` depuis `apps/mobile` pour générer l'APK de test.
- **`ws://` en réseau local** : un certificat TLS valide n'est pas réaliste pour l'adresse privée temporaire d'un hotspot. `usesCleartextTraffic: true` est donc déclaré explicitement dans `app.json` pour ce prototype.
- **Données locales** : aucune synchronisation internet ni compte utilisateur. Le QR mobile est le mécanisme de transmission des paramètres du réseau.

## Permissions Android

La configuration demande `CAMERA`, `NEARBY_WIFI_DEVICES`, `CHANGE_WIFI_STATE` et `FOREGROUND_SERVICE`. Android peut encore afficher une confirmation système pour l'association Wi-Fi.

## Limites et suite

Le serveur est limité à l'appareil hôte et à la durée de vie du service. La découverte globale par nom, les fichiers, une persistance serveur plus robuste et une éventuelle version iOS sont hors MVP.
