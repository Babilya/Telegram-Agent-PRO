import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout/layout";
import Landing from "@/pages/landing";
import { Dashboard } from "@/pages/dashboard";
import Search from "@/pages/search";
import Groups from "@/pages/groups";
import Campaigns from "@/pages/campaigns";
import CampaignForm from "@/pages/campaign-form";
import Jobs from "@/pages/jobs";
import Parsers from "@/pages/parsers";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Monitor from "@/pages/monitor";
import Logs from "@/pages/logs";
import Contacts from "@/pages/contacts";
import AutoReplies from "@/pages/autoreplies";
import Forwarding from "@/pages/forwarding";
import OCR from "@/pages/ocr";
import Voice from "@/pages/voice";
import Mirrors from "@/pages/mirrors";
import Stats from "@/pages/stats";
import Support from "@/pages/support";
import Profile from "@/pages/profile";
import Help from "@/pages/help";
import MenuPage from "@/pages/menu";
import { AuthModal } from "@/components/auth/auth-modal";
import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data, isLoading } = useGetAuthStatus({
    query: { staleTime: 30_000 },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const isAuthenticated = data?.authenticated === true;

  if (!isAuthenticated) {
    return (
      <AuthModal
        onClose={() => navigate("/welcome")}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
        }}
      />
    );
  }

  return <Layout>{children}</Layout>;
}

const protectedRoutes: { path: string; component: React.ComponentType }[] = [
  { path: "/dashboard", component: Dashboard },
  { path: "/search", component: Search },
  { path: "/groups", component: Groups },
  { path: "/campaigns/new", component: CampaignForm },
  { path: "/campaigns/:id/edit", component: CampaignForm },
  { path: "/campaigns", component: Campaigns },
  { path: "/jobs", component: Jobs },
  { path: "/parsers", component: Parsers },
  { path: "/monitor", component: Monitor },
  { path: "/logs", component: Logs },
  { path: "/contacts", component: Contacts },
  { path: "/autoreplies", component: AutoReplies },
  { path: "/forwarding", component: Forwarding },
  { path: "/ocr", component: OCR },
  { path: "/voice", component: Voice },
  { path: "/mirrors", component: Mirrors },
  { path: "/stats", component: Stats },
  { path: "/support", component: Support },
  { path: "/profile", component: Profile },
  { path: "/help", component: Help },
  { path: "/menu", component: MenuPage },
];

function Router() {
  return (
    <Switch>
      <Route path="/welcome" component={Landing} />
      {protectedRoutes.map(({ path, component: Component }) => (
        <Route key={path} path={path}>
          <ProtectedRoute><Component /></ProtectedRoute>
        </Route>
      ))}
      <Route path="/settings">
        <Layout><Settings /></Layout>
      </Route>
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
