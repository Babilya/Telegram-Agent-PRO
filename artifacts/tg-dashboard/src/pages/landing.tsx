import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Upload, ChevronRight, Search, Users, Megaphone, Clock, Zap, Shield } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="min-h-screen bg-background neon-grid flex flex-col overflow-auto">
      {/* Hero Section */}
      <div className="relative w-full flex flex-col items-center px-4 pt-8 pb-6">
        {/* Hero image / upload zone */}
        <div
          className={`relative w-full max-w-sm rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
            dragging ? "ring-2 ring-primary scale-[1.01]" : ""
          }`}
          style={{ aspectRatio: "4/3" }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="hero-image-zone"
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt="Hero"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={logoImg}
              alt="Default Hero"
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <div className="bg-primary/20 border border-primary/50 rounded-xl p-3 backdrop-blur">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span className="text-white text-sm font-semibold font-display">
              Змінити зображення
            </span>
            <span className="text-white/60 text-xs">Перетягніть або натисніть</span>
          </div>

          {/* Bottom gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
          data-testid="image-input"
        />

        {/* Upload hint */}
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Натисніть на зображення, щоб замінити його
        </p>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col px-5 pb-8 max-w-lg mx-auto w-full">
        {/* Badge */}
        <div className="mb-3">
          <span className="text-xs font-display font-semibold tracking-widest uppercase text-accent">
            Ласкаво просимо
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-3xl sm:text-4xl font-display font-black leading-tight mb-2">
          Твій Telegram{" "}
          <span className="text-gradient">менеджер</span>
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-8">
          Потужний інструмент для пошуку груп, автоматичного вступу та масової розсилки повідомлень від вашого акаунту.
        </p>

        {/* Feature list */}
        <div className="space-y-3 mb-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-card-border"
              data-testid={`step-${i}`}
            >
              <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.2), hsl(316 90% 62% / 0.2))", border: "1px solid hsl(271 91% 65% / 0.3)" }}
              >
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-foreground mb-0.5">
                  {step.title}
                </div>
                <div className="text-muted-foreground text-xs leading-relaxed">
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border mb-6">
          <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Для роботи потрібна авторизація через ваш Telegram акаунт. Дані сесії зберігаються лише на цьому сервері.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStart}
          className="btn-gradient w-full py-4 px-6 rounded-2xl text-base font-display font-bold tracking-wide flex items-center justify-center gap-2 glow-primary"
          data-testid="start-button"
        >
          <Zap className="h-5 w-5" />
          ПОЧАТИ
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === 0
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
