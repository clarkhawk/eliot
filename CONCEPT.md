# Îlot

Messagerie offline en réseau local — créez un salon, partagez un QR code, discutez sans internet.

Remake du projet PHP original **Opal Talk**, repensé pour Android (react natif) sous le nom **Îlot**, avec une architecture 100 % locale (hotspot + WebSocket).

## Concept

L'utilisateur peut :
- **Créer un salon** : lui donner un nom, une date d'expiration, puis générer un lien et un QR code de partage
- **Rejoindre un salon** : en scannant le QR code, ou en tapant le nom d'un salon déjà rejoint auparavant (recherché dans l'historique local)

Tout fonctionne **sans connexion internet**, via un réseau local créé par l'appareil hôte.

## Fonctionnalités du MVP

- Création de salon avec nom + date d'expiration
- Génération automatique d'un QR code et d'un lien de partage
- Connexion au salon par scan QR ou saisie du nom (salons déjà rejoints)
- Messagerie texte simple, en temps réel
- Historique des messages conservé localement, même après expiration du salon
- Identité par pseudo à l'entrée du salon (pas de compte)

## Architecture

### Appareil hôte (créateur du salon)

| Composant | Rôle |
|---|---|
| Service premier plan (`Foreground Service`) | Maintient le hotspot et le serveur actifs, notification persistante |
| Hotspot local (`LocalOnlyHotspot`, API 26+) | Crée le point d'accès Wifi auquel les invités se connectent |
| Serveur WebSocket embarqué | Relaie les messages entre tous les participants connectés |
| Stockage local (`Room`) | Historique des messages du salon |

### Appareil invité

| Composant | Rôle |
|---|---|
| Scan QR / Saisie du nom | Récupère les identifiants réseau du salon (SSID, mot de passe, IP, port, expiration) |
| Connexion Wifi (`WifiNetworkSuggestion`, API 29+) | Rejoint le hotspot de l'hôte |
| Client WebSocket | Envoie/reçoit les messages en temps réel |
| Stockage local (`Room`) | Historique des messages + salons déjà rejoints (SSID/pass), pour permettre la recherche par nom |

### Flux de connexion

1. **Créer un salon** : l'hôte démarre le service premier plan → active le hotspot → lance le serveur WebSocket → génère un JSON `{ salon, ssid, pass, ip, port, exp }` → l'encode en QR code
2. **Rejoindre un salon** : l'invité scanne le QR (ou récupère les identifiants d'un salon déjà rejoint) → vérifie que `exp` n'est pas dépassé → rejoint le Wifi (confirmation système requise sur Android 10+) → ouvre une connexion WebSocket vers `ip:port` → envoie son pseudo
3. **Chat** : l'hôte diffuse l'historique du salon au nouvel arrivant, puis relaie chaque message à tous les participants connectés

## Stack technique

- **Langage** : React natif
- **Réseau local** : `WifiManager.LocalOnlyHotspot` (hôte), `WifiNetworkSuggestion` (invité)
- **WebSocket** : `Java-WebSocket` ou `Ktor` embarqué (serveur), `OkHttp` ou `Java-WebSocket` (client)
- **QR code** : `ZXing` (génération et scan)
- **Stockage local** : `Room` (SQLite)
- **Service** : `Foreground Service` + `NotificationCompat`

## Limites connues du MVP

- Le salon reste actif uniquement tant que l'app de l'hôte est ouverte (pas de vrai service en arrière-plan pour l'instant)
- La connexion au Wifi via QR demande une confirmation manuelle de l'utilisateur sur Android 10+ (popup système)
- "Rejoindre par nom" ne fonctionne que pour les salons déjà rejoints une fois (pas de découverte réseau globale en V1)
- MVP Android uniquement — pas de version iOS prévue dans un premier temps (contraintes fortes d'Apple sur la connexion Wifi programmatique)

## Roadmap possible (post-MVP)

- Découverte des salons à proximité par nom (NSD/mDNS), sans passer par l'historique local
- Partage de fichiers/images
- Service en arrière-plan plus robuste
- Version iOS (via Multipeer Connectivity ou une approche différente)
