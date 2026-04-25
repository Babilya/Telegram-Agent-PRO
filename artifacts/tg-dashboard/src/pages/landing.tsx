import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search, Megaphone, Smartphone, KeyRound,
  Bot, Forward, Copy, Eye, Camera, Mic,
  Cpu, Radio, CalendarClock, Database, Lock,
} from "lucide-react";
import { TelegramIcon } from "@/components/ui/telegram-icon";
import { AuthModal } from "@/components/auth/auth-modal";

const TOTAL_PAGES = 4;

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
    badge: "GROUP AGENT PRO",
    title: "Telegram під",
    accent: "контролем",
    desc: "Усе ваше Telegram-життя в одному місці: автоматичні розсилки, моніторинг, дзеркала акаунтів і повна аналітика — від вашого імені.",
    cards: [
      { icon: Search,    title: "Розумний пошук груп",      desc: "Знаходить публічні групи й канали за ключовими словами з фільтрами по аудиторії, активності та типу." },
      { icon: Megaphone, title: "Масові кампанії",          desc: "Розсилки в десятки груп за гнучким розкладом — APScheduler контролює інтервали й уникає блокувань." },
      { icon: Eye,       title: "Моніторинг у реальному часі", desc: "Автовідповіді, пересилання, реакція на ключові слова, OCR і розпізнавання голосових повідомлень." },
    ],
  },
  {
    badge: "Автоматизація",
    title: "Бот, який",
    accent: "не спить",
    desc: "Реагує на повідомлення замість вас, веде досьє контактів і пересилає важливе у потрібні чати — 24/7.",
    cards: [
      { icon: Bot,       title: "Автовідповіді",        desc: "Відповідає на ключові слова, питання та шаблонні запити — точно так, як ви налаштуєте." },
      { icon: Forward,   title: "Розумне пересилання",  desc: "Фільтри по джерелу, типу контенту та ключових словах — кожне повідомлення йде у правильний чат." },
      { icon: Camera,    title: "OCR із зображень",     desc: "Розпізнає текст із картинок, скріншотів і рекламних креативів — українська й англійська." },
      { icon: Mic,       title: "Голосові у текст",     desc: "Транскрибує голосові повідомлення з автодетектом мови — більше не треба слухати." },
    ],
  },
  {
    badge: "Інфраструктура",
    title: "Промислова",
    accent: "надійність",
    desc: "Кожен компонент моніториться, шифрується та має резервну копію — усе видно з єдиної панелі.",
    cards: [
      { icon: Copy,         title: "Дзеркала акаунтів",    desc: "Підключайте додаткові Telegram-акаунти — кожен зі своєю сесією, ізольований і керований окремо." },
      { icon: Cpu,          title: "Стан системи",         desc: "6 індикаторів здоров'я: API, Python, Telegram, інлайн-бот, шифрування, дзеркала — оновлення кожні 5 секунд." },
      { icon: CalendarClock, title: "Планувальник задач",  desc: "Усі заплановані операції з відліком до запуску, описом тригерів і керуванням активними кампаніями." },
      { icon: Radio,        title: "Жива стрічка подій",   desc: "Усі дії бота в реальному часі: 7 фільтрів, миттєвий пошук, повна історія операцій." },
    ],
  },
  {
    badge: "Безпека та підключення",
    title: "Один раз —",
    accent: "назавжди",
    desc: "Підключіть акаунт за 30 секунд. Сесія зашифрована Fernet, дані під контролем, бекап у один клік.",
    cards: [
      { icon: Smartphone,  title: "Номер телефону",       desc: "Будь-який формат: +38 (050) 777 11 11, +380507771111 — система розпізнає автоматично." },
      { icon: KeyRound,    title: "Код і 2FA",            desc: "5-значний код із Telegram, хмарний пароль для двофакторної автентифікації — все за один крок." },
      { icon: Lock,        title: "Шифрування Fernet",    desc: "API Hash і сесійні рядки зберігаються у БД виключно у зашифрованому вигляді — навіть з доступом до даних їх не прочитати." },
      { icon: Database,    title: "Експорт у JSON",       desc: "Усі ключові слова, автовідповіді, фільтри та логи — один файл, одне натискання, без втрат." },
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
    else {
      localStorage.setItem("tgctrl_landing_seen", "1");
      setShowAuth(true);
    }
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
          <div style={{ ...logoIcon, width: 20, height: 20, borderRadius: 5 }}>
            <TelegramIcon className="text-white" style={{ width: 12, height: 12 }} />
          </div>
          <span className="font-display font-black" style={{ fontSize: "clamp(1.15rem, 5.5vw, 1.45rem)" }}>
            <span className="text-white">GROUP </span>
            <span style={gradientText}>AGENT</span>
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="relative z-10 shrink-0 px-5 max-w-lg mx-auto w-full">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, hsl(271 91% 65% / 0.35), hsl(316 90% 62% / 0.35), transparent)" }} />
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
