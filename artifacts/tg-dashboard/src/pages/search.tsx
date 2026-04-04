import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useSearchGroups,
  getSearchGroupsQueryKey,
  useSaveGroup,
  useJoinGroups
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search as SearchIcon, Save, LogIn, Loader2, Users, ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchGroupsGroupType, TelegramGroup } from "@workspace/api-zod/src/generated/types";

const searchSchema = z.object({
  query: z.string().min(1, "Введіть пошуковий запит"),
  minMembers: z.string().optional(),
  maxMembers: z.string().optional(),
  groupType: z.enum(["all", "group", "channel", "supergroup"]).optional(),
});

const typeLabel: Record<string, string> = {
  group: "Група", supergroup: "Супергрупа", channel: "Канал",
};
const typeColor: Record<string, string> = {
  group: "hsl(142 71% 45%)", supergroup: "hsl(271 91% 65%)", channel: "hsl(316 90% 62%)",
};

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-[hsl(271_91%_65%/0.5)] focus:outline-none transition-colors placeholder:text-white/30";

export default function Search() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<{
    query?: string; minMembers?: number; maxMembers?: number;
    groupType?: SearchGroupsGroupType;
  } | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "", minMembers: "", maxMembers: "", groupType: "all" },
  });

  const { data, isLoading } = useSearchGroups(searchParams || {}, {
    query: {
      enabled: !!searchParams?.query,
      queryKey: getSearchGroupsQueryKey(searchParams || {}),
    }
  });

  const saveGroup = useSaveGroup();
  const joinGroups = useJoinGroups();

  const onSubmit = (values: z.infer<typeof searchSchema>) => {
    setSavedIds(new Set());
    setSearchParams({
      query: values.query,
      minMembers: values.minMembers ? parseInt(values.minMembers) : undefined,
      maxMembers: values.maxMembers ? parseInt(values.maxMembers) : undefined,
      groupType: values.groupType === "all" ? undefined : (values.groupType as SearchGroupsGroupType),
    });
  };

  const handleSave = (group: TelegramGroup) => {
    saveGroup.mutate({
      data: {
        telegramId: group.id.toString(), title: group.title,
        username: group.username, membersCount: group.membersCount, type: group.type,
      }
    }, {
      onSuccess: () => {
        setSavedIds(prev => new Set([...prev, group.id.toString()]));
        toast({ title: "Збережено", description: `${group.title} додано до груп.` });
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };

  const handleJoinAndSave = (group: TelegramGroup) => {
    saveGroup.mutate({
      data: {
        telegramId: group.id.toString(), title: group.title,
        username: group.username, membersCount: group.membersCount, type: group.type,
      }
    }, {
      onSuccess: (savedGroup) => {
        setSavedIds(prev => new Set([...prev, group.id.toString()]));
        joinGroups.mutate({ data: { groupIds: [savedGroup.id] } }, {
          onSuccess: () => toast({ title: "Вступ у чергу", description: `Запит на вступ до ${group.title} надіслано.` }),
          onError: (err: any) => toast({ title: "Помилка вступу", description: err.message, variant: "destructive" }),
        });
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Пошук груп</h1>
        <p className="text-muted-foreground text-sm">Знаходьте Telegram-групи за ключовими словами.</p>
      </div>

      {/* Search form */}
      <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <FormField control={form.control} name="query"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <input className={inputCls} placeholder="крипто, маркетинг, бізнес…" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} size="sm" className="h-10 shrink-0">
                {isLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <SearchIcon className="h-4 w-4" />}
                <span className="ml-1.5 hidden sm:inline">Знайти</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <FormField control={form.control} name="groupType"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Всі типи</SelectItem>
                        <SelectItem value="group">Група</SelectItem>
                        <SelectItem value="supergroup">Супергрупа</SelectItem>
                        <SelectItem value="channel">Канал</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="minMembers"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <input className={inputCls} type="number" placeholder="Від учасників" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="maxMembers"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <input className={inputCls} type="number" placeholder="До учасників" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>

      {/* Results */}
      <div>
        {data && (
          <p className="text-[12px] text-muted-foreground mb-2">
            Результатів: <span className="text-white font-semibold">{data.total}</span>
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !data?.results?.length ? (
          <div className="rounded-2xl border border-border/50 bg-secondary/20 py-12 text-center text-muted-foreground text-sm">
            {searchParams?.query ? "Групи не знайдено. Спробуйте інший запит." : "Введіть запит для пошуку груп."}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.results.map((group) => {
              const isSaved = savedIds.has(group.id.toString());
              return (
                <div key={group.id} className="rounded-2xl border border-border/50 bg-secondary/30 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold text-[14px] text-white truncate">{group.title}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: `${typeColor[group.type] ?? "hsl(258 15% 40%)"}18`, color: typeColor[group.type] ?? "hsl(258 15% 60%)" }}>
                        {typeLabel[group.type] || group.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {group.username && (
                        <span className="text-[11px] text-muted-foreground font-mono">@{group.username}</span>
                      )}
                      {group.membersCount && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {new Intl.NumberFormat("uk").format(group.membersCount)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {group.username && (
                      <a href={`https://t.me/${group.username}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                    {isSaved ? (
                      <span className="text-[11px] text-primary font-semibold px-2">✓ Збережено</span>
                    ) : (
                      <>
                        <Button variant="outline" size="icon" className="h-8 w-8"
                          onClick={() => handleSave(group)} disabled={saveGroup.isPending}>
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" className="h-8"
                          onClick={() => handleJoinAndSave(group)}
                          disabled={joinGroups.isPending || saveGroup.isPending}>
                          <LogIn className="h-3.5 w-3.5 mr-1" /> Вступ
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
