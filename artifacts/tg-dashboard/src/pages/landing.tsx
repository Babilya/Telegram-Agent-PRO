import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search, Users, Megaphone, Clock,
  ShieldCheck, Smartphone, KeyRound, ArrowRight,
} from "lucide-react";
import { TelegramIcon } from "@/components/ui/telegram-icon";
import { AuthModal } from "@/components/auth/auth-modal";

const TOTAL_PAGES = 3;

const gradientText: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

/* Transparent card with convex (raised) effect — no border */
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

/* Convex gradient button — no big outer glow */
const convexBtn: React.CSSProperties = {
  background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
  border: "none",
  color: "white",
  boxShadow:
    "0 4px 16px rgba(0,0,0,0.35)," +
    "inset 0 1px 0 rgba(255,255,255,0.22)," +
    "inset 0 -1px 0 rgba(0,0,0,0.18)",
};

/* Square logo icon with convex effect */
const logoIcon: React.CSSProperties = {
  background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
  borderRadius: 10,
  boxShadow:
    "0 3px 10px rgba(0,0,0,0.35)," +
    "inset 0 1px 0 rgba(255,255,255,0.22)," +
    "inset 0 -1px 0 rgba(0,0,0,0.18)",
  width: 34,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const pages = [
  {
    badge: "Ласкаво просимо",
    title: "Твій Telegram",
    accent: "менеджер",
    desc: "Потужний інструмент для автоматичного керування Telegram-групами — все від вашого акаунту.",
    cards: [
      { icon: Search,    title: "Знаходить групи",  desc: "Пошук по ключових словах з фільтрами за учасниками та типом." },
      { icon: Users,     title: "Автовступ у групи", desc: "Автоматично вступає від вашого імені з затримкою між діями." },
      { icon: Megaphone, title: "Масова розсилка",   desc: "Надсилає повідомлення у збережені групи за розкладом." },
    ],
  },
  {
    badge: "Як це працює",
    title: "Функції та",
    accent: "принципи",
    desc: "Всі операції виконуються через офіційний Telegram API від вашого акаунту.",
    cards: [
      { icon: Search,    title: "Пошук груп",      desc: "Публічні групи й канали за ключовим словом, фільтри за мін./макс. учасниками." },
      { icon: Clock,     title: "Гнучкий розклад", desc: "Щогодини, кожні 2/4/8/12 годин, щодня або довільний інтервал у хвилинах." },
      { icon: Megaphone, title: "Кампанії",         desc: "Запускайте, призупиняйте та відстежуйте статус розсилки." },
      { icon: Users,     title: "Збережені групи",  desc: "Масово обирайте й вступайте в групи одним натисканням." },
    ],
  },
  {
    badge: "Авторизація",
    title: "Що і",
    accent: "як",
    desc: "Один раз підключіть Telegram акаунт — далі все автоматично.",
    cards: [
      { icon: Smartphone,  title: "Номер телефону",    desc: "Вкажіть номер з кодом країни — Telegram надішле код підтвердження." },
      { icon: KeyRound,    title: "Підтвердіть код",   desc: "Введіть 5-значний код із Telegram. Якщо є 2FA — також пароль." },
      { icon: ShieldCheck, title: "Сесія збережена",   desc: "Повторно входити не потрібно навіть після перезапуску сервера." },
      { icon: ArrowRight,  title: "Business / Premium", desc: "Рекомендується для масових дій — щоб уникнути обмежень Telegram." },
    ],
  },
];

export default function Landing() {
  const [page, setPage] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [, setLocation] = useLocation();
  const current = pages[page];

  const next = () => {
    if (page < TOTAL_PAGES - 1) setPage(page + 1);
    else setShowAuth(true);
  };

  return (
    <>
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
      {/* Neon grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(271 91% 65% / 0.07) 1px, transparent 1px)," +
            "linear-gradient(90deg, hsl(271 91% 65% / 0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── TOP: Logo only ── */}
      <div className="relative z-20 shrink-0 px-5 pt-4 pb-0 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div style={{ ...logoIcon, width: 38, height: 38, borderRadius: 11 }}>
            <TelegramIcon className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-black" style={{ fontSize: "clamp(1.15rem, 5.5vw, 1.45rem)" }}>
            <span className="text-white">GROUP </span>
            <span style={gradientText}>AGENT</span>
          </span>
        </div>
      </div>

      {/* ── TEXT: Badge + heading + desc ── */}
      <div className="relative z-10 shrink-0 px-5 pt-3 pb-2 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-1">
          <span
            className="text-xs font-display font-semibold tracking-widest uppercase"
            style={{ color: "hsl(316 90% 65%)" }}
          >
            {current.badge}
          </span>
          <h1
            className="font-display font-black leading-tight text-white"
            style={{ fontSize: "clamp(1.45rem, 7vw, 2.2rem)" }}
          >
            {current.title}{" "}
            <span style={gradientText}>{current.accent}</span>
          </h1>
          <p
            className="leading-snug"
            style={{ color: "hsl(258 10% 68%)", fontSize: "clamp(0.75rem, 3.2vw, 0.85rem)" }}
          >
            {current.desc}
          </p>
        </div>
      </div>

      {/* ── CARDS: fills remaining space ── */}
      <div className="relative z-10 flex-1 px-5 max-w-lg mx-auto w-full flex flex-col gap-2 min-h-0">
        {current.cards.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
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
        ))}
      </div>

      {/* ── BOTTOM: Button + dots below ── */}
      <div className="relative z-20 shrink-0 px-5 pt-3 pb-7 max-w-lg mx-auto w-full flex flex-col items-center gap-3">
        <button
          onClick={next}
          className="w-full rounded-2xl font-display font-bold tracking-wide text-white"
          style={{
            ...convexBtn,
            padding: "clamp(13px,3.5vw,16px)",
            fontSize: "clamp(0.875rem, 4vw, 1rem)",
          }}
          data-testid="next-button"
        >
          {page < TOTAL_PAGES - 1 ? "ДАЛІ" : "АВТОРИЗУВАТИСЯ"}
        </button>

        {/* Progress dots — small, centered, below button */}
        <div className="flex gap-2 items-center">
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: page === i ? 20 : 6,
                height: 4,
                background:
                  page === i
                    ? "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))"
                    : "hsl(258 30% 28%)",
              }}
            />
          ))}
        </div>
      </div>
    </div>

    {showAuth && (
      <AuthModal
        onClose={() => setShowAuth(false)}
        onSuccess={() => setLocation("/dashboard")}
      />
    )}
    </>
  );
}
