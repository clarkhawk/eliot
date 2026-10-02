# Îlot — interface Next.js + Tailwind

Implémentation de la maquette Îlot (splash, accueil, créer un salon, rejoindre, chat, thèmes clair/sombre).
Le concept d'origine (hotspot + WebSocket Android) est dans `CONCEPT.md`.

## Lancer

```bash
npm install
npm run dev      # http://localhost:3000
```

Pour afficher le lien de téléchargement Android sur la page d'accueil, renseignez l'URL publique de l'APK dans `.env.local` :

```bash
NEXT_PUBLIC_ANDROID_APK_URL=https://.../ilot.apk
```

Next 15 · React 19 · Tailwind 4 · TypeScript. Dépendances : `qrcode` (génération), `jsqr` (scan de repli), `lucide-react`, `geist` (polices).

## Application mobile

Le prototype React Native se trouve dans `apps/mobile`.

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

Le profil `preview` produit un APK installable. Le profil `production` produit un bundle Android pour le Play Store. L'interface mobile et SQLite sont en place ; le scanner QR natif et le réseau local Android restent à brancher.

## Écrans / routes

| Route | Écran |
|---|---|
| `/` | Splash (1×/session) puis Bienvenue + salons récents |
| `/create` | Nom, localisation, expiration (roues h/min/s) |
| `/join` | Scan QR (caméra) ou saisie du code / du nom d'un salon déjà rejoint. Accepte `?code=…` |
| `/room/[code]` | Chat, partage (QR + code + lien), pseudo, expiration en lecture seule |

## Structure

```
src/
  app/                 routes (pages minces) + globals.css (tokens de thème)
  components/ui/       Button, IconButton, Input/Label, Sheet, Wheel, Logo, ThemeToggle, ScreenHeader, AppShell
  components/screens/  Home, Create, Join, Room
  components/          Scanner, ShareSheet, PseudoSheet, Splash
  lib/store.ts         stockage local + logique salons / invitations / messages
  lib/theme.ts         thème clair/sombre (classe `dark`, sans flash)
```

Thème : variables CSS sémantiques (`bg-bg`, `text-ink`, `bg-field`, `bg-primary`…) dans `globals.css`. Pour brancher vos propres composants, remplacez le contenu de `components/ui/*` en gardant les mêmes props.

## Ce qui est réel / ce qui est simulé

- Salons, historique, pseudo, expiration, QR, lien d'invitation : fonctionnels, **100 % local** (`localStorage`).
- Temps réel : synchronisé entre onglets d'un même navigateur (événement `storage`). Ouvrez le salon dans deux onglets avec deux pseudos pour tester.
- **Pas de réseau entre appareils** : hotspot `LocalOnlyHotspot`, `WifiNetworkSuggestion` et serveur WebSocket embarqué sont des API Android natives, impossibles depuis un navigateur. Le point de branchement est `addMessage()` / `useMessages()` dans `lib/store.ts` (remplacer par un client WebSocket vers `ip:port` du QR).
- Le QR encode `{ v, salon, code, exp }` (sans `ssid/pass/ip/port`, inutiles côté web).
