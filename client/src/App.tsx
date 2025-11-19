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
import Setup from "@/components/setup/setup";
import BusinessObjectsManager from "@/components/setup/business-objects/business-objects-main";
import NotFound from "@/pages/not-found";
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
    <Suspense fallback={<div data-testid="loading-assets">Loading...</div>}>
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
    <Suspense fallback={<div data-testid="loading-asset-detail">Loading...</div>}>
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
    <Suspense fallback={<div data-testid="loading-accounts">Loading...</div>}>
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
    <Suspense fallback={<div data-testid="loading-account-detail">Loading...</div>}>
      <AccountDetail />
    </Suspense>
  );
}

function OpportunitiesPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const opportunitiesRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!opportunitiesRef.current || prevCompanyIdRef.current !== companyId) {
    opportunitiesRef.current = loadCompanyComponent(companyId, "opportunities", "opportunities");
    prevCompanyIdRef.current = companyId;
  }
  
  const Opportunities = opportunitiesRef.current;
  
  return (
    <Suspense fallback={<div data-testid="loading-opportunities">Loading...</div>}>
      <Opportunities />
    </Suspense>
  );
}

function ProductsPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const productsRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!productsRef.current || prevCompanyIdRef.current !== companyId) {
    productsRef.current = loadCompanyComponent(companyId, "products", "products");
    prevCompanyIdRef.current = companyId;
  }
  
  const Products = productsRef.current;
  
  return (
    <Suspense fallback={<div data-testid="loading-products">Loading...</div>}>
      <Products />
    </Suspense>
  );
}

function ProductDetailPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const productDetailRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!productDetailRef.current || prevCompanyIdRef.current !== companyId) {
    productDetailRef.current = loadCompanyComponent(companyId, "products", "product-detail");
    prevCompanyIdRef.current = companyId;
  }
  
  const ProductDetail = productDetailRef.current;
  
  return (
    <Suspense fallback={<div data-testid="loading-product-detail">Loading...</div>}>
      <ProductDetail />
    </Suspense>
  );
}

function QuotesPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const quotesRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!quotesRef.current || prevCompanyIdRef.current !== companyId) {
    quotesRef.current = loadCompanyComponent(companyId, "quotes", "quotes");
    prevCompanyIdRef.current = companyId;
  }
  
  const Quotes = quotesRef.current;
  
  return (
    <Suspense fallback={<div data-testid="loading-quotes">Loading...</div>}>
      <Quotes />
    </Suspense>
  );
}

function QuoteDetailPage() {
  const { user } = useAuth();
  // Normalize companyId: trim and use default if empty
  const companyId = user?.companyId?.trim() || "0_default";
  
  const quoteDetailRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  
  // Load component on first render or when companyId actually changes
  if (!quoteDetailRef.current || prevCompanyIdRef.current !== companyId) {
    quoteDetailRef.current = loadCompanyComponent(companyId, "quotes", "quote-detail");
    prevCompanyIdRef.current = companyId;
  }
  
  const QuoteDetail = quoteDetailRef.current;
  
  return (
    <Suspense fallback={<div data-testid="loading-quote-detail">Loading...</div>}>
      <QuoteDetail />
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
        <Route path="/quotes/:id" component={QuoteDetailPage} />
        <Route path="/quotes" component={QuotesPage} />
        <Route path="/opportunities" component={OpportunitiesPage} />
        <Route path="/products/:id" component={ProductDetailPage} />
        <Route path="/products" component={ProductsPage} />
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
