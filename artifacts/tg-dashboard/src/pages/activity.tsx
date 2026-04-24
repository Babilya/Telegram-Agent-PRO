import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Eye, Bot, Forward, MessageSquare, Camera, Mic, Hash, Filter } from "lucide-react";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

type FilterKey = "all" | "monitor_hit" | "autoreply" | "forward" | "ocr" | "voice" | "support";

const labels: Record<FilterKey, { label: string; icon: any; color: string }> = {
  all: { label: "Усе", icon: Activity, color: PRI },
  monitor_hit: { label: "Моніторинг", icon: Eye, color: "hsl(38 92% 55%)" },
  autoreply: { label: "Автовідповіді", icon: Bot, color: "hsl(190 80% 55%)" },
  forward: { label: "Пересилання", icon: Forward, color: "hsl(316 90% 62%)" },
  ocr: { label: "OCR", icon: Camera, color: "hsl(142 71% 45%)" },
  voice: { label: "Голосові", icon: Mic, color: "hsl(258 70% 60%)" },
  support: { label: "Підтримка", icon: MessageSquare, color: "hsl(50 90% 55%)" },
};

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, (Date.now() - t) / 1000);
  if (diff < 60) return `${Math.floor(diff)}с тому`;
  if (diff < 3600) return `${Math.floor(diff / 60)}хв тому`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}год тому`;
  return new Date(iso).toLocaleString("uk-UA");
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const { data } = useQuery({
    queryKey: ["activity-logs", filter],
    queryFn: () => shadowApi.listLogs(filter === "all" ? undefined : filter, 200),
    refetchInterval: 4000,
  });
  const logs: any[] = data?.logs ?? [];

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const l of logs) out[l.eventType] = (out[l.eventType] || 0) + 1;
    return out;
  }, [logs]);

  return (
    <div className="space-y-3 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Активність</h1>
        <p className="text-muted-foreground text-sm">Жива стрічка подій по всіх модулях. Оновлюється кожні 4 с.</p>
      </div>

      {/* Filter chips */}
      <div className="rounded-2xl p-3 flex flex-wrap gap-1.5" style={card}>
        <Filter className="h-3.5 w-3.5 self-center mr-1" style={{ color: DIM }} />
        {(Object.keys(labels) as FilterKey[]).map((k) => {
          const meta = labels[k];
          const Icon = meta.icon;
          const active = filter === k;
          const c = active ? meta.color : DIM;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className="px-2.5 py-1 rounded-lg text-xs font-display flex items-center gap-1.5 transition-all"
              style={{ color: c, border: `1px solid ${c}${active ? "" : "33"}`, background: active ? `${meta.color}15` : "transparent" }}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
              {k !== "all" && counts[k] ? <span className="font-mono opacity-70">·{counts[k]}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Live feed */}
      <div className="space-y-1">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-sm border border-dashed border-border rounded-xl" style={{ color: DIM }}>
            Подій ще немає. Активуйте моніторинг або автовідповіді — і вони з'являться тут.
          </div>
        ) : logs.map((l) => {
          const meta = labels[(l.eventType as FilterKey)] ?? labels.all;
          const Icon = meta.icon;
          return (
            <div key={l.id} className="px-3 py-2 rounded-xl flex items-start gap-2.5" style={card}>
              <span className="mt-0.5 shrink-0" style={{ color: meta.color }}><Icon className="h-3.5 w-3.5" /></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: meta.color, border: `1px solid ${meta.color}55` }}>
                    {meta.label}
                  </span>
                  {l.chatTitle && <span className="text-[11px] truncate font-display font-bold text-white">{l.chatTitle}</span>}
                  {l.matchedKeyword && (
                    <span className="text-[10px] font-mono flex items-center" style={{ color: PRI }}>
                      <Hash className="h-2.5 w-2.5" />{l.matchedKeyword}
                    </span>
                  )}
                  <span className="text-[10px] ml-auto" style={{ color: DIM }}>{relTime(l.createdAt)}</span>
                </div>
                {l.text && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "hsl(258 15% 75%)" }}>{l.text}</p>}
                {l.userId && <p className="text-[10px] font-mono mt-0.5" style={{ color: DIM }}>user:{l.userId}{l.chatId ? ` · chat:${l.chatId}` : ""}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
