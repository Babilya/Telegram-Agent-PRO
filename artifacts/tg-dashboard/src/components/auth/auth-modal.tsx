import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, Smartphone, KeyRound, ShieldCheck, ArrowRight, CheckCircle2, LogOut } from "lucide-react";
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

type Step = "intro" | "phone" | "code" | "password" | "success";

const convexBtn: React.CSSProperties = {
  background: "linear-gradient(160deg, hsl(271 91% 68%), hsl(316 90% 60%))",
  color: "white",
  border: "none",
  boxShadow:
    "0 4px 16px rgba(0,0,0,0.35)," +
    "inset 0 1px 0 rgba(255,255,255,0.22)," +
    "inset 0 -1px 0 rgba(0,0,0,0.18)",
};

const glassPanel: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const gradientText: React.CSSProperties = {
  background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const steps: Step[] = ["intro", "phone", "code", "success"];

const stepInfo: Record<Step, { icon: React.FC<any>; label: string }> = {
  intro:    { icon: TelegramIcon,  label: "Про підключення" },
  phone:    { icon: Smartphone,   label: "Номер телефону" },
  code:     { icon: KeyRound,     label: "Код підтвердження" },
  password: { icon: ShieldCheck,  label: "Пароль 2FA" },
  success:  { icon: CheckCircle2, label: "Підключено" },
};

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("intro");
  const [phoneNumber, setPhoneNumber] = useState("");

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
          setStep("code");
        } else {
          toast({ title: "Помилка", description: res.message, variant: "destructive" });
        }
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };

  const onCodeSubmit = ({ code }: { code: string }) => {
    verifyCode.mutate({ data: { phone: phoneNumber, code, phoneCodeHash: "hash" } }, {
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

  const visibleSteps = step === "password"
    ? (["intro", "phone", "code", "password", "success"] as Step[])
    : (["intro", "phone", "code", "success"] as Step[]);

  const stepIndex = visibleSteps.indexOf(step);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(10,6,28,0.45)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: "hsl(258 38% 9% / 0.95)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px hsl(271 91% 65% / 0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
          maxHeight: "88dvh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-display font-semibold uppercase tracking-widest"
              style={{ color: "hsl(316 90% 65%)" }}>
              Авторизація Telegram
            </span>
            <h2 className="text-lg font-display font-black text-white leading-tight">
              {stepInfo[step].label}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.07)", color: "hsl(258 10% 70%)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="px-5 py-3 shrink-0 flex gap-1.5">
          {visibleSteps.map((_, i) => (
            <div key={i} className="h-1 flex-1 rounded-full overflow-hidden"
              style={{ background: "hsl(258 30% 18%)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: i <= stepIndex ? "100%" : "0%",
                  background: "linear-gradient(90deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                  opacity: i < stepIndex ? 0.45 : 1,
                }} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── INTRO ── */}
          {step === "intro" && (
            <div className="flex flex-col gap-5">
              {authStatus?.authenticated ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: "hsl(271 91% 65% / 0.1)", border: "1px solid hsl(271 91% 65% / 0.2)" }}>
                    <CheckCircle2 className="h-6 w-6 shrink-0" style={{ color: "hsl(271 91% 65%)" }} />
                    <div>
                      <p className="font-display font-bold text-white text-sm">Акаунт підключено</p>
                      <p className="text-xs mt-0.5" style={{ color: "hsl(258 15% 75%)" }}>
                        {authStatus.firstName && `${authStatus.firstName} · `}
                        {authStatus.username ? `@${authStatus.username}` : authStatus.phone}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(258 15% 75%)" }}>
                    Ваш акаунт вже підключений. Можете відключити його або продовжити роботу.
                  </p>
                  <button onClick={onSuccess}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm"
                    style={convexBtn}>
                    Перейти до панелі
                  </button>
                  <button onClick={handleLogout} disabled={logout.isPending}
                    className="w-full py-3 rounded-2xl font-display font-semibold text-sm transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", color: "hsl(0 85% 65%)", border: "1px solid hsl(0 60% 40% / 0.3)" }}>
                    {logout.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Відключити акаунт"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {[
                    { emoji: "🔐", title: "Що це?", desc: "GROUP AGENT використовує ваш Telegram акаунт для пошуку груп, автовступу та розсилок — без сторонніх сервісів." },
                    { emoji: "📱", title: "Що потрібно?", desc: "Лише номер телефону вашого Telegram. Код підтвердження надійде прямо в додаток." },
                    { emoji: "🛡️", title: "Безпечно?", desc: "Сесія зберігається на сервері. Ніхто, крім вас, не має доступу до акаунту." },
                    { emoji: "⚡", title: "Кому підходить?", desc: "Telegram Business або Premium акаунт — для масових дій без обмежень." },
                  ].map(({ emoji, title, desc }) => (
                    <div key={title} className="flex items-start gap-3 px-3 py-2.5 rounded-2xl"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <span className="text-lg shrink-0 leading-tight mt-0.5">{emoji}</span>
                      <div>
                        <p className="font-display font-bold text-white text-sm leading-tight">{title}</p>
                        <p className="text-xs leading-relaxed mt-0.5" style={{ color: "hsl(258 15% 75%)" }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setStep("phone")}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 mt-1"
                    style={convexBtn}>
                    <Smartphone className="h-4 w-4" /> Продовжити
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PHONE ── */}
          {step === "phone" && (
            <div className="flex flex-col gap-5">
              <div className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(258 15% 78%)" }}>
                  Введіть номер телефону у форматі <span className="font-mono text-white">+380XXXXXXXXX</span>.
                  Telegram надішле вам код підтвердження у застосунок.
                </p>
              </div>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold uppercase tracking-widest"
                    style={{ color: "hsl(258 15% 68%)" }}>
                    Номер телефону
                  </label>
                  <input
                    {...phoneForm.register("phone")}
                    placeholder="+380XXXXXXXXX"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "hsl(271 91% 65% / 0.6)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
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
                  {sendCode.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><ArrowRight className="h-4 w-4" /> Надіслати код</>}
                </button>
              </form>
            </div>
          )}

          {/* ── CODE ── */}
          {step === "code" && (
            <div className="flex flex-col gap-5">
              <div className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(258 15% 78%)" }}>
                  Код підтвердження надіслано на <span className="font-mono text-white">{phoneNumber}</span>.
                  Відкрийте Telegram і введіть 5-значний код нижче.
                </p>
              </div>
              <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold uppercase tracking-widest"
                    style={{ color: "hsl(258 15% 68%)" }}>
                    Код з Telegram
                  </label>
                  <input
                    {...codeForm.register("code")}
                    placeholder="12345"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl font-mono text-lg text-white text-center outline-none tracking-[0.5em] transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "hsl(271 91% 65% / 0.6)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
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
                  {verifyCode.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><CheckCircle2 className="h-4 w-4" /> Підтвердити</>}
                </button>
                <button type="button" onClick={() => setStep("phone")}
                  className="text-center text-xs py-2 transition-colors"
                  style={{ color: "hsl(258 15% 62%)" }}>
                  ← Змінити номер
                </button>
              </form>
            </div>
          )}

          {/* ── 2FA PASSWORD ── */}
          {step === "password" && (
            <div className="flex flex-col gap-5">
              <div className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(258 15% 78%)" }}>
                  На вашому акаунті увімкнена двофакторна авторизація (2FA). Введіть пароль, який ви встановили у Telegram → Налаштування → Конфіденційність.
                </p>
              </div>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-display font-semibold uppercase tracking-widest"
                    style={{ color: "hsl(258 15% 68%)" }}>
                    Пароль 2FA
                  </label>
                  <input
                    {...passwordForm.register("password")}
                    type="password"
                    placeholder="Ваш пароль"
                    className="w-full px-4 py-3 rounded-xl font-mono text-sm text-white outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "hsl(271 91% 65% / 0.6)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
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
                  {verifyPassword.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><ShieldCheck className="h-4 w-4" /> Підтвердити</>}
                </button>
              </form>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
                  boxShadow: "0 0 30px hsl(271 91% 65% / 0.4)",
                }}>
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-white">Акаунт підключено!</h3>
                <p className="text-sm mt-1" style={{ color: "hsl(258 15% 75%)" }}>
                  Все готово. Тепер можна шукати групи та запускати розсилки.
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
