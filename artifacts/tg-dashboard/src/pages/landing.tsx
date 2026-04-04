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
  boxShadow: "0 0 24px hsl(271 91% 65% / 0.4), 0 0 48px hsl(316 90% 62% / 0.18)",
  flexShrink: 0,
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

const gradientText: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const pages = [
  {
    badge: "Ласкаво просимо",
    heading: (
      <>
        Твій Telegram{" "}
        <span style={gradientText}>менеджер</span>
      </>
    ),
    desc: "Потужний інструмент для автоматичного керування Telegram-групами — все від вашого акаунту, без сторонніх сервісів.",
    cards: [
      { icon: Search,   title: "Знаходить групи",   desc: "Пошук по ключових словах з фільтрами за кількістю учасників та типом." },
      { icon: Users,    title: "Автовступ у групи",  desc: "Автоматично вступає від вашого імені з налаштованою затримкою між діями." },
      { icon: Megaphone,title: "Масова розсилка",    desc: "Надсилає повідомлення у збережені групи за розкладом або вручну." },
    ],
  },
  {
    badge: "Як це працює",
    heading: (
      <>
        Функції та{" "}
        <span style={gradientText}>принципи</span>
      </>
    ),
    desc: "Всі операції виконуються від вашого акаунту через офіційний Telegram API.",
    cards: [
      { icon: Search,   title: "Пошук груп",       desc: "Введіть ключове слово — система знаходить групи й канали. Фільтруйте за мін./макс. учасниками та типом." },
      { icon: Clock,    title: "Гнучкий розклад",   desc: "Розсилка кожну годину, кожні 2/4/8/12 годин або щодня. Довільний інтервал у хвилинах." },
      { icon: Megaphone,title: "Кампанії",           desc: "Створюйте кампанії з текстом і розкладом. Запускайте, призупиняйте та відстежуйте статус." },
      { icon: Users,    title: "Збережені групи",    desc: "Зберігайте знайдені групи, масово обирайте та одним кліком вступайте в усі одразу." },
    ],
  },
  {
    badge: "Авторизація",
    heading: (
      <>
        Що і{" "}
        <span style={gradientText}>як</span>
      </>
    ),
    desc: "Для роботи потрібно один раз підключити ваш Telegram акаунт — далі все автоматично.",
    cards: [
      { icon: Smartphone,  title: "Введіть номер телефону", desc: "Вкажіть номер акаунту Telegram з кодом країни. Telegram надішле код підтвердження." },
      { icon: KeyRound,    title: "Підтвердіть код",        desc: "Введіть 5-значний код із Telegram. Якщо увімкнена 2FA — також пароль." },
      { icon: ShieldCheck, title: "Сесія збережена",        desc: "Авторизація зберігається на сервері. Повторно входити не потрібно — навіть після перезапуску." },
      { icon: ArrowRight,  title: "Business або Premium",   desc: "Для масових дій рекомендується Telegram Business або Premium акаунт, щоб уникнути обмежень." },
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
        minHeight: "-webkit-fill-available",
        background:
          "radial-gradient(ellipse 90% 55% at 50% 0%, hsl(271 91% 38% / 0.55) 0%, transparent 70%), " +
          "radial-gradient(ellipse 65% 50% at 85% 100%, hsl(316 90% 40% / 0.3) 0%, transparent 65%), " +
          "radial-gradient(ellipse 70% 55% at 15% 90%, hsl(258 80% 28% / 0.4) 0%, transparent 65%), " +
          "hsl(258 38% 8%)",
      }}
    >
      {/* Neon grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(271 91% 65% / 0.07) 1px, transparent 1px), " +
            "linear-gradient(90deg, hsl(271 91% 65% / 0.07) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Progress bar ── */}
      <div className="relative z-20 px-6 pt-8 pb-2 max-w-lg mx-auto w-full shrink-0">
        {/* Step label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                boxShadow: "0 0 16px hsl(271 91% 65% / 0.55)",
              }}
            >
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-black text-lg" style={gradientText}>TG_CTRL</span>
          </div>
          <span className="font-mono text-xs" style={{ color: "hsl(258 10% 55%)" }}>
            {page + 1} / {TOTAL_PAGES}
          </span>
        </div>

        {/* Segmented progress bar */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full overflow-hidden cursor-pointer"
              style={{ background: "hsl(258 30% 20%)" }}
              onClick={() => setPage(i)}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: i < page ? "100%" : i === page ? "100%" : "0%",
                  background:
                    i <= page
                      ? "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))"
                      : "transparent",
                  opacity: i < page ? 0.45 : 1,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-5">
          {/* Badge + heading + desc */}
          <div className="flex flex-col gap-2">
            <span
              className="text-xs font-display font-semibold tracking-widest uppercase"
              style={{ color: "hsl(316 90% 65%)" }}
            >
              {current.badge}
            </span>
            <h1 className="font-display font-black leading-tight text-white"
              style={{ fontSize: "clamp(1.75rem, 8vw, 2.5rem)" }}>
              {current.heading}
            </h1>
            <p style={{ color: "hsl(258 10% 72%)", fontSize: "clamp(0.85rem, 4vw, 1rem)", lineHeight: 1.6 }}>
              {current.desc}
            </p>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {current.cards.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-2xl" style={cardStyle}>
                <div
                  className="shrink-0 rounded-xl flex items-center justify-center"
                  style={{ ...iconWrap, width: "clamp(36px,9vw,42px)", height: "clamp(36px,9vw,42px)" }}
                >
                  <Icon style={{ color: "hsl(271 91% 72%)", width: "clamp(16px,4.5vw,20px)", height: "clamp(16px,4.5vw,20px)" }} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-display font-bold text-white"
                    style={{ fontSize: "clamp(0.75rem, 3.5vw, 0.875rem)" }}>
                    {title}
                  </span>
                  <span style={{ color: "hsl(258 10% 65%)", fontSize: "clamp(0.7rem, 3vw, 0.8rem)", lineHeight: 1.55 }}>
                    {desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fixed bottom bar ── */}
      <div className="relative z-20 px-6 pt-3 pb-8 shrink-0 max-w-lg mx-auto w-full">
        <button
          onClick={next}
          className="w-full rounded-2xl font-display font-bold tracking-wide"
          style={{
            ...gradientBtn,
            padding: "clamp(12px, 3.5vw, 16px) 24px",
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
