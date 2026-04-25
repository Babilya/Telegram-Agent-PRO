import { useEffect, useState } from "react";
import { BookOpen, AlertTriangle, HelpCircle, Shield, Compass, FileText, ChevronRight, FlaskConical, Loader2, CheckCircle2, XCircle, PlayCircle } from "lucide-react";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const OK = "hsl(142 71% 45%)";
const ERR = "hsl(0 84% 60%)";
const card: React.CSSProperties = { background: "linear-gradient(160deg, hsl(258 35% 14% / 0.85), hsl(258 35% 9% / 0.85))", border: "1px solid hsl(271 40% 28% / 0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)" };

type Tab = "menu" | "guide" | "faq" | "errors" | "security" | "quick" | "tests";

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
  { code: "E013", title: "Mirror code invalid", desc: "Невірний або прострочений код входу для дзеркала. Запросіть код повторно." },
  { code: "E014", title: "Mirror 2FA failed", desc: "Невірний пароль 2FA для дзеркала. Перевірте розкладку клавіатури." },
  { code: "E015", title: "Mirror session lost", desc: "Сесія дзеркала більше не авторизована. Пройдіть авторизацію наново." },
];

const faq = [
  { q: "Що таке юзербот?", a: "Скрипт, який використовує ваш особистий акаунт через Telegram API. Може читати, писати, вступати в групи — все, що можете ви, але автоматично." },
  { q: "Чи безпечно це?", a: "Так, якщо не спамити. Бот має вбудовані затримки, ліміти та антибан-логіку. Сесії шифруються Fernet, чутливі поля зберігаються в зашифрованому вигляді." },
  { q: "Чи можуть мене заблокувати?", a: "Telegram може накласти FloodWait при частих діях. При систематичному спамі — постійний бан акаунта. Дотримуйтесь рекомендованих інтервалів." },
  { q: "Скільки коштує?", a: "Безкоштовно при самостійному запуску на Replit / власному сервері. Платите лише за трафік і за хостинг (на Replit — за деплоймент, якщо потрібен)." },
  { q: "Де зберігаються логи?", a: "У базі PostgreSQL (таблиця message_logs). Експорт — на сторінці «Логи». Видалення всіх — кнопкою «Очистити»." },
  { q: "Як зупинити бота?", a: "Зупиніть workflow «Telegram Bot Service» у середовищі Replit. Налаштування і дані залишаться у базі." },
  { q: "Чи можна спамити?", a: "Ні. Це порушує правила Telegram і призводить до блокування акаунта назавжди. Бот має ліміт 10 скасувань / 24 год (E012) і 20 вступів / день (E011)." },
  { q: "Як отримати ID групи?", a: "Додайте бота в групу, напишіть /id. Бот відповість числом, наприклад -1001234567890. Або через десктопний клієнт у режимі розробника." },
  { q: "Чому не вступає в групу?", a: "Група приватна / ліміт 20/день / ви забанені / неправильне посилання / у вас немає інвайт-лінка для приватних груп." },
  { q: "Як змінити ключ доступу дзеркала?", a: "На сторінці «Дзеркала» видаліть старе дзеркало та створіть нове — буде згенеровано новий ключ. Стара сесія залишиться зашифрованою у БД." },
  { q: "Що таке інлайн-бот?", a: "Окремий BotFather-бот (працює як @your_bot), який показує меню з інлайн-кнопками. Юзербот цього не вміє через обмеження Telegram. Стартує, якщо задано TELEGRAM_BOT_TOKEN." },
  { q: "Що показує сторінка «Система»?", a: "Стан усіх компонентів: Node API, Python-сервіс, Telegram-клієнт, інлайн-бот, шифрування, активні дзеркала. Оновлюється кожні 5 секунд." },
  { q: "Що таке «Розклад»?", a: "Список усіх запланованих задач планувальника APScheduler: кампанії розсилки, щогодинна перевірка контактів, що були давно. Показує час до наступного запуску." },
  { q: "Як подивитись усі події?", a: "На сторінці «Активність» — жива стрічка моніторингу, автовідповідей, пересилань, OCR, голосових і тікетів підтримки. Фільтр по типу події. Оновлюється кожні 4 секунди." },
];

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: "menu", label: "Каталог", icon: BookOpen },
  { key: "quick", label: "Швидко", icon: Compass },
  { key: "guide", label: "Гід", icon: FileText },
  { key: "faq", label: "FAQ", icon: HelpCircle },
  { key: "errors", label: "Помилки", icon: AlertTriangle },
  { key: "security", label: "Безпека", icon: Shield },
  { key: "tests", label: "Тести", icon: FlaskConical },
];

export default function Help() {
  const [tab, setTab] = useState<Tab>("menu");

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">📘 Довідковий каталог</h1>
        <p className="text-muted-foreground text-sm">GROUP AGENT PRO v3.8</p>
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
      {tab === "tests" && <Tests />}
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

interface TestRun {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  passed: number;
  failed: number;
  total: number;
  status: "ok" | "fail" | "error";
  tests: { name: string; status: "passed" | "failed" }[];
  error?: string;
}

function Tests() {
  const [lastRun, setLastRun] = useState<TestRun | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  async function refresh() {
    try {
      const r = await fetch("/api/system/tests");
      const j = await r.json();
      setLastRun(j.lastRun);
      setRunning(j.running);
    } catch (e: any) {
      setError(e?.message ?? "Помилка завантаження");
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, running ? 2000 : 10000);
    return () => clearInterval(id);
  }, [running]);

  async function runTests() {
    setRunning(true);
    setError(null);
    try {
      const r = await fetch("/api/system/tests/run", { method: "POST" });
      const j = await r.json();
      if (j.lastRun) setLastRun(j.lastRun);
      if (!j.success && j.message) setError(j.message);
    } catch (e: any) {
      setError(e?.message ?? "Не вдалося запустити тести");
    } finally {
      setRunning(false);
    }
  }

  const status = lastRun?.status;
  const badgeColor = status === "ok" ? OK : status === "fail" ? ERR : DIM;
  const StatusIcon = status === "ok" ? CheckCircle2 : status === "fail" ? XCircle : FlaskConical;
  const failed = lastRun?.tests.filter((t) => t.status === "failed") ?? [];
  const visible = showAll ? lastRun?.tests ?? [] : failed.length ? failed : (lastRun?.tests ?? []).slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="rounded-xl p-2 flex items-center justify-center"
              style={{ background: `${badgeColor} / 0.12`, border: `1px solid ${badgeColor}` }}
            >
              <StatusIcon className="h-5 w-5" style={{ color: badgeColor }} />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-white">
                {lastRun
                  ? status === "ok"
                    ? `Усі тести зелені — ${lastRun.passed}/${lastRun.total}`
                    : status === "fail"
                    ? `Червоні: ${lastRun.failed}/${lastRun.total}`
                    : "Помилка запуску"
                  : "Тести ще не запускались"}
              </p>
              <p className="text-[11px]" style={{ color: DIM }}>
                {lastRun
                  ? `${new Date(lastRun.finishedAt).toLocaleString("uk-UA")} · ${(lastRun.durationMs / 1000).toFixed(2)}s`
                  : "Натисніть «Запустити» щоб виконати pytest"}
              </p>
            </div>
          </div>
          <button
            onClick={runTests}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))",
              border: "1px solid hsl(271 91% 65% / 0.4)",
              color: "white",
            }}
          >
            {running ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Виконую…
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" /> Запустити
              </>
            )}
          </button>
        </div>

        {lastRun && lastRun.total > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Stat label="Усього" value={lastRun.total} color={PRI} />
            <Stat label="Пройшло" value={lastRun.passed} color={OK} />
            <Stat label="Впало" value={lastRun.failed} color={lastRun.failed > 0 ? ERR : DIM} />
          </div>
        )}

        {error && (
          <p className="text-xs mt-3" style={{ color: ERR }}>
            {error}
          </p>
        )}
        {lastRun?.error && (
          <p className="text-xs mt-3 font-mono" style={{ color: ERR }}>
            {lastRun.error}
          </p>
        )}
      </div>

      {lastRun && lastRun.tests.length > 0 && (
        <div className="rounded-2xl p-4" style={card}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>
              {failed.length > 0 && !showAll ? `Червоні (${failed.length})` : `Тести (${lastRun.tests.length})`}
            </p>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-[11px] underline"
              style={{ color: DIM }}
            >
              {showAll ? "Лише червоні" : "Показати всі"}
            </button>
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {visible.map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono"
                style={card}
              >
                {t.status === "passed" ? (
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0" style={{ color: OK }} />
                ) : (
                  <XCircle className="h-3 w-3 flex-shrink-0" style={{ color: ERR }} />
                )}
                <span className="text-white truncate">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4" style={card}>
        <p className="text-[11px] font-display font-bold uppercase tracking-widest mb-2" style={{ color: DIM }}>
          Покриття
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            "test_broadcast.py — 15 тестів",
            "test_helpers.py — 7 тестів",
            "test_monitor.py — 6 тестів",
            "Cache TTL · Fernet · monitor",
          ].map((s) => (
            <div key={s} className="px-2.5 py-2 rounded-lg text-white" style={card}>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={card}>
      <p className="text-[10px] uppercase tracking-widest" style={{ color: DIM }}>
        {label}
      </p>
      <p className="text-lg font-display font-black" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
