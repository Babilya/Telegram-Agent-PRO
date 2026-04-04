import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const LANDING_KEY = "tgctrl_landing_seen";

function Router() {
  const hasSeenLanding = localStorage.getItem(LANDING_KEY) === "1";

  return (
    <Switch>
      <Route path="/welcome" component={Landing} />
      <Route path="/dashboard">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/search">
        <Layout>
          <Search />
        </Layout>
      </Route>
      <Route path="/groups">
        <Layout>
          <Groups />
        </Layout>
      </Route>
      <Route path="/campaigns/new">
        <Layout>
          <CampaignForm />
        </Layout>
      </Route>
      <Route path="/campaigns/:id/edit">
        <Layout>
          <CampaignForm />
        </Layout>
      </Route>
      <Route path="/campaigns">
        <Layout>
          <Campaigns />
        </Layout>
      </Route>
      <Route path="/jobs">
        <Layout>
          <Jobs />
        </Layout>
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
