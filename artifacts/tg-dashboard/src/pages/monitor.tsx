import { useState } from "react";
import { Eye, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

export default function Monitor() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newWord, setNewWord] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["keywords"],
    queryFn: shadowApi.listKeywords,
    refetchInterval: 5000,
  });
  const keywords = data?.keywords ?? [];

  const addM = useMutation({
    mutationFn: (w: string) => shadowApi.addKeyword(w),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Додано", description: `Ключове слово «${newWord}» активне.` });
        setNewWord("");
        qc.invalidateQueries({ queryKey: ["keywords"] });
      } else {
        toast({ title: "Помилка", description: res.message, variant: "destructive" });
      }
    },
    onError: (e: any) => toast({ title: "E005", description: e.message?.slice(0, 100), variant: "destructive" }),
  });

  const toggleM = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => shadowApi.toggleKeyword(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keywords"] }),
  });
  const delM = useMutation({
    mutationFn: shadowApi.deleteKeyword,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keywords"] }),
  });

  const addKeyword = () => {
    const w = newWord.trim();
    if (w.length < 2) {
      toast({ title: "E005 — слово закоротке", description: "Мінімум 2 символи.", variant: "destructive" });
      return;
    }
    addM.mutate(w);
  };

  const active = keywords.filter((k: any) => k.enabled).length;

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Моніторинг</h1>
        <p className="text-muted-foreground text-sm">Ключові слова, згадки, реакції, редагування.</p>
      </div>

      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <Eye style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Активні ключові слова</p>
            <p className="text-xs" style={{ color: DIM }}>{active} активних • {keywords.length} всього</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Нове ключове слово…"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            data-testid="input-keyword"
          />
          <Button onClick={addKeyword} disabled={addM.isPending} data-testid="btn-add-keyword">
            {addM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Додати</>}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>
          Список слів
        </h2>
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : keywords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            Ключових слів ще немає. Додайте перше для початку моніторингу.
          </div>
        ) : keywords.map((k: any) => (
          <div key={k.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={card}>
            <div className={`h-2 w-2 rounded-full ${k.enabled ? "bg-primary animate-pulse" : "bg-muted"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-white truncate">«{k.word}»</p>
              <p className="text-[10px]" style={{ color: DIM }}>
                {k.enabled ? "Активне" : "Призупинене"} • Спрацювань: {k.hits}
              </p>
            </div>
            <button
              onClick={() => toggleM.mutate({ id: k.id, enabled: !k.enabled })}
              className="text-xs px-2 py-1 rounded-lg hover:bg-white/10"
              style={{ color: k.enabled ? PRI : DIM }}
            >
              {k.enabled ? "Пауза" : "Старт"}
            </button>
            <button onClick={() => delM.mutate(k.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-3 text-xs" style={{ ...card, borderColor: "hsl(45 90% 55% / 0.3)" }}>
        <div className="flex gap-2 items-start">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "hsl(45 90% 55%)" }} />
          <div style={{ color: DIM }}>
            <p><b className="text-white">E005</b> — слово закоротке (мін. 2 символи).</p>
            <p><b className="text-white">E006</b> — петля автовідповідей виявлена.</p>
            <p className="mt-1">Сповіщення надсилаються в приватний чат «Saved Messages».</p>
          </div>
        </div>
      </div>
    </div>
  );
}
