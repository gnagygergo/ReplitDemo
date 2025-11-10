import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Search, Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "wouter";
import { type AssetWithDetails } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Assets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>('serialNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery<AssetWithDetails[]>({
    queryKey: ["/api/assets", sortBy, sortOrder, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({ sortBy, sortOrder });
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      const res = await fetch(`/api/assets?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Asset deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (asset: AssetWithDetails) => {
    if (confirm(`Are you sure you want to delete asset "${asset.serialNumber}"?`)) {
      deleteMutation.mutate(asset.id);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 inline" />
      : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Assets</h2>
          </div>
          <Link href="/assets/new">
            <Button 
              className="flex items-center space-x-2"
              data-testid="button-create-asset"
            >
              <Plus className="w-4 h-4" />
              <span>Create Asset</span>
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Search Assets</label>
              <div className="relative flex-1">
                
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by serial number or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-assets"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assets found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Try adjusting your search criteria" 
                    : "Get started by creating your first asset"}
                </p>
                <Link href="/assets/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Asset
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('serialNumber')}
                        data-testid="header-serial-number"
                      >
                        Serial Number {getSortIcon('serialNumber')}
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead 
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('installationDate')}
                        data-testid="header-installation-date"
                      >
                        Installation Date {getSortIcon('installationDate')}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id} data-testid={`row-asset-${asset.id}`}>
                        <TableCell className="font-medium">
                          <TextField
                            mode="table"
                            value={asset.serialNumber}
                            linkPath="/assets"
                            recordId={asset.id}
                            testId={`link-asset-${asset.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            mode="table"
                            value={asset.name}
                            testId={`link-asset-${asset.id}`}
                          />
                        
                        </TableCell>
                        <TableCell>{asset.description || '-'}</TableCell>
                        <TableCell>
                          {asset.account ? (
                            <Link href={`/accounts/${asset.accountId}`}>
                              <span className="text-primary hover:underline cursor-pointer">
                                {asset.account.name}
                              </span>
                            </Link>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {asset.product ? (
                            <span>{asset.product.productName}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{asset.quantity || '-'}</TableCell>
                        <TableCell>
                          {asset.installationDate 
                            ? format(new Date(asset.installationDate), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/assets/${asset.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-edit-${asset.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(asset)}
                              data-testid={`button-delete-${asset.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
