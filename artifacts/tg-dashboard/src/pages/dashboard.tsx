import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { AuthCard } from "@/components/auth/auth-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Megaphone, Send, AlertTriangle, Activity, ArrowRight, Search } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats({
    query: {
      queryKey: getGetDashboardStatsQueryKey(),
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight text-gradient">Overview</h1>
        <p className="text-muted-foreground text-sm">System metrics and active jobs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Groups"
              value={stats?.totalGroups ?? "-"}
              icon={Users}
              loading={isLoading}
            />
            <StatCard
              title="Joined Groups"
              value={stats?.joinedGroups ?? "-"}
              icon={Activity}
              loading={isLoading}
              valueClassName="text-primary"
            />
            <StatCard
              title="Active Campaigns"
              value={stats?.activeCampaigns ?? "-"}
              icon={Megaphone}
              loading={isLoading}
              valueClassName="text-accent"
            />
            <StatCard
              title="Total Sent"
              value={stats?.totalSent ?? "-"}
              icon={Send}
              loading={isLoading}
            />
          </div>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system jobs and broadcasts</CardDescription>
              </div>
              <Link href="/jobs" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted/20 animate-pulse rounded-md" />
                  ))}
                </div>
              ) : !stats?.recentJobs?.length ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-md">
                  No recent activity found.
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-sm ${job.status === "completed" ? "bg-primary/10 text-primary" : job.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                          {job.status === "failed" ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium uppercase tracking-wider">{job.type}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {job.targetId || job.groupId ? `Target: ${job.targetId || job.groupId}` : `Campaign: ${job.campaignId}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-sm ${
                          job.status === "completed" ? "bg-primary/20 text-primary" :
                          job.status === "failed" ? "bg-destructive/20 text-destructive" :
                          job.status === "running" ? "bg-accent/20 text-accent animate-pulse" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {job.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <AuthCard />

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/search" className="flex items-center gap-3 p-3 rounded-md hover:bg-secondary/80 border border-transparent hover:border-border transition-colors group">
                <div className="bg-primary/10 p-2 rounded text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Search className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Search Groups</p>
                  <p className="text-xs text-muted-foreground">Find new targets</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </Link>
              
              <Link href="/campaigns/new" className="flex items-center gap-3 p-3 rounded-md hover:bg-secondary/80 border border-transparent hover:border-border transition-colors group">
                <div className="bg-accent/10 p-2 rounded text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New Campaign</p>
                  <p className="text-xs text-muted-foreground">Create broadcast</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  loading,
  valueClassName = ""
}: { 
  title: string; 
  value: number | string; 
  icon: any;
  loading?: boolean;
  valueClassName?: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <p className="text-xs font-medium uppercase tracking-wider">{title}</p>
          <Icon className="h-4 w-4 opacity-50" />
        </div>
        {loading ? (
          <div className="h-8 bg-muted/20 animate-pulse rounded w-1/2" />
        ) : (
          <p className={`text-2xl font-bold font-mono-nums ${valueClassName}`}>
            {typeof value === 'number' ? new Intl.NumberFormat().format(value) : value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
