import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { CompanySettingsProvider } from "@/contexts/CompanySettingsContext";
import { loadCompanyComponent } from "@/lib/loadCompanyComponent";
import { Suspense, useRef } from "react";
import Header from "@/components/layout/header";
import Landing from "@/pages/landing";
import QuickWinsLogin from "@/pages/quickwins-login";
import Registration from "@/pages/registration";
import Quotes from "@/components/quotes/quotes";
import Opportunities from "@/components/opportunities/opportunities";
import Products from "@/components/products/products";
import Setup from "@/components/setup/setup";
import BusinessObjectsManager from "@/components/setup/business-objects/business-objects-main";
import NotFound from "@/pages/not-found";
import QuoteDetail from "@/components/quotes/quote-detail";
import ProductDetail from "@/components/products/product-detail";
import DigitalOffice from "@/pages/digital-office";

function AssetsPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const assetsRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!assetsRef.current || prevCompanyIdRef.current !== companyId) {
    assetsRef.current = loadCompanyComponent(companyId, "assets", "assets");
    prevCompanyIdRef.current = companyId;
  }
  
  const Assets = assetsRef.current;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Assets />
    </Suspense>
  );
}

function AssetDetailPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const assetDetailRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!assetDetailRef.current || prevCompanyIdRef.current !== companyId) {
    assetDetailRef.current = loadCompanyComponent(companyId, "assets", "asset-detail");
    prevCompanyIdRef.current = companyId;
  }
  
  const AssetDetail = assetDetailRef.current;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssetDetail />
    </Suspense>
  );
}

function AccountsPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const accountsRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!accountsRef.current || prevCompanyIdRef.current !== companyId) {
    accountsRef.current = loadCompanyComponent(companyId, "accounts", "accounts");
    prevCompanyIdRef.current = companyId;
  }
  
  const Accounts = accountsRef.current;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Accounts />
    </Suspense>
  );
}

function AccountDetailPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const accountDetailRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!accountDetailRef.current || prevCompanyIdRef.current !== companyId) {
    accountDetailRef.current = loadCompanyComponent(companyId, "accounts", "account-detail");
    prevCompanyIdRef.current = companyId;
  }
  
  const AccountDetail = accountDetailRef.current;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountDetail />
    </Suspense>
  );
}

function AuthenticatedRouter() {
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
        <Route path="/accounts/:id" component={AccountDetailPage} />
        <Route path="/accounts" component={AccountsPage} />
        <Route path="/assets/:id" component={AssetDetailPage} />
        <Route path="/assets" component={AssetsPage} />
        <Route path="/quotes/:id" component={QuoteDetail} />
        <Route path="/quotes" component={Quotes} />
        <Route path="/opportunities" component={Opportunities} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/products" component={Products} />
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
