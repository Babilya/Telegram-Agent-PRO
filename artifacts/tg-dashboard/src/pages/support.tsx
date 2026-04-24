import { useState } from "react";
import { MessageCircle, Send, Clock, Loader2, Trash2, Reply, CheckCircle2, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

export default function Support() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: shadowApi.listTickets,
    refetchInterval: 10000,
  });
  const tickets = data?.tickets ?? [];

  const sendM = useMutation({
    mutationFn: (d: { subject: string; message: string }) => shadowApi.createTicket(d),
    onSuccess: () => {
      toast({ title: "Звернення надіслано", description: "Час відповіді: до 24 годин." });
      setSubject(""); setText("");
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const replyM = useMutation({
    mutationFn: (d: { id: number; reply: string }) => shadowApi.replyTicket(d.id, d.reply),
    onSuccess: () => {
      toast({ title: "Відповідь збережено" });
      setReplyId(null); setReplyText("");
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
  const statusM = useMutation({
    mutationFn: (d: { id: number; status: string }) => shadowApi.updateTicketStatus(d.id, d.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
  const delM = useMutation({
    mutationFn: (id: number) => shadowApi.deleteTicket(id),
    onSuccess: () => {
      toast({ title: "Звернення видалено" });
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const send = () => {
    if (!text.trim() || !subject.trim()) {
      toast({ title: "Заповніть тему та текст", variant: "destructive" });
      return;
    }
    sendM.mutate({ subject: subject.trim(), message: text.trim() });
  };

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Підтримка</h1>
        <p className="text-muted-foreground text-sm">Звернення до власника бота.</p>
      </div>

      <div className="rounded-2xl p-4 space-y-2" style={card}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <MessageCircle style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Чат підтримки</p>
            <p className="text-xs flex items-center gap-1" style={{ color: DIM }}>
              <Clock className="h-3 w-3" /> Відповідь до 24 годин
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-3 space-y-2 max-h-80 overflow-y-auto" style={card}>
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : tickets.length === 0 ? (
          <p className="text-center text-sm py-6" style={{ color: DIM }}>Звернень немає.</p>
        ) : tickets.map((t: any) => {
          const isClosed = t.status === "closed";
          const isAnswered = t.status === "answered";
          const statusColor = isAnswered ? PRI : isClosed ? "hsl(258 15% 52%)" : "hsl(45 90% 60%)";
          return (
            <div key={t.id} className="px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-display font-bold text-white">{t.subject}</p>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: statusColor, background: `${statusColor}15` }}>{t.status}</span>
              </div>
              <p className="text-xs text-white/80 mb-1">{t.message}</p>
              {t.reply && (
                <div className="mt-2 p-2 rounded-lg border-l-2 border-primary/40 bg-primary/5">
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest mb-0.5" style={{ color: PRI }}>Відповідь</p>
                  <p className="text-xs text-white/90">{t.reply}</p>
                </div>
              )}
              <div className="flex items-center justify-between mt-1.5 gap-2">
                <p className="text-[9px] font-mono" style={{ color: DIM }}>{new Date(t.createdAt).toLocaleString("uk")}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setReplyId(replyId === t.id ? null : t.id); setReplyText(t.reply ?? ""); }} className="p-1 rounded hover:bg-white/5" title="Відповісти" data-testid={`btn-reply-${t.id}`}>
                    <Reply className="h-3 w-3" style={{ color: PRI }} />
                  </button>
                  {!isClosed ? (
                    <button onClick={() => statusM.mutate({ id: t.id, status: "closed" })} className="p-1 rounded hover:bg-white/5" title="Закрити" data-testid={`btn-close-${t.id}`}>
                      <CheckCircle2 className="h-3 w-3" style={{ color: DIM }} />
                    </button>
                  ) : (
                    <button onClick={() => statusM.mutate({ id: t.id, status: "open" })} className="p-1 rounded hover:bg-white/5" title="Відкрити знову" data-testid={`btn-reopen-${t.id}`}>
                      <RotateCcw className="h-3 w-3" style={{ color: DIM }} />
                    </button>
                  )}
                  <button onClick={() => { if (confirm("Видалити звернення?")) delM.mutate(t.id); }} className="p-1 rounded hover:bg-white/5" title="Видалити" data-testid={`btn-delete-${t.id}`}>
                    <Trash2 className="h-3 w-3" style={{ color: "hsl(0 84% 60%)" }} />
                  </button>
                </div>
              </div>
              {replyId === t.id && (
                <div className="mt-2 flex gap-2">
                  <textarea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Текст відповіді…" className="flex-1 bg-transparent outline-none text-xs text-white placeholder:text-muted-foreground resize-none border border-white/10 rounded-md px-2 py-1.5" data-testid={`input-reply-${t.id}`} />
                  <Button onClick={() => replyM.mutate({ id: t.id, reply: replyText.trim() })} disabled={!replyText.trim() || replyM.isPending} size="icon" data-testid={`btn-send-reply-${t.id}`}>
                    {replyM.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-3 space-y-2" style={card}>
        <Input placeholder="Тема звернення…" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Опишіть проблему та додайте деталі…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-muted-foreground resize-none border border-white/10 rounded-md px-3 py-2"
          />
          <Button onClick={send} disabled={!text.trim() || sendM.isPending} size="icon">
            {sendM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="rounded-xl p-3 text-xs" style={card}>
        <p style={{ color: DIM }}>
          ❗️ Не надсилайте спам. Додавайте скріни та деталі для швидшого вирішення.
        </p>
      </div>
    </div>
  );
}
