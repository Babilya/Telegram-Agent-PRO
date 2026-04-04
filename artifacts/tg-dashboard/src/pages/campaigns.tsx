import { Link } from "wouter";
import { 
  useListCampaigns, 
  getListCampaignsQueryKey,
  useStartCampaign,
  usePauseCampaign,
  useDeleteCampaign
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Pause, Edit, Trash2, Loader2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatSchedule = (type: string, interval?: number | null) => {
  const map: Record<string, string> = {
    once: "Run once",
    hourly: "Every hour",
    every2h: "Every 2 hours",
    every4h: "Every 4 hours",
    every8h: "Every 8 hours",
    every12h: "Every 12 hours",
    daily: "Every day",
    custom: `Every ${interval || "?"} hours`
  };
  return map[type] || type;
};

export default function Campaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListCampaigns({
    query: {
      queryKey: getListCampaignsQueryKey(),
    }
  });

  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const deleteCampaign = useDeleteCampaign();

  const handleStart = (id: number) => {
    startCampaign.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Campaign Started", description: "Broadcast is now active." });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      }
    });
  };

  const handlePause = (id: number) => {
    pauseCampaign.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Campaign Paused", description: "Broadcast paused." });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    deleteCampaign.mutate({ data: { id } }, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Campaign removed." });
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage your automated broadcasts.</p>
        </div>
        
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sent / Failed</TableHead>
              <TableHead className="text-right">Last Run</TableHead>
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
            ) : !data?.campaigns?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No campaigns found. Create one to start broadcasting.
                </TableCell>
              </TableRow>
            ) : (
              data.campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={campaign.message}>
                      {campaign.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">
                      {formatSchedule(campaign.scheduleType, campaign.intervalHours)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      campaign.status === "active" ? "default" : 
                      campaign.status === "paused" ? "secondary" : 
                      campaign.status === "completed" ? "outline" : "secondary"
                    } className="uppercase text-[10px] tracking-wider font-mono">
                      {campaign.status === "active" && <Activity className="w-3 h-3 mr-1 inline animate-pulse" />}
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono-nums text-sm">
                    <span className="text-primary">{campaign.sentCount}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-destructive">{campaign.failCount}</span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {campaign.lastRunAt ? formatDistanceToNow(new Date(campaign.lastRunAt), { addSuffix: true }) : "Never"}
                    {campaign.nextRunAt && campaign.status === 'active' && (
                      <div className="text-[10px] opacity-70">Next: {formatDistanceToNow(new Date(campaign.nextRunAt))}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {campaign.status === "active" ? (
                        <Button variant="ghost" size="icon" onClick={() => handlePause(campaign.id)} disabled={pauseCampaign.isPending}>
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleStart(campaign.id)} disabled={startCampaign.isPending}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Link href={`/campaigns/${campaign.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)} disabled={deleteCampaign.isPending} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
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
  );
}
