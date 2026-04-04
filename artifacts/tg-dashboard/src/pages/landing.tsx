import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Upload, Search, Users, Megaphone, Clock, Zap, Shield } from "lucide-react";
import logoImg from "@assets/IMG_9715_1775279307639.png";

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

  const bgStyle = {
    background:
      "radial-gradient(ellipse 80% 60% at 50% 10%, hsl(271 91% 40% / 0.55) 0%, transparent 70%), " +
      "radial-gradient(ellipse 60% 50% at 80% 80%, hsl(316 90% 45% / 0.3) 0%, transparent 65%), " +
      "radial-gradient(ellipse 70% 60% at 20% 90%, hsl(258 80% 30% / 0.4) 0%, transparent 65%), " +
      "hsl(258 38% 8%)",
  };

  const gridStyle = {
    backgroundImage:
      "linear-gradient(hsl(271 91% 65% / 0.07) 1px, transparent 1px), " +
      "linear-gradient(90deg, hsl(271 91% 65% / 0.07) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
  };

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll"
      style={{ scrollSnapType: "y mandatory", ...bgStyle }}
      data-testid="landing-container"
    >
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={gridStyle} />

      {/* ────────────── PAGE 1 : Hero ────────────── */}
      <div
        ref={page0Ref}
        className="relative h-screen flex flex-col items-center justify-between py-10 px-6"
        style={{ scrollSnapAlign: "start" }}
        data-testid="page-0"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
              boxShadow: "0 0 20px hsl(271 91% 65% / 0.6)",
            }}
          >
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-black text-2xl text-gradient tracking-tight">TG_CTRL</span>
        </div>

        {/* Hero image */}
        <div
          className={`relative z-10 w-full max-w-xs rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 ${
            dragging ? "scale-[1.02]" : ""
          }`}
          style={{
            aspectRatio: "1 / 1",
            boxShadow:
              "0 0 60px hsl(271 91% 65% / 0.5), 0 0 120px hsl(316 90% 62% / 0.25)",
            border: "1.5px solid hsl(271 91% 65% / 0.4)",
          }}
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

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <div
              className="p-3 rounded-xl"
              style={{ background: "hsl(271 91% 65% / 0.25)", border: "1px solid hsl(271 91% 65% / 0.6)" }}
            >
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span className="text-white text-sm font-display font-bold">Змінити зображення</span>
            <span className="text-white/60 text-xs">Перетягніть або натисніть</span>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: "linear-gradient(to top, hsl(258 38% 8%), transparent)" }} />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
          data-testid="image-input"
        />

        {/* CTA page 1 */}
        <div className="z-10 flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => scrollToPage(1)}
            className="w-full py-4 px-6 rounded-2xl text-base font-display font-bold tracking-wide"
            style={{
              background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
              color: "white",
              boxShadow: "0 0 30px hsl(271 91% 65% / 0.5), 0 0 60px hsl(316 90% 62% / 0.2)",
            }}
          >
            ДАЛІ
          </button>
          {/* Dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => scrollToPage(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: activePage === i ? 24 : 6,
                  background: activePage === i
                    ? "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))"
                    : "hsl(258 30% 30%)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ────────────── PAGE 2 : Welcome ────────────── */}
      <div
        ref={page1Ref}
        className="relative h-screen flex flex-col justify-between py-10 px-6"
        style={{ scrollSnapAlign: "start" }}
        data-testid="page-1"
      >
        <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
          {/* Heading */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-display font-semibold tracking-widest uppercase"
              style={{ color: "hsl(316 90% 65%)" }}>
              Ласкаво просимо
            </span>
            <h1 className="text-4xl font-display font-black leading-tight text-white">
              Твій Telegram{" "}
              <span className="text-gradient">менеджер</span>
            </h1>
            <p className="text-base leading-relaxed mt-1"
              style={{ color: "hsl(258 10% 72%)" }}>
              Потужний інструмент для пошуку груп, автоматичного вступу та масової розсилки повідомлень.
            </p>
          </div>

          {/* Cards 1–2 */}
          <div className="flex flex-col gap-3">
            {steps.slice(0, 2).map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{
                  background: "hsl(258 35% 12% / 0.85)",
                  border: "1px solid hsl(258 30% 22%)",
                  backdropFilter: "blur(8px)",
                }}
                data-testid={`step-${i}`}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.2))",
                    border: "1px solid hsl(271 91% 65% / 0.4)",
                  }}
                >
                  <step.icon className="h-5 w-5" style={{ color: "hsl(271 91% 72%)" }} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display font-bold text-sm text-white">{step.title}</span>
                  <span className="text-xs leading-relaxed" style={{ color: "hsl(258 10% 65%)" }}>{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA page 2 */}
        <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
          <button
            onClick={() => scrollToPage(2)}
            className="w-full py-4 px-6 rounded-2xl text-base font-display font-bold tracking-wide"
            style={{
              background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
              color: "white",
              boxShadow: "0 0 30px hsl(271 91% 65% / 0.5), 0 0 60px hsl(316 90% 62% / 0.2)",
            }}
          >
            ДАЛІ
          </button>
          {/* Dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => scrollToPage(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: activePage === i ? 24 : 6,
                  background: activePage === i
                    ? "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))"
                    : "hsl(258 30% 30%)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ────────────── PAGE 3 : How it works + CTA ────────────── */}
      <div
        ref={page2Ref}
        className="relative h-screen flex flex-col justify-between py-10 px-6"
        style={{ scrollSnapAlign: "start" }}
        data-testid="page-2"
      >
        <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
          {/* Heading */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-display font-semibold tracking-widest uppercase"
              style={{ color: "hsl(316 90% 65%)" }}>
              Як це працює
            </span>
            <h2 className="text-3xl font-display font-black leading-tight text-white">
              Все під{" "}
              <span className="text-gradient">контролем</span>
            </h2>
          </div>

          {/* Cards 3–4 */}
          <div className="flex flex-col gap-3">
            {steps.slice(2).map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{
                  background: "hsl(258 35% 12% / 0.85)",
                  border: "1px solid hsl(258 30% 22%)",
                  backdropFilter: "blur(8px)",
                }}
                data-testid={`step-${i + 2}`}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.2))",
                    border: "1px solid hsl(271 91% 65% / 0.4)",
                  }}
                >
                  <step.icon className="h-5 w-5" style={{ color: "hsl(271 91% 72%)" }} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display font-bold text-sm text-white">{step.title}</span>
                  <span className="text-xs leading-relaxed" style={{ color: "hsl(258 10% 65%)" }}>{step.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{
              background: "hsl(316 60% 20% / 0.3)",
              border: "1px solid hsl(316 50% 30% / 0.4)",
            }}
          >
            <Shield className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(316 90% 65%)" }} />
            <p className="text-xs leading-relaxed" style={{ color: "hsl(258 10% 70%)" }}>
              Для роботи потрібна авторизація через ваш Telegram акаунт. Дані сесії зберігаються лише на цьому сервері.
            </p>
          </div>
        </div>

        {/* CTA + dots */}
        <div className="flex flex-col gap-5 max-w-lg mx-auto w-full">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-full py-4 px-6 rounded-2xl text-base font-display font-bold tracking-wide"
            style={{
              background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
              color: "white",
              boxShadow: "0 0 30px hsl(271 91% 65% / 0.5), 0 0 60px hsl(316 90% 62% / 0.2)",
            }}
            data-testid="start-button"
          >
            АВТОРИЗУВАТИСЯ
          </button>

          {/* Page dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => scrollToPage(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: activePage === i ? 24 : 6,
                  background: activePage === i
                    ? "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))"
                    : "hsl(258 30% 30%)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
