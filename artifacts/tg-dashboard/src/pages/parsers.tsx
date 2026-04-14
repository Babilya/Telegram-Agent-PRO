import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Users, Download, Bug, Search, Crown, Bot,
  Bookmark, BookmarkCheck, Trash2, RefreshCw, ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Member {
  id: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isBot?: boolean;
  isPremium?: boolean;
}

interface Dialog {
  telegramId: string;
  title: string;
  username?: string | null;
  membersCount?: number | null;
  type: string;
  identifier: string;
}

interface SavedContact {
  id: number;
  telegramId: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  phone?: string | null;
  isBot: boolean;
  isPremium: boolean;
  sourceGroup?: string | null;
  createdAt: string;
}

const PAGE_SIZE = 200;

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-[hsl(271_91%_65%/0.5)] focus:outline-none transition-colors placeholder:text-white/30";
const PRI = "hsl(271 91% 65%)";

type TabT = "parse" | "contacts";

export default function Parsers() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabT>("parse");

  // ── Parse tab state ──
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [isLoadingDialogs, setIsLoadingDialogs] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedGroupTitle, setSelectedGroupTitle] = useState<string>("");
  const [limit, setLimit] = useState<string>("500");
  const [filterQuery, setFilterQuery] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseInfo, setParseInfo] = useState<{ group: string; total: number } | null>(null);
  const [isSavingContacts, setIsSavingContacts] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // ── Contacts tab state ──
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsOffset, setContactsOffset] = useState(0);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [contactsFilter, setContactsFilter] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load dialogs on mount
  useEffect(() => {
    fetchDialogs();
  }, []);

  // Load contacts when switching to contacts tab
  useEffect(() => {
    if (activeTab === "contacts") {
      setContacts([]);
      setContactsOffset(0);
      fetchContacts(0, true);
    }
  }, [activeTab]);

  const fetchDialogs = async () => {
    setIsLoadingDialogs(true);
    try {
      const res = await fetch("/api/parse/dialogs?limit=200");
      const data = await res.json();
      if (data.success) setDialogs(data.dialogs ?? []);
      else setDialogs([]);
    } catch {
      setDialogs([]);
    } finally {
      setIsLoadingDialogs(false);
    }
  };

  const fetchContacts = useCallback(async (offset = 0, replace = false) => {
    if (replace) setIsLoadingContacts(true);
    else setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (contactsFilter) params.set("search", contactsFilter);
      const res = await fetch(`/api/contacts?${params}`);
      const data = await res.json();
      const incoming: SavedContact[] = data.contacts ?? [];
      setContactsTotal(data.total ?? 0);
      setContactsOffset(offset + incoming.length);
      setContacts(prev => replace ? incoming : [...prev, ...incoming]);
    } catch {
      if (replace) setContacts([]);
    } finally {
      setIsLoadingContacts(false);
      setIsLoadingMore(false);
    }
  }, [contactsFilter]);

  const handleContactsSearch = () => {
    setContacts([]);
    setContactsOffset(0);
    fetchContacts(0, true);
  };

  const handleParse = async () => {
    if (!selectedGroup) {
      toast({ title: "Оберіть групу", variant: "destructive" });
      return;
    }
    setIsParsing(true);
    setMembers(null);
    setParseError(null);
    setParseInfo(null);
    setSavedCount(null);
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

  const handleSaveContacts = async () => {
    if (!members || members.length === 0) return;
    setIsSavingContacts(true);
    try {
      const res = await fetch("/api/contacts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: members.map(m => ({
            telegramId: String(m.id),
            firstName: m.firstName,
            lastName: m.lastName,
            username: m.username,
            phone: m.phone,
            isBot: m.isBot ?? false,
            isPremium: m.isPremium ?? false,
          })),
          sourceGroup: selectedGroupTitle || selectedGroup,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedCount(data.saved);
        toast({ title: `Збережено ${data.saved} контактів`, description: `з ${data.total} проаналізованих` });
      } else {
        toast({ title: "Помилка збереження", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Помилка", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingContacts(false);
    }
  };

  const handleExportCSV = (data: Member[] | SavedContact[], filename: string) => {
    const isMember = (x: any): x is Member => "id" in x && typeof x.id === "number";
    const header = "id,username,firstName,lastName,phone,isBot,isPremium";
    const rows = data.map((m: any) =>
      [
        isMember(m) ? m.id : m.telegramId,
        m.username ?? "",
        m.firstName ?? "",
        m.lastName ?? "",
        m.phone ?? "",
        m.isBot ? "1" : "0",
        m.isPremium ? "1" : "0",
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV збережено", description: `${data.length} записів.` });
  };

  const handleDeleteAllContacts = async () => {
    setIsDeletingAll(true);
    try {
      await fetch("/api/contacts/all", { method: "DELETE" });
      setContacts([]);
      setContactsTotal(0);
      setContactsOffset(0);
      toast({ title: "Всі контакти видалено" });
    } catch {
      toast({ title: "Помилка видалення", variant: "destructive" });
    } finally {
      setIsDeletingAll(false);
      setShowDeleteDialog(false);
    }
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

  const hasMoreContacts = contacts.length < contactsTotal;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Парсер учасників</h1>
        <p className="text-muted-foreground text-sm">Збір та збереження учасників Telegram-груп.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
        {([["parse", <Bug className="h-3.5 w-3.5" />, "Парсинг"], ["contacts", <Bookmark className="h-3.5 w-3.5" />, `Контакти${contactsTotal ? ` (${contactsTotal})` : contacts.length ? ` (${contacts.length})` : ""}`]] as [TabT, any, string][]).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-display font-semibold transition-all"
            style={{
              background: activeTab === id ? "linear-gradient(135deg, hsl(271 91% 65% / 0.3), hsl(316 90% 62% / 0.2))" : "transparent",
              color: activeTab === id ? "white" : "hsl(258 10% 50%)",
              border: activeTab === id ? "1px solid hsl(271 91% 65% / 0.3)" : "1px solid transparent",
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Parse Tab ── */}
      {activeTab === "parse" && (
        <>
          <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-display font-semibold uppercase tracking-widest text-muted-foreground">Ваші Telegram чати</label>
                <button onClick={fetchDialogs} className="text-muted-foreground hover:text-white transition-colors">
                  <RefreshCw className={`h-3 w-3 ${isLoadingDialogs ? "animate-spin" : ""}`} />
                </button>
              </div>
              {isLoadingDialogs ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Завантаження чатів…</span>
                </div>
              ) : dialogs.length === 0 ? (
                <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground">
                  Немає доступних чатів. Переконайтесь, що Telegram акаунт підключено.
                </div>
              ) : (
                <Select value={selectedGroup} onValueChange={(v) => {
                  setSelectedGroup(v);
                  const d = dialogs.find(d => d.identifier === v);
                  setSelectedGroupTitle(d?.title ?? v);
                }}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder={`Оберіть чат (${dialogs.length} доступно)…`} />
                  </SelectTrigger>
                  <SelectContent>
                    {dialogs.map(d => (
                      <SelectItem key={d.telegramId} value={d.identifier}>
                        <span className="flex items-center gap-2">
                          <span>{d.title}</span>
                          {d.username && <span className="text-muted-foreground font-mono text-[11px]">@{d.username}</span>}
                          {d.membersCount && (
                            <span className="text-muted-foreground text-[11px]">
                              ({new Intl.NumberFormat("uk").format(d.membersCount)})
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-[11px] font-display font-semibold uppercase tracking-widest text-muted-foreground">Ліміт</label>
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
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Парсинг…</>
                  : <><Bug className="h-4 w-4 mr-2" />Запустити</>}
              </Button>
            </div>

            <p className="text-[12px] text-muted-foreground leading-relaxed">
              <strong className="text-white">Важливо:</strong> Парсинг доступний лише для груп де ви є учасником. Великі ліміти можуть тривати кілька хвилин.
            </p>
          </div>

          {parseError && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {parseError}
            </div>
          )}

          {members !== null && (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-display font-bold text-white">
                    Результати <span className="text-primary font-mono">({parseInfo?.total})</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{parseInfo?.group}</p>
                </div>
                <div className="flex gap-2">
                  {savedCount !== null ? (
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "hsl(271 91% 65% / 0.15)", color: PRI }}>
                      <BookmarkCheck className="h-3.5 w-3.5" /> Збережено {savedCount}
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleSaveContacts} disabled={isSavingContacts}>
                      {isSavingContacts
                        ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        : <Bookmark className="h-3.5 w-3.5 mr-1.5" />}
                      Зберегти
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleExportCSV(members!, "members")}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="Фільтр за ім'ям, @username, телефоном…"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                />
              </div>

              {filtered !== null && filtered.length === 0 ? (
                <div className="rounded-2xl border border-border/50 bg-secondary/20 py-8 text-center text-muted-foreground text-sm">
                  Нічого не знайдено.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {(filtered ?? members).map(m => (
                    <MemberRow key={m.id} member={m} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === "contacts" && (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-display font-bold text-white">
              Збережені контакти{contactsTotal > 0 && <span className="text-primary font-mono"> ({contactsTotal})</span>}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setContacts([]); setContactsOffset(0); fetchContacts(0, true); }}>
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingContacts ? "animate-spin" : ""}`} />
              </Button>
              {contacts.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleExportCSV(contacts as any, "contacts")}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
                  </Button>
                  <Button variant="outline" size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteDialog(true)} disabled={isDeletingAll}>
                    {isDeletingAll
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                className={`${inputCls} pl-9`}
                placeholder="Пошук за ім'ям, @username, групою…"
                value={contactsFilter}
                onChange={e => setContactsFilter(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleContactsSearch()}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleContactsSearch} className="h-[42px] shrink-0">
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>

          {isLoadingContacts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-secondary/20 py-12 text-center text-muted-foreground text-sm">
              {contactsTotal === 0
                ? "Збережених контактів немає. Запарсіть групу і натисніть «Зберегти»."
                : "Нічого не знайдено за вашим запитом."}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                {contacts.map(c => (
                  <MemberRow
                    key={c.id}
                    member={{ id: parseInt(c.telegramId) || 0, ...c }}
                    badge={c.sourceGroup ?? undefined}
                  />
                ))}
              </div>

              {hasMoreContacts && (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-center mt-1"
                  onClick={() => fetchContacts(contactsOffset)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore
                    ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    : <ChevronDown className="h-3.5 w-3.5 mr-1.5" />}
                  Завантажити ще ({contactsTotal - contacts.length})
                </Button>
              )}
            </>
          )}
        </>
      )}

      {/* Delete all confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити всі контакти?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотна. Всі {contactsTotal} збережених контактів будуть видалені назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllContacts}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Видалити всі
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MemberRow({ member, badge }: { member: Member; badge?: string }) {
  const PRI = "hsl(271 91% 65%)";
  const ACC = "hsl(316 90% 62%)";
  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/30 px-4 py-2.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
        {member.isBot
          ? <Bot style={{ width: 14, height: 14, color: ACC }} />
          : <Users style={{ width: 14, height: 14, color: PRI }} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[13px] font-semibold text-white truncate">
            {[member.firstName, member.lastName].filter(Boolean).join(" ") || "Без імені"}
          </p>
          {member.isPremium && <Crown style={{ width: 11, height: 11, color: ACC }} />}
          {member.isBot && <span className="text-[10px] text-muted-foreground font-mono">bot</span>}
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              style={{ background: "hsl(271 91% 65% / 0.15)", color: PRI }}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {member.username && <span className="text-[11px] text-muted-foreground font-mono">@{member.username}</span>}
          {member.phone && <span className="text-[11px] text-muted-foreground font-mono">{member.phone}</span>}
        </div>
      </div>

      <span className="text-[10px] text-muted-foreground font-mono shrink-0">#{member.id}</span>
    </div>
  );
}
