import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type Quote, type QuoteLine } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet } from "lucide-react";
import QuoteHeaderCard from "@/components/quotes/quote-cards/quote-header-card";
import QuoteLinesCard from "@/components/quotes/quote-cards/quote-lines-card";
import QuoteEmailsCard from "@/components/quotes/quote-cards/quote-emails-card";

export default function QuoteDetail() {
  const [match, params] = useRoute("/quotes/:id");
  const [location, navigate] = useLocation();
  const [isQuoteEditing, setIsQuoteEditing] = useState(false);

  const isNewQuote = params?.id === "new";

  // Extract URL search params for prepopulation
  const searchParams = new URLSearchParams(window.location.search);
  const urlCustomerId = searchParams.get("customerId");
  const urlAccountName = searchParams.get("accountName");

  const { data: quote, isLoading: isLoadingQuote } = useQuery<Quote>({
    queryKey: ["/api/quotes", params?.id],
    enabled: !!params?.id && !isNewQuote,
  });

  const { data: quoteLines = [], isLoading: isLoadingLines } = useQuery<
    QuoteLine[]
  >({
    queryKey: ["/api/quotes", params?.id, "quote-lines"],
    enabled: !!params?.id && !isNewQuote,
  });

  const handleQuoteCreated = (newQuoteId: string) => {
    navigate(`/quotes/${newQuoteId}`, { replace: true });
  };

  const handleCancelNewQuote = () => {
    navigate("/quotes");
  };

  if (isLoadingQuote && !isNewQuote) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading quote details...</div>
      </div>
    );
  }

  if (!quote && !isNewQuote) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Quote not found</h3>
          <p className="text-muted-foreground mb-4">
            The quote you're looking for doesn't exist.
          </p>
          <Link href="/quotes">
            <Button variant="outline">Back to Quotes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/quotes" className="hover:text-foreground">
          Quotes
        </Link>
        <span>/</span>
        {urlAccountName && urlCustomerId && (
          <>
            <Link
              href={`/accounts/${urlCustomerId}`}
              className="hover:text-foreground"
            >
              {urlAccountName}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium">
          {isNewQuote ? "New Quote" : quote?.quoteName}
        </span>
      </div>
      
      {/* Page Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              data-testid="text-quote-name"
            >
              {isNewQuote ? "New Quote" : quote?.quoteName}
            </h1>
            <p className="text-muted-foreground">Quote Details</p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="quote" className="w-full mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="quote" data-testid="tab-quote">
            Quote
          </TabsTrigger>
          <TabsTrigger value="communication" data-testid="tab-communication">
            Communication
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quote" className="space-y-6">
          {/* Quote Header and Details Card */}
          <QuoteHeaderCard
            quoteId={params?.id || null}
            quote={quote || null}
            isNewQuote={isNewQuote}
            urlCustomerId={urlCustomerId}
            onQuoteCreated={handleQuoteCreated}
            onCancelNewQuote={handleCancelNewQuote}
            onEditingChange={setIsQuoteEditing}
          />
          
          {/* Products Card */}
          {!isNewQuote && (
            <QuoteLinesCard
              quoteId={params?.id || ""}
              quoteLines={quoteLines}
              isLoadingLines={isLoadingLines}
              isQuoteEditing={isQuoteEditing}
            />
          )}
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          {/* Emails Card */}
          <QuoteEmailsCard quote={quote || null} isNewQuote={isNewQuote} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
