import { useState } from "react";
import { Forward, Plus, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "linear-gradient(160deg, hsl(258 35% 14% / 0.85), hsl(258 35% 9% / 0.85))", border: "1px solid hsl(271 40% 28% / 0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)" };

export default function Forwarding() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [src, setSrc] = useState("");
  const [kw, setKw] = useState("");
  const [tgt, setTgt] = useState("");

  const { data } = useQuery({
    queryKey: ["forwarding"],
    queryFn: shadowApi.listForwarding,
    refetchInterval: 5000,
  });
  const filters = data?.filters ?? [];

  const addM = useMutation({
    mutationFn: (d: any) => shadowApi.addForward(d),
    onSuccess: () => {
      toast({ title: "Фільтр додано" });
      setSrc(""); setKw(""); setTgt("");
      qc.invalidateQueries({ queryKey: ["forwarding"] });
    },
    onError: (e: any) => toast({ title: "Помилка", description: String(e.message).slice(0, 100), variant: "destructive" }),
  });

  const delM = useMutation({
    mutationFn: shadowApi.deleteForward,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forwarding"] }),
  });

  const add = () => {
    if (!src || !tgt) {
      toast({ title: "Вкажіть джерело та отримувача", variant: "destructive" });
      return;
    }
    addM.mutate({ sourceChat: src, destChat: tgt, keyword: kw || undefined });
  };

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Пересилання</h1>
        <p className="text-muted-foreground text-sm">Маршрутизація повідомлень за фільтрами.</p>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={card}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <Forward style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Активні фільтри</p>
            <p className="text-xs" style={{ color: DIM }}>{filters.filter((f: any) => f.enabled).length}</p>
          </div>
        </div>
        <Input placeholder="Чат-джерело (ID або @username)…" value={src} onChange={(e) => setSrc(e.target.value)} />
        <Input placeholder="Ключове слово (опціонально)…" value={kw} onChange={(e) => setKw(e.target.value)} />
        <Input placeholder="Чат-отримувач (ID або @username)…" value={tgt} onChange={(e) => setTgt(e.target.value)} />
        <Button onClick={add} disabled={addM.isPending} className="w-full">
          {addM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Додати фільтр</>}
        </Button>
      </div>

      <div className="space-y-1.5">
        {filters.map((f: any) => (
          <div key={f.id} className="px-4 py-3 rounded-xl" style={card}>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-white">{f.sourceChat}</span>
              <ArrowRight className="h-3 w-3" style={{ color: PRI }} />
              <span className="font-mono text-white">{f.destChat}</span>
              <button onClick={() => delM.mutate(f.id)} className="ml-auto text-destructive hover:bg-destructive/10 p-1 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: DIM }}>
              фільтр: {f.keyword || "*все*"} • переслано: {f.forwarded}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
