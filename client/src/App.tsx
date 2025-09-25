import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Landing from "@/pages/landing";
import Accounts from "@/pages/accounts";
import Opportunities from "@/pages/opportunities";
import Cases from "@/pages/cases";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <>
      <Header />
      <Switch>
        <Route path="/" component={() => <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><h2 className="text-2xl font-bold">Dashboard - Coming Soon</h2></div>} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/opportunities" component={Opportunities} />
        <Route path="/cases" component={Cases} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return <Landing />;
  }

  // Show authenticated CRM interface
  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-background">
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
