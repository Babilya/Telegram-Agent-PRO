import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm, useWatch } from "react-hook-form";
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

// NF-02: intervalHours required when scheduleType is "custom"
const formSchema = z.object({
  name: z.string().min(1, "Введіть назву кампанії"),
  message: z.string().min(1, "Введіть текст повідомлення"),
  scheduleType: z.enum(["once", "hourly", "every2h", "every4h", "every8h", "every12h", "daily", "custom"]),
  intervalHours: z.string().optional(),
  targetGroupIds: z.array(z.number()).min(1, "Оберіть хоча б одну групу"),
}).superRefine((data, ctx) => {
  if (data.scheduleType === "custom") {
    const val = parseInt(data.intervalHours ?? "");
    if (isNaN(val) || val < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Вкажіть інтервал (мінімум 1 год) для довільного розкладу",
        path: ["intervalHours"],
      });
    }
  }
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
        // T-05: Ensure targetGroupIds is always an array, never null
        targetGroupIds: Array.isArray(campaign.targetGroupIds) ? campaign.targetGroupIds : [],
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

  // B-10: Watch targetGroupIds at top level to avoid nested FormField conflicts
  const selectedGroupIds = useWatch({ control: form.control, name: "targetGroupIds" }) ?? [];

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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs">Текст повідомлення</FormLabel>
                      <span className={`text-[11px] font-mono ${field.value?.length > 4000 ? "text-destructive" : field.value?.length > 3000 ? "text-yellow-500" : "text-muted-foreground"}`}>
                        {field.value?.length ?? 0} / 4096
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Введіть текст, який буде надсилатись у групи…"
                        className="min-h-[140px] font-mono text-sm"
                        maxLength={4096}
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
                        <FormLabel className="text-xs">Інтервал (год) *</FormLabel>
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
              {/* B-10: Removed nested FormField with same name. Use direct form.setValue for checkboxes. */}
              <div className="max-h-56 overflow-y-auto border border-border rounded-xl p-2 space-y-1">
                {!groupsData?.groups?.length ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Немає вступлених груп. Спочатку вступіть у групи.
                  </div>
                ) : (
                  groupsData.groups.map(group => {
                    const isChecked = selectedGroupIds.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        className="flex flex-row items-center space-x-3 space-y-0 rounded-lg p-2 hover:bg-secondary/50 cursor-pointer"
                        onClick={() => {
                          const current = form.getValues("targetGroupIds") ?? [];
                          form.setValue(
                            "targetGroupIds",
                            isChecked ? current.filter(v => v !== group.id) : [...current, group.id],
                            { shouldValidate: true }
                          );
                        }}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const current = form.getValues("targetGroupIds") ?? [];
                            form.setValue(
                              "targetGroupIds",
                              checked ? [...current, group.id] : current.filter(v => v !== group.id),
                              { shouldValidate: true }
                            );
                          }}
                        />
                        <div className="leading-none">
                          <p className="cursor-pointer font-medium text-sm">{group.title}</p>
                          {group.username && (
                            <p className="text-xs text-muted-foreground font-mono">@{group.username}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {form.formState.errors.targetGroupIds && (
                <p className="text-[12px] text-destructive mt-1.5">
                  {form.formState.errors.targetGroupIds.message}
                </p>
              )}
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
