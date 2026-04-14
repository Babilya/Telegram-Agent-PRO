import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, X, Smartphone, KeyRound, ShieldCheck, ArrowRight,
  CheckCircle2, Settings, Lock, ExternalLink,
  RotateCcw, Globe, Clock, Megaphone, Search, Bug, LayoutDashboard, User,
} from "lucide-react";
import { TelegramIcon } from "@/components/ui/telegram-icon";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSendAuthCode,
  useVerifyAuthCode,
  useVerifyAuthPassword,
  useGetAuthStatus,
  getGetAuthStatusQueryKey,
  useLogoutAuth,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "prep" | "phone" | "code" | "password" | "success" | "connected";

/* ── Design tokens — same as landing.tsx ── */
const MODAL_BG =
  "radial-gradient(ellipse 90% 55% at 50% 0%, hsl(271 91% 38% / 0.55) 0%, transparent 70%)," +
  "radial-gradient(ellipse 65% 50% at 85% 100%, hsl(316 90% 40% / 0.3) 0%, transparent 65%)," +
  "radial-gradient(ellipse 70% 55% at 15% 90%, hsl(258 80% 28% / 0.4) 0%, transparent 65%)," +
  "hsl(258 38% 8%)";

const MODAL_SHADOW =
  "0 40px 90px rgba(0,0,0,0.85)," +
  "0 0 0 1px rgba(255,255,255,0.06)," +
  "0 0 80px hsl(271 91% 60% / 0.12)," +
  "inset 0 1px 0 rgba(255,255,255,0.09)";

const PRI = "hsl(271 91% 65%)";
const ACC = "hsl(316 90% 62%)";
const SUB = "hsl(258 15% 70%)";
const DIM = "hsl(258 15% 48%)";

/* Convex card — exact same as landing */
const convexCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.035)",
  boxShadow:
    "0 4px 16px rgba(0,0,0,0.32)," +
    "inset 0 1px 0 rgba(255,255,255,0.09)," +
    "inset 0 -1px 0 rgba(0,0,0,0.18)",
};

/* Convex icon wrap — exact same as landing */
const iconWrap: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 65% / 0.3), hsl(316 90% 62% / 0.2))",
  boxShadow:
    "0 3px 10px rgba(0,0,0,0.3)," +
    "inset 0 1px 0 rgba(255,255,255,0.15)," +
    "inset 0 -1px 0 rgba(0,0,0,0.2)",
  flexShrink: 0,
};

/* Convex gradient button — exact same as landing */
const convexBtn: React.CSSProperties = {
  background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
  color: "white",
  boxShadow:
    "0 4px 16px rgba(0,0,0,0.35)," +
    "inset 0 1px 0 rgba(255,255,255,0.22)," +
    "inset 0 -1px 0 rgba(0,0,0,0.18)",
};

const gradientText: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const inputBase = "w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all duration-200 font-body";
const inputSt: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.25)",
};
const inputFocusSt: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  border: "1px solid hsl(271 91% 65% / 0.5)",
  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2), 0 0 0 3px hsl(271 91% 65% / 0.10)",
};

/* ── Small helpers ── */
function FeatureCard({ icon: Icon, title, sub }: { icon: React.FC<any>; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={convexCard}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={iconWrap}>
        <Icon style={{ color: "hsl(271 91% 80%)", width: 16, height: 16 }} />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-display font-bold text-white text-[13px] leading-tight">{title}</span>
        <span className="text-[12px] leading-snug" style={{ color: SUB }}>{sub}</span>
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, label }: { icon: React.FC<any>; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5" style={convexCard}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={iconWrap}>
        <Icon style={{ color: "hsl(271 91% 80%)", width: 13, height: 13 }} />
      </div>
      <p className="text-[12px]" style={{ color: SUB }}>{label}</p>
    </div>
  );
}

function StepHeading({ badge, title, accent }: { badge: string; title: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5 pt-1">
      <span className="text-[10px] font-display font-semibold uppercase tracking-[0.14em]" style={{ color: ACC }}>
        {badge}
      </span>
      <h2 className="font-display font-black leading-tight text-white" style={{ fontSize: "clamp(1.3rem,6vw,1.65rem)" }}>
        {title}{accent && <> <span style={gradientText}>{accent}</span></>}
      </h2>
    </div>
  );
}

function InputField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-display font-semibold uppercase tracking-[0.11em]" style={{ color: DIM }}>
        {label}
      </label>
      {children}
      {error && <span className="text-[11px]" style={{ color: "hsl(0 85% 65%)" }}>{error}</span>}
    </div>
  );
}

const PROGRESS_STEPS: Step[] = ["phone", "code", "success"];
const PROGRESS_STEPS_2FA: Step[] = ["phone", "code", "password", "success"];

function stepBadge(step: Step, progressSteps: Step[]): string {
  const idx = progressSteps.indexOf(step as any);
  if (idx === -1) return "";
  return `Крок ${idx + 1} з ${progressSteps.length}`;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [codeRaw, setCodeRaw] = useState("");
  const [codeDisplay, setCodeDisplay] = useState("");

  const { data: authStatus } = useGetAuthStatus({ query: { queryKey: getGetAuthStatusQueryKey() } });
  const sendCode = useSendAuthCode();
  const verifyCode = useVerifyAuthCode();
  const verifyPassword = useVerifyAuthPassword();
  const logout = useLogoutAuth();

  useEffect(() => {
    fetch("/api/auth/config")
      .then(r => r.json())
      .then((cfg: { hasCredentials: boolean }) => {
        setHasCredentials(cfg.hasCredentials);
        setConfigLoaded(true);
        if (!cfg.hasCredentials) setStep("prep");
      })
      .catch(() => { setConfigLoaded(true); setStep("prep"); });
  }, []);

  useEffect(() => {
    if (configLoaded && hasCredentials && authStatus !== undefined && step === null) {
      setStep(authStatus.authenticated ? "connected" : "phone");
    }
  }, [configLoaded, hasCredentials, authStatus, step]);

  const phoneForm = useForm<{ phone: string }>({
    resolver: zodResolver(z.object({
      phone: z.string().regex(/^\+\d{10,15}$/, "Формат: +380XXXXXXXXX"),
    })),
    defaultValues: { phone: "" },
  });
  const passwordForm = useForm<{ password: string }>({
    resolver: zodResolver(z.object({ password: z.string().min(1, "Введіть пароль") })),
    defaultValues: { password: "" },
  });

  const handleSendCode = (data: { phone: string }) => {
    setPhone(data.phone);
    sendCode.mutate({ data: { phone: data.phone } }, {
      onSuccess: (res) => {
        if (res.success) {
          setPhoneCodeHash(res.phoneCodeHash ?? "");
          setStep("code");
        } else {
          toast({ title: "Помилка", description: res.error ?? "Не вдалось надіслати код", variant: "destructive" });
        }
      },
      onError: () => toast({ title: "Помилка з'єднання", description: "Перевірте сервер", variant: "destructive" }),
    });
  };

  const handleVerifyCode = () => {
    if (codeRaw.length < 5) {
      toast({ title: "Введіть повний код", description: "5 цифр з Telegram", variant: "destructive" });
      return;
    }
    verifyCode.mutate({ data: { phone, code: codeRaw, phoneCodeHash } }, {
      onSuccess: (res: any) => {
        if (res.requiresPassword || res.requires2FA) {
          setStep("password");
        } else if (res.success) {
          queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
          setStep("success");
        } else {
          toast({ title: "Невірний код", description: res.error ?? "Спробуйте ще раз або запросіть новий", variant: "destructive" });
        }
      },
      onError: () => toast({ title: "Помилка з'єднання", description: "Перевірте сервер", variant: "destructive" }),
    });
  };

  const handleVerifyPassword = (data: { password: string }) => {
    verifyPassword.mutate({ data: { phone, password: data.password } }, {
      onSuccess: (res) => {
        if (res.success) {
          queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
          setStep("success");
        } else {
          toast({ title: "Невірний пароль 2FA", description: res.error ?? "Перевірте та спробуйте знову", variant: "destructive" });
        }
      },
      onError: () => toast({ title: "Помилка з'єднання", description: "Перевірте сервер", variant: "destructive" }),
    });
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
        setStep("phone");
      },
    });
  };

  if (step === null) return null;

  const progressSteps = step === "password" ? PROGRESS_STEPS_2FA : PROGRESS_STEPS;
  const progressIndex = progressSteps.indexOf(step as any);
  const showProgress = ["phone", "code", "password", "success"].includes(step);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(5,3,14,0.65)", backdropFilter: "blur(16px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Neon grid overlay inside modal area */}
      <div
        className="relative w-full sm:max-w-[420px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden flex flex-col"
        style={{ background: MODAL_BG, boxShadow: MODAL_SHADOW, maxHeight: "92dvh" }}
      >
        {/* Subtle neon grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(271 91% 65% / 0.05) 1px, transparent 1px)," +
              "linear-gradient(90deg, hsl(271 91% 65% / 0.05) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }} />

        {/* ── HEADER ── */}
        <div className="relative z-10 flex items-start justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div style={{
              background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
              borderRadius: 8, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22)",
            }}>
              <TelegramIcon className="text-white" style={{ width: 13, height: 13 }} />
            </div>
            <span className="font-display font-black text-[15px]">
              <span className="text-white">GROUP </span>
              <span style={gradientText}>AGENT</span>
            </span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.06)", color: DIM }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── PROGRESS DOTS ── */}
        {showProgress && (
          <div className="relative z-10 flex gap-1.5 px-5 pb-1 shrink-0">
            {progressSteps.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: i <= progressIndex ? "100%" : "0%",
                    background: `linear-gradient(90deg, ${PRI}, ${ACC})`,
                    opacity: i < progressIndex ? 0.4 : 1,
                  }} />
              </div>
            ))}
          </div>
        )}

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-5 flex flex-col gap-3">

          {/* ══ ПІДГОТОВКА ══ */}
          {step === "prep" && (
            <>
              <StepHeading badge="Авторизація Telegram" title="Що потрібно" accent="знати" />
              <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>
                Один раз підключіть акаунт — далі все автоматично.
              </p>

              <div className="flex flex-col gap-2">
                <FeatureCard icon={Smartphone} title="Мобільний номер телефону"
                  sub="Міжнародний формат +380… — Telegram надішле код." />
                <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={convexCard}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={iconWrap}>
                    <Settings style={{ color: "hsl(271 91% 80%)", width: 16, height: 16 }} />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-display font-bold text-white text-[13px] leading-tight">API ID та API Hash</span>
                    <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] leading-snug hover:opacity-80 transition-opacity"
                      style={{ color: "hsl(271 91% 75%)" }}>
                      Отримати безкоштовно на my.telegram.org <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <FeatureCard icon={KeyRound}    title="Код підтвердження"  sub="5 цифр — надійде прямо в Telegram." />
                <FeatureCard icon={ShieldCheck} title="Пароль 2FA (якщо є)" sub="Хмарний пароль з налаштувань Telegram." />
              </div>

              {/* Combined security info */}
              <div className="rounded-2xl overflow-hidden" style={{
                background: "rgba(255,255,255,0.025)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.15)",
              }}>
                <div className="flex items-start gap-2.5 px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <Settings style={{ color: PRI, width: 13, height: 13, marginTop: 2, flexShrink: 0 }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: SUB }}>
                    <span className="text-white font-medium">API ID / API Hash</span> — зберігаються лише на сервері, ніколи не передаються третім особам.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 px-4 py-3">
                  <Lock style={{ color: PRI, width: 13, height: 13, marginTop: 2, flexShrink: 0 }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: SUB }}>
                    <span className="text-white font-medium">Пароль 2FA</span> — не зберігається. Використовується один раз для сесії. Сесію можна скинути будь-коли.
                  </p>
                </div>
              </div>

              <button onClick={() => setStep("phone")}
                className="w-full py-4 rounded-2xl font-display font-bold tracking-wide text-white flex items-center justify-center gap-2"
                style={convexBtn}>
                <ArrowRight className="h-4 w-4" /> Продовжити
              </button>
            </>
          )}

          {/* ══ НОМЕР ТЕЛЕФОНУ ══ */}
          {step === "phone" && (
            <>
              <StepHeading badge={stepBadge("phone", progressSteps)} title="Номер" accent="телефону" />

              <div className="grid grid-cols-2 gap-2">
                {([
                  { icon: Globe,      t: "Міжнародний формат",   s: "+ та код країни" },
                  { icon: Smartphone, t: "Код в Telegram",        s: "Або SMS якщо не в додатку" },
                  { icon: Clock,      t: "Дійсний 5 хвилин",     s: "Після — новий код" },
                  { icon: Lock,       t: "Номер захищено",        s: "Лише для входу" },
                ] as { icon: React.FC<any>; t: string; s: string }[]).map(({ icon: Icon, t, s }) => (
                  <div key={t} className="flex flex-col gap-1.5 rounded-2xl px-3 py-2.5" style={convexCard}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={iconWrap}>
                      <Icon style={{ color: "hsl(271 91% 80%)", width: 13, height: 13 }} />
                    </div>
                    <div>
                      <p className="font-display font-bold text-white text-[12px] leading-tight">{t}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: SUB }}>{s}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={phoneForm.handleSubmit(handleSendCode)} className="flex flex-col gap-3">
                <InputField label="Номер телефону" error={phoneForm.formState.errors.phone?.message}>
                  <input
                    {...phoneForm.register("phone")}
                    type="tel"
                    placeholder="+380XXXXXXXXX"
                    className={inputBase}
                    style={inputSt}
                    onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusSt)}
                    onBlur={(e) => Object.assign(e.currentTarget.style, inputSt)}
                  />
                </InputField>
                <button type="submit" disabled={sendCode.isPending}
                  className="w-full py-4 rounded-2xl font-display font-bold tracking-wide text-white flex items-center justify-center gap-2"
                  style={convexBtn}>
                  {sendCode.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Надсилаємо…</>
                    : <><ArrowRight className="h-4 w-4" /> Надіслати код</>}
                </button>
              </form>

              {!hasCredentials && (
                <button onClick={() => setStep("prep")}
                  className="text-center text-xs py-1 hover:opacity-70 transition-opacity"
                  style={{ color: DIM }}>
                  ← Назад
                </button>
              )}
            </>
          )}

          {/* ══ КОД ПІДТВЕРДЖЕННЯ ══ */}
          {step === "code" && (
            <>
              <StepHeading badge={stepBadge("code", progressSteps)} title="Код з" accent="Telegram" />
              <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>
                Код надіслано на <span className="text-white font-semibold">{phone}</span>.
                Відкрийте Telegram і знайдіть повідомлення від сервісного акаунту.
              </p>

              <div className="flex items-start gap-3 rounded-2xl px-4 py-3" style={convexCard}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={iconWrap}>
                  <KeyRound style={{ color: "hsl(271 91% 80%)", width: 14, height: 14 }} />
                </div>
                <p className="text-[12px] leading-relaxed pt-1.5" style={{ color: SUB }}>
                  Код дійсний <span className="text-white">5 хвилин</span>. Telegram може заблокувати спробу при надто швидкому введенні.
                </p>
              </div>

              <InputField label="5-значний код">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="· · · · ·"
                  value={codeDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\s+/g, "").replace(/\D/g, "").slice(0, 5);
                    setCodeRaw(raw);
                    setCodeDisplay(raw.split("").join("  "));
                  }}
                  className={`${inputBase} font-mono text-2xl text-center`}
                  style={{ ...inputSt, letterSpacing: "0.35em" }}
                  onFocus={(e) => Object.assign(e.currentTarget.style, { ...inputFocusSt, letterSpacing: "0.35em" })}
                  onBlur={(e) => Object.assign(e.currentTarget.style, { ...inputSt, letterSpacing: "0.35em" })}
                />
              </InputField>

              <button
                onClick={handleVerifyCode}
                disabled={verifyCode.isPending || codeRaw.length < 5}
                className="w-full py-4 rounded-2xl font-display font-bold tracking-wide text-white flex items-center justify-center gap-2"
                style={{ ...convexBtn, opacity: codeRaw.length < 5 ? 0.5 : 1 }}>
                {verifyCode.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Перевіряємо…</>
                  : <><CheckCircle2 className="h-4 w-4" /> Підтвердити</>}
              </button>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep("phone")}
                  className="text-xs py-1 hover:opacity-70 transition-opacity" style={{ color: DIM }}>
                  ← Змінити номер
                </button>
                <button onClick={() => { setCodeRaw(""); setCodeDisplay(""); setStep("phone"); }}
                  className="text-xs py-1 flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: DIM }}>
                  <RotateCcw className="h-3 w-3" /> Новий код
                </button>
              </div>
            </>
          )}

          {/* ══ 2FA ПАРОЛЬ ══ */}
          {step === "password" && (
            <>
              <StepHeading badge={stepBadge("password", progressSteps)} title="Хмарний" accent="пароль" />
              <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>
                Ваш акаунт захищено. Введіть пароль з: Telegram → Налаштування → Конфіденційність → Двоетапна перевірка.
              </p>

              <div className="flex items-start gap-3 rounded-2xl px-4 py-3" style={convexCard}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={iconWrap}>
                  <ShieldCheck style={{ color: "hsl(271 91% 80%)", width: 14, height: 14 }} />
                </div>
                <p className="text-[12px] leading-relaxed pt-1.5" style={{ color: SUB }}>
                  Пароль <span className="text-white">не зберігається</span> — використовується один раз для створення сесії. Ви можете скинути сесію будь-коли.
                </p>
              </div>

              <form onSubmit={passwordForm.handleSubmit(handleVerifyPassword)} className="flex flex-col gap-3">
                <InputField label="Хмарний пароль 2FA" error={passwordForm.formState.errors.password?.message}>
                  <input
                    {...passwordForm.register("password")}
                    type="password"
                    placeholder="Ваш пароль"
                    className={inputBase}
                    style={inputSt}
                    onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusSt)}
                    onBlur={(e) => Object.assign(e.currentTarget.style, inputSt)}
                  />
                </InputField>
                <button type="submit" disabled={verifyPassword.isPending}
                  className="w-full py-4 rounded-2xl font-display font-bold tracking-wide text-white flex items-center justify-center gap-2"
                  style={convexBtn}>
                  {verifyPassword.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Перевіряємо…</>
                    : <><ShieldCheck className="h-4 w-4" /> Підтвердити</>}
                </button>
              </form>
            </>
          )}

          {/* ══ УСПІХ ══ */}
          {step === "success" && (
            <>
              <div className="flex items-center gap-3 pt-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                    boxShadow: "0 0 32px hsl(271 91% 65% / 0.4), inset 0 1px 0 rgba(255,255,255,0.22)",
                  }}>
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-display font-black text-white" style={{ fontSize: "clamp(1.2rem,5.5vw,1.5rem)" }}>
                    Авторизація <span style={gradientText}>успішна!</span>
                  </p>
                  {authStatus?.firstName && (
                    <p className="text-[12px] mt-0.5 flex items-center gap-1" style={{ color: SUB }}>
                      <User style={{ width: 11, height: 11 }} />
                      {authStatus.firstName}{authStatus.username ? ` · @${authStatus.username}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>
                Сесія збережена — повторна авторизація не знадобиться.
              </p>
              <div className="flex flex-col gap-2">
                <FeatureRow icon={Megaphone} label="Розсилки — надсилання від вашого імені" />
                <FeatureRow icon={Search}    label="Пошук груп — OSINT та аналіз" />
                <FeatureRow icon={Bug}       label="Парсери — збір учасників та даних" />
              </div>
              <button onClick={onSuccess}
                className="w-full py-4 rounded-2xl font-display font-bold tracking-wide text-white flex items-center justify-center gap-2"
                style={convexBtn}>
                <LayoutDashboard className="h-4 w-4" /> Відкрити панель керування
              </button>
            </>
          )}

          {/* ══ ПІДКЛЮЧЕНО ══ */}
          {step === "connected" && (
            <>
              <StepHeading badge="Акаунт Telegram" title="Підключено" />
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={convexCard}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22)",
                  }}>
                  <TelegramIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-white text-[14px] leading-tight">
                    {authStatus?.firstName ?? "Акаунт підключено"}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: SUB }}>
                    {authStatus?.username ? `@${authStatus.username}` : authStatus?.phone ?? ""}
                  </p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>
                Сесія активна. Доступні всі функції платформи.
              </p>
              <div className="flex flex-col gap-2">
                <FeatureRow icon={Megaphone} label="Розсилки — надсилання від вашого імені" />
                <FeatureRow icon={Search}    label="Пошук груп — OSINT та аналіз" />
                <FeatureRow icon={Bug}       label="Парсери — збір учасників та даних" />
              </div>
              <button onClick={onSuccess}
                className="w-full py-4 rounded-2xl font-display font-bold tracking-wide text-white flex items-center justify-center gap-2"
                style={convexBtn}>
                <LayoutDashboard className="h-4 w-4" /> Панель керування
              </button>
              <button onClick={handleLogout} disabled={logout.isPending}
                className="w-full py-3 rounded-2xl font-display font-semibold text-sm flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.04)", color: "hsl(0 80% 68%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                {logout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Відключити акаунт"}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
