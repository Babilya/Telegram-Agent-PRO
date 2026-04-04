import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2, X, Smartphone, KeyRound, ShieldCheck, ArrowRight,
  CheckCircle2, Settings, Lock, ExternalLink, Hash, RotateCcw,
  Globe, Clock,
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

type Step =
  | "prep"
  | "apiid"
  | "apihash"
  | "phone"
  | "code"
  | "password"
  | "success"
  | "connected";

const MODAL_BG = "linear-gradient(170deg, hsl(268 52% 14%) 0%, hsl(260 42% 10%) 45%, hsl(250 36% 8%) 100%)";
const MODAL_SHADOW = "0 40px 90px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.07), 0 0 80px hsl(271 91% 60% / 0.14), inset 0 1px 0 rgba(255,255,255,0.10)";

const PRI = "hsl(271 91% 65%)";
const ACC = "hsl(316 90% 62%)";
const SUB = "hsl(258 15% 70%)";
const DIM = "hsl(258 15% 52%)";

const gradBtn: React.CSSProperties = {
  background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
  color: "#fff",
  boxShadow: "0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.18)",
};

const iconWrap: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 65% / 0.30), hsl(316 90% 62% / 0.20))",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.045)",
};

const inputBase = "w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all duration-200 font-body";
const inputSt: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
};
const inputFocusSt: React.CSSProperties = {
  borderColor: "hsl(271 91% 65% / 0.55)",
  background: "rgba(255,255,255,0.08)",
};

function InputField({
  label, children, error,
}: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-display font-semibold uppercase tracking-[0.11em]"
        style={{ color: DIM }}>
        {label}
      </label>
      {children}
      {error && (
        <span className="text-[11px]" style={{ color: "hsl(0 85% 65%)" }}>{error}</span>
      )}
    </div>
  );
}

function IconBox({ icon: Icon, size = 15 }: { icon: React.FC<any>; size?: number }) {
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={iconWrap}>
      <Icon style={{ color: PRI, width: size, height: size }} />
    </div>
  );
}

function InfoCard({ icon, title, sub }: { icon: React.FC<any>; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={card}>
      <IconBox icon={icon} />
      <div>
        <p className="text-[13px] font-display font-bold text-white leading-tight">{title}</p>
        <p className="text-[12px] mt-0.5" style={{ color: SUB }}>{sub}</p>
      </div>
    </div>
  );
}

function StepLabel({ step }: { step: Step | null }) {
  const labels: Partial<Record<Step, string>> = {
    prep:      "Підготовка",
    apiid:     "Крок 1 — API ID",
    apihash:   "Крок 2 — API Hash",
    phone:     "Номер телефону",
    code:      "Код підтвердження",
    password:  "Пароль 2FA",
    success:   "Успіх",
    connected: "Акаунт підключено",
  };
  return <>{step ? (labels[step] ?? "…") : "…"}</>;
}

const PROGRESS_STEPS: Step[] = ["phone", "code", "success"];
const PROGRESS_STEPS_2FA: Step[] = ["phone", "code", "password", "success"];

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
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

  useEffect(() => {
    if (!configLoaded) return;
    if (!hasCredentials) return;
    const t = setTimeout(() => {
      if (step === null) setStep("phone");
    }, 4000);
    return () => clearTimeout(t);
  }, [configLoaded, hasCredentials, step]);

  const phoneForm = useForm<{ phone: string }>({
    resolver: zodResolver(z.object({ phone: z.string().min(7, "Введіть номер телефону") })),
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
      onSuccess: (res) => {
        if (res.success) {
          queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
          setStep("success");
        } else if (res.requires2FA) {
          setStep("password");
        } else {
          toast({ title: "Невірний код", description: res.error ?? "Спробуйте ще раз або запитайте новий", variant: "destructive" });
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

  const handleResendCode = () => {
    setCodeRaw("");
    setCodeDisplay("");
    setStep("phone");
  };

  if (step === null) return null;

  const progressSteps = step === "password" ? PROGRESS_STEPS_2FA : PROGRESS_STEPS;
  const progressIndex = progressSteps.indexOf(step as any);
  const showProgress = ["phone", "code", "password", "success"].includes(step);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(5,3,14,0.55)", backdropFilter: "blur(12px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-[390px] rounded-[28px] overflow-hidden"
        style={{ background: MODAL_BG, boxShadow: MODAL_SHADOW }}
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-display font-semibold uppercase tracking-[0.14em]"
              style={{ color: ACC }}>
              Авторизація Telegram
            </span>
            <h2 className="text-[17px] font-display font-black text-white leading-tight">
              <StepLabel step={step} />
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.07)", color: SUB }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── PROGRESS BAR ── */}
        {showProgress && (
          <div className="px-4 pt-3 pb-1 flex gap-1.5">
            {progressSteps.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: i <= progressIndex ? "100%" : "0%",
                    background: `linear-gradient(90deg, ${PRI}, ${ACC})`,
                    opacity: i < progressIndex ? 0.38 : 1,
                  }} />
              </div>
            ))}
          </div>
        )}

        {/* ── CONTENT ── */}
        <div className="px-4 pt-3 pb-5 flex flex-col gap-3">

          {/* ══ ПІДГОТОВКА ══ */}
          {step === "prep" && (
            <>
              <p className="text-[13px] leading-relaxed px-0.5" style={{ color: SUB }}>
                Для підключення потрібні чотири речі:
              </p>

              <div className="flex flex-col gap-2">
                <InfoCard icon={Settings}   title="API ID та API Hash"       sub="Отримати безкоштовно на my.telegram.org" />
                <InfoCard icon={Smartphone} title="Номер телефону акаунта"   sub="Міжнародний формат — +380…" />
                <InfoCard icon={KeyRound}   title="Код підтвердження"        sub="5 цифр — надійде прямо в Telegram" />
                <InfoCard icon={ShieldCheck}title="Пароль 2FA (якщо є)"     sub="Хмарний пароль з налаштувань Telegram" />
              </div>

              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: "hsl(271 91% 65% / 0.08)", border: "1px solid hsl(271 91% 65% / 0.18)" }}>
                <Lock style={{ color: PRI, width: 14, height: 14, marginTop: 1, flexShrink: 0 }} />
                <p className="text-[12px] leading-relaxed" style={{ color: SUB }}>
                  Всі дані зберігаються <span className="text-white font-medium">локально</span> і нікуди не передаються.
                  Ви можете будь-коли скинути сесію.
                </p>
              </div>

              <button onClick={() => setStep("apiid")}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 mt-1"
                style={gradBtn}>
                <ArrowRight className="h-4 w-4" /> Продовжити
              </button>
            </>
          )}

          {/* ══ API ID ══ */}
          {step === "apiid" && (
            <>
              <div className="flex flex-col gap-1 px-0.5">
                <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>
                  Відкрийте{" "}
                  <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold underline-offset-2"
                    style={{ color: "hsl(271 91% 75%)", textDecoration: "underline" }}>
                    my.telegram.org <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}→ <span className="text-white font-medium">API development tools</span>
                </p>
                <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: SUB }}>
                  Знайдіть поле <span className="text-white font-medium">App api_id</span> — це <span className="text-white">число</span>.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px] font-mono" style={{ color: DIM }}>Приклад:</span>
                <span className="text-[14px] font-mono font-bold text-white tracking-widest">20799080</span>
              </div>

              <InputField label="App api_id (лише цифри)">
                <input
                  type="tel"
                  placeholder="20799080"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value.replace(/\D/g, ""))}
                  className={inputBase}
                  style={inputSt}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusSt)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputSt)}
                />
              </InputField>

              {apiId && !/^\d{5,}$/.test(apiId) && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "hsl(0 85% 60% / 0.08)", border: "1px solid hsl(0 80% 60% / 0.18)" }}>
                  <p className="text-[12px]" style={{ color: "hsl(0 80% 72%)" }}>
                    API ID складається лише з цифр — мінімум 5 знаків.
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  if (!/^\d{5,}$/.test(apiId)) {
                    toast({ title: "Невірний API ID", description: "Введіть числовий ідентифікатор (мінімум 5 цифр)", variant: "destructive" });
                    return;
                  }
                  setStep("apihash");
                }}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 mt-1"
                style={gradBtn}>
                <ArrowRight className="h-4 w-4" /> Далі — API Hash
              </button>

              <button onClick={() => setStep("prep")}
                className="text-center text-xs py-1 transition-colors hover:opacity-80"
                style={{ color: DIM }}>
                ← Назад
              </button>
            </>
          )}

          {/* ══ API HASH ══ */}
          {step === "apihash" && (
            <>
              <div className="flex flex-col gap-1 px-0.5">
                <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>
                  На тій же сторінці{" "}
                  <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold"
                    style={{ color: "hsl(271 91% 75%)", textDecoration: "underline" }}>
                    my.telegram.org <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}знайдіть <span className="text-white font-medium">App api_hash</span> — довгий рядок.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[11px] font-mono" style={{ color: DIM }}>Приклад:</span>
                <span className="text-[13px] font-mono font-bold text-white tracking-wide">a1b2c3d4e5f6g7h8</span>
              </div>

              <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Hash style={{ color: DIM, width: 12, height: 12, marginTop: 2, flexShrink: 0 }} />
                <p className="text-[12px]" style={{ color: DIM }}>
                  Hash чутливий до регістру — копіюйте точно як є, без пробілів.
                </p>
              </div>

              <InputField label="App api_hash">
                <input
                  type="text"
                  placeholder="a1b2c3d4e5f6g7h8i9j0"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value.trim())}
                  className={`${inputBase} font-mono`}
                  style={inputSt}
                  onFocus={(e) => Object.assign(e.currentTarget.style, inputFocusSt)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, inputSt)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </InputField>

              <button
                onClick={() => {
                  if (apiHash.length < 10) {
                    toast({ title: "Невірний API Hash", description: "Hash має бути буквено-цифровим рядком від 10 символів", variant: "destructive" });
                    return;
                  }
                  setStep("phone");
                }}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 mt-1"
                style={gradBtn}>
                <Smartphone className="h-4 w-4" /> Далі — Авторизація
              </button>

              <button onClick={() => setStep("apiid")}
                className="text-center text-xs py-1 transition-colors hover:opacity-80"
                style={{ color: DIM }}>
                ← Назад
              </button>
            </>
          )}

          {/* ══ НОМЕР ТЕЛЕФОНУ ══ */}
          {step === "phone" && (
            <>
              <div className="flex flex-col gap-1.5">
                {([
                  { icon: Globe,      t: "Міжнародний формат", s: "Починається з + та коду країни" },
                  { icon: Smartphone, t: "Код прийде в Telegram", s: "Або SMS якщо ви не в додатку" },
                  { icon: Clock,      t: "Код дійсний 5 хвилин", s: "Після — можна запросити новий" },
                  { icon: Lock,       t: "Номер захищено", s: "Використовується лише для входу" },
                ] as { icon: React.FC<any>; t: string; s: string }[]).map(({ icon: Icon, t, s }) => (
                  <div key={t} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={card}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={iconWrap}>
                      <Icon style={{ color: PRI, width: 13, height: 13 }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-display font-bold text-white leading-tight">{t}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: DIM }}>{s}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, hsl(271 91% 65% / 0.10), hsl(316 90% 62% / 0.06))",
                  border: "1px solid hsl(271 91% 65% / 0.28)",
                }}>
                <span className="text-[11px] font-display font-semibold uppercase tracking-wider" style={{ color: "hsl(271 91% 65%)" }}>Приклад</span>
                <span className="text-[14px] font-mono font-bold text-white tracking-wide">+380961234567</span>
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
                  className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                  style={gradBtn}>
                  {sendCode.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Надсилаємо…</>
                    : <><ArrowRight className="h-4 w-4" /> Надіслати код</>}
                </button>
              </form>

              {!hasCredentials && (
                <button onClick={() => setStep("apihash")}
                  className="text-center text-xs py-1 transition-colors hover:opacity-80"
                  style={{ color: DIM }}>
                  ← Назад
                </button>
              )}
            </>
          )}

          {/* ══ КОД ПІДТВЕРДЖЕННЯ ══ */}
          {step === "code" && (
            <>
              <div className="flex flex-col gap-1 px-0.5">
                <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>
                  Код надіслано на{" "}
                  <span className="text-white font-semibold">{phone}</span>.
                  Відкрийте Telegram і знайдіть повідомлення від <span className="text-white">Telegram</span>.
                </p>
              </div>

              <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <KeyRound style={{ color: DIM, width: 12, height: 12, marginTop: 2, flexShrink: 0 }} />
                <p className="text-[12px]" style={{ color: DIM }}>
                  Код дійсний 5 хвилин. Telegram може заблокувати спробу при швидкому введенні.
                </p>
              </div>

              <InputField label="5-значний код з Telegram">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="1  2  3  4  5"
                  value={codeDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\s+/g, "").replace(/\D/g, "").slice(0, 5);
                    setCodeRaw(raw);
                    setCodeDisplay(raw.split("").join("  "));
                  }}
                  className={`${inputBase} font-mono text-2xl text-center`}
                  style={{ ...inputSt, letterSpacing: "0.3em" }}
                  onFocus={(e) => Object.assign(e.currentTarget.style, { ...inputFocusSt, letterSpacing: "0.3em" })}
                  onBlur={(e) => Object.assign(e.currentTarget.style, { ...inputSt, letterSpacing: "0.3em" })}
                />
              </InputField>

              <button
                onClick={handleVerifyCode}
                disabled={verifyCode.isPending || codeRaw.length < 5}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={{ ...gradBtn, opacity: codeRaw.length < 5 ? 0.55 : 1 }}>
                {verifyCode.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Перевіряємо…</>
                  : <><CheckCircle2 className="h-4 w-4" /> Підтвердити</>}
              </button>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep("phone")}
                  className="text-xs py-1 hover:opacity-80 transition-opacity"
                  style={{ color: DIM }}>
                  ← Змінити номер
                </button>
                <button onClick={handleResendCode}
                  className="text-xs py-1 flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ color: DIM }}>
                  <RotateCcw className="h-3 w-3" /> Новий код
                </button>
              </div>
            </>
          )}

          {/* ══ 2FA ПАРОЛЬ ══ */}
          {step === "password" && (
            <>
              <div className="flex items-start gap-3 px-3 py-3 rounded-2xl"
                style={{ background: "hsl(271 91% 65% / 0.08)", border: "1px solid hsl(271 91% 65% / 0.18)" }}>
                <ShieldCheck style={{ color: PRI, width: 18, height: 18, marginTop: 1, flexShrink: 0 }} />
                <div>
                  <p className="text-[13px] font-display font-bold text-white leading-tight">Двофакторний захист</p>
                  <p className="text-[12px] mt-0.5" style={{ color: SUB }}>
                    Ваш акаунт захищено хмарним паролем. Введіть його з Telegram → Налаштування → Конфіденційність → 2FA.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Lock style={{ color: DIM, width: 12, height: 12, marginTop: 2, flexShrink: 0 }} />
                <p className="text-[12px]" style={{ color: DIM }}>
                  Пароль <span className="text-white">не зберігається</span> — використовується один раз для створення сесії.
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
                  className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                  style={gradBtn}>
                  {verifyPassword.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Перевіряємо…</>
                    : <><ShieldCheck className="h-4 w-4" /> Підтвердити</>}
                </button>
              </form>
            </>
          )}

          {/* ══ УСПІХ ══ */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                    boxShadow: "0 0 40px hsl(271 91% 65% / 0.45)",
                  }}>
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="font-display font-black text-[22px] text-white">Авторизація успішна!</h3>
                <p className="text-[13px]" style={{ color: SUB }}>
                  {authStatus?.firstName ? `👤 ${authStatus.firstName}${authStatus.username ? ` · @${authStatus.username}` : ""}` : "Акаунт підключено"}
                </p>
              </div>

              <div className="w-full flex flex-col gap-1.5 text-left">
                {[
                  "📢 Розсилки — надсилання від вашого імені",
                  "🔍 OSINT — пошук та аналіз груп",
                  "🕷️ Парсери — збір учасників та даних",
                ].map(line => (
                  <div key={line} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={card}>
                    <p className="text-[13px]" style={{ color: SUB }}>{line}</p>
                  </div>
                ))}
                <p className="text-[11px] text-center mt-1" style={{ color: DIM }}>
                  Сесія збережена — повторний вхід не знадобиться.
                </p>
              </div>

              <button onClick={onSuccess}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={gradBtn}>
                🚀 Відкрити панель керування
              </button>
            </div>
          )}

          {/* ══ ПІДКЛЮЧЕНО ══ */}
          {step === "connected" && (
            <>
              <div className="flex items-center gap-3 px-3 py-3 rounded-2xl"
                style={{ background: "hsl(271 91% 65% / 0.10)", border: "1px solid hsl(271 91% 65% / 0.22)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))" }}>
                  <TelegramIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-white text-sm">
                    {authStatus?.firstName ?? "Акаунт підключено"}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: SUB }}>
                    {authStatus?.username ? `@${authStatus.username}` : authStatus?.phone ?? ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {[
                  "📢 Розсилки — надсилання від вашого імені",
                  "🔍 OSINT — пошук та аналіз груп",
                  "🕷️ Парсери — збір учасників та даних",
                ].map(line => (
                  <div key={line} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={card}>
                    <p className="text-[13px]" style={{ color: SUB }}>{line}</p>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-center" style={{ color: DIM }}>
                Сесія збережена — повторний вхід не знадобиться.
              </p>

              <button onClick={onSuccess}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={gradBtn}>
                🚀 Панель керування
              </button>

              <button onClick={handleLogout} disabled={logout.isPending}
                className="w-full py-2.5 rounded-2xl font-display font-semibold text-sm flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", color: "hsl(0 80% 68%)", border: "1px solid hsl(0 60% 45% / 0.25)" }}>
                {logout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Відключити акаунт"}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
