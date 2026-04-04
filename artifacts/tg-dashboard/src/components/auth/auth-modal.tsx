import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, Smartphone, KeyRound, ShieldCheck, ArrowRight, CheckCircle2, Settings, Bot, Lock, ExternalLink } from "lucide-react";
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

type Step = "prep" | "apiid" | "apihash" | "intro" | "phone" | "code" | "password" | "success";

const convexBtn: React.CSSProperties = {
  background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
  color: "white",
  border: "none",
  boxShadow:
    "0 4px 16px rgba(0,0,0,0.35)," +
    "inset 0 1px 0 rgba(255,255,255,0.22)," +
    "inset 0 -1px 0 rgba(0,0,0,0.18)",
};

const stepInfo: Record<Step, { icon: React.FC<any>; label: string }> = {
  prep:     { icon: Bot,          label: "Підготовка" },
  apiid:    { icon: Settings,     label: "Крок 1: API ID" },
  apihash:  { icon: KeyRound,     label: "Крок 2: API Hash" },
  intro:    { icon: TelegramIcon, label: "Про підключення" },
  phone:    { icon: Smartphone,   label: "Номер телефону" },
  code:     { icon: KeyRound,     label: "Код підтвердження" },
  password: { icon: ShieldCheck,  label: "Пароль 2FA" },
  success:  { icon: CheckCircle2, label: "Підключено" },
};

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [codeDisplay, setCodeDisplay] = useState("");
  const [apiIdInput, setApiIdInput] = useState("");
  const [apiHashInput, setApiHashInput] = useState("");

  useEffect(() => {
    fetch("/api/auth/config")
      .then(r => r.json())
      .then((cfg: { hasCredentials: boolean }) => {
        setStep(cfg.hasCredentials ? "intro" : "prep");
      })
      .catch(() => setStep("prep"));
  }, []);

  const { data: authStatus } = useGetAuthStatus({ query: { queryKey: getGetAuthStatusQueryKey() } });

  useEffect(() => {
    if (step === "intro" && authStatus !== undefined && !authStatus.authenticated) {
      setStep("phone");
    }
  }, [step, authStatus]);

  const sendCode = useSendAuthCode();
  const verifyCode = useVerifyAuthCode();
  const verifyPassword = useVerifyAuthPassword();
  const logout = useLogoutAuth();

  const phoneForm = useForm<{ phone: string }>({
    resolver: zodResolver(z.object({ phone: z.string().min(7, "Введіть номер телефону") })),
    defaultValues: { phone: "" },
  });
  const codeForm = useForm<{ code: string }>({
    resolver: zodResolver(z.object({ code: z.string().min(5, "Введіть код") })),
    defaultValues: { code: "" },
  });
  const passwordForm = useForm<{ password: string }>({
    resolver: zodResolver(z.object({ password: z.string().min(1, "Введіть пароль") })),
    defaultValues: { password: "" },
  });

  const onPhoneSubmit = ({ phone }: { phone: string }) => {
    sendCode.mutate({ data: { phone } }, {
      onSuccess: (res) => {
        if (res.success) {
          setPhoneNumber(phone);
          setPhoneCodeHash((res as any).phoneCodeHash ?? "");
          setStep("code");
        } else {
          toast({ title: "Помилка", description: res.message, variant: "destructive" });
        }
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };

  const onCodeSubmit = ({ code }: { code: string }) => {
    verifyCode.mutate({ data: { phone: phoneNumber, code, phoneCodeHash } }, {
      onSuccess: (res) => {
        if (res.success) {
          if (res.requiresPassword) {
            setStep("password");
          } else {
            queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
            setStep("success");
          }
        } else {
          toast({ title: "Невірний код", description: res.message, variant: "destructive" });
        }
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };

  const onPasswordSubmit = ({ password }: { password: string }) => {
    verifyPassword.mutate({ data: { password } }, {
      onSuccess: (res) => {
        if (res.success) {
          queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
          setStep("success");
        } else {
          toast({ title: "Невірний пароль", description: res.message, variant: "destructive" });
        }
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
        setStep("intro");
        toast({ title: "Вийшли", description: "Акаунт відключено." });
      },
    });
  };

  const visibleSteps = (step === "password"
    ? ["phone", "code", "password", "success"]
    : ["phone", "code", "success"]) as Step[];

  const stepIndex = step ? visibleSteps.indexOf(step) : -1;

  const subColor = "hsl(258 15% 72%)";
  const inputCls = "w-full px-4 py-3 rounded-2xl text-sm text-white outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "hsl(271 91% 65% / 0.65)"; };
  const inputBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      style={{ background: "rgba(5,3,14,0.20)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-[28px] overflow-hidden"
        style={{
          background: "linear-gradient(170deg, hsl(268 52% 14%) 0%, hsl(260 42% 10%) 45%, hsl(250 36% 8%) 100%)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.80), 0 0 0 1px rgba(255,255,255,0.07), 0 0 80px hsl(271 91% 60% / 0.14), inset 0 1px 0 rgba(255,255,255,0.10)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-display font-semibold uppercase tracking-[0.12em]"
              style={{ color: "hsl(316 90% 65%)" }}>
              Авторизація Telegram
            </span>
            <h2 className="text-[17px] font-display font-black text-white leading-tight">
              {step ? stepInfo[step].label : "…"}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", color: "hsl(258 15% 65%)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="px-4 pt-3 pb-2 flex gap-1.5">
          {visibleSteps.map((_, i) => (
            <div key={i} className="h-[3px] flex-1 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: i <= stepIndex ? "100%" : "0%",
                  background: "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                  opacity: i < stepIndex ? 0.40 : 1,
                }} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-4 pt-2 pb-5">

          {/* ── LOADING ── */}
          {step === null && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "hsl(271 91% 65%)" }} />
            </div>
          )}

          {/* ── PREP (ПІДГОТОВКА) ── */}
          {step === "prep" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {[
                  { icon: Settings,   label: "API ID та API Hash",  sub: "Отримати на my.telegram.org" },
                  { icon: Smartphone, label: "Номер телефону акаунта", sub: "Міжнародний формат: +380…" },
                  { icon: KeyRound,   label: "Код з Telegram",      sub: "5-значний, надійде в додаток" },
                  { icon: ShieldCheck,label: "2FA пароль",          sub: "Якщо увімкнено в налаштуваннях" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.30), hsl(316 90% 62% / 0.20))" }}>
                      <Icon style={{ color: "hsl(271 91% 80%)", width: 14, height: 14 }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-display font-bold text-white leading-tight">{label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: subColor }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
                style={{ background: "hsl(271 91% 65% / 0.08)", border: "1px solid hsl(271 91% 65% / 0.15)" }}>
                <Lock style={{ color: "hsl(271 91% 70%)", width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
                <p className="text-[12px] leading-relaxed" style={{ color: subColor }}>
                  Всі дані зберігаються <span className="text-white">локально</span> і нікуди не передаються.
                  Ви можете будь-коли скинути сесію.
                </p>
              </div>

              <button onClick={() => setStep("apiid")}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={convexBtn}>
                <ArrowRight className="h-4 w-4" /> Продовжити
              </button>
            </div>
          )}

          {/* ── API ID ── */}
          {step === "apiid" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 px-1">
                <p className="text-[13px] leading-relaxed" style={{ color: subColor }}>
                  Відкрийте{" "}
                  <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold"
                    style={{ color: "hsl(271 91% 75%)" }}>
                    my.telegram.org <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}→ <span className="text-white font-semibold">API development tools</span>
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: subColor }}>
                  Скопіюйте <span className="text-white font-semibold">App api_id</span> — це <span className="text-white">число</span>.
                </p>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl mt-0.5"
                  style={{ background: "rgba(255,255,255,0.04)", fontFamily: "monospace" }}>
                  <span className="text-[11px]" style={{ color: "hsl(258 15% 55%)" }}>Приклад:</span>
                  <span className="text-[13px] text-white font-semibold">20799080</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-display font-semibold uppercase tracking-[0.10em]"
                  style={{ color: "hsl(258 15% 62%)" }}>
                  API ID (лише цифри)
                </label>
                <input
                  type="tel"
                  placeholder="20799080"
                  value={apiIdInput}
                  onChange={(e) => setApiIdInput(e.target.value.replace(/\D/g, ""))}
                  className={inputCls}
                  style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              <button
                onClick={() => {
                  if (apiIdInput.length < 5) {
                    toast({ title: "Невірний API ID", description: "API ID складається лише з цифр (мінімум 5)", variant: "destructive" });
                    return;
                  }
                  setStep("apihash");
                }}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={convexBtn}>
                <ArrowRight className="h-4 w-4" /> Далі — API Hash
              </button>

              <button onClick={() => setStep("prep")}
                className="text-center text-xs py-1.5"
                style={{ color: "hsl(258 15% 55%)" }}>
                ← Назад
              </button>
            </div>
          )}

          {/* ── API HASH ── */}
          {step === "apihash" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5 px-1">
                <p className="text-[13px] leading-relaxed" style={{ color: subColor }}>
                  На тій же сторінці{" "}
                  <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold"
                    style={{ color: "hsl(271 91% 75%)" }}>
                    my.telegram.org <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}знайдіть <span className="text-white font-semibold">App api_hash</span> — довгий буквено-цифровий рядок.
                </p>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl mt-0.5"
                  style={{ background: "rgba(255,255,255,0.04)", fontFamily: "monospace" }}>
                  <span className="text-[11px]" style={{ color: "hsl(258 15% 55%)" }}>Приклад:</span>
                  <span className="text-[12px] text-white font-semibold tracking-wide">a1b2c3d4e5f6g7h8</span>
                </div>
                <p className="text-[11px]" style={{ color: "hsl(258 15% 55%)" }}>
                  ⚠️ Hash чутливий до регістру — копіюйте точно як є.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-display font-semibold uppercase tracking-[0.10em]"
                  style={{ color: "hsl(258 15% 62%)" }}>
                  API Hash
                </label>
                <input
                  type="text"
                  placeholder="a1b2c3d4e5f6g7h8i9j0"
                  value={apiHashInput}
                  onChange={(e) => setApiHashInput(e.target.value.trim())}
                  className={`${inputCls} font-mono`}
                  style={inputStyle}
                  onFocus={inputFocus} onBlur={inputBlur}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>

              <button
                onClick={() => {
                  if (apiHashInput.length < 10) {
                    toast({ title: "Невірний API Hash", description: "Hash має бути довгим буквено-цифровим рядком", variant: "destructive" });
                    return;
                  }
                  setStep("phone");
                }}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={convexBtn}>
                <ArrowRight className="h-4 w-4" /> Далі — Авторизація
              </button>

              <button onClick={() => setStep("apiid")}
                className="text-center text-xs py-1.5"
                style={{ color: "hsl(258 15% 55%)" }}>
                ← Назад
              </button>
            </div>
          )}

          {/* ── INTRO (акаунт вже підключено) ── */}
          {step === "intro" && (
            <div className="flex flex-col gap-3">
              {authStatus === undefined ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "hsl(271 91% 65%)" }} />
                </div>
              ) : authStatus.authenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                    style={{ background: "hsl(271 91% 65% / 0.10)", border: "1px solid hsl(271 91% 65% / 0.20)" }}>
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "hsl(271 91% 65%)" }} />
                    <div>
                      <p className="font-display font-bold text-white text-sm">Акаунт підключено</p>
                      <p className="text-xs mt-0.5" style={{ color: subColor }}>
                        {authStatus.firstName && `${authStatus.firstName} · `}
                        {authStatus.username ? `@${authStatus.username}` : authStatus.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 px-1">
                    {["📢 Розсилки — надсилання від вашого імені",
                      "🔍 OSINT — пошук та аналіз груп",
                      "🕷️ Парсери — збір учасників та даних"].map(line => (
                      <p key={line} className="text-[12px]" style={{ color: subColor }}>{line}</p>
                    ))}
                    <p className="text-[11px] mt-1" style={{ color: "hsl(258 15% 52%)" }}>
                      Сесія збережена — повторний вхід не потрібен.
                    </p>
                  </div>
                  <button onClick={onSuccess}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm"
                    style={convexBtn}>
                    🚀 Панель керування
                  </button>
                  <button onClick={handleLogout} disabled={logout.isPending}
                    className="w-full py-3 rounded-2xl font-display font-semibold text-sm transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", color: "hsl(0 85% 65%)", border: "1px solid hsl(0 60% 40% / 0.25)" }}>
                    {logout.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Відключити акаунт"}
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* ── PHONE ── */}
          {step === "phone" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed" style={{ color: subColor }}>
                Введіть номер у форматі <span className="text-white font-semibold">+380XXXXXXXXX</span>.
                Telegram надішле код у застосунок.
              </p>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-display font-semibold uppercase tracking-[0.10em]"
                    style={{ color: "hsl(258 15% 62%)" }}>
                    Номер телефону
                  </label>
                  <input {...phoneForm.register("phone")}
                    placeholder="+380XXXXXXXXX"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                  {phoneForm.formState.errors.phone && (
                    <span className="text-xs" style={{ color: "hsl(0 85% 65%)" }}>
                      {phoneForm.formState.errors.phone.message}
                    </span>
                  )}
                </div>
                <button type="submit" disabled={sendCode.isPending}
                  className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                  style={convexBtn}>
                  {sendCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Надіслати код</>}
                </button>
              </form>
            </div>
          )}

          {/* ── CODE ── */}
          {step === "code" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed" style={{ color: subColor }}>
                Код надіслано на <span className="text-white font-semibold">{phoneNumber}</span>.
                Відкрийте Telegram і введіть 5-значний код.
              </p>
              <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-display font-semibold uppercase tracking-[0.10em]"
                    style={{ color: "hsl(258 15% 62%)" }}>
                    Код з Telegram
                  </label>
                  <input
                    ref={codeForm.register("code").ref}
                    type="tel"
                    inputMode="numeric"
                    placeholder="1 2 3 4 5"
                    value={codeDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\s+/g, "").replace(/\D/g, "").slice(0, 5);
                      setCodeDisplay(raw.split("").join(" "));
                      codeForm.setValue("code", raw, { shouldValidate: true });
                    }}
                    className={`${inputCls} font-mono text-xl text-center`}
                    style={{ ...inputStyle, letterSpacing: "0.45em" }}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                  {codeForm.formState.errors.code && (
                    <span className="text-xs" style={{ color: "hsl(0 85% 65%)" }}>
                      {codeForm.formState.errors.code.message}
                    </span>
                  )}
                </div>
                <button type="submit" disabled={verifyCode.isPending}
                  className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                  style={convexBtn}>
                  {verifyCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Підтвердити</>}
                </button>
                <button type="button" onClick={() => setStep("phone")}
                  className="text-center text-xs py-1.5 transition-colors"
                  style={{ color: "hsl(258 15% 58%)" }}>
                  ← Змінити номер
                </button>
              </form>
            </div>
          )}

          {/* ── 2FA PASSWORD ── */}
          {step === "password" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed" style={{ color: subColor }}>
                На акаунті увімкнена 2FA. Введіть пароль з Telegram → Налаштування → Конфіденційність.
              </p>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-display font-semibold uppercase tracking-[0.10em]"
                    style={{ color: "hsl(258 15% 62%)" }}>
                    Пароль 2FA
                  </label>
                  <input {...passwordForm.register("password")}
                    type="password"
                    placeholder="Ваш пароль"
                    className={inputCls}
                    style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                  {passwordForm.formState.errors.password && (
                    <span className="text-xs" style={{ color: "hsl(0 85% 65%)" }}>
                      {passwordForm.formState.errors.password.message}
                    </span>
                  )}
                </div>
                <button type="submit" disabled={verifyPassword.isPending}
                  className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                  style={convexBtn}>
                  {verifyPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Підтвердити</>}
                </button>
              </form>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-3 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                  boxShadow: "0 0 32px hsl(271 91% 65% / 0.40)",
                }}>
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-white">Акаунт підключено!</h3>
                <p className="text-sm mt-1" style={{ color: subColor }}>
                  Все готово. Шукайте групи та запускайте розсилки.
                </p>
              </div>
              <button onClick={onSuccess}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={convexBtn}>
                <TelegramIcon className="h-4 w-4" /> Відкрити панель
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
