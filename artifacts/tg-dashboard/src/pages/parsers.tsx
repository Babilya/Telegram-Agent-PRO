import { useState } from "react";
import { useListGroups, getListGroupsQueryKey } from "@workspace/api-client-react";
import {
  Loader2, Users, Download, Bug, ChevronDown, Search, Crown, Bot,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Member {
  id: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isBot?: boolean;
  isPremium?: boolean;
}

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-[hsl(271_91%_65%/0.5)] focus:outline-none transition-colors placeholder:text-white/30";

export default function Parsers() {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [limit, setLimit] = useState<string>("500");
  const [filterQuery, setFilterQuery] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseInfo, setParseInfo] = useState<{ group: string; total: number } | null>(null);

  const { data: groupsData } = useListGroups(
    { status: "joined" },
    { query: { queryKey: getListGroupsQueryKey({ status: "joined" }) } }
  );

  const handleParse = async () => {
    if (!selectedGroup) {
      toast({ title: "Оберіть групу", variant: "destructive" });
      return;
    }
    setIsParsing(true);
    setMembers(null);
    setParseError(null);
    setParseInfo(null);
    try {
      const res = await fetch(`/api/parse/members?groupUsername=${encodeURIComponent(selectedGroup)}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
        setParseInfo({ group: selectedGroup, total: data.total });
      } else {
        setParseError(data.message ?? "Помилка парсингу");
      }
    } catch (e: any) {
      setParseError(e.message ?? "Помилка з'єднання");
    } finally {
      setIsParsing(false);
    }
  };

  const handleExportCSV = () => {
    if (!members) return;
    const header = "id,username,firstName,lastName,phone,isBot,isPremium";
    const rows = members.map(m =>
      [m.id, m.username ?? "", m.firstName ?? "", m.lastName ?? "", m.phone ?? "", m.isBot ? "1" : "0", m.isPremium ? "1" : "0"].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_${selectedGroup}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV збережено", description: `${members.length} учасників експортовано.` });
  };

  const filtered = members
    ? members.filter(m => {
        if (!filterQuery) return true;
        const q = filterQuery.toLowerCase();
        return (
          m.username?.toLowerCase().includes(q) ||
          m.firstName?.toLowerCase().includes(q) ||
          m.lastName?.toLowerCase().includes(q) ||
          m.phone?.includes(q)
        );
      })
    : null;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Парсер учасників</h1>
        <p className="text-muted-foreground text-sm">Збір учасників з Telegram-груп де ви є членом.</p>
      </div>

      {/* Config */}
      <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-display font-semibold uppercase tracking-widest text-muted-foreground">Група</label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Оберіть вступлену групу…" />
            </SelectTrigger>
            <SelectContent>
              {!groupsData?.groups?.length ? (
                <SelectItem value="__empty__" disabled>Немає вступлених груп</SelectItem>
              ) : (
                groupsData.groups.map(g => (
                  <SelectItem key={g.id} value={g.username ?? g.telegramId}>
                    {g.title} {g.username ? `(@${g.username})` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-display font-semibold uppercase tracking-widest text-muted-foreground">Ліміт учасників</label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 учасників</SelectItem>
                <SelectItem value="500">500 учасників</SelectItem>
                <SelectItem value="1000">1 000 учасників</SelectItem>
                <SelectItem value="5000">5 000 учасників</SelectItem>
                <SelectItem value="10000">10 000 учасників</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleParse} disabled={isParsing || !selectedGroup} className="h-10 px-5">
            {isParsing
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Парсинг…</>
              : <><Bug className="h-4 w-4 mr-2" /> Запустити</>}
          </Button>
        </div>

        <div className="rounded-xl bg-white/4 border border-white/6 px-3 py-2.5 text-[12px] text-muted-foreground leading-relaxed">
          <strong className="text-white">Важливо:</strong> Парсинг доступний лише для груп де ви є учасником. Для каналів потрібні права адміна. Великі ліміти можуть тривати кілька хвилин.
        </div>
      </div>

      {/* Error */}
      {parseError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {parseError}
        </div>
      )}

      {/* Results */}
      {members !== null && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-display font-bold text-white">
                Результати <span className="text-primary font-mono">({parseInfo?.total})</span>
              </p>
              <p className="text-[11px] text-muted-foreground">{parseInfo?.group}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
          </div>

          {/* Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Пошук за ім'ям, @username, телефоном…"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
            />
          </div>

          {filtered !== null && filtered.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-secondary/20 py-8 text-center text-muted-foreground text-sm">
              Нічого не знайдено за вашим запитом.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {(filtered ?? members).map((m) => (
                <div key={m.id} className="rounded-2xl border border-border/50 bg-secondary/30 px-4 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
                    {m.isBot
                      ? <Bot style={{ width: 14, height: 14, color: "hsl(316 90% 62%)" }} />
                      : <Users style={{ width: 14, height: 14, color: "hsl(271 91% 65%)" }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-white truncate">
                        {[m.firstName, m.lastName].filter(Boolean).join(" ") || "Без імені"}
                      </p>
                      {m.isPremium && <Crown style={{ width: 11, height: 11, color: "hsl(316 90% 62%)" }} />}
                      {m.isBot && <span className="text-[10px] text-muted-foreground font-mono">bot</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {m.username && (
                        <span className="text-[11px] text-muted-foreground font-mono">@{m.username}</span>
                      )}
                      {m.phone && (
                        <span className="text-[11px] text-muted-foreground font-mono">{m.phone}</span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">#{m.id}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
