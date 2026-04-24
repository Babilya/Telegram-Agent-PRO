import { useState } from "react";
import { ScrollText, Filter, Image as ImageIcon, Trash2, User, Loader2, Pencil, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

type Cat = "all" | "media" | "deleted" | "edited";

const categories: { key: Cat; label: string; icon: any; eventType?: string }[] = [
  { key: "all", label: "Усі повідомлення", icon: Filter },
  { key: "media", label: "Тільки фото та відео", icon: ImageIcon },
  { key: "edited", label: "Тільки редаговані", icon: Pencil, eventType: "edited" },
  { key: "deleted", label: "Тільки видалені", icon: Trash2, eventType: "deleted" },
];

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n;]/.test(s) ? `"${s}"` : s;
}

function exportCsv(logs: any[]) {
  const headers = ["id", "createdAt", "eventType", "chatId", "chatTitle", "senderId", "senderName", "messageId", "text", "mediaType", "mediaPath"];
  const rows = [headers.join(",")];
  for (const l of logs) {
    rows.push(headers.map(h => csvEscape(l[h])).join(","));
  }
  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shadow-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Logs() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [cat, setCat] = useState<Cat>("all");
  const eventType = categories.find(c => c.key === cat)?.eventType;

  const { data, isLoading } = useQuery({
    queryKey: ["logs", cat],
    queryFn: () => shadowApi.listLogs(eventType, 200),
    refetchInterval: 5000,
  });
  const allLogs = data?.logs ?? [];
  const logs = cat === "media"
    ? allLogs.filter((l: any) => l.mediaType)
    : allLogs;

  const clearM = useMutation({
    mutationFn: shadowApi.clearLogs,
    onSuccess: () => {
      toast({ title: "Логи очищено" });
      qc.invalidateQueries({ queryKey: ["logs"] });
    },
  });

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Логи</h1>
        <p className="text-muted-foreground text-sm">Архів усіх повідомлень, медіа та подій.</p>
      </div>

      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <ScrollText style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Усього записів</p>
            <p className="text-xs" style={{ color: DIM }}>{logs.length} у вибірці</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportCsv(logs)}>
            <Download className="h-3.5 w-3.5 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => clearM.mutate()}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Очистити
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: cat === c.key ? "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" : "rgba(255,255,255,0.04)",
                border: `1px solid ${cat === c.key ? "hsl(271 91% 65% / 0.4)" : "rgba(255,255,255,0.07)"}`,
                color: cat === c.key ? "white" : DIM,
              }}
            >
              <c.icon className="h-3.5 w-3.5" /> {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            Записів ще немає. Бот логуватиме повідомлення при підключенні.
          </div>
        ) : logs.map((l: any) => (
          <div key={l.id} className="px-4 py-3 rounded-xl" style={card}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-display font-bold text-white">{l.senderName || "?"}</p>
              <span className="text-[10px] font-mono" style={{ color: DIM }}>
                {new Date(l.createdAt).toLocaleTimeString("uk")} • {l.chatTitle || l.chatId}
              </span>
            </div>
            <p className={`text-xs ${l.eventType === "deleted" ? "line-through opacity-60" : ""}`}
               style={{ color: l.eventType === "deleted" ? "hsl(0 70% 60%)" : "hsl(258 15% 80%)" }}>
              {l.text || (l.mediaType ? `[${l.mediaType}]` : "(порожньо)")}
            </p>
            {l.eventType !== "sent" && (
              <span className="text-[9px] font-mono mt-1 inline-block px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: DIM }}>
                {l.eventType}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl p-3 text-xs" style={card}>
        <p style={{ color: DIM }}>
          Логи оновлюються автоматично кожні 5 секунд. Подія <b className="text-white">edited</b> зберігає старий текст,
          <b className="text-white"> deleted</b> — лише факт видалення.
        </p>
      </div>
    </div>
  );
}
