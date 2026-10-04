"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Scanner } from "@/components/Scanner";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { joinRoom, parseInvite } from "@/lib/store";
import type { InvitePayload } from "@/lib/types";

export function JoinScreen() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function go(input: string | InvitePayload) {
    const res = joinRoom(input);
    if (!res.ok) return setError(res.error);
    router.push(`/room/${res.room.code}`);
  }

  // Lien d'invitation : /join?code=ILOT-A7K2Q9&n=Nom&e=timestamp
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const code = q.get("code");
    if (!code) return;
    const exp = Number(q.get("e"));
    const parsed = exp ? parseInvite(window.location.href) : code;
    if (parsed) go(parsed);
    else setValue(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onScan(text: string) {
    const parsed = parseInvite(text);
    if (!parsed) return setError("QR code non reconnu. Ce n'est pas une invitation Îlot.");
    go(parsed);
  }

  return (
    <>
      <ScreenHeader title="Rejoindre" subtitle="Entrez un code ou scannez pour participer" backHref="/app" />

      <form
        className="flex flex-1 flex-col overflow-y-auto px-5 pt-4"
        onSubmit={(e) => { e.preventDefault(); go(value); }}
      >
        <Scanner onResult={onScan} onError={setError} />

        <div className="mt-8">
          <Label htmlFor="code">Code d&apos;accès</Label>
          <Input
            id="code"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            placeholder="ex. ILOT-A7K2Q9"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="mt-auto pb-3 pt-6 text-center text-[13px]" role="status">
          {error ? (
            <p role="alert" className="text-danger">{error}</p>
          ) : (
            <p className="text-muted">Gardez l&apos;hôte à proximité pour une connexion fiable et stable.</p>
          )}
        </div>
      </form>

      <footer className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
        <Button onClick={() => go(value)}>Rejoindre le salon</Button>
      </footer>
    </>
  );
}
