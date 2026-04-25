import { useQuery } from "@tanstack/react-query";
import { Activity, Cpu, Database, Bot, Lock, KeyRound, Wifi, WifiOff, FlaskConical, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const OK = "hsl(142 71% 45%)";
const ERR = "hsl(0 84% 60%)";
const WARN = "hsl(38 92% 55%)";
const card: React.CSSProperties = { background: "linear-gradient(160deg, hsl(258 35% 14% / 0.85), hsl(258 35% 9% / 0.85))", border: "1px solid hsl(271 40% 28% / 0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)" };

const apiBase = ((import.meta.env.BASE_URL ?? "/") + "api").replace(/\/+/g, "/");

function fmtUptime(sec: number): string {
  if (!sec) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d) return `${d}д ${h}год`;
  if (h) return `${h}год ${m}хв`;
  if (m) return `${m}хв ${s}с`;
  return `${s}с`;
}

export default function SystemPage() {
  const { data, refetch, isFetching } = useQuery<any>({
    queryKey: ["system-health"],
    queryFn: () => fetch(`${apiBase}/system/health`).then((r) => r.json()),
    refetchInterval: 5000,
  });

  if (!data) {
    return <div className="text-center py-10 text-muted-foreground">Завантаження…</div>;
  }

  const tg = data.telegram ?? {};
  const ib = data.inlineBot ?? {};
  const mr = data.mirrors ?? { active: 0 };
  const enc = data.encryption ?? {};
  const py = data.pythonService ?? {};
  const lr = data.lastTestRun;

  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Система</h1>
          <p className="text-muted-foreground text-sm">Стан усіх компонентів у реальному часі.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Оновити
        </Button>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-2 gap-2">
        <Tile icon={<Cpu />} label="API-сервер" value="Node.js" sub={fmtUptime(data.apiServer?.uptimeSec ?? 0)} ok />
        <Tile icon={<Bot />} label="Python-сервіс" value={py.ok ? "Активний" : "Недоступний"} sub={py.error || "FastAPI :8001"} ok={py.ok} />
        <Tile icon={tg.connected ? <Wifi /> : <WifiOff />} label="Telegram-клієнт"
          value={tg.authorized ? `@${tg.me?.username ?? "?"}` : tg.connected ? "Підключено" : "Не з'єднано"}
          sub={tg.authorized ? "Авторизовано" : "Потрібен вхід"} ok={tg.authorized} warn={tg.connected && !tg.authorized} />
        <Tile icon={<Bot />} label="Інлайн-бот" value={ib.running ? "Працює" : ib.enabled ? "Запускається…" : "Вимкнено"}
          sub={ib.enabled ? "TELEGRAM_BOT_TOKEN ✓" : "Token не задано"} ok={ib.running} warn={ib.enabled && !ib.running} />
        <Tile icon={<Lock />} label="Шифрування" value={enc.configured ? "Налаштовано" : "Dev-ключ"}
          sub={enc.configured ? "Окремий ключ шифрування ✓" : "Похідний ключ із API_HASH"} ok={enc.configured} warn={!enc.configured} />
        <Tile icon={<KeyRound />} label="Активні дзеркала" value={String(mr.active ?? 0)} sub="з власними сесіями" ok={mr.active > 0} />
      </div>

      {/* Tests summary */}
      <div className="rounded-2xl p-4 space-y-2" style={card}>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4" style={{ color: PRI }} />
          <p className="text-sm font-display font-bold">Останній прогін тестів</p>
        </div>
        {lr ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded font-mono" style={{ color: lr.failed === 0 ? OK : ERR, border: `1px solid ${(lr.failed === 0 ? OK : ERR)}55` }}>
              {lr.passed}/{lr.total}
            </span>
            <span style={{ color: DIM }}>
              {lr.failed === 0 ? "усі зелені" : `${lr.failed} впало`} • {new Date(lr.finishedAt).toLocaleString("uk-UA")}
            </span>
          </div>
        ) : (
          <p className="text-xs" style={{ color: DIM }}>Тести ще не запускали — відкрийте «Довідка → Тести».</p>
        )}
      </div>

      {/* Detailed env block */}
      <div className="rounded-2xl p-4 space-y-2" style={card}>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: PRI }} />
          <p className="text-sm font-display font-bold">Деталі середовища</p>
        </div>
        <DetailRow label="Node" value={data.apiServer?.node ?? "—"} />
        <DetailRow label="Uptime API" value={fmtUptime(data.apiServer?.uptimeSec ?? 0)} />
        <DetailRow label="Telegram me" value={tg.me ? `${tg.me.firstName} (@${tg.me.username}) #${tg.me.id}` : "—"} />
        <DetailRow label="Інлайн-бот" value={ib.enabled ? (ib.running ? "running" : "idle") : "disabled"} />
        <DetailRow label="Шифрування" value={enc.configured ? "user-key" : "dev-derived"} />
        <DetailRow label="Дзеркал у пам'яті" value={String(mr.active ?? 0)} />
      </div>
    </div>
  );
}

function Tile({ icon, label, value, sub, ok, warn }: { icon: React.ReactNode; label: string; value: string; sub: string; ok?: boolean; warn?: boolean }) {
  const color = ok ? OK : warn ? WARN : ERR;
  return (
    <div className="rounded-2xl p-3" style={card}>
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-[11px] uppercase tracking-widest font-display font-bold" style={{ color: DIM }}>{label}</span>
      </div>
      <p className="text-base font-display font-black mt-1 truncate" style={{ color }}>{value}</p>
      <p className="text-[10px] truncate" style={{ color: DIM }}>{sub}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: DIM }}>{label}</span>
      <span className="font-mono text-white truncate max-w-[60%]">{value}</span>
    </div>
  );
}
