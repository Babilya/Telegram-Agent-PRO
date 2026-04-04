import { Link, useLocation } from "wouter";
import { LayoutDashboard, Search, Users, Megaphone, Activity, ShieldCheck, ShieldAlert } from "lucide-react";
import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Search Groups", href: "/search", icon: Search },
  { name: "Saved Groups", href: "/groups", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Job History", href: "/jobs", icon: Activity },
];

export function AppSidebar() {
  const [location] = useLocation();

  const { data: authStatus } = useGetAuthStatus({
    query: {
      queryKey: getGetAuthStatusQueryKey(),
    },
  });

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-mono font-bold text-xl text-primary tracking-tighter">
          <div className="bg-primary/10 p-1.5 rounded-sm">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          TG_CTRL
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-sidebar-accent/50 border border-sidebar-border/50">
          {authStatus?.authenticated ? (
            <>
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Connected</span>
                <span className="text-[10px] font-mono text-muted-foreground truncate w-36">
                  {authStatus.username ? `@${authStatus.username}` : authStatus.phone}
                </span>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-destructive">Disconnected</span>
                <span className="text-[10px] text-muted-foreground">Action required</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
