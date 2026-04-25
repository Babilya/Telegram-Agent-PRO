import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";
import { User, Phone, AtSign, Hash, Calendar, Shield, KeyRound } from "lucide-react";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "linear-gradient(160deg, hsl(258 35% 14% / 0.85), hsl(258 35% 9% / 0.85))", border: "1px solid hsl(271 40% 28% / 0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)" };

export default function Profile() {
  const { data: auth } = useGetAuthStatus({ query: { queryKey: getGetAuthStatusQueryKey() } });

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Мій профіль</h1>
        <p className="text-muted-foreground text-sm">Дані вашого акаунту.</p>
      </div>

      <div className="rounded-2xl p-5 flex items-center gap-4" style={card}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))" }}>
          <User className="h-8 w-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-display font-bold text-white truncate">
            {auth?.firstName || "Не авторизовано"}
          </p>
          {auth?.username && (
            <p className="text-sm font-mono" style={{ color: PRI }}>@{auth.username}</p>
          )}
          <p className="text-xs font-mono" style={{ color: DIM }}>{auth?.phone || "—"}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Row icon={Hash} label="Telegram ID" value={auth?.id ? String(auth.id) : "—"} />
        <Row icon={AtSign} label="Username" value={auth?.username ? `@${auth.username}` : "—"} />
        <Row icon={Phone} label="Телефон" value={auth?.phone || "—"} />
        <Row icon={KeyRound} label="Ключ доступу" value="••••••••••••" />
        <Row icon={Calendar} label="Сеанс" value={new Date().toLocaleString("uk")} />
        <Row icon={Shield} label="Доступ" value={auth?.authenticated ? "🟢 Авторизовано" : "🔴 Не активно"} />
      </div>

      <div className="rounded-2xl p-4 space-y-2" style={card}>
        <p className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>
          📊 Активні модулі
        </p>
        {[
          { name: "Розсилки", on: true },
          { name: "Моніторинг", on: true },
          { name: "Логування", on: true },
          { name: "Досьє", on: true },
          { name: "Автовідповіді", on: true },
          { name: "Пересилання", on: true },
        ].map((m) => (
          <div key={m.name} className="flex items-center justify-between text-sm">
            <span style={{ color: DIM }}>{m.name}</span>
            <span style={{ color: m.on ? PRI : "hsl(0 70% 60%)" }}>
              {m.on ? "🟢 Активно" : "🔴 Вимкнено"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={card}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
        <Icon style={{ width: 13, height: 13, color: PRI }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-display font-semibold uppercase tracking-widest" style={{ color: DIM }}>{label}</p>
        <p className="text-[13px] font-mono text-white truncate">{value}</p>
      </div>
    </div>
  );
}
