import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Search, Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "wouter";
import { type Quote } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes", sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({ sortBy, sortOrder });
      const res = await fetch(`/api/quotes?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch quotes');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/quotes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Quote deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch = 
      (quote.quoteName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.sellerName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDelete = (quote: Quote) => {
    if (confirm(`Are you sure you want to delete quote "${quote.quoteName}"?`)) {
      deleteMutation.mutate(quote.id);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quotes</h2>
          <p className="text-muted-foreground mt-1">Manage your sales quotes and proposals</p>
        </div>
        <Link href="/quotes/new">
          <Button 
            className="flex items-center space-x-2"
            data-testid="button-create-quote"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quote</span>
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">Search Quotes</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by quote name, customer, seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-quotes"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('quoteName')}
                    data-testid="header-sort-quoteName"
                  >
                    <span>Quote Name</span>
                    {sortBy === 'quoteName' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                    {sortBy !== 'quoteName' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </div>
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('quoteExpirationDate')}
                    data-testid="header-sort-quoteExpirationDate"
                  >
                    <span>Expiration Date</span>
                    {sortBy === 'quoteExpirationDate' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                    {sortBy !== 'quoteExpirationDate' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                    onClick={() => handleSort('createdDate')}
                    data-testid="header-sort-createdDate"
                  >
                    <span>Created Date</span>
                    {sortBy === 'createdDate' && (
                      sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    )}
                    {sortBy !== 'createdDate' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="w-10 h-10 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm ? "No quotes found matching your search" : "No quotes yet. Create your first quote to get started."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-quote-${quote.id}`}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <FileSpreadsheet className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <Link href={`/quotes/${quote.id}`}>
                            <div className="text-sm font-medium text-foreground hover:text-primary cursor-pointer" data-testid={`link-quote-name-${quote.id}`}>
                              {quote.quoteName}
                            </div>
                          </Link>
                          <div className="text-sm text-muted-foreground">Quote</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-customer-${quote.id}`}>
                      <div className="font-medium text-foreground">{quote.customerName || "N/A"}</div>
                      {quote.customerAddress && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">{quote.customerAddress}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-seller-${quote.id}`}>
                      <div className="font-medium text-foreground">{quote.sellerName || "N/A"}</div>
                      {quote.sellerEmail && (
                        <div className="text-xs text-muted-foreground">{quote.sellerEmail}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-expiration-${quote.id}`}>
                      {quote.quoteExpirationDate ? format(new Date(quote.quoteExpirationDate), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" data-testid={`text-created-${quote.id}`}>
                      {quote.createdDate ? format(new Date(quote.createdDate), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Link href={`/quotes/${quote.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                            data-testid={`button-edit-${quote.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(quote)}
                          className="text-destructive hover:text-destructive/80"
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${quote.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {!isLoading && filteredQuotes.length > 0 && (
          <div className="bg-muted px-6 py-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredQuotes.length} of {quotes.length} quotes
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
