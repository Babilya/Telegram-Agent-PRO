import { useState } from "react";
import { Bot, Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "linear-gradient(160deg, hsl(258 35% 14% / 0.85), hsl(258 35% 9% / 0.85))", border: "1px solid hsl(271 40% 28% / 0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)" };

export default function AutoReplies() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [trigger, setTrigger] = useState("");
  const [reply, setReply] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["autoreplies"],
    queryFn: shadowApi.listAutoreplies,
    refetchInterval: 5000,
  });
  const rules = data?.autoreplies ?? [];

  const addM = useMutation({
    mutationFn: (d: { trigger: string; reply: string }) => shadowApi.addAutoreply(d),
    onSuccess: () => {
      toast({ title: "Правило додано" });
      setTrigger(""); setReply("");
      qc.invalidateQueries({ queryKey: ["autoreplies"] });
    },
    onError: (e: any) => toast({ title: "Помилка", description: String(e.message).slice(0, 100), variant: "destructive" }),
  });

  const delM = useMutation({
    mutationFn: shadowApi.deleteAutoreply,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autoreplies"] }),
  });

  const add = () => {
    if (!trigger.trim() || !reply.trim()) {
      toast({ title: "Заповніть обидва поля", variant: "destructive" });
      return;
    }
    addM.mutate({ trigger: trigger.trim(), reply: reply.trim() });
  };

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Автовідповіді</h1>
        <p className="text-muted-foreground text-sm">Тригер → відповідь від вашого імені.</p>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={card}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <Bot style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Активні правила</p>
            <p className="text-xs" style={{ color: DIM }}>{rules.filter((r: any) => r.enabled).length} активних</p>
          </div>
        </div>
        <Input placeholder="Тригер (ключова фраза)…" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
        <Input placeholder="Текст відповіді…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <Button onClick={add} disabled={addM.isPending} className="w-full">
          {addM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Додати правило</>}
        </Button>
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            Правил ще немає.
          </div>
        ) : rules.map((r: any) => (
          <div key={r.id} className="px-4 py-3 rounded-xl space-y-1.5" style={card}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: PRI }}>«{r.trigger}»</span>
              <span style={{ color: DIM }}>→</span>
              <span className="text-[10px]" style={{ color: DIM }}>спрацювань: {r.hits}</span>
              <button onClick={() => delM.mutate(r.id)} className="ml-auto text-destructive hover:bg-destructive/10 p-1 rounded">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: DIM }} />
              <p className="text-xs text-white/80">{r.reply}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-3 text-xs" style={card}>
        <p style={{ color: DIM }}>
          Спрацьовує лише в особистих чатах. <b className="text-white">E006</b> — петля автовідповідей виявлена.
        </p>
      </div>
    </div>
  );
}
