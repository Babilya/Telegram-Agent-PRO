import { useState } from "react";
import { 
  useListGroups, 
  getListGroupsQueryKey,
  useJoinGroups,
  useDeleteGroup
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, Trash2, Loader2, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListGroupsStatus } from "@workspace/api-zod/src/generated/types";

export default function Groups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ListGroupsStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useListGroups(
    { status: statusFilter === "all" ? undefined : statusFilter },
    {
      query: {
        queryKey: getListGroupsQueryKey({ status: statusFilter === "all" ? undefined : statusFilter }),
      }
    }
  );

  const joinGroups = useJoinGroups();
  const deleteGroup = useDeleteGroup();

  const toggleSelectAll = () => {
    if (data?.groups) {
      if (selectedIds.size === data.groups.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(data.groups.map(g => g.id)));
      }
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkJoin = () => {
    if (selectedIds.size === 0) return;
    joinGroups.mutate({
      data: { groupIds: Array.from(selectedIds) }
    }, {
      onSuccess: () => {
        toast({ title: "Join Queued", description: `Queued join for ${selectedIds.size} groups.` });
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ status: statusFilter === "all" ? undefined : statusFilter }) });
        setSelectedIds(new Set());
      },
      onError: (err: any) => {
        toast({ title: "Failed to queue joins", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteGroup.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Group removed from targets." });
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ status: statusFilter === "all" ? undefined : statusFilter }) });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-gradient">Saved Targets</h1>
          <p className="text-muted-foreground">Manage your inventory of target groups.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as ListGroupsStatus)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="saved">Saved</SelectItem>
              <SelectItem value="pending">Pending Join</SelectItem>
              <SelectItem value="joined">Joined</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            disabled={selectedIds.size === 0 || joinGroups.isPending}
            onClick={handleBulkJoin}
          >
            {joinGroups.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Join Selected ({selectedIds.size})
          </Button>
        </div>
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={data?.groups && data.groups.length > 0 && selectedIds.size === data.groups.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No targets found. Use search to add groups.
                </TableCell>
              </TableRow>
            ) : (
              data.groups.map((group) => (
                <TableRow key={group.id} className={selectedIds.has(group.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(group.id)}
                      onCheckedChange={() => toggleSelect(group.id)}
                      aria-label={`Select ${group.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{group.title}</div>
                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                      {group.username ? `@${group.username}` : group.telegramId}
                      <span className="opacity-50">•</span>
                      <span className="uppercase">{group.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      group.status === "joined" ? "default" : 
                      group.status === "failed" ? "destructive" : 
                      group.status === "pending" ? "secondary" : "outline"
                    } className="uppercase text-[10px] tracking-wider font-mono">
                      {group.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono-nums text-sm">
                    {group.membersCount ? new Intl.NumberFormat().format(group.membersCount) : "-"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(group.id)}
                      disabled={deleteGroup.isPending}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
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
