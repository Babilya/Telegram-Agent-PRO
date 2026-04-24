import { useState } from "react";
import { Copy, Plus, Trash2, KeyRound, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

export default function Mirrors() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [owner, setOwner] = useState("");
  const [tgId, setTgId] = useState("");

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

  const create = () => {
    if (!owner.trim() || !tgId.trim()) {
      toast({ title: "E007 — заповніть усі поля", variant: "destructive" });
      return;
    }
    addM.mutate({ ownerName: owner.trim(), ownerTelegramId: tgId.trim() });
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
        ) : mirrors.map((m: any) => (
          <div key={m.id} className="px-4 py-3 rounded-xl flex items-center gap-3" style={card}>
            <KeyRound className="h-4 w-4" style={{ color: PRI }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-bold text-white truncate">{m.ownerName}</p>
              <p className="text-[10px] font-mono truncate" style={{ color: DIM }}>
                TG ID: {m.ownerTelegramId} • Ключ: {m.accessKey}
              </p>
            </div>
            <button onClick={() => delM.mutate(m.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
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
