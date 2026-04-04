import { Link, useLocation } from "wouter";
import { LayoutDashboard, Search, Users, Megaphone, Activity, ShieldCheck, ShieldAlert, X, Zap } from "lucide-react";
import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Search Groups", href: "/search", icon: Search },
  { name: "Saved Groups", href: "/groups", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Job History", href: "/jobs", icon: Activity },
];

interface AppSidebarProps {
  onClose?: () => void;
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const [location] = useLocation();

  const { data: authStatus } = useGetAuthStatus({
    query: {
      queryKey: getGetAuthStatusQueryKey(),
      refetchInterval: 10000,
    },
  });

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-display font-black text-lg tracking-tight text-gradient" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center glow-primary"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))" }}>
            <Zap className="h-4 w-4 text-white" />
          </div>
          TG_CTRL
        </Link>
        {/* Close button - mobile only */}
        {onClose && (
          <button
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={onClose}
            data-testid="sidebar-close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? "text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              style={isActive ? {
                background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))",
                borderLeft: "2px solid hsl(271 91% 65%)",
              } : {}}
              data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Auth status badge */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
          authStatus?.authenticated
            ? "bg-primary/10 border-primary/20"
            : "bg-destructive/10 border-destructive/20"
        }`}>
          {authStatus?.authenticated ? (
            <>
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground">Підключено</span>
                <span className="text-[10px] font-mono text-muted-foreground truncate">
                  {authStatus.username ? `@${authStatus.username}` : authStatus.phone}
                </span>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-destructive">Не підключено</span>
                <span className="text-[10px] text-muted-foreground">Потрібна авторизація</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
