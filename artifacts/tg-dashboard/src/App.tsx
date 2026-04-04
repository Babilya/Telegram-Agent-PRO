import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout/layout";
import { Dashboard } from "@/pages/dashboard";
import Search from "@/pages/search";
import Groups from "@/pages/groups";
import Campaigns from "@/pages/campaigns";
import CampaignForm from "@/pages/campaign-form";
import Jobs from "@/pages/jobs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/search" component={Search} />
        <Route path="/groups" component={Groups} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/campaigns/new" component={CampaignForm} />
        <Route path="/campaigns/:id/edit" component={CampaignForm} />
        <Route path="/jobs" component={Jobs} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
