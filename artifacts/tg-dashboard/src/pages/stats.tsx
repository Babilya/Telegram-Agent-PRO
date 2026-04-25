import { useState } from "react";
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRI = "hsl(271 91% 65%)";
const ACC = "hsl(316 90% 62%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "linear-gradient(160deg, hsl(258 35% 14% / 0.85), hsl(258 35% 9% / 0.85))", border: "1px solid hsl(271 40% 28% / 0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)" };

type Period = "day" | "week" | "month";

const weekData = [
  { day: "Пн", val: 45 }, { day: "Вт", val: 52 }, { day: "Ср", val: 38 },
  { day: "Чт", val: 47 }, { day: "Пт", val: 63 }, { day: "Сб", val: 71 }, { day: "Нд", val: 31 },
];

export default function Stats() {
  const [period, setPeriod] = useState<Period>("week");
  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });

  const total = weekData.reduce((s, d) => s + d.val, 0);
  const max = Math.max(...weekData.map(d => d.val));

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Статистика</h1>
        <p className="text-muted-foreground text-sm">Детальна аналітика активності.</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {(["day", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: period === p ? "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" : "rgba(255,255,255,0.04)",
              border: `1px solid ${period === p ? "hsl(271 91% 65% / 0.4)" : "rgba(255,255,255,0.07)"}`,
              color: period === p ? "white" : DIM,
            }}
          >
            {p === "day" ? "День" : p === "week" ? "Тиждень" : "Місяць"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Розсилок" val={stats?.totalSent ?? 347} />
        <Stat label="Спрацювань" val={70} accent />
        <Stat label="Нових контактів" val={23} />
        <Stat label="Вступів" val={stats?.joinedGroups ?? 5} accent />
      </div>

      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4" style={{ color: PRI }} />
          <p className="text-sm font-display font-bold text-white flex-1">Активність по днях</p>
          <span className="text-[10px] font-mono" style={{ color: DIM }}>Всього: {total}</span>
        </div>
        <div className="space-y-1.5">
          {weekData.map((d) => (
            <div key={d.day} className="flex items-center gap-2 text-xs">
              <span className="w-7 font-mono" style={{ color: DIM }}>{d.day}</span>
              <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-md" style={{
                  width: `${(d.val / max) * 100}%`,
                  background: `linear-gradient(90deg, ${PRI}, ${ACC})`,
                }} />
              </div>
              <span className="w-8 text-right font-mono text-white">{d.val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4 space-y-2" style={card}>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: PRI }} />
          <p className="text-sm font-display font-bold text-white">Прогноз навантаження</p>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>🟩🟩🟩🟨⬜</span>
          <span className="text-sm font-mono text-white">70%</span>
        </div>
      </div>

      <Button variant="outline" className="w-full"><Download className="h-4 w-4 mr-2" /> Експорт CSV</Button>
    </div>
  );
}

function Stat({ label, val, accent }: { label: string; val: number | string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-1" style={card}>
      <p className="text-[10px] font-display font-semibold uppercase tracking-widest" style={{ color: DIM }}>{label}</p>
      <p className="text-2xl font-bold font-mono" style={{ color: accent ? ACC : "white" }}>
        {typeof val === "number" ? new Intl.NumberFormat("uk").format(val) : val}
      </p>
    </div>
  );
}
