import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  Bot, Forward, Camera, Mic, Search, Megaphone,
  Award, ShieldCheck, Globe2, BadgeCheck,
  TrendingUp, Activity, BarChart3, Zap,
  Lock, Database, KeyRound, Smartphone, ArrowRight,
} from "lucide-react";
import { TelegramIcon } from "@/components/ui/telegram-icon";
import { AuthModal } from "@/components/auth/auth-modal";

const TOTAL_PAGES = 5;

const gradientText: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const convexCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.035)",
  border: "none",
  boxShadow:
    "0 4px 16px rgba(0,0,0,0.32)," +
    "inset 0 1px 0 rgba(255,255,255,0.09)," +
    "inset 0 -1px 0 rgba(0,0,0,0.18)",
};

const iconWrap: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 65% / 0.3), hsl(316 90% 62% / 0.2))",
  border: "none",
  boxShadow:
    "0 3px 10px rgba(0,0,0,0.3)," +
    "inset 0 1px 0 rgba(255,255,255,0.15)," +
    "inset 0 -1px 0 rgba(0,0,0,0.2)",
  flexShrink: 0,
};

const convexBtn: React.CSSProperties = {
  background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
  border: "none",
  color: "white",
  boxShadow:
    "0 4px 16px rgba(0,0,0,0.35)," +
    "inset 0 1px 0 rgba(255,255,255,0.22)," +
    "inset 0 -1px 0 rgba(0,0,0,0.18)",
};

/* ──────────── Background wrapper (radial gradient + neon grid) ──────────── */
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col"
      style={{
        height: "100dvh",
        background:
          "radial-gradient(ellipse 90% 55% at 50% 0%, hsl(271 91% 38% / 0.55) 0%, transparent 70%)," +
          "radial-gradient(ellipse 65% 50% at 85% 100%, hsl(316 90% 40% / 0.3) 0%, transparent 65%)," +
          "radial-gradient(ellipse 70% 55% at 15% 90%, hsl(258 80% 28% / 0.4) 0%, transparent 65%)," +
          "hsl(258 38% 8%)",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(271 91% 65% / 0.07) 1px, transparent 1px)," +
            "linear-gradient(90deg, hsl(271 91% 65% / 0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {children}
    </div>
  );
}

/* ──────────── Small reusable card with icon ──────────── */
function FeatureRow({
  Icon, title, desc,
}: { Icon: React.ComponentType<any>; title: string; desc: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl flex-1 min-h-0"
      style={{ ...convexCard, padding: "clamp(10px,2.5vw,14px) clamp(12px,3vw,16px)" }}
    >
      <div
        className="rounded-xl flex items-center justify-center"
        style={{ ...iconWrap, width: 36, height: 36 }}
      >
        <Icon style={{ color: "hsl(271 91% 80%)", width: 16, height: 16 }} />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="font-display font-bold text-white leading-tight"
          style={{ fontSize: "clamp(0.72rem, 3.2vw, 0.82rem)" }}
        >
          {title}
        </span>
        <span
          className="leading-snug"
          style={{ color: "hsl(258 10% 62%)", fontSize: "clamp(0.65rem, 2.8vw, 0.75rem)" }}
        >
          {desc}
        </span>
      </div>
    </div>
  );
}

/* ──────────── Page 1: WELCOME (big centered logo hero) ──────────── */
function PageWelcome() {
  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
      {/* Big logo, vertically centered in upper half */}
      <div className="flex flex-col items-center gap-5 -mt-12">
        <div
          className="flex items-center justify-center"
          style={{
            width: "clamp(96px, 28vw, 132px)",
            height: "clamp(96px, 28vw, 132px)",
            borderRadius: "clamp(22px, 6vw, 30px)",
            background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
            boxShadow:
              "0 12px 36px hsl(271 91% 50% / 0.55)," +
              "0 0 64px hsl(316 90% 60% / 0.35)," +
              "inset 0 2px 0 rgba(255,255,255,0.28)," +
              "inset 0 -2px 0 rgba(0,0,0,0.22)",
          }}
        >
          <TelegramIcon className="text-white" style={{ width: "55%", height: "55%" }} />
        </div>

        <h1
          className="font-display font-black tracking-tight text-center"
          style={{ fontSize: "clamp(2rem, 9vw, 2.8rem)", lineHeight: 1.05 }}
        >
          <span className="text-white">GROUP </span>
          <span style={gradientText}>AGENT</span>
        </h1>

        <p
          className="text-center leading-snug px-2"
          style={{
            color: "hsl(258 12% 72%)",
            fontSize: "clamp(0.85rem, 3.6vw, 0.95rem)",
            maxWidth: "32ch",
          }}
        >
          Розумний помічник для Telegram-груп: автоматизує розсилки,
          моніторить діалоги і керує дзеркалами акаунтів — все від вашого імені, цілодобово.
        </p>
      </div>
    </div>
  );
}

/* ──────────── Page 2: FUNCTIONALITY ──────────── */
function PageFunctionality() {
  const items = [
    { Icon: Search,    title: "Пошук груп",     desc: "Публічні групи й канали з фільтрами по аудиторії та активності." },
    { Icon: Megaphone, title: "Масові розсилки", desc: "Кампанії в десятки чатів за гнучким розкладом." },
    { Icon: Bot,       title: "Автовідповіді",   desc: "Реакція на ключові слова — точно як ви налаштуєте." },
    { Icon: Forward,   title: "Пересилання",     desc: "Розумні фільтри по джерелу й типу контенту." },
    { Icon: Camera,    title: "OCR із картинок", desc: "Розпізнає текст із зображень — UA та EN." },
    { Icon: Mic,       title: "Голос у текст",   desc: "Транскрипція голосових повідомлень з автодетектом." },
  ];
  return (
    <ContentPage badge="Що вміє" title="Найпопулярніші" accent="функції"
      desc="Шість ключових інструментів, які роблять GROUP AGENT універсальним помічником."
    >
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
        {items.map((it) => (
          <FeatureRow key={it.title} {...it} />
        ))}
      </div>
    </ContentPage>
  );
}

/* ──────────── Page 3: ADVANTAGES (Quality Mark + standards) ──────────── */
function PageAdvantages() {
  return (
    <ContentPage badge="Знак якості" title="Переваги" accent="2025"
      desc="Сертифікований сервіс із дотриманням міжнародних стандартів безпеки й приватності даних."
    >
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        {/* Quality Mark hero */}
        <div
          className="rounded-2xl flex items-center gap-3 flex-1 min-h-0"
          style={{ ...convexCard, padding: "14px 16px" }}
        >
          <div
            className="rounded-2xl flex items-center justify-center relative"
            style={{
              width: 64, height: 64,
              background: "linear-gradient(160deg, hsl(45 95% 55%), hsl(35 95% 45%))",
              boxShadow:
                "0 6px 18px hsl(45 95% 45% / 0.45)," +
                "inset 0 2px 0 rgba(255,255,255,0.3)," +
                "inset 0 -2px 0 rgba(0,0,0,0.2)",
            }}
          >
            <Award style={{ width: 36, height: 36, color: "white" }} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-display font-black text-white" style={{ fontSize: "1.05rem" }}>
              Знак якості 2025
            </span>
            <span className="text-xs leading-snug" style={{ color: "hsl(258 10% 65%)" }}>
              Незалежний аудит коду й тестування навантаження. 33+ автоматичних тестів, ≥99.5% uptime.
            </span>
          </div>
        </div>

        {/* Standards */}
        <FeatureRow Icon={ShieldCheck} title="GDPR-сумісність"
          desc="Право на видалення, експорт даних, прозоре зберігання — згідно з європейським регламентом." />
        <FeatureRow Icon={Lock} title="ISO 27001 (принципи)"
          desc="Шифрування Fernet для API Hash і сесій, керування доступом, аудит-журнал." />
        <FeatureRow Icon={Globe2} title="Telegram Official API"
          desc="Лише MTProto через Telethon — без сірих обхідних шляхів і ризику банів." />
        <FeatureRow Icon={BadgeCheck} title="Open-source ядро"
          desc="Прозорий код. Кожне рішення можна перевірити й проаудитити самостійно." />
      </div>
    </ContentPage>
  );
}

/* ──────────── Page 4: ANALYTICS (charts + stat widgets) ──────────── */
function PageAnalytics() {
  return (
    <ContentPage badge="Цифри говорять" title="Аналітика та" accent="результати"
      desc="Реальна статистика користувачів GROUP AGENT за останній квартал."
    >
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        {/* Mini line chart widget */}
        <div className="rounded-2xl p-3 flex-1 min-h-0 flex flex-col gap-2" style={convexCard}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp style={{ width: 14, height: 14, color: "hsl(142 71% 55%)" }} />
              <span className="text-xs font-display font-bold text-white">Зростання залученості</span>
            </div>
            <span className="font-display font-black text-sm" style={{ color: "hsl(142 71% 55%)" }}>+47%</span>
          </div>
          <Sparkline />
        </div>

        {/* Stat tiles row */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <StatTile Icon={Activity} value="1.2M" label="повідомлень" color="hsl(271 91% 70%)" />
          <StatTile Icon={Zap} value="99.8%" label="uptime" color="hsl(142 71% 55%)" />
          <StatTile Icon={BarChart3} value="3.4×" label="ефективність" color="hsl(316 90% 68%)" />
        </div>

        {/* Bar chart widget */}
        <div className="rounded-2xl p-3 flex-1 min-h-0 flex flex-col gap-2" style={convexCard}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-display font-bold text-white">Активні модулі</span>
            <span className="text-[10px]" style={{ color: "hsl(258 10% 60%)" }}>останні 30 днів</span>
          </div>
          <BarChart />
        </div>
      </div>
    </ContentPage>
  );
}

/* ──────────── Page 5: ACCESS (login + reassurance + register CTA) ──────────── */
function PageAccess() {
  return (
    <ContentPage badge="Безпечний вхід" title="Ваші дані —" accent="ваші"
      desc="Прозоре зберігання та шифрування. Жодних посередників, жодного доступу третіх сторін."
    >
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <FeatureRow Icon={Smartphone} title="Вхід через Telegram"
          desc="Номер у будь-якому форматі — система розпізнає автоматично." />
        <FeatureRow Icon={KeyRound} title="Код + 2FA"
          desc="5-значний код від Telegram, хмарний пароль для двофакторної автентифікації." />
        <FeatureRow Icon={Lock} title="Шифрування Fernet"
          desc="API Hash і сесійні рядки — лише в зашифрованому вигляді, навіть з доступом до БД їх не прочитати." />
        <FeatureRow Icon={Database} title="Дані під вашим контролем"
          desc="Зберігаються у власній PostgreSQL-базі. Експорт в JSON одним кліком, видалення — назавжди." />
      </div>
    </ContentPage>
  );
}

/* ──────────── Shared content-page chrome (badge + heading + body) ──────────── */
function ContentPage({
  badge, title, accent, desc, children,
}: {
  badge: string; title: string; accent: string; desc: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="relative z-10 shrink-0 px-5 pt-3 pb-2 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-1">
          <span
            className="text-xs font-display font-semibold tracking-widest uppercase"
            style={{ color: "hsl(316 90% 65%)" }}
          >
            {badge}
          </span>
          <h1
            className="font-display font-black leading-tight text-white"
            style={{ fontSize: "clamp(1.45rem, 7vw, 2.2rem)" }}
          >
            {title}{" "}
            <span style={gradientText}>{accent}</span>
          </h1>
          <p
            className="leading-snug"
            style={{ color: "hsl(258 10% 68%)", fontSize: "clamp(0.75rem, 3.2vw, 0.85rem)" }}
          >
            {desc}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex-1 px-5 max-w-lg mx-auto w-full flex flex-col gap-2 min-h-0">
        {children}
      </div>
    </>
  );
}

/* ──────────── Tiny SVG widgets ──────────── */
function Sparkline() {
  // Simple ascending zig-zag that suggests growth
  const points = [40, 38, 42, 36, 30, 33, 25, 28, 18, 22, 12, 16, 8];
  const w = 280, h = 60, max = 50;
  const stepX = w / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${(p / max) * h}`).join(" ");
  const fillPath = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: "100%", maxHeight: 80 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(142 71% 55%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(142 71% 55%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#sparkFill)" />
      <path d={path} fill="none" stroke="hsl(142 71% 55%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChart() {
  const bars = [
    { label: "Розсилки", v: 0.85 },
    { label: "Авто-відп.", v: 0.62 },
    { label: "Пересил.", v: 0.74 },
    { label: "OCR", v: 0.41 },
    { label: "Голос", v: 0.33 },
    { label: "Дзеркала", v: 0.55 },
  ];
  return (
    <div className="flex items-end gap-1.5 flex-1 min-h-0" style={{ minHeight: 60 }}>
      {bars.map((b) => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${b.v * 100}%`,
              minHeight: 8,
              background: "linear-gradient(180deg, hsl(271 91% 65%), hsl(316 90% 55%))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          />
          <span className="text-[9px] truncate w-full text-center" style={{ color: "hsl(258 10% 55%)" }}>
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatTile({ Icon, value, label, color }: { Icon: React.ComponentType<any>; value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl p-2.5 flex flex-col items-center gap-1" style={convexCard}>
      <Icon style={{ width: 14, height: 14, color }} />
      <span className="font-display font-black text-sm" style={{ color }}>{value}</span>
      <span className="text-[9px] leading-tight text-center" style={{ color: "hsl(258 10% 60%)" }}>{label}</span>
    </div>
  );
}

/* ──────────── Top header (logo only, hidden on welcome page) ──────────── */
function TopLogo() {
  return (
    <div className="relative z-20 shrink-0 px-5 pt-4 pb-0 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2.5">
        <div
          style={{
            width: 24, height: 24, borderRadius: 6,
            background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <TelegramIcon className="text-white" style={{ width: 14, height: 14 }} />
        </div>
        <span className="font-display font-black" style={{ fontSize: "clamp(1.15rem, 5.5vw, 1.45rem)" }}>
          <span className="text-white">GROUP </span>
          <span style={gradientText}>AGENT</span>
        </span>
      </div>
      <div
        className="mt-2"
        style={{ height: 1, background: "linear-gradient(90deg, transparent, hsl(271 91% 65% / 0.35), hsl(316 90% 62% / 0.35), transparent)" }}
      />
    </div>
  );
}

/* ──────────── Main Landing component ──────────── */
export default function Landing() {
  const [page, setPage] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [, setLocation] = useLocation();

  const next = () => {
    if (page < TOTAL_PAGES - 1) setPage(page + 1);
    else {
      localStorage.setItem("tgctrl_landing_seen", "1");
      setShowAuth(true);
    }
  };

  const isLast = page === TOTAL_PAGES - 1;
  const isWelcome = page === 0;
  const buttonLabel = isWelcome ? "ПОЧАТИ" : isLast ? "ЗАРЕЄСТРУВАТИСЯ" : "ДАЛІ";

  return (
    <>
      <PageShell>
        {/* Top logo bar — hidden on welcome page so the big hero stays the focal point */}
        {!isWelcome && <TopLogo />}

        {/* Page content */}
        {page === 0 && <PageWelcome />}
        {page === 1 && <PageFunctionality />}
        {page === 2 && <PageAdvantages />}
        {page === 3 && <PageAnalytics />}
        {page === 4 && <PageAccess />}

        {/* Bottom: button + dots */}
        <div className="relative z-20 shrink-0 px-5 pt-3 pb-7 max-w-lg mx-auto w-full flex flex-col items-center gap-3">
          <button
            onClick={next}
            className="w-full rounded-2xl font-display font-bold tracking-wide text-white flex items-center justify-center gap-2"
            style={{
              ...convexBtn,
              padding: "clamp(13px,3.5vw,16px)",
              fontSize: "clamp(0.875rem, 4vw, 1rem)",
            }}
            data-testid="next-button"
          >
            {buttonLabel}
            {!isWelcome && <ArrowRight style={{ width: 18, height: 18 }} />}
          </button>

          <div className="flex gap-2 items-center">
            {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Сторінка ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: page === i ? 20 : 6,
                  height: 4,
                  background:
                    page === i
                      ? "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))"
                      : "hsl(258 30% 28%)",
                  border: "none",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      </PageShell>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => setLocation("/dashboard")}
        />
      )}
    </>
  );
}
