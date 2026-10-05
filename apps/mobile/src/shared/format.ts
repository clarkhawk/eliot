export function formatRemaining(ms: number): string {
  if (ms <= 0) return "expiré";
  const totalMin = Math.ceil(ms / 60000);
  if (ms < 60000) return "expire dans moins d'une minute";
  if (totalMin < 60) return `expire dans ${totalMin} minute${totalMin > 1 ? "s" : ""}`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return `expire dans ${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}`;
  const d = Math.floor(h / 24);
  return `expire dans ${d} jour${d > 1 ? "s" : ""}`;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
