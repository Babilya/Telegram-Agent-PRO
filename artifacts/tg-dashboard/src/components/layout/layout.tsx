import { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { Zap } from "lucide-react";
import { Link } from "wouter";

export function Layout({ children }: { children: ReactNode }) {
  const { data: health } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000,
    },
  });

  return (
    <div className="flex flex-col bg-background text-foreground font-sans"
      style={{ height: "100dvh" }}>
      {/* Top header */}
      <header className="shrink-0 flex items-center justify-between px-4 h-12"
        style={{
          background: "hsl(258 40% 6% / 0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid hsl(258 30% 16%)",
        }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(271 91% 65%), hsl(316 90% 62%))",
              boxShadow: "0 0 12px hsl(271 91% 65% / 0.45)",
              borderRadius: 8,
            }}>
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display font-black text-base"
            style={{
              background: "linear-gradient(135deg, hsl(271 91% 72%), hsl(316 90% 68%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            TG_CTRL
          </span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <div className={`h-1.5 w-1.5 rounded-full ${health?.status === "ok" ? "bg-primary animate-pulse" : "bg-destructive"}`} />
          <span style={{ color: health?.status === "ok" ? "hsl(271 91% 65%)" : "hsl(0 85% 60%)" }}>
            {health?.status === "ok" ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </header>

      {/* Page content — padded at bottom for nav bar */}
      <main className="flex-1 overflow-auto px-4 pt-4 pb-4" style={{ paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
