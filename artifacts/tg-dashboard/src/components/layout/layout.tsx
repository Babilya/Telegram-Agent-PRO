import { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

export function Layout({ children }: { children: ReactNode }) {
  const { data: health } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000, // check every 30s
    },
  });

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-6 shrink-0">
          <div className="text-sm font-mono text-muted-foreground">
            {new Date().toISOString().split("T")[0]}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted-foreground">SYS_STATUS:</span>
              {health?.status === "ok" ? (
                <span className="text-primary flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  ONLINE
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  OFFLINE
                </span>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
