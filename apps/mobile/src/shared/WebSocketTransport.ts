import { decodePacket, encodePacket, type ChatMessage, type InvitePayload, type ServerPacket } from "@ilot/shared";

type TransportStatus = "idle" | "connecting" | "connected" | "reconnecting" | "closed";

type TransportOptions = {
  url: string;
  invite: InvitePayload;
  clientId: string;
  pseudo: string;
  onStatus?: (status: TransportStatus) => void;
  onPacket?: (packet: ServerPacket) => void;
  onError?: (message: string) => void;
};

/** Thin WebSocket client. The Android host will provide the URL and server protocol. */
export class WebSocketTransport {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private attempt = 0;

  constructor(private readonly options: TransportOptions) {}

  connect() {
    this.stopped = false;
    if (this.isExpired()) {
      this.options.onStatus?.("closed");
      return;
    }
    this.open();
  }

  close() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
    this.options.onStatus?.("closed");
  }

  sendMessage(message: Omit<ChatMessage, "roomCode">) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.options.onError?.("Connexion indisponible. Le message n'a pas été envoyé.");
      return false;
    }
    this.socket.send(encodePacket({ type: "message", message }));
    return true;
  }

  private open() {
    if (this.stopped || this.isExpired()) {
      this.stopped = true;
      this.options.onStatus?.("closed");
      return;
    }
    this.options.onStatus?.(this.attempt ? "reconnecting" : "connecting");
    const socket = new WebSocket(this.options.url);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.options.onStatus?.("connected");
      socket.send(encodePacket({
        type: "hello",
        room: this.options.invite,
        clientId: this.options.clientId,
        pseudo: this.options.pseudo,
      }));
    };

    socket.onmessage = (event) => {
      const packet = decodePacket(String(event.data));
      if (packet) this.options.onPacket?.(packet);
      else this.options.onError?.("Réponse réseau non reconnue.");
    };

    socket.onerror = () => this.options.onError?.("Impossible de joindre le salon local.");
    socket.onclose = () => {
      if (this.socket === socket) this.socket = null;
      if (this.stopped || this.isExpired()) {
        this.stopped = true;
        this.options.onStatus?.("closed");
        return;
      }
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(this.attempt++, 5));
      this.reconnectTimer = setTimeout(() => this.open(), delay);
    };
  }

  private isExpired() {
    return this.options.invite.exp <= Date.now();
  }
}
