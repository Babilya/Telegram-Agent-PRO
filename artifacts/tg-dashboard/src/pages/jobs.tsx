import { useState } from "react";
import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Loader2, Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function Jobs() {
  const [limit, setLimit] = useState(50);

  const { data, isLoading } = useListJobs({ limit }, {
    query: {
      queryKey: getListJobsQueryKey({ limit }),
      refetchInterval: 10000, // auto-refresh jobs
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight text-gradient">Job History</h1>
        <p className="text-muted-foreground">System execution logs for joins and broadcasts.</p>
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : !data?.jobs?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No jobs logged yet.
                </TableCell>
              </TableRow>
            ) : (
              data.jobs.map((job) => (
                <TableRow key={job.id} className="font-mono text-sm">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {job.type === "broadcast" ? <Activity className="h-4 w-4 text-accent" /> : <Activity className="h-4 w-4 text-primary" />}
                      <span className="uppercase font-bold tracking-wider">{job.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {job.campaignId ? `Campaign #${job.campaignId}` : ''}
                    {job.groupId ? `Group #${job.groupId}` : ''}
                    {job.targetId ? `Target: ${job.targetId}` : ''}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`uppercase text-[10px] tracking-wider ${
                      job.status === 'completed' ? 'border-primary text-primary' :
                      job.status === 'failed' ? 'border-destructive text-destructive' :
                      job.status === 'running' ? 'border-accent text-accent animate-pulse' : ''
                    }`}>
                      {job.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                      {job.status === 'failed' && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                      {job.status === 'pending' && <Clock className="w-3 h-3 mr-1 inline" />}
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs truncate max-w-[250px]" title={job.error || job.message || ""}>
                    {job.error ? <span className="text-destructive">{job.error}</span> : job.message}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    <div>{format(new Date(job.createdAt), 'MMM d, HH:mm:ss')}</div>
                    {job.completedAt && (
                      <div className="opacity-50">Done: {formatDistanceToNow(new Date(job.completedAt))}</div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {data?.total && data.total > limit && (
          <div className="p-4 border-t border-border flex justify-center bg-secondary/20">
            <Button variant="outline" onClick={() => setLimit(l => l + 50)}>Load More Logs</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
