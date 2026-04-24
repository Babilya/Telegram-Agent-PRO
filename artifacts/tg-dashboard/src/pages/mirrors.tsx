import { useState } from "react";
import { Copy, Plus, Trash2, KeyRound, Loader2, Play, Square, ShieldCheck, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const OK = "hsl(142 70% 50%)";
const ERR = "hsl(0 70% 60%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

type Step = "idle" | "credentials" | "code" | "password" | "done";

function statusBadge(s: string): { color: string; label: string } {
  switch (s) {
    case "running": return { color: OK, label: "● Працює" };
    case "ready": return { color: PRI, label: "✓ Готово" };
    case "pending_code": return { color: "hsl(38 90% 60%)", label: "⏳ Очікує код" };
    case "pending_password": return { color: "hsl(38 90% 60%)", label: "⏳ Очікує 2FA" };
    case "configured": return { color: DIM, label: "Налаштовано" };
    case "error": return { color: ERR, label: "✕ Помилка" };
    default: return { color: DIM, label: "○ Idle" };
  }
}

export default function Mirrors() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [owner, setOwner] = useState("");
  const [tgId, setTgId] = useState("");

  // Auth dialog state
  const [authMirror, setAuthMirror] = useState<any | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["mirrors"],
    queryFn: shadowApi.listMirrors,
    refetchInterval: 5000,
  });
  const mirrors = data?.mirrors ?? [];

  const addM = useMutation({
    mutationFn: (d: { ownerName: string; ownerTelegramId: string }) => shadowApi.addMirror(d),
    onSuccess: (res: any) => {
      toast({ title: "Дзеркало створено", description: `Ключ доступу: ${res.mirror.accessKey}` });
      setOwner(""); setTgId("");
      qc.invalidateQueries({ queryKey: ["mirrors"] });
    },
    onError: () => toast({ title: "E007 — невірні дані", variant: "destructive" }),
  });

  const delM = useMutation({
    mutationFn: shadowApi.deleteMirror,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mirrors"] }),
  });

  const startM = useMutation({
    mutationFn: (id: number) => shadowApi.mirrorStart(id),
    onSuccess: () => { toast({ title: "Дзеркало запущено" }); qc.invalidateQueries({ queryKey: ["mirrors"] }); },
    onError: (e: any) => toast({ title: "E500 — старт не вдався", description: String(e?.message || e), variant: "destructive" }),
  });

  const stopM = useMutation({
    mutationFn: (id: number) => shadowApi.mirrorStop(id),
    onSuccess: () => { toast({ title: "Дзеркало зупинено" }); qc.invalidateQueries({ queryKey: ["mirrors"] }); },
  });

  const create = () => {
    if (!owner.trim() || !tgId.trim()) {
      toast({ title: "E007 — заповніть усі поля", variant: "destructive" });
      return;
    }
    addM.mutate({ ownerName: owner.trim(), ownerTelegramId: tgId.trim() });
  };

  const openAuth = (m: any) => {
    setAuthMirror(m);
    setStep("credentials");
    setApiId(m.apiId ? String(m.apiId) : "");
    setApiHash(""); setPhone(m.phone || ""); setCode(""); setPassword("");
  };

  const closeAuth = () => {
    setAuthMirror(null); setStep("idle"); setBusy(false);
    qc.invalidateQueries({ queryKey: ["mirrors"] });
  };

  const sendCode = async () => {
    if (!authMirror) return;
    if (!apiId.trim() || !apiHash.trim() || !phone.trim()) {
      toast({ title: "E007 — заповніть усі поля", variant: "destructive" }); return;
    }
    setBusy(true);
    try {
      await shadowApi.mirrorSendCode(authMirror.id, { apiId: Number(apiId), apiHash: apiHash.trim(), phone: phone.trim() });
      setStep("code");
      toast({ title: "Код надіслано в Telegram", description: phone });
    } catch (e: any) {
      toast({ title: "Не вдалося надіслати код", description: String(e?.message || e), variant: "destructive" });
    } finally { setBusy(false); }
  };

  const verifyCode = async () => {
    if (!authMirror || !code.trim()) return;
    setBusy(true);
    try {
      const r = await shadowApi.mirrorVerifyCode(authMirror.id, code.trim());
      if (r.needPassword) { setStep("password"); toast({ title: "Введіть пароль 2FA" }); }
      else { setStep("done"); toast({ title: "Авторизовано ✓" }); }
    } catch (e: any) {
      toast({ title: "Невірний код", description: String(e?.message || e), variant: "destructive" });
    } finally { setBusy(false); }
  };

  const verifyPwd = async () => {
    if (!authMirror || !password) return;
    setBusy(true);
    try {
      await shadowApi.mirrorVerifyPassword(authMirror.id, password);
      setStep("done");
      toast({ title: "Авторизовано ✓" });
    } catch (e: any) {
      toast({ title: "Невірний пароль", description: String(e?.message || e), variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Дзеркала</h1>
        <p className="text-muted-foreground text-sm">Копії бота для інших акаунтів.</p>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={card}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <Copy style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Створити дзеркало</p>
            <p className="text-xs" style={{ color: DIM }}>Друг отримає унікальний ключ</p>
          </div>
        </div>
        <Input placeholder="Ім'я власника…" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <Input placeholder="Telegram ID власника…" value={tgId} onChange={(e) => setTgId(e.target.value)} />
        <Button onClick={create} disabled={addM.isPending} className="w-full">
          {addM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Створити</>}
        </Button>

        <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "rgba(0,0,0,0.3)" }}>
          <p className="text-[11px] font-display font-bold uppercase tracking-widest mb-1" style={{ color: DIM }}>Обмеження дзеркала</p>
          <Limit label="Розсилки" allowed />
          <Limit label="Моніторинг" allowed />
          <Limit label="Логування" />
          <Limit label="Автовідповіді" allowed />
          <Limit label="Дзеркала" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>
          Активні дзеркала ({mirrors.length})
        </h2>
        {mirrors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            Дзеркал ще немає.
          </div>
        ) : mirrors.map((m: any) => {
          const b = statusBadge(m.status || "idle");
          const ready = m.sessionString && m.apiId && m.apiHashEnc;
          const running = m.status === "running";
          return (
            <div key={m.id} className="px-4 py-3 rounded-xl flex items-center gap-3 flex-wrap" style={card}>
              <KeyRound className="h-4 w-4" style={{ color: PRI }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-display font-bold text-white truncate">{m.ownerName}</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: b.color, border: `1px solid ${b.color}55` }}>{b.label}</span>
                </div>
                <p className="text-[10px] font-mono truncate" style={{ color: DIM }}>
                  TG ID: {m.ownerTelegramId} • Ключ: {m.accessKey}{m.phone ? ` • ☎ ${m.phone}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => openAuth(m)} title="Авторизувати">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {ready ? "Переавторизувати" : "Авторизувати"}
                </Button>
                {ready && !running && (
                  <Button size="sm" onClick={() => startM.mutate(m.id)} disabled={startM.isPending}>
                    {startM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                )}
                {running && (
                  <Button size="sm" variant="outline" onClick={() => stopM.mutate(m.id)} disabled={stopM.isPending}>
                    {stopM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                  </Button>
                )}
                <button onClick={() => delM.mutate(m.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!authMirror} onOpenChange={(o) => !o && closeAuth()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Авторизація дзеркала {authMirror?.ownerName ? `«${authMirror.ownerName}»` : ""}</DialogTitle>
            <DialogDescription>
              {step === "credentials" && "Введіть API ID, API Hash і номер телефону власника."}
              {step === "code" && "Введіть код, який Telegram надіслав у застосунок."}
              {step === "password" && "У акаунта увімкнено 2FA — введіть пароль."}
              {step === "done" && "Готово! Тепер можна натиснути Старт на картці дзеркала."}
            </DialogDescription>
          </DialogHeader>

          {step === "credentials" && (
            <div className="space-y-2">
              <Input placeholder="API ID (число)" value={apiId} onChange={(e) => setApiId(e.target.value)} />
              <Input placeholder="API Hash" value={apiHash} onChange={(e) => setApiHash(e.target.value)} />
              <Input placeholder="Телефон у форматі +380…" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <p className="text-[11px]" style={{ color: DIM }}>API ID/Hash отримати на my.telegram.org. Хеш буде зашифровано Fernet.</p>
              <Button onClick={sendCode} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Надіслати код"}
              </Button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-2">
              <Input placeholder="Код із Telegram" value={code} onChange={(e) => setCode(e.target.value)} />
              <Button onClick={verifyCode} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Підтвердити код"}
              </Button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-2">
              <Input type="password" placeholder="Пароль 2FA" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button onClick={verifyPwd} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Підтвердити пароль"}
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: OK }}>
                <ShieldCheck className="h-4 w-4" /> Сесію збережено та зашифровано.
              </div>
              <Button onClick={closeAuth} className="w-full">Закрити</Button>
            </div>
          )}

          {authMirror?.error && step !== "done" && (
            <div className="flex items-center gap-2 text-xs" style={{ color: ERR }}>
              <AlertCircle className="h-3.5 w-3.5" /> {authMirror.error}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Limit({ label, allowed }: { label: string; allowed?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: DIM }}>{label}</span>
      <span style={{ color: allowed ? PRI : "hsl(0 70% 60%)" }}>{allowed ? "✅" : "❌"}</span>
    </div>
  );
}
