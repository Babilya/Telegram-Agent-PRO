import { useState } from "react";
import {
  useListGroups,
  getListGroupsQueryKey,
  useJoinGroups,
  useDeleteGroup
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListGroupsStatus } from "@workspace/api-zod/src/generated/types";

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
        toast({ title: "Видалено", description: "Групу видалено зі списку." });
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ status: statusFilter === "all" ? undefined : statusFilter }) });
      },
    });
  };

  return (
    <div className="space-y-4 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Збережені групи</h1>
          <p className="text-muted-foreground text-sm">Керуйте списком цільових Telegram-груп.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ListGroupsStatus)}>
            <SelectTrigger className="w-36 h-9 text-sm">
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
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={!!data?.groups?.length && selectedIds.size === data.groups.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Учасники</TableHead>
              <TableHead className="text-right">Додано</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : !data?.groups?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                  Груп не знайдено. Використайте пошук для додавання.
                </TableCell>
              </TableRow>
            ) : (
              data.groups.map((group) => (
                <TableRow key={group.id} className={selectedIds.has(group.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(group.id)}
                      onCheckedChange={() => toggleSelect(group.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{group.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {group.username ? `@${group.username}` : group.telegramId}
                      <span className="opacity-40 mx-1">·</span>
                      {typeLabel[group.type] || group.type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      group.status === "joined" ? "default" :
                      group.status === "failed" ? "destructive" :
                      group.status === "pending" ? "secondary" : "outline"
                    } className="text-[10px] font-mono tracking-wider">
                      {statusLabel[group.status] || group.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {group.membersCount ? new Intl.NumberFormat("uk").format(group.membersCount) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true, locale: uk })}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"
                      onClick={() => handleDelete(group.id)}
                      disabled={deleteGroup.isPending}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
