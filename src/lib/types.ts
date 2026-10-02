export type Room = {
  /** Code d'accès partagé, ex. ILOT-8924 (sert aussi d'identifiant) */
  code: string;
  name: string;
  createdAt: number;
  /** Timestamp d'expiration (ms) */
  expiresAt: number;
  /** true si cet appareil a créé le salon */
  host: boolean;
  /** Localisation facultative enregistrée à la création */
  location?: { lat: number; lng: number };
};

export type Message = {
  id: string;
  roomCode: string;
  authorId: string;
  author: string;
  text: string;
  ts: number;
};

/** Contenu encodé dans le QR code (cf. README : { salon, …, exp }) */
export type InvitePayload = {
  v: 1;
  salon: string;
  code: string;
  exp: number;
};
