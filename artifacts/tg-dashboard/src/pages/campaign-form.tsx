import { useEffect, useMemo } from "react";
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
  { value: "once", label: "Run once" },
  { value: "hourly", label: "Every hour" },
  { value: "every2h", label: "Every 2 hours" },
  { value: "every4h", label: "Every 4 hours" },
  { value: "every8h", label: "Every 8 hours" },
  { value: "every12h", label: "Every 12 hours" },
  { value: "daily", label: "Every day" },
  { value: "custom", label: "Custom interval" },
] as const;

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  message: z.string().min(1, "Message is required"),
  scheduleType: z.enum(["once", "hourly", "every2h", "every4h", "every8h", "every12h", "daily", "custom"]),
  intervalHours: z.string().optional(),
  targetGroupIds: z.array(z.number()).min(1, "Select at least one target group"),
});

export default function CampaignForm() {
  const { id } = useParams<{ id?: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEdit = !!id;
  const campaignId = isEdit ? parseInt(id) : undefined;

  const { data: groupsData, isLoading: isLoadingGroups } = useListGroups({ status: "joined" }, {
    query: {
      queryKey: getListGroupsQueryKey({ status: "joined" }),
    }
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
      name: "",
      message: "",
      scheduleType: "once",
      intervalHours: "",
      targetGroupIds: [],
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
      intervalHours: values.scheduleType === "custom" && values.intervalHours ? parseInt(values.intervalHours) : undefined,
      targetGroupIds: values.targetGroupIds,
    };

    if (isEdit) {
      updateCampaign.mutate({ data: { id: campaignId!, ...payload } }, {
        onSuccess: () => {
          toast({ title: "Campaign Updated" });
          queryClient.invalidateQueries({ queryKey: getGetCampaignQueryKey(campaignId!) });
          setLocation("/campaigns");
        },
        onError: (err: any) => {
          toast({ title: "Failed to update", description: err.message, variant: "destructive" });
        }
      });
    } else {
      createCampaign.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Campaign Created" });
          setLocation("/campaigns");
        },
        onError: (err: any) => {
          toast({ title: "Failed to create", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const isSaving = createCampaign.isPending || updateCampaign.isPending;
  const isLoading = isLoadingGroups || (isEdit && isLoadingCampaign);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedScheduleType = form.watch("scheduleType");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/campaigns")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">{isEdit ? "Edit Campaign" : "New Campaign"}</h1>
          <p className="text-muted-foreground">Configure broadcast settings.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Daily Promo - Morning" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broadcast Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Type the message to broadcast to groups..." 
                        className="min-h-[150px] font-mono text-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select schedule" />
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
                  <FormField
                    control={form.control}
                    name="intervalHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interval (Hours)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="e.g. 48" {...field} />
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
            <CardHeader>
              <CardTitle>Targets</CardTitle>
              <p className="text-sm text-muted-foreground">Select the joined groups to broadcast to.</p>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="targetGroupIds"
                render={() => (
                  <FormItem>
                    <div className="max-h-64 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                      {!groupsData?.groups?.length ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No joined groups available. Join groups first.
                        </div>
                      ) : (
                        groupsData.groups.map(group => (
                          <FormField
                            key={group.id}
                            control={form.control}
                            name="targetGroupIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={group.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 hover:bg-secondary/50 cursor-pointer"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(group.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, group.id])
                                          : field.onChange(field.value?.filter((value) => value !== group.id));
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="cursor-pointer font-medium">
                                      {group.title}
                                    </FormLabel>
                                    {group.username && (
                                      <p className="text-xs text-muted-foreground font-mono">
                                        @{group.username}
                                      </p>
                                    )}
                                  </div>
                                </FormItem>
                              );
                            }}
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

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} size="lg" className="w-full sm:w-auto">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isEdit ? "Update Campaign" : "Create Campaign"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
