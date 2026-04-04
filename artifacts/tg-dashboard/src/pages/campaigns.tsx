import { Link } from "wouter";
import {
  useListCampaigns,
  getListCampaignsQueryKey,
  useStartCampaign,
  usePauseCampaign,
  useDeleteCampaign
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Edit, Trash2, Loader2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const scheduleLabel = (type: string, interval?: number | null) => {
  const map: Record<string, string> = {
    once: "Один раз",
    hourly: "Щогодини",
    every2h: "Кожні 2 год",
    every4h: "Кожні 4 год",
    every8h: "Кожні 8 год",
    every12h: "Кожні 12 год",
    daily: "Щодня",
    custom: `Кожні ${interval || "?"} год`,
  };
  return map[type] || type;
};

const statusLabel: Record<string, string> = {
  active: "Активна", paused: "Пауза", completed: "Завершена", draft: "Чернетка",
};

export default function Campaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListCampaigns({
    query: { queryKey: getListCampaignsQueryKey() },
  });

  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const deleteCampaign = useDeleteCampaign();

  const handleStart = (id: number) => {
    startCampaign.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Кампанію запущено", description: "Розсилка активна." });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      },
    });
  };

  const handlePause = (id: number) => {
    pauseCampaign.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Кампанію призупинено" });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Видалити кампанію?")) return;
    deleteCampaign.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Видалено", description: "Кампанію видалено." });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      },
    });
  };

  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Кампанії</h1>
          <p className="text-muted-foreground text-sm">Керуйте автоматичними розсилками.</p>
        </div>
        <Link href="/campaigns/new">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Нова
          </Button>
        </Link>
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Назва</TableHead>
              <TableHead>Розклад</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Надіслано / Помилки</TableHead>
              <TableHead className="text-right">Останній запуск</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : !data?.campaigns?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                  Кампаній немає. Створіть першу для розсилки.
                </TableCell>
              </TableRow>
            ) : (
              data.campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{campaign.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[160px]" title={campaign.message}>
                      {campaign.message}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {scheduleLabel(campaign.scheduleType, campaign.intervalHours)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      campaign.status === "active" ? "default" :
                      campaign.status === "paused" ? "secondary" :
                      campaign.status === "completed" ? "outline" : "secondary"
                    } className="text-[10px] tracking-wider font-mono">
                      {campaign.status === "active" && <Activity className="w-3 h-3 mr-1 inline animate-pulse" />}
                      {statusLabel[campaign.status] || campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span className="text-primary">{campaign.sentCount}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-destructive">{campaign.failCount}</span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {campaign.lastRunAt
                      ? formatDistanceToNow(new Date(campaign.lastRunAt), { addSuffix: true, locale: uk })
                      : "Не запускалась"}
                    {campaign.nextRunAt && campaign.status === "active" && (
                      <div className="text-[10px] opacity-60">
                        Далі: {formatDistanceToNow(new Date(campaign.nextRunAt), { locale: uk })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {campaign.status === "active" ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => handlePause(campaign.id)} disabled={pauseCampaign.isPending}>
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => handleStart(campaign.id)} disabled={startCampaign.isPending}>
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Link href={`/campaigns/${campaign.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(campaign.id)} disabled={deleteCampaign.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
