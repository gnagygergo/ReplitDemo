import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Loader2, CheckCircle, XCircle, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FindAccountDataProps {
  accountId: string;
  accountName: string;
}

interface FindRegistrationIdResponse {
  registrationId: string;
  address: string;
  accountId: string;
  accountName: string;
}

export default function FindAccountData({ accountId, accountName }: FindAccountDataProps) {
  const [result, setResult] = useState<FindRegistrationIdResponse | null>(null);
  const { toast } = useToast();

  const findRegistrationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/accounts/${accountId}/find-registration-id`, {});
      return response.json() as Promise<FindRegistrationIdResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      const foundCount = [
        data.registrationId !== "Not found",
        data.address !== "Not found"
      ].filter(Boolean).length;

      if (foundCount === 0) {
        toast({
          title: "Not Found",
          description: "Could not find registration ID or address for this company",
          variant: "destructive",
        });
      } else if (foundCount === 1) {
        toast({
          title: "Partial Success",
          description: "Found some company information",
        });
      } else {
        toast({
          title: "Success",
          description: "Found registration ID and address!",
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to search for company data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (data: { companyRegistrationId?: string; address?: string }) => {
      const response = await apiRequest("PATCH", `/api/accounts/${accountId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update account",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    setResult(null);
    findRegistrationMutation.mutate();
  };

  const handleUpdate = () => {
    if (!result) return;

    const updateData: { companyRegistrationId?: string; address?: string } = {};
    
    if (result.registrationId && result.registrationId !== "Not found") {
      updateData.companyRegistrationId = result.registrationId;
    }
    
    if (result.address && result.address !== "Not found") {
      updateData.address = result.address;
    }

    if (Object.keys(updateData).length === 0) {
      toast({
        title: "Nothing to Update",
        description: "No valid data found to update the account",
        variant: "destructive",
      });
      return;
    }

    updateAccountMutation.mutate(updateData);
  };

  return (
    <Card className="border-purple-600 border-[3px]" data-testid="card-find-account-data">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Account Data Finder</CardTitle>
          <Button
            onClick={handleSearch}
            disabled={findRegistrationMutation.isPending}
            size="sm"
            variant="outline"
            data-testid="button-search-registration-id"
          >
            {findRegistrationMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Find Company Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted space-y-3">
              <div className="flex items-start gap-3">
                {result.registrationId !== "Not found" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Registration ID:</p>
                  <p 
                    className="text-sm break-words"
                    data-testid="text-registration-id-result"
                  >
                    {result.registrationId}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {result.address !== "Not found" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Address:</p>
                  <p 
                    className="text-sm break-words"
                    data-testid="text-address-result"
                  >
                    {result.address}
                  </p>
                </div>
              </div>
            </div>

            {(result.registrationId !== "Not found" || result.address !== "Not found") && (
              <Button
                onClick={handleUpdate}
                disabled={updateAccountMutation.isPending}
                size="sm"
                className="w-full"
                data-testid="button-update-account"
              >
                {updateAccountMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Account with this data
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {!result && !findRegistrationMutation.isPending && (
          <div className="text-sm text-muted-foreground">
            <p>
              Click "Find Company Data" to search for <strong>{accountName}</strong>'s official company registration number and address using AI.
            </p>
            <p className="mt-2 text-xs">
              Note: AI Services must be configured in Setup to use this feature.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
