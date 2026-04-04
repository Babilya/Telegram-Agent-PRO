import { useState } from "react";
import { useGetAuthStatus, getGetAuthStatusQueryKey, useLogoutAuth } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  User, Phone, AtSign, ShieldCheck, LogOut, Loader2, RefreshCw,
  KeyRound, Hash, Activity, Server, CheckCircle2, XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";

const PRI = "hsl(271 91% 65%)";
const ACC = "hsl(316 90% 62%)";
const SUB = "hsl(258 15% 70%)";
const DIM = "hsl(258 15% 52%)";

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.07)",
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={card}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
        <Icon style={{ width: 13, height: 13, color: PRI }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-display font-semibold uppercase tracking-widest" style={{ color: DIM }}>{label}</p>
        <p className="text-[13px] font-mono text-white truncate">{value}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: authStatus, isLoading } = useGetAuthStatus({
    query: { queryKey: getGetAuthStatusQueryKey(), refetchInterval: 30000 },
  });

  const logout = useLogoutAuth();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Відключено", description: "Telegram акаунт відключено." });
        queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
      },
      onError: () => toast({ title: "Помилка відключення", variant: "destructive" }),
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Налаштування</h1>
          <p className="text-muted-foreground text-sm">Акаунт та стан системи.</p>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleRefresh}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Account section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>Telegram акаунт</h2>

        {/* Status banner */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{
            background: authStatus?.authenticated ? "hsl(271 91% 65% / 0.10)" : "hsl(0 85% 60% / 0.10)",
            border: `1px solid ${authStatus?.authenticated ? "hsl(271 91% 65% / 0.25)" : "hsl(0 85% 60% / 0.25)"}`,
          }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: authStatus?.authenticated ? "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))" : "hsl(0 60% 35%)" }}>
            {isLoading
              ? <Loader2 className="h-5 w-5 text-white animate-spin" />
              : authStatus?.authenticated
                ? <CheckCircle2 className="h-5 w-5 text-white" />
                : <XCircle className="h-5 w-5 text-white" />}
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-white text-sm">
              {authStatus?.authenticated ? "Акаунт підключено" : "Акаунт не підключено"}
            </p>
            <p className="text-[12px]" style={{ color: SUB }}>
              {authStatus?.authenticated
                ? `${authStatus.firstName ?? ""} ${authStatus.username ? `@${authStatus.username}` : authStatus.phone ?? ""}`.trim()
                : "Натисніть щоб підключити"}
            </p>
          </div>
          {!authStatus?.authenticated && (
            <Button size="sm" onClick={() => setShowAuth(true)}>
              Підключити
            </Button>
          )}
        </div>

        {authStatus?.authenticated && (
          <>
            <InfoRow icon={User}       label="Ім'я"      value={[authStatus.firstName].filter(Boolean).join(" ")} />
            <InfoRow icon={AtSign}     label="Username"  value={authStatus.username ? `@${authStatus.username}` : null} />
            <InfoRow icon={Phone}      label="Телефон"   value={authStatus.phone} />
          </>
        )}
      </div>

      {/* API Credentials section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>API Credentials</h2>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={card}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
              <Hash style={{ width: 13, height: 13, color: PRI }} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-display font-semibold uppercase tracking-widest" style={{ color: DIM }}>API ID</p>
              <p className="text-[13px] font-mono text-white">••••••••</p>
            </div>
            <div className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "hsl(142 71% 45%)" }}>
              <CheckCircle2 style={{ width: 10, height: 10, color: "white" }} />
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={card}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
              <KeyRound style={{ width: 13, height: 13, color: PRI }} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-display font-semibold uppercase tracking-widest" style={{ color: DIM }}>API Hash</p>
              <p className="text-[13px] font-mono text-white">••••••••••••••••••••••••</p>
            </div>
            <div className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "hsl(142 71% 45%)" }}>
              <CheckCircle2 style={{ width: 10, height: 10, color: "white" }} />
            </div>
          </div>
        </div>

        <p className="text-[11px] px-1" style={{ color: DIM }}>
          API credentials встановлені через env-змінні та не відображаються з міркувань безпеки.
        </p>
      </div>

      {/* System section */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>Стан системи</h2>

        <div className="flex flex-col gap-1.5">
          {[
            { label: "API сервер (Node.js)", port: "8080" },
            { label: "Bot сервіс (Python)", port: "8001" },
          ].map(({ label, port }) => (
            <div key={port} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={card}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
                <Server style={{ width: 13, height: 13, color: PRI }} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-white">{label}</p>
                <p className="text-[11px] font-mono" style={{ color: DIM }}>:{port}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-mono" style={{ color: PRI }}>ONLINE</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      {authStatus?.authenticated && (
        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: "hsl(0 70% 55%)" }}>Небезпечна зона</h2>
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            {logout.isPending
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <LogOut className="h-4 w-4 mr-2" />}
            Відключити Telegram акаунт
          </Button>
          <p className="text-[11px] text-center" style={{ color: DIM }}>
            Сесія буде видалена. Для повторного використання потрібна нова авторизація.
          </p>
        </div>
      )}

      {!authStatus?.authenticated && (
        <Button className="w-full" onClick={() => setShowAuth(true)}>
          <ShieldCheck className="h-4 w-4 mr-2" /> Авторизуватися в Telegram
        </Button>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
          }}
        />
      )}
    </div>
  );
}
