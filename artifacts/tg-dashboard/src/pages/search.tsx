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
import { Search as SearchIcon, Save, LogIn, Loader2, Users, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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

export default function Search() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<{
    query?: string;
    minMembers?: number;
    maxMembers?: number;
    groupType?: SearchGroupsGroupType;
  } | null>(null);

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
        telegramId: group.id.toString(),
        title: group.title,
        username: group.username,
        membersCount: group.membersCount,
        type: group.type,
      }
    }, {
      onSuccess: () => toast({ title: "Збережено", description: `${group.title} додано до груп.` }),
      onError: (err: any) => toast({ title: "Помилка збереження", description: err.message, variant: "destructive" }),
    });
  };

  const handleJoinAndSave = (group: TelegramGroup) => {
    saveGroup.mutate({
      data: {
        telegramId: group.id.toString(),
        title: group.title,
        username: group.username,
        membersCount: group.membersCount,
        type: group.type,
      }
    }, {
      onSuccess: (savedGroup) => {
        joinGroups.mutate({ data: { groupIds: [savedGroup.id] } }, {
          onSuccess: () => toast({ title: "Вступ у чергу", description: `Запит на вступ до ${group.title} надіслано.` }),
          onError: (err: any) => toast({ title: "Помилка вступу", description: err.message, variant: "destructive" }),
        });
      },
      onError: (err: any) => toast({ title: "Помилка", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Пошук груп</h1>
        <p className="text-muted-foreground text-sm">Знаходьте нові Telegram-групи за ключовими словами.</p>
      </div>

      <Card className="border-border">
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="flex gap-2 items-end">
                <FormField control={form.control} name="query"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Ключове слово</FormLabel>
                      <FormControl>
                        <Input placeholder="крипто, маркетинг, бізнес…" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="groupType"
                  render={({ field }) => (
                    <FormItem className="w-36">
                      <FormLabel className="text-xs">Тип</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Всі" />
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
              </div>

              <div className="flex gap-2 items-end">
                <FormField control={form.control} name="minMembers"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Мін. учасників</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="maxMembers"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Макс. учасників</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Без ліміту" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="pb-0.5">
                  <Button type="submit" disabled={isLoading} size="sm" className="h-9">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                    <span className="ml-1.5">Знайти</span>
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-display font-bold tracking-tight">
            Результати {data && <span className="text-muted-foreground font-normal">({data.total})</span>}
          </h2>
        </div>
        <Card className="border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>Назва</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Учасники</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !data?.results?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                    {searchParams?.query ? "Групи не знайдено." : "Введіть запит для пошуку груп."}
                  </TableCell>
                </TableRow>
              ) : (
                data.results.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{group.title}</div>
                      {group.username && (
                        <div className="text-xs text-muted-foreground font-mono">@{group.username}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-mono">
                        {typeLabel[group.type] || group.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {group.membersCount ? new Intl.NumberFormat("uk").format(group.membersCount) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm"
                          onClick={() => handleSave(group)}
                          disabled={saveGroup.isPending}>
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm"
                          onClick={() => handleJoinAndSave(group)}
                          disabled={joinGroups.isPending || saveGroup.isPending}>
                          <LogIn className="h-3.5 w-3.5 mr-1" /> Вступ
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
    </div>
  );
}
