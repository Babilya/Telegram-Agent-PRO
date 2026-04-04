import { useState } from "react";
import {
  useListGroups, getListGroupsQueryKey, useJoinGroups, useDeleteGroup,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, Trash2, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListGroupsStatus } from "@workspace/api-zod/src/generated/types";

const statusColor: Record<string, string> = {
  joined:  "hsl(142 71% 45%)",
  failed:  "hsl(0 85% 60%)",
  pending: "hsl(271 91% 65%)",
  saved:   "hsl(258 15% 52%)",
};
const statusLabel: Record<string, string> = {
  saved: "Збережено", pending: "Очікує", joined: "Вступлено", failed: "Помилка",
};
const typeLabel: Record<string, string> = {
  group: "Група", supergroup: "Супергрупа", channel: "Канал",
};

export default function Groups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ListGroupsStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useListGroups(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { query: { queryKey: getListGroupsQueryKey({ status: statusFilter === "all" ? undefined : statusFilter }) } }
  );

  const joinGroups = useJoinGroups();
  const deleteGroup = useDeleteGroup();

  const toggleSelectAll = () => {
    if (!data?.groups) return;
    if (selectedIds.size === data.groups.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(data.groups.map(g => g.id)));
  };
  const toggleSelect = (id: number) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };
  const handleBulkJoin = () => {
    if (!selectedIds.size) return;
    joinGroups.mutate({ data: { groupIds: Array.from(selectedIds) } }, {
      onSuccess: () => {
        toast({ title: "Вступ у чергу", description: `Запит на вступ до ${selectedIds.size} груп надіслано.` });
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ status: statusFilter === "all" ? undefined : statusFilter }) });
        setSelectedIds(new Set());
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };
  const handleDelete = (id: number) => {
    deleteGroup.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Видалено" });
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ status: statusFilter === "all" ? undefined : statusFilter }) });
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Збережені групи</h1>
        <p className="text-muted-foreground text-sm">Керуйте списком цільових Telegram-груп.</p>
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ListGroupsStatus)}>
          <SelectTrigger className="flex-1 h-9 text-sm">
            <SelectValue placeholder="Фільтр" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі</SelectItem>
            <SelectItem value="saved">Збережені</SelectItem>
            <SelectItem value="pending">Очікує вступу</SelectItem>
            <SelectItem value="joined">Вступлено</SelectItem>
            <SelectItem value="failed">Помилка</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" disabled={!selectedIds.size || joinGroups.isPending} onClick={handleBulkJoin}>
          {joinGroups.isPending
            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            : <LogIn className="h-3.5 w-3.5 mr-1.5" />}
          Вступити ({selectedIds.size})
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data?.groups?.length ? (
        <div className="rounded-2xl border border-border/50 bg-secondary/20 py-12 text-center text-muted-foreground text-sm">
          Груп не знайдено. Використайте пошук для додавання.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.groups.length > 1 && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-secondary/20 border border-border/30">
              <Checkbox
                checked={selectedIds.size === data.groups.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-[12px] text-muted-foreground">
                {selectedIds.size > 0 ? `Вибрано: ${selectedIds.size}` : "Вибрати всі"}
              </span>
            </div>
          )}

          {data.groups.map((g) => (
            <div key={g.id}
              className="rounded-2xl border bg-secondary/30 px-4 py-3 flex items-center gap-3 transition-colors"
              style={{ borderColor: selectedIds.has(g.id) ? "hsl(271 91% 65% / 0.40)" : "hsl(var(--border) / 0.5)" }}>
              <Checkbox
                checked={selectedIds.has(g.id)}
                onCheckedChange={() => toggleSelect(g.id)}
              />

              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-[14px] text-white truncate">{g.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {g.username ? `@${g.username}` : String(g.telegramId)}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-40">·</span>
                  <span className="text-[11px] text-muted-foreground">{typeLabel[g.type] || g.type}</span>
                  {g.membersCount ? (
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {new Intl.NumberFormat("uk").format(g.membersCount)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${statusColor[g.status]}18`, color: statusColor[g.status] }}>
                  {statusLabel[g.status] || g.status}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(g.id)} disabled={deleteGroup.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
