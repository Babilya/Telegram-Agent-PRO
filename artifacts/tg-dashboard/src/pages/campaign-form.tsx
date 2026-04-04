import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateCampaign,
  useGetCampaign,
  getGetCampaignQueryKey,
  useUpdateCampaign,
  useListGroups,
  getListGroupsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateCampaignBodyScheduleType } from "@workspace/api-zod/src/generated/types";

const scheduleTypes = [
  { value: "once",     label: "Один раз" },
  { value: "hourly",   label: "Щогодини" },
  { value: "every2h",  label: "Кожні 2 год" },
  { value: "every4h",  label: "Кожні 4 год" },
  { value: "every8h",  label: "Кожні 8 год" },
  { value: "every12h", label: "Кожні 12 год" },
  { value: "daily",    label: "Щодня" },
  { value: "custom",   label: "Довільний інтервал" },
] as const;

const formSchema = z.object({
  name: z.string().min(1, "Введіть назву кампанії"),
  message: z.string().min(1, "Введіть текст повідомлення"),
  scheduleType: z.enum(["once", "hourly", "every2h", "every4h", "every8h", "every12h", "daily", "custom"]),
  intervalHours: z.string().optional(),
  targetGroupIds: z.array(z.number()).min(1, "Оберіть хоча б одну групу"),
});

export default function CampaignForm() {
  const { id } = useParams<{ id?: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEdit = !!id;
  const campaignId = isEdit ? parseInt(id) : undefined;

  const { data: groupsData, isLoading: isLoadingGroups } = useListGroups({ status: "joined" }, {
    query: { queryKey: getListGroupsQueryKey({ status: "joined" }) }
  });

  const { data: campaign, isLoading: isLoadingCampaign } = useGetCampaign(campaignId!, {
    query: {
      enabled: isEdit && !!campaignId,
      queryKey: getGetCampaignQueryKey(campaignId!),
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", message: "", scheduleType: "once", intervalHours: "", targetGroupIds: [],
    },
  });

  useEffect(() => {
    if (isEdit && campaign) {
      form.reset({
        name: campaign.name,
        message: campaign.message,
        scheduleType: campaign.scheduleType as any,
        intervalHours: campaign.intervalHours ? campaign.intervalHours.toString() : "",
        targetGroupIds: campaign.targetGroupIds,
      });
    }
  }, [isEdit, campaign, form]);

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      name: values.name,
      message: values.message,
      scheduleType: values.scheduleType as CreateCampaignBodyScheduleType,
      intervalHours: values.scheduleType === "custom" && values.intervalHours
        ? parseInt(values.intervalHours)
        : undefined,
      targetGroupIds: values.targetGroupIds,
    };

    if (isEdit) {
      updateCampaign.mutate({ data: { id: campaignId!, ...payload } }, {
        onSuccess: () => {
          toast({ title: "Кампанію оновлено" });
          queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId!) });
          setLocation("/campaigns");
        },
        onError: (err: any) => toast({ title: "Помилка оновлення", description: err.message, variant: "destructive" }),
      });
    } else {
      createCampaign.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Кампанію створено" });
          setLocation("/campaigns");
        },
        onError: (err: any) => toast({ title: "Помилка створення", description: err.message, variant: "destructive" }),
      });
    }
  };

  const isSaving = createCampaign.isPending || updateCampaign.isPending;
  const isLoading = isLoadingGroups || (isEdit && isLoadingCampaign);
  const selectedScheduleType = form.watch("scheduleType");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation("/campaigns")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">
            {isEdit ? "Редагування кампанії" : "Нова кампанія"}
          </h1>
          <p className="text-muted-foreground text-sm">Налаштуйте параметри розсилки.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-display">Основні параметри</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <FormField control={form.control} name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Назва кампанії</FormLabel>
                    <FormControl>
                      <Input placeholder="Щоденна акція — Ранок" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Текст повідомлення</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Введіть текст, який буде надсилатись у групи…"
                        className="min-h-[120px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="scheduleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Розклад</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {scheduleTypes.map(st => (
                            <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedScheduleType === "custom" && (
                  <FormField control={form.control} name="intervalHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Інтервал (год)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="48" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-display">Цільові групи</CardTitle>
              <p className="text-xs text-muted-foreground">Оберіть групи, куди надсилати повідомлення.</p>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <FormField control={form.control} name="targetGroupIds"
                render={() => (
                  <FormItem>
                    <div className="max-h-56 overflow-y-auto border border-border rounded-xl p-2 space-y-1">
                      {!groupsData?.groups?.length ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          Немає вступлених груп. Спочатку вступіть у групи.
                        </div>
                      ) : (
                        groupsData.groups.map(group => (
                          <FormField key={group.id} control={form.control} name="targetGroupIds"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg p-2 hover:bg-secondary/50 cursor-pointer">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(group.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, group.id])
                                        : field.onChange(field.value?.filter(v => v !== group.id));
                                    }}
                                  />
                                </FormControl>
                                <div className="leading-none">
                                  <FormLabel className="cursor-pointer font-medium text-sm">{group.title}</FormLabel>
                                  {group.username && (
                                    <p className="text-xs text-muted-foreground font-mono">@{group.username}</p>
                                  )}
                                </div>
                              </FormItem>
                            )}
                          />
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Save className="mr-2 h-4 w-4" />}
            {isEdit ? "Зберегти зміни" : "Створити кампанію"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
