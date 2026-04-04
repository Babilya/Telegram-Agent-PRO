import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search, Users, Megaphone, Clock, Zap,
  ShieldCheck, Smartphone, KeyRound, ArrowRight,
} from "lucide-react";

const TOTAL_PAGES = 3;

const gradientBtn: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
  color: "white",
  boxShadow: "0 0 28px hsl(271 91% 65% / 0.45), 0 0 56px hsl(316 90% 62% / 0.2)",
};

const cardStyle: React.CSSProperties = {
  background: "hsl(258 35% 12% / 0.85)",
  border: "1px solid hsl(258 30% 22%)",
  backdropFilter: "blur(8px)",
};

const iconWrap: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.2))",
  border: "1px solid hsl(271 91% 65% / 0.4)",
};

export default function Landing() {
  const [page, setPage] = useState(0);
  const [, setLocation] = useLocation();

  const bgStyle: React.CSSProperties = {
    background:
      "radial-gradient(ellipse 90% 55% at 50% 0%, hsl(271 91% 38% / 0.55) 0%, transparent 70%), " +
      "radial-gradient(ellipse 65% 50% at 85% 100%, hsl(316 90% 40% / 0.3) 0%, transparent 65%), " +
      "radial-gradient(ellipse 70% 55% at 15% 90%, hsl(258 80% 28% / 0.4) 0%, transparent 65%), " +
      "hsl(258 38% 8%)",
  };

  const gridStyle: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(hsl(271 91% 65% / 0.07) 1px, transparent 1px), " +
      "linear-gradient(90deg, hsl(271 91% 65% / 0.07) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
  };

  const next = () => {
    if (page < TOTAL_PAGES - 1) setPage(page + 1);
    else setLocation("/dashboard");
  };

  return (
    <div className="h-screen flex flex-col" style={bgStyle}>
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={gridStyle} />

      {/* Content area — scrollable if needed, but usually fits */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-10 pb-4">

        {/* ── PAGE 0: Знайомство ── */}
        {page === 0 && (
          <div className="flex flex-col gap-7 max-w-lg mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                  boxShadow: "0 0 20px hsl(271 91% 65% / 0.6)",
                }}
              >
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span
                className="font-display font-black text-xl tracking-tight"
                style={{
                  background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TG_CTRL
              </span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-3">
              <span
                className="text-xs font-display font-semibold tracking-widest uppercase"
                style={{ color: "hsl(316 90% 65%)" }}
              >
                Ласкаво просимо
              </span>
              <h1 className="text-4xl font-display font-black leading-tight text-white">
                Твій Telegram{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  менеджер
                </span>
              </h1>
              <p className="text-base leading-relaxed" style={{ color: "hsl(258 10% 72%)" }}>
                Потужний інструмент для автоматичного керування Telegram-групами — все від вашого акаунту, без сторонніх сервісів.
              </p>
            </div>

            {/* What it does */}
            <div className="flex flex-col gap-3">
              {[
                { icon: Search, title: "Знаходить групи", desc: "Пошук по ключовим словам з фільтрами за кількістю учасників та типом." },
                { icon: Users, title: "Автовступ у групи", desc: "Автоматично вступає від вашого імені з налаштованою затримкою між діями." },
                { icon: Megaphone, title: "Масова розсилка", desc: "Надсилає повідомлення у збережені групи за розкладом або вручну." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-2xl" style={cardStyle}>
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={iconWrap}>
                    <Icon className="h-5 w-5" style={{ color: "hsl(271 91% 72%)" }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-display font-bold text-sm text-white">{title}</span>
                    <span className="text-xs leading-relaxed" style={{ color: "hsl(258 10% 65%)" }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PAGE 1: Функції ── */}
        {page === 1 && (
          <div className="flex flex-col gap-7 max-w-lg mx-auto">
            <div className="flex flex-col gap-3">
              <span
                className="text-xs font-display font-semibold tracking-widest uppercase"
                style={{ color: "hsl(316 90% 65%)" }}
              >
                Як це працює
              </span>
              <h2 className="text-4xl font-display font-black leading-tight text-white">
                Функції та{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  принципи
                </span>
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "hsl(258 10% 72%)" }}>
                Всі операції виконуються від вашого акаунту через офіційний Telegram API.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                {
                  icon: Search,
                  title: "Пошук груп",
                  desc: "Введіть ключове слово — система знаходить публічні групи й канали. Фільтруйте за мін./макс. учасниками та типом.",
                },
                {
                  icon: Clock,
                  title: "Гнучкий розклад",
                  desc: "Розсилка кожну годину, кожні 2/4/8/12 годин або щодня. Можна встановити довільний інтервал у хвилинах.",
                },
                {
                  icon: Megaphone,
                  title: "Кампанії розсилки",
                  desc: "Створюйте кампанії з текстом, списком груп і розкладом. Запускайте, призупиняйте та відстежуйте статус.",
                },
                {
                  icon: Users,
                  title: "Збережені групи",
                  desc: "Зберігайте знайдені групи, масово обирайте та одним кліком вступайте в усі одразу.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-2xl" style={cardStyle}>
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={iconWrap}>
                    <Icon className="h-5 w-5" style={{ color: "hsl(271 91% 72%)" }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-display font-bold text-sm text-white">{title}</span>
                    <span className="text-xs leading-relaxed" style={{ color: "hsl(258 10% 65%)" }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PAGE 2: Авторизація ── */}
        {page === 2 && (
          <div className="flex flex-col gap-7 max-w-lg mx-auto">
            <div className="flex flex-col gap-3">
              <span
                className="text-xs font-display font-semibold tracking-widest uppercase"
                style={{ color: "hsl(316 90% 65%)" }}
              >
                Авторизація
              </span>
              <h2 className="text-4xl font-display font-black leading-tight text-white">
                Що і{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  як
                </span>
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "hsl(258 10% 72%)" }}>
                Для роботи потрібно один раз підключити ваш Telegram акаунт — далі все автоматично.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                {
                  icon: Smartphone,
                  title: "Введіть номер телефону",
                  desc: "Вкажіть номер акаунту Telegram з кодом країни. Telegram надішле вам код підтвердження.",
                },
                {
                  icon: KeyRound,
                  title: "Підтвердіть код",
                  desc: "Введіть 5-значний код із Telegram. Якщо увімкнена 2FA — також пароль.",
                },
                {
                  icon: ShieldCheck,
                  title: "Сесія збережена",
                  desc: "Авторизація зберігається на сервері. Повторно входити не потрібно — навіть після перезапуску.",
                },
                {
                  icon: ArrowRight,
                  title: "Потрібен Business або Premium",
                  desc: "Для масових дій рекомендується Telegram Business або Premium акаунт, щоб уникнути обмежень.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-2xl" style={cardStyle}>
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={iconWrap}>
                    <Icon className="h-5 w-5" style={{ color: "hsl(271 91% 72%)" }} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-display font-bold text-sm text-white">{title}</span>
                    <span className="text-xs leading-relaxed" style={{ color: "hsl(258 10% 65%)" }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed bottom bar ── */}
      <div className="relative z-20 px-6 pb-10 pt-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-display font-bold text-base tracking-wide"
          style={gradientBtn}
          data-testid="next-button"
        >
          {page < TOTAL_PAGES - 1 ? "ДАЛІ" : "АВТОРИЗУВАТИСЯ"}
        </button>

        {/* Page dots */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: page === i ? 24 : 6,
                background:
                  page === i
                    ? "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))"
                    : "hsl(258 30% 30%)",
              }}
              data-testid={`dot-${i}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
