import { requireNativeModule } from "expo-modules-core";
import type { InvitePayload } from "@ilot/shared";

type NativeIlotNetwork = {
  startHost: (name: string, expiresAt: number) => Promise<InvitePayload>;
  stopHost: (roomCode?: string | null) => Promise<void>;
  joinNetwork: (ssid: string, password: string) => Promise<void>;
  openWifiSettings: () => Promise<void>;
};

export const IlotNetwork = requireNativeModule<NativeIlotNetwork>("IlotNetwork");
