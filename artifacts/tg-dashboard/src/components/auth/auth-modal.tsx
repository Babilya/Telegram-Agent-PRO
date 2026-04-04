import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, Smartphone, KeyRound, ShieldCheck, ArrowRight, CheckCircle2, Settings, Bot, Fingerprint, Lock, Gem, ExternalLink } from "lucide-react";
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

type Step = "apiid" | "intro" | "phone" | "code" | "password" | "success";

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
  apiid:    { icon: Settings,     label: "API налаштування" },
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

  useEffect(() => {
    fetch("/api/auth/config")
      .then(r => r.json())
      .then((cfg: { hasCredentials: boolean }) => {
        setStep(cfg.hasCredentials ? "intro" : "apiid");
      })
      .catch(() => setStep("intro"));
  }, []);

  const { data: authStatus } = useGetAuthStatus({ query: { queryKey: getGetAuthStatusQueryKey() } });
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

          {/* ── API ID ── */}
          {step === "apiid" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.30), hsl(316 90% 62% / 0.20))" }}>
                  <Settings style={{ color: "hsl(271 91% 80%)", width: 14, height: 14 }} />
                </div>
                <div>
                  <p className="font-display font-bold text-white text-[13px] leading-tight">Налаштування API</p>
                  <p className="text-[11px] mt-0.5" style={{ color: subColor }}>Потрібно один раз</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 px-1">
                <p className="text-[13px] leading-relaxed" style={{ color: subColor }}>
                  Перейди на{" "}
                  <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold"
                    style={{ color: "hsl(271 91% 75%)" }}>
                    my.telegram.org <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}→ <span className="text-white font-semibold">API Development Tools</span>
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: subColor }}>
                  Скопіюй <span className="text-white font-semibold">App api_id</span> (число) та введи нижче.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-display font-semibold uppercase tracking-[0.10em]"
                  style={{ color: "hsl(258 15% 62%)" }}>
                  API ID (число)
                </label>
                <input
                  type="tel"
                  placeholder="12345678"
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
                    toast({ title: "Введіть API ID", description: "Мінімум 5 цифр", variant: "destructive" });
                    return;
                  }
                  setStep("intro");
                }}
                className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2"
                style={convexBtn}>
                <ArrowRight className="h-4 w-4" /> Продовжити
              </button>

              <button onClick={() => setStep("intro")}
                className="text-center text-xs py-1.5"
                style={{ color: "hsl(258 15% 55%)" }}>
                Вже налаштовано — пропустити
              </button>
            </div>
          )}

          {/* ── INTRO ── */}
          {step === "intro" && (
            <>
              {authStatus?.authenticated ? (
                <div className="flex flex-col gap-3">
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
                  <p className="text-sm leading-relaxed px-1" style={{ color: subColor }}>
                    Ваш акаунт підключений. Можете відключити або продовжити.
                  </p>
                  <button onClick={onSuccess}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm"
                    style={convexBtn}>
                    Перейти до панелі
                  </button>
                  <button onClick={handleLogout} disabled={logout.isPending}
                    className="w-full py-3 rounded-2xl font-display font-semibold text-sm transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", color: "hsl(0 85% 65%)", border: "1px solid hsl(0 60% 40% / 0.25)" }}>
                    {logout.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Відключити акаунт"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {[
                    {
                      icon: Bot,
                      title: "Що це?",
                      desc: "GROUP AGENT використовує ваш Telegram акаунт для пошуку груп, автовступу та розсилок — без сторонніх сервісів.",
                    },
                    {
                      icon: Fingerprint,
                      title: "Що потрібно?",
                      desc: "Лише номер телефону вашого Telegram. Код підтвердження надійде прямо в додаток.",
                    },
                    {
                      icon: Lock,
                      title: "Безпечно?",
                      desc: "Сесія зберігається на сервері. Ніхто, крім вас, не має доступу до акаунту.",
                    },
                    {
                      icon: Gem,
                      title: "Кому підходить?",
                      desc: "Telegram Business або Premium акаунт — для масових дій без обмежень.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-2 px-3 py-2 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-px"
                        style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.30), hsl(316 90% 62% / 0.20))" }}>
                        <Icon style={{ color: "hsl(271 91% 80%)", width: 15, height: 15 }} />
                      </div>
                      <div>
                        <p className="font-display font-bold text-white text-[13px] leading-tight">{title}</p>
                        <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: subColor }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setStep("phone")}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 mt-2"
                    style={convexBtn}>
                    <Smartphone className="h-4 w-4" /> Продовжити
                  </button>
                </div>
              )}
            </>
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
