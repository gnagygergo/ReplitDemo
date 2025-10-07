import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Landing from "@/pages/landing";
import QuickWinsLogin from "@/pages/quickwins-login";
import Registration from "@/pages/registration";
import Accounts from "@/components/accounts/accounts";
import Quotes from "@/components/quotes/quotes";
import Opportunities from "@/components/opportunities/opportunities";
import Products from "@/components/products/products";
import Cases from "@/components/cases/cases";
import Setup from "@/components/setup/setup";
import NotFound from "@/pages/not-found";
import AccountDetail from "@/components/accounts/account-detail";
import QuoteDetail from "@/components/quotes/quote-detail";
import ProductDetail from "@/components/products/product-detail";

function AuthenticatedRouter() {
  return (
    <>
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
        <Route path="/accounts/:id" component={AccountDetail} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/quotes/:id" component={QuoteDetail} />
        <Route path="/quotes" component={Quotes} />
        <Route path="/opportunities" component={Opportunities} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/products" component={Products} />
        <Route path="/cases" component={Cases} />
        <Route path="/setup" component={Setup} />
        <Route component={NotFound} />
      </Switch>
    </>
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

  // Show unauthenticated routes while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return <UnauthenticatedRouter />;
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
