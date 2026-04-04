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
import { Search as SearchIcon, Save, LogIn, Loader2, Users, Type, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchGroupsGroupType, TelegramGroup } from "@workspace/api-zod/src/generated/types";

const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  minMembers: z.string().optional(),
  maxMembers: z.string().optional(),
  groupType: z.enum(["all", "group", "channel", "supergroup"]).optional(),
});

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
    defaultValues: {
      query: "",
      minMembers: "",
      maxMembers: "",
      groupType: "all",
    },
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
      onSuccess: () => {
        toast({ title: "Group Saved", description: `${group.title} added to saved groups.` });
      },
      onError: (err: any) => {
        toast({ title: "Failed to save", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleJoinAndSave = (group: TelegramGroup) => {
    // First save, then join
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
        joinGroups.mutate({
          data: { groupIds: [savedGroup.id] }
        }, {
          onSuccess: () => {
            toast({ title: "Join Request Queued", description: `Queued join for ${group.title}.` });
          },
          onError: (err: any) => {
            toast({ title: "Join Failed", description: err.message, variant: "destructive" });
          }
        });
      },
      onError: (err: any) => {
        toast({ title: "Failed to save before joining", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight text-gradient">Search Groups</h1>
        <p className="text-muted-foreground">Find and acquire new Telegram targets.</p>
      </div>

      <Card className="border-border">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex gap-4 items-start">
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Keyword</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. crypto, trading, marketing" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="groupType"
                  render={({ field }) => (
                    <FormItem className="w-40">
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="group">Group</SelectItem>
                          <SelectItem value="supergroup">Supergroup</SelectItem>
                          <SelectItem value="channel">Channel</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4 items-start">
                <FormField
                  control={form.control}
                  name="minMembers"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Min Members</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Max Members</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="No limit" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex items-end pb-1 h-full pt-8">
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-mono font-bold tracking-tight">Results {data && `(${data.total})`}</h2>
        <Card className="border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {searchParams?.query ? "No groups found." : "Enter a search query to find groups."}
                  </TableCell>
                </TableRow>
              ) : (
                data.results.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="font-medium">{group.title}</div>
                      {group.username && <div className="text-xs text-muted-foreground font-mono">@{group.username}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-mono">
                        {group.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono-nums text-sm">
                      {group.membersCount ? new Intl.NumberFormat().format(group.membersCount) : "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSave(group)}
                          disabled={saveGroup.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleJoinAndSave(group)}
                          disabled={joinGroups.isPending || saveGroup.isPending}
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Join
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
