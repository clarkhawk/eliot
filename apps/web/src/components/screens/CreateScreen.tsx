"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Wheel } from "@/components/ui/Wheel";
import { createRoom } from "@/lib/store";

type Unit = "h" | "m" | "s";

export function CreateScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [time, setTime] = useState({ h: 0, m: 50, s: 0 });
  const [active, setActive] = useState<Unit>("m");
  const [error, setError] = useState("");

  const set = (u: Unit) => (v: number) => setTime((t) => ({ ...t, [u]: v }));

  function submit() {
    const durationMs = (time.h * 3600 + time.m * 60 + time.s) * 1000;
    if (!name.trim()) return setError("Donnez un nom à votre salon.");
    if (durationMs < 60_000) return setError("Choisissez une durée d'au moins 1 minute.");
    try {
      const room = createRoom({ name, durationMs });
      router.push(`/room/${room.code}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d'enregistrer le salon sur cet appareil.");
    }
  }

  return (
    <>
      <ScreenHeader title="Créer un salon" subtitle="Configurez un espace temporaire pour échanger" backHref="/app" />

      <div className="flex-1 overflow-y-auto px-5 pt-3">
        <div>
          <Label htmlFor="name">Nom du salon</Label>
          <Input
            id="name"
            value={name}
            maxLength={40}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="ex. Révisions Groupe 3"
            autoComplete="off"
          />
        </div>

        <hr className="my-6 border-line" />

        <div>
          <p className="mb-3 font-mono text-[13px] text-muted">expiration</p>
          <div className="flex">
            <Wheel label="heures" max={23} value={time.h} active={active === "h"} onChange={set("h")} onActivate={() => setActive("h")} />
            <Wheel label="minutes" max={59} value={time.m} active={active === "m"} onChange={set("m")} onActivate={() => setActive("m")} />
            <Wheel label="secondes" max={59} value={time.s} active={active === "s"} onChange={set("s")} onActivate={() => setActive("s")} />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-center text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>

      <footer className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <Button onClick={submit}>Créer un salon</Button>
      </footer>
    </>
  );
}
