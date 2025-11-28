import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CompanySettingsProvider } from "@/contexts/CompanySettingsContext";
import Header from "@/components/layout/header";
import Landing from "@/pages/landing";
import QuickWinsLogin from "@/pages/quickwins-login";
import Registration from "@/pages/registration";
import Setup from "@/components/setup/setup";
import BusinessObjectsManager from "@/components/setup/business-objects/business-objects-main";
import NotFound from "@/pages/not-found";
import DigitalOffice from "@/pages/digital-office";
import ObjectListPage from "@/components/ObjectListPage";
import ObjectDetailPage from "@/components/ObjectDetailPage";

interface TabDefinition {
  tabLabel: string;
  tabCode: string;
  objectCode: string;
  icon: string;
  tabOrder: number;
}

function AuthenticatedRouter() {
  const { user } = useAuth();

  const { data: tabDefinitions = [], isLoading } = useQuery<TabDefinition[]>({
    queryKey: ["/api/tab-definitions"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <CompanySettingsProvider>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div data-testid="loading-app">Loading...</div>
        </div>
      </CompanySettingsProvider>
    );
  }

  return (
    <CompanySettingsProvider>
      <Header />
      <Switch>
        <Route
          path="/"
          component={() => (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <h2 className="text-2xl font-bold">Dashboard - Coming Soon</h2>
            </div>
          )}
        />
        
        {tabDefinitions.map((tab) => (
          <Route
            key={`${tab.tabCode}-detail`}
            path={`/${tab.objectCode}/:id`}
            component={() => <ObjectDetailPage objectCode={tab.objectCode} />}
          />
        ))}
        
        {tabDefinitions.map((tab) => (
          <Route
            key={`${tab.tabCode}-list`}
            path={`/${tab.objectCode}`}
            component={() => <ObjectListPage objectCode={tab.objectCode} />}
          />
        ))}
        
        <Route path="/setup" component={Setup} />
        <Route path="setup/business-objects" component={BusinessObjectsManager} />
        <Route path="/digital-office" component={DigitalOffice} />
        <Route component={NotFound} />
      </Switch>
    </CompanySettingsProvider>
  );
}

function UnauthenticatedRouter() {
  return (
    <Switch>
      <Route path="/register" component={Registration} />
      <Route component={QuickWinsLogin} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return <UnauthenticatedRouter />;
  }

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
