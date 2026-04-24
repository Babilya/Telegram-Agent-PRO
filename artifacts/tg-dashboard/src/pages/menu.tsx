import { Link } from "wouter";
import {
  Megaphone, Eye, ScrollText, FolderOpen, Bot, Forward,
  Search, Users, Camera, Mic, Copy, BarChart3, MessageCircle,
  Settings as SettingsIcon, BookOpen, User, Activity, ChevronRight, FileText,
} from "lucide-react";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

const sections: { title: string; items: { href: string; icon: any; label: string; sub?: string }[] }[] = [
  {
    title: "Основні модулі",
    items: [
      { href: "/campaigns", icon: Megaphone, label: "Розсилки", sub: "Автоматичні повідомлення" },
      { href: "/monitor", icon: Eye, label: "Моніторинг", sub: "Ключові слова, реакції" },
      { href: "/logs", icon: ScrollText, label: "Логи", sub: "Архів повідомлень та медіа" },
      { href: "/contacts", icon: FolderOpen, label: "Досьє контактів", sub: "Профілі співрозмовників" },
      { href: "/autoreplies", icon: Bot, label: "Автовідповіді", sub: "Тригер → відповідь" },
      { href: "/forwarding", icon: Forward, label: "Пересилання", sub: "Маршрутизація за фільтрами" },
    ],
  },
  {
    title: "Групи та контент",
    items: [
      { href: "/search", icon: Search, label: "Пошук груп", sub: "Глобальний пошук" },
      { href: "/groups", icon: Users, label: "Вступ у групи", sub: "Збережені та нові" },
      { href: "/parsers", icon: FileText, label: "Парсер", sub: "Збір учасників груп" },
    ],
  },
  {
    title: "AI та інтеграції",
    items: [
      { href: "/ocr", icon: Camera, label: "OCR (фото → текст)", sub: "ua, ru, en" },
      { href: "/voice", icon: Mic, label: "Голосові → текст", sub: "Whisper транскрипція" },
      { href: "/mirrors", icon: Copy, label: "Дзеркала", sub: "Копії бота для друзів" },
    ],
  },
  {
    title: "Аналітика та сервіс",
    items: [
      { href: "/stats", icon: BarChart3, label: "Статистика", sub: "Звіти за період" },
      { href: "/jobs", icon: Activity, label: "Історія задач", sub: "Лог виконання" },
      { href: "/support", icon: MessageCircle, label: "Підтримка", sub: "Зв'язок з власником" },
    ],
  },
  {
    title: "Особисте",
    items: [
      { href: "/profile", icon: User, label: "Мій профіль", sub: "Дані акаунту" },
      { href: "/settings", icon: SettingsIcon, label: "Налаштування", sub: "Сесія, сповіщення" },
      { href: "/help", icon: BookOpen, label: "Довідковий каталог", sub: "FAQ, помилки, гід" },
    ],
  },
];

export default function MenuPage() {
  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Меню</h1>
        <p className="text-muted-foreground text-sm">Усі функції SHADOW AGENT PRO.</p>
      </div>

      {sections.map((s) => (
        <div key={s.title} className="space-y-1.5">
          <h2 className="text-[11px] font-display font-bold uppercase tracking-widest px-1" style={{ color: DIM }}>
            {s.title}
          </h2>
          {s.items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/8 transition-colors"
              style={card}
              data-testid={`menu-${it.href.replace("/", "")}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
                <it.icon style={{ width: 16, height: 16, color: PRI }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-bold text-white">{it.label}</p>
                {it.sub && <p className="text-[10px]" style={{ color: DIM }}>{it.sub}</p>}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: DIM }} />
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
