"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Input, Label } from "./ui/Field";
import { Sheet } from "./ui/Sheet";
import { setPseudo } from "@/lib/store";

/** Identité par pseudo à l'entrée du salon (pas de compte). */
export function PseudoSheet({ open, initial = "" }: { open: boolean; initial?: string }) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (open && !value && initial) setValue(initial);
  }, [open, initial, value]);
  const submit = () => value.trim() && setPseudo(value.trim().slice(0, 20));

  return (
    <Sheet open={open} title="Votre pseudo" dismissible={false}>
      <p className="-mt-2 mb-4 text-[13px] text-muted">Choisissez le nom affiché aux autres participants.</p>
      <Label htmlFor="pseudo">Pseudo</Label>
      <Input
        id="pseudo"
        autoFocus
        value={value}
        maxLength={20}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="ex. Rossi"
        autoComplete="off"
      />
      <Button className="mt-5" onClick={submit} disabled={!value.trim()}>
        Entrer dans le salon
      </Button>
    </Sheet>
  );
}
