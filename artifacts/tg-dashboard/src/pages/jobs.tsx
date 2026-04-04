import { useState } from "react";
import { useListJobs, getListJobsQueryKey } from "@workspace/api-client-react";
import { Loader2, Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { uk } from "date-fns/locale";
import { Button } from "@/components/ui/button";

const typeLabel: Record<string, string> = { broadcast: "Розсилка", join: "Вступ" };
const statusLabel: Record<string, string> = {
  completed: "Виконано", failed: "Помилка", pending: "Очікує", running: "Виконується",
};

const statusColor: Record<string, string> = {
  completed: "hsl(142 71% 45%)",
  failed: "hsl(0 85% 60%)",
  running: "hsl(271 91% 65%)",
  pending: "hsl(258 15% 52%)",
};

const TypeIcon = ({ type }: { type: string }) => (
  <Activity className={`h-3.5 w-3.5 ${type === "broadcast" ? "text-accent" : "text-primary"}`} />
);

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "completed") return <CheckCircle2 className="h-3 w-3" />;
  if (status === "failed") return <AlertTriangle className="h-3 w-3" />;
  if (status === "pending") return <Clock className="h-3 w-3" />;
  return <Activity className="h-3 w-3 animate-pulse" />;
};

export default function Jobs() {
  const [limit, setLimit] = useState(50);
  const { data, isLoading } = useListJobs({ limit }, {
    query: { queryKey: getListJobsQueryKey({ limit }), refetchInterval: 10000 },
  });

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Журнал задач</h1>
        <p className="text-muted-foreground text-sm">Системний журнал виконання вступів та розсилок.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data?.jobs?.length ? (
        <div className="rounded-2xl border border-border/50 bg-secondary/20 py-12 text-center text-muted-foreground text-sm">
          Журнал порожній. Задачі з'являться після запуску кампаній.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-border/50 bg-secondary/30 px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TypeIcon type={job.type} />
                  <span className="text-[12px] font-display font-bold text-white uppercase tracking-wider">
                    {typeLabel[job.type] || job.type}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${statusColor[job.status]}18`, color: statusColor[job.status] }}>
                  <StatusIcon status={job.status} />
                  {statusLabel[job.status] || job.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="text-[12px] text-muted-foreground font-mono min-w-0">
                  {job.campaignId ? `Кампанія #${job.campaignId}` : ""}
                  {job.groupId ? `Група #${job.groupId}` : ""}
                  {job.targetId ? `Ціль: ${job.targetId}` : ""}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                  {format(new Date(job.createdAt), "d MMM, HH:mm", { locale: uk })}
                </span>
              </div>

              {(job.error || job.message) && (
                <p className={`text-[12px] truncate ${job.error ? "text-destructive" : "text-muted-foreground"}`}>
                  {job.error || job.message}
                </p>
              )}
            </div>
          ))}

          {data?.total && data.total > limit && (
            <Button variant="outline" size="sm" onClick={() => setLimit(l => l + 50)} className="self-center mt-1">
              Завантажити ще
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
