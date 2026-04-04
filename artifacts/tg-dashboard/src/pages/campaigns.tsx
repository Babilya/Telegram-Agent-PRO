import { Link } from "wouter";
import {
  useListCampaigns,
  getListCampaignsQueryKey,
  useStartCampaign,
  usePauseCampaign,
  useDeleteCampaign
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Edit, Trash2, Loader2, Activity, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const scheduleLabel = (type: string, interval?: number | null) => {
  const map: Record<string, string> = {
    once: "Один раз", hourly: "Щогодини", every2h: "Кожні 2 год",
    every4h: "Кожні 4 год", every8h: "Кожні 8 год",
    every12h: "Кожні 12 год", daily: "Щодня",
    custom: `Кожні ${interval || "?"} год`,
  };
  return map[type] || type;
};

const statusColor: Record<string, string> = {
  active: "hsl(271 91% 65%)", paused: "hsl(258 15% 52%)",
  completed: "hsl(142 71% 45%)", draft: "hsl(258 15% 40%)",
};
const statusLabel: Record<string, string> = {
  active: "Активна", paused: "Пауза", completed: "Завершена", draft: "Чернетка",
};

export default function Campaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useListCampaigns({ query: { queryKey: getListCampaignsQueryKey() } });
  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const deleteCampaign = useDeleteCampaign();

  const handleStart = (id: number) => {
    startCampaign.mutate({ data: { id } }, {
      onSuccess: () => { toast({ title: "Кампанію запущено" }); queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }); },
    });
  };
  const handlePause = (id: number) => {
    pauseCampaign.mutate({ data: { id } }, {
      onSuccess: () => { toast({ title: "Кампанію призупинено" }); queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }); },
    });
  };
  const handleDelete = (id: number) => {
    if (!confirm("Видалити кампанію?")) return;
    deleteCampaign.mutate({ data: { id } }, {
      onSuccess: () => { toast({ title: "Видалено" }); queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }); },
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Кампанії</h1>
          <p className="text-muted-foreground text-sm">Керуйте автоматичними розсилками.</p>
        </div>
        <Link href="/campaigns/new">
          <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Нова</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data?.campaigns?.length ? (
        <div className="rounded-2xl border border-border/50 bg-secondary/20 py-12 text-center text-muted-foreground text-sm">
          Кампаній немає. Створіть першу для розсилки.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.campaigns.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/50 bg-secondary/30 px-4 py-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-[15px] text-white truncate">{c.name}</p>
                  <p className="text-[12px] text-muted-foreground truncate mt-0.5">{c.message}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {c.status === "active" ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePause(c.id)} disabled={pauseCampaign.isPending}>
                      <Pause className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStart(c.id)} disabled={startCampaign.isPending}>
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Link href={`/campaigns/${c.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(c.id)} disabled={deleteCampaign.isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${statusColor[c.status]}18`, color: statusColor[c.status] }}>
                  {c.status === "active" && <Activity className="h-3 w-3 animate-pulse" />}
                  {statusLabel[c.status] || c.status}
                </span>

                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {scheduleLabel(c.scheduleType, c.intervalHours)}
                </span>

                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Send className="h-3 w-3" />
                  <span className="text-primary font-mono">{c.sentCount}</span>
                  <span className="opacity-40">/</span>
                  <span className="text-destructive font-mono">{c.failCount}</span>
                </span>

                {c.lastRunAt && (
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.lastRunAt), { addSuffix: true, locale: uk })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
