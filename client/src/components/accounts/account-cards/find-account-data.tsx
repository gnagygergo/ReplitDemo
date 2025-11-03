import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FindAccountDataProps {
  accountId: string;
  accountName: string;
}

interface FindRegistrationIdResponse {
  registrationId: string;
  accountId: string;
  accountName: string;
}

export default function FindAccountData({ accountId, accountName }: FindAccountDataProps) {
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const { toast } = useToast();

  const findRegistrationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/accounts/${accountId}/find-registration-id`, {});
      return response.json() as Promise<FindRegistrationIdResponse>;
    },
    onSuccess: (data) => {
      setResult(data.registrationId);
      if (data.registrationId === "Not found") {
        setStatus("error");
        toast({
          title: "Not Found",
          description: "Could not find a registration ID for this company",
          variant: "destructive",
        });
      } else {
        setStatus("success");
        toast({
          title: "Success",
          description: "Found registration ID!",
        });
      }
    },
    onError: (error: any) => {
      setStatus("error");
      const errorMessage = error?.message || "Failed to search for registration ID";
      setResult(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    setResult(null);
    setStatus("idle");
    findRegistrationMutation.mutate();
  };

  return (
    <Card data-testid="card-find-account-data">
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
                Find Registration ID
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="mt-2 p-4 rounded-lg bg-muted">
            <div className="flex items-start gap-3">
              {status === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {status === "success" ? "Registration ID Found:" : "Result:"}
                </p>
                <p 
                  className="text-sm break-words"
                  data-testid="text-registration-id-result"
                >
                  {result}
                </p>
              </div>
            </div>
          </div>
        )}

        {!result && !findRegistrationMutation.isPending && (
          <div className="text-sm text-muted-foreground">
            <p>
              Click "Find Registration ID" to search for <strong>{accountName}</strong>'s official company registration number using AI.
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
