# Îlot — interface Next.js + Tailwind

Interface web de démonstration et client Android Îlot (accueil, création, rejoindre, chat, thèmes clair/sombre).
L'architecture retenue (React Native/Expo + module natif Kotlin) est décrite dans `CONCEPT.md`.

## Lancer

```bash
npm install
npm run dev      # http://localhost:3000
```

Pour afficher le lien vers un APK Android publié sur la page de téléchargement, renseignez son URL publique dans `.env.local` :

```bash
NEXT_PUBLIC_ANDROID_APK_URL=https://.../ilot.apk
```

Next 15 · React 19 · Tailwind 4 · TypeScript. Dépendances : `qrcode` (génération), `jsqr` (scan de repli), `lucide-react`, `geist` (polices).

## Application mobile

Le client Android React Native/Expo se trouve dans `apps/mobile`.

```bash
cd apps/mobile
npm install
npx expo start
```

La configuration Android est prête pour un APK de test via EAS :

```bash
npx eas login
npm run build:preview
```

Le profil `preview` produit un APK installable avec le module natif Kotlin. Le profil `production` produit un bundle Android pour le Play Store. Un dev client EAS est nécessaire pour tester le hotspot, le service premier plan et le serveur WebSocket ; Expo Go ne contient pas ce module.

## Écrans / routes

| Route | Écran |
|---|---|
| `/` | Page de téléchargement Android |
| `/app` | Accueil de l'application web + salons récents |
| `/create` | Nom, localisation, expiration (roues h/min/s) |
| `/join` | Scan QR (caméra) ou saisie du code / du nom d'un salon déjà rejoint. Accepte `?code=…` |
| `/room/[code]` | Chat local, code du salon, pseudo, expiration en lecture seule |

## Structure

```
src/
  app/                 routes (pages minces) + globals.css (tokens de thème)
  components/ui/       Button, IconButton, Input/Label, Sheet, Wheel, Logo, ThemeToggle, ScreenHeader, AppShell
  components/screens/  Home, Create, Join, Room
  components/          Scanner, PseudoSheet, Splash
  lib/store.ts         stockage local + logique salons / invitations / messages
  lib/theme.ts         thème clair/sombre (classe `dark`, sans flash)
```

Thème : variables CSS sémantiques (`bg-bg`, `text-ink`, `bg-field`, `bg-primary`…) dans `globals.css`. Pour brancher vos propres composants, remplacez le contenu de `components/ui/*` en gardant les mêmes props.

## Ce qui est réel / ce qui est simulé

- Salons, historique, pseudo et expiration : fonctionnels, **100 % local** (`localStorage`). La version web affiche un bandeau de démo et ne propose pas le partage QR/lien entre appareils.
- Temps réel web : synchronisé entre onglets d'un même navigateur (événement `storage`). Ouvrez le salon dans deux onglets avec deux pseudos pour tester.
- **Pas de réseau entre appareils** : hotspot `LocalOnlyHotspot`, `WifiNetworkSuggestion` et serveur WebSocket embarqué sont des API Android natives, impossibles depuis un navigateur. Le point de branchement est `addMessage()` / `useMessages()` dans `lib/store.ts` (remplacer par un client WebSocket vers `ip:port` du QR).
- Le QR encode `{ v, salon, code, exp }` (sans `ssid/pass/ip/port`, inutiles côté web).

Le transport mobile utilise `ws://` sur le hotspot local. Le certificat TLS n'est pas réaliste dans ce contexte sans infrastructure de confiance ; `usesCleartextTraffic: true` est donc activé explicitement dans `apps/mobile/app.json` comme choix assumé pour le prototype. Les invitations expirées sont rejetées par le paquet partagé, sur web comme sur mobile.
