export type TransportStatus = "idle" | "connecting" | "connected" | "reconnecting" | "closed";

export function formatTransportStatus(status: TransportStatus, expired: boolean): string {
  if (expired) return "salon expiré · lecture seule";
  switch (status) {
    case "idle":
      return "Hors ligne";
    case "connecting":
      return "Connexion au salon…";
    case "connected":
      return "Connecté au salon";
    case "reconnecting":
      return "Reconnexion au salon…";
    case "closed":
      return "Déconnecté";
  }
}
