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

function Router() {
  return (
    <Switch>
      <Route path="/welcome" component={Landing} />
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/search">
        <ProtectedRoute><Search /></ProtectedRoute>
      </Route>
      <Route path="/groups">
        <ProtectedRoute><Groups /></ProtectedRoute>
      </Route>
      <Route path="/campaigns/new">
        <ProtectedRoute><CampaignForm /></ProtectedRoute>
      </Route>
      <Route path="/campaigns/:id/edit">
        <ProtectedRoute><CampaignForm /></ProtectedRoute>
      </Route>
      <Route path="/campaigns">
        <ProtectedRoute><Campaigns /></ProtectedRoute>
      </Route>
      <Route path="/jobs">
        <ProtectedRoute><Jobs /></ProtectedRoute>
      </Route>
      <Route path="/parsers">
        <ProtectedRoute><Parsers /></ProtectedRoute>
      </Route>
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
