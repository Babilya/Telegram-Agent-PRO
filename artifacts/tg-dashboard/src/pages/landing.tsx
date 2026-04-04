import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Upload, Search, Users, Megaphone, Clock, Zap, Shield, ChevronDown } from "lucide-react";
import logoImg from "@assets/IMG_9715_1775279307639.png";

const LANDING_KEY = "tgctrl_landing_seen";
const IMAGE_KEY = "tgctrl_hero_image";

const steps = [
  {
    icon: Search,
    title: "Пошук груп",
    desc: "Знаходьте цільові Telegram-групи за ключовими словами, фільтруйте за кількістю учасників та типом.",
  },
  {
    icon: Users,
    title: "Автоматичний вступ",
    desc: "Автоматично вступайте в обрані групи від імені вашого акаунту з налаштуванням затримки.",
  },
  {
    icon: Megaphone,
    title: "Розсилка повідомлень",
    desc: "Створюйте кампанії та надсилайте повідомлення в задані групи за розкладом.",
  },
  {
    icon: Clock,
    title: "Гнучкий розклад",
    desc: "Налаштуйте інтервал: кожну годину, кожні 2/4/8/12 годин або щоденно.",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [heroImage, setHeroImage] = useState<string>(
    () => localStorage.getItem(IMAGE_KEY) || ""
  );
  const [dragging, setDragging] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const page0Ref = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const pageRefs = [page0Ref, page1Ref, page2Ref];

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setHeroImage(result);
      localStorage.setItem(IMAGE_KEY, result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleStart = () => {
    localStorage.setItem(LANDING_KEY, "1");
    setLocation("/dashboard");
  };

  const scrollToPage = (index: number) => {
    pageRefs[index].current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const page = Math.round(scrollTop / height);
      setActivePage(Math.min(page, 2));
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll bg-background neon-grid"
      style={{ scrollSnapType: "y mandatory" }}
      data-testid="landing-container"
    >
      {/* ── Page 1: Hero ── */}
      <div
        ref={page0Ref}
        className="h-screen flex flex-col items-center justify-between py-10 px-6"
        style={{ scrollSnapAlign: "start" }}
        data-testid="page-0"
      >
        {/* Brand badge */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center glow-primary"
              style={{ background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))" }}
            >
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-black text-2xl text-gradient">TG_CTRL</span>
          </div>
        </div>

        {/* Hero image */}
        <div
          className={`relative w-full max-w-xs rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
            dragging ? "ring-2 ring-primary scale-[1.01]" : ""
          }`}
          style={{ aspectRatio: "1 / 1" }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="hero-image-zone"
        >
          <img
            src={heroImage || logoImg}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <div
              className="p-3 rounded-xl backdrop-blur"
              style={{ background: "hsl(271 91% 65% / 0.2)", border: "1px solid hsl(271 91% 65% / 0.5)" }}
            >
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span className="text-white text-sm font-display font-bold">Змінити зображення</span>
            <span className="text-white/60 text-xs">Перетягніть або натисніть</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
          data-testid="image-input"
        />

        {/* Scroll hint */}
        <button
          onClick={() => scrollToPage(1)}
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-xs font-medium tracking-wide">Далі</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </div>

      {/* ── Page 2: Welcome + Features ── */}
      <div
        ref={page1Ref}
        className="h-screen flex flex-col justify-between py-10 px-6"
        style={{ scrollSnapAlign: "start" }}
        data-testid="page-1"
      >
        <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-display font-semibold tracking-widest uppercase text-accent">
              Ласкаво просимо
            </span>
            <h1 className="text-4xl font-display font-black leading-tight">
              Твій Telegram{" "}
              <span className="text-gradient">менеджер</span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mt-1">
              Потужний інструмент для пошуку груп, автоматичного вступу та масової розсилки повідомлень від вашого акаунту.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {steps.slice(0, 2).map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-card-border"
                data-testid={`step-${i}`}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 65% / 0.2), hsl(316 90% 62% / 0.2))",
                    border: "1px solid hsl(271 91% 65% / 0.3)",
                  }}
                >
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display font-bold text-sm text-foreground">{step.title}</span>
                  <span className="text-muted-foreground text-xs leading-relaxed">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => scrollToPage(2)}
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <span className="text-xs font-medium tracking-wide">Далі</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </div>

      {/* ── Page 3: More steps + CTA ── */}
      <div
        ref={page2Ref}
        className="h-screen flex flex-col justify-between py-10 px-6"
        style={{ scrollSnapAlign: "start" }}
        data-testid="page-2"
      >
        <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-display font-semibold tracking-widest uppercase text-accent">
              Як це працює
            </span>
            <h2 className="text-3xl font-display font-black leading-tight text-foreground">
              Все під контролем
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {steps.slice(2).map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-card-border"
                data-testid={`step-${i + 2}`}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 65% / 0.2), hsl(316 90% 62% / 0.2))",
                    border: "1px solid hsl(271 91% 65% / 0.3)",
                  }}
                >
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display font-bold text-sm text-foreground">{step.title}</span>
                  <span className="text-muted-foreground text-xs leading-relaxed">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border">
            <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Для роботи потрібна авторизація через ваш Telegram акаунт. Дані сесії зберігаються лише на цьому сервері.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 max-w-lg mx-auto w-full">
          {/* CTA */}
          <button
            onClick={handleStart}
            className="btn-gradient w-full py-4 px-6 rounded-2xl text-base font-display font-bold tracking-wide flex items-center justify-center gap-2 glow-primary"
            data-testid="start-button"
          >
            <Zap className="h-5 w-5" />
            ПОЧАТИ
          </button>

          {/* Page dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => scrollToPage(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activePage === i ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
