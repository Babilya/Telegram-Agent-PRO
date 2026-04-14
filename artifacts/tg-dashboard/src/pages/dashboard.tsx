import { useState } from "react";
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Megaphone, Send, AlertTriangle, Activity, ArrowRight, Search, CheckCircle2, LogIn } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { AuthModal } from "@/components/auth/auth-modal";

const statusLabel: Record<string, string> = {
  completed: "Виконано", failed: "Помилка", running: "Виконується", pending: "Очікує",
};
const typeLabel: Record<string, string> = {
  broadcast: "Розсилка", join: "Вступ",
};

export function Dashboard() {
  const [showAuth, setShowAuth] = useState(false);

  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: 15000 },
  });
  const { data: authStatus } = useGetAuthStatus({
    query: { queryKey: getGetAuthStatusQueryKey(), refetchInterval: 30000 },
  });

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Огляд</h1>
        <p className="text-muted-foreground text-sm">Стан системи та активні задачі.</p>
      </div>

      {/* Auth status banner — UX-07: accessible clickable element */}
      <div
        role="button"
        tabIndex={0}
        className="flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all"
        style={{
          background: authStatus?.authenticated
            ? "hsl(271 91% 65% / 0.1)"
            : "hsl(316 90% 62% / 0.1)",
          border: `1px solid ${authStatus?.authenticated ? "hsl(271 91% 65% / 0.25)" : "hsl(316 90% 62% / 0.25)"}`,
        }}
        onClick={() => setShowAuth(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setShowAuth(true)}
        aria-label={authStatus?.authenticated ? "Акаунт підключено — натисніть для деталей" : "Натисніть для підключення Telegram акаунту"}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: authStatus?.authenticated ? "hsl(271 91% 65% / 0.2)" : "hsl(316 90% 62% / 0.2)" }}>
            {authStatus?.authenticated
              ? <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(271 91% 65%)" }} />
              : <LogIn className="h-4 w-4" style={{ color: "hsl(316 90% 62%)" }} />}
          </div>
          <div>
            <p className="text-sm font-display font-bold text-white">
              {authStatus?.authenticated ? "Акаунт підключено" : "Акаунт не підключено"}
            </p>
            <p className="text-xs" style={{ color: "hsl(258 10% 60%)" }}>
              {authStatus?.authenticated
                ? `${authStatus.firstName || ""} ${authStatus.username ? `@${authStatus.username}` : authStatus.phone || ""}`
                : "Натисніть для підключення Telegram акаунту"}
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4" style={{ color: "hsl(258 10% 50%)" }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Груп збережено" value={stats?.totalGroups ?? "-"} icon={Users} loading={isLoading} />
        <StatCard title="Вступлено" value={stats?.joinedGroups ?? "-"} icon={Activity} loading={isLoading} valueClassName="text-primary" />
        <StatCard title="Кампанії активні" value={stats?.activeCampaigns ?? "-"} icon={Megaphone} loading={isLoading} valueClassName="text-accent" />
        <StatCard title="Надіслано всього" value={stats?.totalSent ?? "-"} icon={Send} loading={isLoading} />
      </div>

      {/* Quick actions */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display">Швидкий доступ</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-1.5">
          <Link href="/search" className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 border border-transparent hover:border-border transition-colors group">
            <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Пошук груп</p>
              <p className="text-xs text-muted-foreground">Знайти нові цілі</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </Link>

          <Link href="/campaigns/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/80 border border-transparent hover:border-border transition-colors group">
            <div className="bg-accent/10 p-2 rounded-lg text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Нова кампанія</p>
              <p className="text-xs text-muted-foreground">Запустити розсилку</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-display font-bold">Остання активність</h2>
          <Link href="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1">
            Всі задачі <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card className="border-border">
          <CardContent className="p-3">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted/20 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : !stats?.recentJobs?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                Задач ще не було. Запустіть кампанію або вступіть у групи.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${
                        job.status === "completed" ? "bg-primary/10 text-primary" :
                        job.status === "failed" ? "bg-destructive/10 text-destructive" :
                        "bg-accent/10 text-accent"
                      }`}>
                        {job.status === "failed"
                          ? <AlertTriangle className="h-3.5 w-3.5" />
                          : <Activity className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">
                          {typeLabel[job.type] || job.type}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {job.targetId || job.groupId
                            ? `Ціль: ${job.targetId || job.groupId}`
                            : `Кампанія: ${job.campaignId}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg ${
                        job.status === "completed" ? "bg-primary/20 text-primary" :
                        job.status === "failed" ? "bg-destructive/20 text-destructive" :
                        job.status === "running" ? "bg-accent/20 text-accent animate-pulse" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {statusLabel[job.status] || job.status}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: uk })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      )}
    </div>
  );
}

function StatCard({
  title, value, icon: Icon, loading, valueClassName = ""
}: {
  title: string; value: number | string; icon: any; loading?: boolean; valueClassName?: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-3.5 flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <p className="text-[10px] font-medium uppercase tracking-wider leading-tight">{title}</p>
          <Icon className="h-3.5 w-3.5 opacity-50" />
        </div>
        {loading ? (
          <div className="h-7 bg-muted/20 animate-pulse rounded w-1/2" />
        ) : (
          <p className={`text-2xl font-bold font-mono ${valueClassName}`}>
            {typeof value === "number" ? new Intl.NumberFormat("uk").format(value) : value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
