import { useState } from "react";
import { BookOpen, AlertTriangle, HelpCircle, Shield, Compass, FileText, ChevronRight } from "lucide-react";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

type Tab = "menu" | "guide" | "faq" | "errors" | "security" | "quick";

const errors = [
  { code: "E001", title: "FloodWaitError", desc: "Занадто часта розсилка. Збільште інтервал до 5+ хв." },
  { code: "E002", title: "Group not found", desc: "Невірний ID або ви не в групі. Перевірте через /id." },
  { code: "E003", title: "No write rights", desc: "Вас видалили або заблокували. Перевірте можливість писати вручну." },
  { code: "E004", title: "Invalid interval", desc: "Текст замість числа. Введіть число від 5 до 1440." },
  { code: "E005", title: "Keyword too short", desc: "Слово закоротке (мін. 2 символи)." },
  { code: "E006", title: "Autoreply loop", desc: "Виявлено петлю автовідповідей." },
  { code: "E007", title: "Mirror invalid API", desc: "Невірні api_id / api_hash для дзеркала." },
  { code: "E008", title: "OCR no text", desc: "Текст на фото не знайдено. Використовуйте контрастні фото." },
  { code: "E009", title: "Voice too long", desc: "Голосове задовге (>5 хв). Розбийте на частини." },
  { code: "E010", title: "Backup failed", desc: "Помилка резервної копії. Перевірте місце на диску." },
  { code: "E011", title: "Join limit", desc: "Досягнуто ліміт вступів (20/день). Зачекайте до завтра." },
  { code: "E012", title: "Cancel limit", desc: "10 скасувань за 24 год. Блокування на 24 години." },
];

const faq = [
  { q: "Що таке юзербот?", a: "Скрипт, який використовує ваш особистий акаунт через API. Може читати, писати, вступати в групи — все, що можете ви." },
  { q: "Чи безпечно це?", a: "Так, якщо не спамити. Бот має вбудовані затримки, обмеження та антибан. Дані зберігаються локально." },
  { q: "Чи можуть мене заблокувати?", a: "Telegram може накласти FloodWait при частих діях. При систематичному спамі — бан акаунта." },
  { q: "Скільки коштує?", a: "Безкоштовно при самостійному запуску на Replit / своєму ПК. Витрати — лише трафік." },
  { q: "Де зберігаються логи?", a: "У папці data/ на сервері. Видалення — через підтримку." },
  { q: "Як зупинити бота?", a: "Натисніть «Вийти» в головному меню. Налаштування збережуться." },
  { q: "Чи можна спамити?", a: "Ні. Це порушує правила Telegram і призводить до блокування акаунта назавжди." },
  { q: "Як отримати ID групи?", a: "Додайте бота в групу, напишіть /id. Бот відповість числом, наприклад -1001234567890." },
  { q: "Чому не вступає в групу?", a: "Група приватна / ліміт 20/день / ви забанені / неправильне посилання." },
  { q: "Як змінити ключ?", a: "Зверніться до власника через підтримку. Він згенерує новий ключ." },
];

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: "menu", label: "Каталог", icon: BookOpen },
  { key: "quick", label: "Швидко", icon: Compass },
  { key: "guide", label: "Гід", icon: FileText },
  { key: "faq", label: "FAQ", icon: HelpCircle },
  { key: "errors", label: "Помилки", icon: AlertTriangle },
  { key: "security", label: "Безпека", icon: Shield },
];

export default function Help() {
  const [tab, setTab] = useState<Tab>("menu");

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">📘 Довідковий каталог</h1>
        <p className="text-muted-foreground text-sm">SHADOW AGENT PRO v3.8</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: tab === t.key ? "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" : "rgba(255,255,255,0.04)",
              border: `1px solid ${tab === t.key ? "hsl(271 91% 65% / 0.4)" : "rgba(255,255,255,0.07)"}`,
              color: tab === t.key ? "white" : DIM,
            }}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "menu" && <CatalogMenu />}
      {tab === "quick" && <QuickNav />}
      {tab === "guide" && <FullGuide />}
      {tab === "faq" && <FAQ />}
      {tab === "errors" && <Errors />}
      {tab === "security" && <Security />}
    </div>
  );
}

function CatalogMenu() {
  const items = [
    "📨 Розсилки", "👁️ Моніторинг", "📜 Логи", "🗂️ Досьє контактів",
    "🤖 Автовідповіді", "📤 Пересилання", "🔍 Пошук груп", "🚪 Вступ у групи",
    "📸 OCR (фото→текст)", "🎤 Голосові → текст", "🪞 Дзеркала", "📊 Статистика",
    "⚙️ Налаштування", "💬 Підтримка",
  ];
  return (
    <>
      <div className="rounded-2xl p-4" style={card}>
        <p className="text-[11px] font-display font-bold uppercase tracking-widest mb-3" style={{ color: DIM }}>
          Основні функції
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((i, idx) => (
            <div key={i} className="px-2.5 py-2 rounded-lg text-xs flex items-center gap-1.5" style={card}>
              <span className="font-mono text-[10px]" style={{ color: PRI }}>{idx + 1}.</span>
              <span className="text-white truncate">{i}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl p-4 space-y-1.5" style={card}>
        <p className="text-[11px] font-display font-bold uppercase tracking-widest mb-1" style={{ color: DIM }}>
          Загальні розділи
        </p>
        {["🧭 Швидкі переходи", "📖 Повний гід користувача", "❓ Розширений FAQ", "⚠️ Коди помилок (E001–E012)", "🔐 Політика безпеки"].map((s) => (
          <div key={s} className="text-xs text-white py-1">{s}</div>
        ))}
      </div>
    </>
  );
}

function QuickNav() {
  const wants = [
    "📨 Додати розсилку", "👁️ Додати ключ. слово", "🗂️ Відкрити досьє",
    "🤖 Налаштувати автовідповідь", "🔍 Знайти групи", "🚪 Вступити в групи",
    "📸 Розпізнати фото", "🎤 Голосове в текст", "🪞 Створити дзеркало",
    "📊 Подивитись статистику", "⚙️ Змінити сповіщення", "💬 Написати в підтримку",
  ];
  return (
    <div className="rounded-2xl p-4" style={card}>
      <p className="text-sm font-display font-bold text-white mb-2">Я хочу:</p>
      <div className="space-y-1">
        {wants.map((w) => (
          <div key={w} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs">
            <span className="text-white">{w}</span>
            <ChevronRight className="h-3 w-3" style={{ color: DIM }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FullGuide() {
  const sections = [
    { title: "1. Встановлення", items: ["Подайте заявку через меню", "Власник схвалить і надішле ключ", "Введіть ключ у боті", "Отримайте доступ до всіх функцій"] },
    { title: "2. Налаштування", items: ["Додайте групи для розсилок (ID через /id)", "Додайте ключові слова для моніторингу", "Налаштуйте автовідповіді", "Встановіть, куди слати сповіщення"] },
    { title: "3. Щоденна робота", items: ["Перевіряйте сповіщення в приватному чаті", "Слідкуйте за логами та досьє", "Використовуйте OCR для документів", "Створюйте дзеркала для друзів"] },
    { title: "4. Безпека", items: ["Не давайте ключ нікому", "Не спамте — бан акаунта Telegram", "Ліміт скасувань — 10/добу → блок 24 год", "Регулярно робіть бекап (власник)"] },
    { title: "5. Оптимізація", items: ["Різні інтервали для різних груп", "Додавайте медіа для залучення", "Використовуйте теги в досьє для пошуку"] },
  ];
  return (
    <div className="space-y-2">
      {sections.map((s) => (
        <div key={s.title} className="rounded-2xl p-4" style={card}>
          <p className="text-sm font-display font-bold text-white mb-2">{s.title}</p>
          <ul className="space-y-1 text-xs" style={{ color: "hsl(258 15% 80%)" }}>
            {s.items.map((i) => (
              <li key={i} className="flex gap-2"><span style={{ color: PRI }}>•</span>{i}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FAQ() {
  return (
    <div className="space-y-1.5">
      {faq.map((f, i) => (
        <details key={i} className="rounded-xl px-4 py-3 group" style={card}>
          <summary className="text-sm font-medium text-white cursor-pointer flex items-center justify-between">
            <span>{f.q}</span>
            <ChevronRight className="h-4 w-4 group-open:rotate-90 transition-transform" style={{ color: DIM }} />
          </summary>
          <p className="text-xs mt-2" style={{ color: "hsl(258 15% 75%)" }}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

function Errors() {
  return (
    <div className="space-y-1.5">
      {errors.map((e) => (
        <div key={e.code} className="rounded-xl px-4 py-3" style={card}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: "hsl(45 90% 55%)" }} />
            <span className="text-xs font-mono font-bold" style={{ color: "hsl(45 90% 55%)" }}>{e.code}</span>
            <span className="text-xs font-display font-bold text-white">{e.title}</span>
          </div>
          <p className="text-xs pl-6" style={{ color: "hsl(258 15% 75%)" }}>{e.desc}</p>
        </div>
      ))}
    </div>
  );
}

function Security() {
  const points = [
    "Шифрування api_hash та сесій (Fernet).",
    "Змінні оточення (.env) для секретів.",
    "FloodWait — автоматичне очікування + повтор.",
    "Випадкові паузи 1-5 сек між діями.",
    "Ліміт 20 вступів/добу для антибану.",
    "Розсилки: не частіше 1 раз на 5 хв на групу.",
    "Блок користувача: 10 скасувань → 24 год.",
    "Логи зберігаються локально, не у хмарі.",
    "Доступ тільки за унікальним ключем.",
    "Бекапи бази даних та медіа (власник).",
  ];
  return (
    <div className="rounded-2xl p-4 space-y-2" style={card}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4" style={{ color: PRI }} />
        <p className="text-sm font-display font-bold text-white">🔐 Політика безпеки</p>
      </div>
      <ul className="space-y-1.5 text-xs" style={{ color: "hsl(258 15% 80%)" }}>
        {points.map((p) => (
          <li key={p} className="flex gap-2"><span style={{ color: PRI }}>•</span>{p}</li>
        ))}
      </ul>
    </div>
  );
}
