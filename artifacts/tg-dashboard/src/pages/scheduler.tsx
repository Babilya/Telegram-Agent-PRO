import { useQuery } from "@tanstack/react-query";
import { Clock, CalendarClock, Play, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const OK = "hsl(142 71% 45%)";
const ERR = "hsl(0 84% 60%)";
const card: React.CSSProperties = { background: "linear-gradient(160deg, hsl(258 35% 14% / 0.85), hsl(258 35% 9% / 0.85))", border: "1px solid hsl(271 40% 28% / 0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)" };

const apiBase = ((import.meta.env.BASE_URL ?? "/") + "api").replace(/\/+/g, "/");

function untilLabel(iso: string | null): { text: string; color: string } {
  if (!iso) return { text: "не заплановано", color: DIM };
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { text: "зараз", color: OK };
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d) return { text: `за ${d}д ${h % 24}год`, color: PRI };
  if (h) return { text: `за ${h}год ${m % 60}хв`, color: PRI };
  if (m) return { text: `за ${m}хв ${s % 60}с`, color: OK };
  return { text: `за ${s}с`, color: OK };
}

function trigDescr(trig: string): string {
  const m = trig.match(/interval\[(\d+):(\d+):(\d+)\]/);
  if (m) {
    const [, hh, mm, ss] = m;
    if (hh !== "0") return `кожні ${Number(hh)} год`;
    if (mm !== "0") return `кожні ${Number(mm)} хв`;
    return `кожні ${Number(ss)} с`;
  }
  if (trig.includes("date")) return "разово";
  if (trig.includes("cron")) return trig.replace("cron[", "cron · ").replace("]", "");
  return trig;
}

export default function SchedulerPage() {
  const { data, refetch, isFetching } = useQuery<any>({
    queryKey: ["scheduler-jobs"],
    queryFn: () => fetch(`${apiBase}/system/jobs`).then((r) => r.json()),
    refetchInterval: 3000,
  });
  const jobs: any[] = data?.jobs ?? [];
  const running = data?.schedulerRunning;
  const activeCampaigns: string[] = data?.activeCampaigns ?? [];

  return (
    <div className="space-y-3 pb-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Розклад</h1>
          <p className="text-muted-foreground text-sm">
            Усі заплановані задачі планувальника APScheduler у Python-сервісі.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Оновити
        </Button>
      </div>

      {/* Status summary */}
      <div className="rounded-2xl p-3 flex items-center gap-3" style={card}>
        <CalendarClock className="h-5 w-5" style={{ color: running ? OK : ERR }} />
        <div className="flex-1">
          <p className="text-sm font-display font-bold">
            Планувальник {running ? <span style={{ color: OK }}>● активний</span> : <span style={{ color: ERR }}>○ зупинено</span>}
          </p>
          <p className="text-[11px]" style={{ color: DIM }}>
            Задач у пам'яті: {jobs.length} · активних кампаній: {activeCampaigns.length}
          </p>
        </div>
      </div>

      {/* Jobs list */}
      <div className="space-y-1.5">
        <h2 className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>
          Заплановані задачі ({jobs.length})
        </h2>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-sm border border-dashed border-border rounded-xl" style={{ color: DIM }}>
            Жодної задачі не заплановано.
          </div>
        ) : jobs.map((j) => {
          const u = untilLabel(j.nextRun);
          const isCampaign = activeCampaigns.includes(j.id);
          return (
            <div key={j.id} className="px-3 py-2.5 rounded-xl flex items-start gap-3" style={card}>
              <Clock className="h-4 w-4 mt-0.5 shrink-0" style={{ color: PRI }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-display font-bold text-white truncate">{j.name}</p>
                  {isCampaign && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1" style={{ color: PRI, border: `1px solid ${PRI}55` }}>
                      <Play className="h-2.5 w-2.5" /> кампанія
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono truncate" style={{ color: DIM }}>
                  id: {j.id} · {trigDescr(j.trigger)} · {j.func}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: u.color }}>
                  ⏱ {u.text}{j.nextRun ? ` · ${new Date(j.nextRun).toLocaleString("uk-UA")}` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {data?.error && (
        <div className="rounded-xl px-3 py-2 flex items-center gap-2 text-xs" style={{ ...card, color: ERR }}>
          <AlertCircle className="h-3.5 w-3.5" /> Python-сервіс недоступний: {data.error}
        </div>
      )}
    </div>
  );
}
