import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search, Users, Megaphone, Clock, Zap,
  ShieldCheck, Smartphone, KeyRound, ArrowRight,
} from "lucide-react";

const TOTAL_PAGES = 3;

const gradientText: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const iconWrap: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 65% / 0.28), hsl(316 90% 62% / 0.18))",
  border: "1px solid hsl(271 91% 65% / 0.4)",
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
      { icon: Clock,     title: "Гнучкий розклад", desc: "Щогодини, кожні 2/4/8/12 годин, щодня або довільний інтервал." },
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
  const [, setLocation] = useLocation();
  const current = pages[page];

  const next = () => {
    if (page < TOTAL_PAGES - 1) setPage(page + 1);
    else setLocation("/dashboard");
  };

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

      {/* ── TOP: Logo + Progress ── */}
      <div className="relative z-20 shrink-0 px-5 pt-5 pb-3 max-w-lg mx-auto w-full">
        {/* Logo row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                boxShadow: "0 0 14px hsl(271 91% 65% / 0.55)",
              }}
            >
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-black text-lg" style={gradientText}>TG_CTRL</span>
          </div>
          <span className="font-mono text-xs" style={{ color: "hsl(258 10% 50%)" }}>
            {page + 1} / {TOTAL_PAGES}
          </span>
        </div>

        {/* Progress segments */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="h-1 flex-1 rounded-full overflow-hidden"
              style={{ background: "hsl(258 30% 18%)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: i <= page ? "100%" : "0%",
                  background: "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                  opacity: i < page ? 0.4 : 1,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── MIDDLE: Text ── */}
      <div className="relative z-10 shrink-0 px-5 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-1.5">
          <span
            className="text-xs font-display font-semibold tracking-widest uppercase"
            style={{ color: "hsl(316 90% 65%)" }}
          >
            {current.badge}
          </span>
          <h1
            className="font-display font-black leading-tight text-white"
            style={{ fontSize: "clamp(1.6rem, 7.5vw, 2.4rem)" }}
          >
            {current.title}{" "}
            <span style={gradientText}>{current.accent}</span>
          </h1>
          <p
            className="leading-snug"
            style={{ color: "hsl(258 10% 68%)", fontSize: "clamp(0.8rem, 3.5vw, 0.9rem)" }}
          >
            {current.desc}
          </p>
        </div>
      </div>

      {/* ── CARDS: fills remaining space ── */}
      <div className="relative z-10 flex-1 px-5 py-3 max-w-lg mx-auto w-full flex flex-col gap-2 min-h-0">
        {current.cards.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex items-center gap-3 rounded-2xl flex-1 min-h-0"
            style={{ ...glassCard, padding: "clamp(10px,2.5vw,14px) clamp(12px,3vw,16px)" }}
          >
            <div
              className="rounded-xl flex items-center justify-center"
              style={{ ...iconWrap, width: 36, height: 36, minWidth: 36 }}
            >
              <Icon style={{ color: "hsl(271 91% 72%)", width: 16, height: 16 }} />
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

      {/* ── BOTTOM: Button ── */}
      <div className="relative z-20 shrink-0 px-5 pt-2 pb-8 max-w-lg mx-auto w-full">
        <button
          onClick={next}
          className="w-full rounded-2xl font-display font-bold tracking-wide text-white"
          style={{
            background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
            boxShadow: "0 0 28px hsl(271 91% 65% / 0.45), 0 0 56px hsl(316 90% 62% / 0.2)",
            padding: "clamp(13px,3.5vw,16px)",
            fontSize: "clamp(0.875rem, 4vw, 1rem)",
          }}
          data-testid="next-button"
        >
          {page < TOTAL_PAGES - 1 ? "ДАЛІ" : "АВТОРИЗУВАТИСЯ"}
        </button>
      </div>
    </div>
  );
}
