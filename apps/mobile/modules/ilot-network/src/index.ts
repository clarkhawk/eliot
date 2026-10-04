import { requireNativeModule } from "expo-modules-core";
import type { InvitePayload } from "@ilot/shared";

type NativeIlotNetwork = {
  startHost: (name: string, expiresAt: number) => Promise<InvitePayload>;
  joinNetwork: (ssid: string, password: string) => Promise<void>;
};

export const IlotNetwork = requireNativeModule<NativeIlotNetwork>("IlotNetwork");
