import { useState } from "react";
import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Loader2, Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { uk } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const typeLabel: Record<string, string> = {
  broadcast: "Розсилка", join: "Вступ",
};
const statusLabel: Record<string, string> = {
  completed: "Виконано", failed: "Помилка", pending: "Очікує", running: "Виконується",
};

export default function Jobs() {
  const [limit, setLimit] = useState(50);

  const { data, isLoading } = useListJobs({ limit }, {
    query: {
      queryKey: getListJobsQueryKey({ limit }),
      refetchInterval: 10000,
    }
  });

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Журнал задач</h1>
        <p className="text-muted-foreground text-sm">Системний журнал виконання вступів та розсилок.</p>
      </div>

      <Card className="border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              <TableHead>Тип</TableHead>
              <TableHead>Ціль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Деталі</TableHead>
              <TableHead className="text-right">Час</TableHead>
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
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                  Журнал порожній. Задачі з'являться після запуску кампаній.
                </TableCell>
              </TableRow>
            ) : (
              data.jobs.map((job) => (
                <TableRow key={job.id} className="font-mono text-sm">
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Activity className={`h-3.5 w-3.5 ${job.type === "broadcast" ? "text-accent" : "text-primary"}`} />
                      <span className="text-xs font-bold tracking-wider uppercase">
                        {typeLabel[job.type] || job.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {job.campaignId ? `Кампанія #${job.campaignId}` : ""}
                    {job.groupId ? `Група #${job.groupId}` : ""}
                    {job.targetId ? `Ціль: ${job.targetId}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] tracking-wider ${
                      job.status === "completed" ? "border-primary text-primary" :
                      job.status === "failed" ? "border-destructive text-destructive" :
                      job.status === "running" ? "border-accent text-accent animate-pulse" : ""
                    }`}>
                      {job.status === "completed" && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                      {job.status === "failed" && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
                      {job.status === "pending" && <Clock className="w-3 h-3 mr-1 inline" />}
                      {statusLabel[job.status] || job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs truncate max-w-[200px]" title={job.error || job.message || ""}>
                    {job.error
                      ? <span className="text-destructive">{job.error}</span>
                      : <span className="text-muted-foreground">{job.message}</span>}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    <div>{format(new Date(job.createdAt), "d MMM, HH:mm", { locale: uk })}</div>
                    {job.completedAt && (
                      <div className="opacity-50">
                        {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true, locale: uk })}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {data?.total && data.total > limit && (
          <div className="p-4 border-t border-border flex justify-center bg-secondary/20">
            <Button variant="outline" size="sm" onClick={() => setLimit(l => l + 50)}>
              Завантажити ще
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
