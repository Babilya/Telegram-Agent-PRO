import { useState } from "react";
import {
  useListGroups, getListGroupsQueryKey, useJoinGroups, useDeleteGroup,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, Trash2, Loader2, Users, Upload, X, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const DELAY_OPTIONS = [
  { value: "2", label: "2 сек" },
  { value: "5", label: "5 сек" },
  { value: "10", label: "10 сек" },
  { value: "30", label: "30 сек" },
  { value: "60", label: "1 хв" },
  { value: "120", label: "2 хв" },
];

export default function Groups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ListGroupsStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [joinDelay, setJoinDelay] = useState("5");

  const qKey = getListGroupsQueryKey({ status: statusFilter === "all" ? undefined : statusFilter });
  const { data, isLoading, refetch } = useListGroups(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { query: { queryKey: qKey, refetchInterval: 10000 } }
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
    joinGroups.mutate({ data: { groupIds: Array.from(selectedIds), delaySeconds: parseInt(joinDelay) } }, {
      onSuccess: () => {
        toast({ title: "Вступ запущено", description: `${selectedIds.size} груп поставлено у чергу (затримка ${joinDelay}с між кожним).` });
        queryClient.invalidateQueries({ queryKey: qKey });
        setSelectedIds(new Set());
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteGroup.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Видалено" });
        queryClient.invalidateQueries({ queryKey: qKey });
        setSelectedIds(s => { const n = new Set(s); n.delete(id); return n; });
      },
    });
  };

  const handleBulkImport = async () => {
    const lines = importText.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) {
      toast({ title: "Введіть хоча б один @username або посилання", variant: "destructive" });
      return;
    }
    setIsImporting(true);
    try {
      const res = await fetch("/api/parse/import-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: lines }),
      });
      const data = await res.json();

      if (data.success) {
        const saved = data.savedToDb ?? data.imported?.length ?? 0;
        const failed = data.failed?.length ?? 0;
        toast({
          title: `Імпортовано ${saved} груп`,
          description: failed ? `Помилки: ${failed} (приватні або неіснуючі групи)` : "Всі успішно додано",
        });
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({}) });
        setImportText("");
        setShowImport(false);
      } else {
        toast({ title: "Помилка імпорту", description: data.message ?? "Не вдалося знайти групи", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Помилка з'єднання", description: e.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const groups = data?.groups ?? [];
  const joinedCount = groups.filter(g => g.status === "joined").length;
  const pendingCount = groups.filter(g => g.status === "pending").length;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Збережені групи</h1>
          <p className="text-muted-foreground text-sm">Керуйте списком цільових Telegram-груп.</p>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => refetch()}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats row */}
      {groups.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Всього", value: groups.length, color: "hsl(258 15% 52%)" },
            { label: "Вступлено", value: joinedCount, color: "hsl(142 71% 45%)" },
            { label: "Очікує", value: pendingCount, color: "hsl(271 91% 65%)" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-center">
              <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ListGroupsStatus)}>
          <SelectTrigger className="flex-1 min-w-[90px] h-9 text-sm">
            <SelectValue placeholder="Фільтр" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі</SelectItem>
            <SelectItem value="saved">Збережені</SelectItem>
            <SelectItem value="pending">Очікує</SelectItem>
            <SelectItem value="joined">Вступлено</SelectItem>
            <SelectItem value="failed">Помилка</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => setShowImport(v => !v)}>
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Імпорт
          {showImport ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
      </div>

      {/* Join controls — only show when items selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-2xl border border-primary/30 bg-primary/5 flex-wrap">
          <span className="text-[12px] font-display font-bold text-white flex-1">
            Вибрано: {selectedIds.size}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground shrink-0">Затримка:</span>
            <Select value={joinDelay} onValueChange={setJoinDelay}>
              <SelectTrigger className="h-7 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELAY_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" disabled={joinGroups.isPending} onClick={handleBulkJoin} className="h-8">
            {joinGroups.isPending
              ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              : <LogIn className="h-3.5 w-3.5 mr-1.5" />}
            Вступити
          </Button>
        </div>
      )}

      {/* Bulk import panel */}
      {showImport && (
        <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-display font-bold text-white">Масовий імпорт груп</p>
            <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Вставте @username, t.me/посилання або telegram_id — по одному на рядок або через кому.
          </p>
          <textarea
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-[hsl(271_91%_65%/0.5)] focus:outline-none transition-colors placeholder:text-white/30 resize-none font-mono"
            rows={5}
            placeholder={"@crypto_ua\nhttps://t.me/marketing_hub\nbusiness_group"}
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Telegram акаунт має бути підключений для вирішення username-ів через API.
          </p>
          <Button onClick={handleBulkImport} disabled={isImporting || !importText.trim()} className="self-end">
            {isImporting
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Імпорт…</>
              : <><Upload className="h-4 w-4 mr-2" />Імпортувати</>}
          </Button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !groups.length ? (
        <div className="rounded-2xl border border-border/50 bg-secondary/20 py-12 text-center text-muted-foreground text-sm">
          Груп не знайдено. Використайте пошук або імпорт для додавання.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.length > 1 && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-secondary/20 border border-border/30">
              <Checkbox
                checked={selectedIds.size === groups.length && groups.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-[12px] text-muted-foreground">
                {selectedIds.size > 0 ? `Вибрано: ${selectedIds.size}` : "Вибрати всі"}
              </span>
            </div>
          )}

          {groups.map((g) => (
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
                  {g.status === "pending" && <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />}
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
