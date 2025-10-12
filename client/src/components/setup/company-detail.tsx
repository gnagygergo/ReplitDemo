import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Company,
  type InsertCompany,
  insertCompanySchema,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Building, Edit, Save, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LogoUpload } from "./logo-upload";

export default function CompanyDetail() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: companyName } = useQuery<{ companyName: string }>({
    queryKey: ["/api/auth/company-name"],
  });

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/auth/my-company"],
  });

  const { data: licenceAgreements = [] } = useQuery<any[]>({
    queryKey: ["/api/auth/my-company-licence-agreements"],
  });

  const form = useForm<Partial<InsertCompany>>({
    resolver: zodResolver(
      insertCompanySchema.partial().pick({
        companyAlias: true,
        bankAccountNumber: true,
        address: true,
      }),
    ),
    defaultValues: {
      companyAlias: "",
      bankAccountNumber: "",
      address: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertCompany>) => {
      const response = await apiRequest("PATCH", `/api/auth/my-company`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/my-company"] });
      toast({
        title: "Success",
        description: "Company details updated successfully",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company details",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (company) {
      form.reset({
        companyAlias: company.companyAlias || "",
        bankAccountNumber: company.bankAccountNumber || "",
        address: company.address || "",
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
  };

  const onSubmit = (data: Partial<InsertCompany>) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-muted-foreground">Loading company details...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-muted-foreground">No company found</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Highlights Pane */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Building className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              data-testid="text-company-name"
            >
              {companyName?.companyName || company.companyOfficialName}
            </h1>
            <p className="text-muted-foreground">Company Information</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Details Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Company Details</CardTitle>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={updateMutation.isPending}
                    data-testid="button-save-company"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleEdit}
                  data-testid="button-edit-company"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Official Name
                      </label>
                      <Input
                        value={company.companyOfficialName}
                        disabled
                        className="mt-2"
                        data-testid="input-company-official-name"
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="companyAlias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Alias</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              data-testid="input-company-alias"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Registration ID
                      </label>
                      <Input
                        value={company.companyRegistrationId || ""}
                        disabled
                        className="mt-2"
                        data-testid="input-company-registration-id"
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              data-testid="input-bank-account"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              rows={3}
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Official Name
                  </label>
                  <div
                    className="mt-2 text-foreground"
                    data-testid="text-company-official-name"
                  >
                    {company.companyOfficialName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Company Alias
                  </label>
                  <div
                    className="mt-2 text-foreground"
                    data-testid="text-company-alias"
                  >
                    {company.companyAlias || "N/A"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Registration ID
                  </label>
                  <div
                    className="mt-2 text-foreground"
                    data-testid="text-company-registration-id"
                  >
                    {company.companyRegistrationId || "N/A"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Bank Account Number
                  </label>
                  <div
                    className="mt-2 text-foreground"
                    data-testid="text-bank-account"
                  >
                    {company.bankAccountNumber || "N/A"}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Address
                  </label>
                  <div
                    className="mt-2 text-foreground whitespace-pre-wrap"
                    data-testid="text-address"
                  >
                    {company.address || "N/A"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Licence Agreements Card */}
        <Card>
          <CardHeader>
            <CardTitle>Licence Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            {licenceAgreements.length === 0 ? (
              <p
                className="text-muted-foreground text-center py-8"
                data-testid="text-no-agreements"
              >
                No licence agreements found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Valid From
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Valid To
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        All Seats
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Seats Used
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Seats Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenceAgreements.map((agreement: any) => (
                      <tr
                        key={agreement.id}
                        className="border-b"
                        data-testid={`row-agreement-${agreement.id}`}
                      >
                        <td
                          className="py-3 px-4"
                          data-testid={`text-name-${agreement.id}`}
                        >
                          {agreement.templateName || "N/A"}
                        </td>
                        <td
                          className="py-3 px-4"
                          data-testid={`text-valid-from-${agreement.id}`}
                        >
                          {agreement.validFrom
                            ? format(new Date(agreement.validFrom), "PPP")
                            : "N/A"}
                        </td>
                        <td
                          className="py-3 px-4"
                          data-testid={`text-valid-to-${agreement.id}`}
                        >
                          {agreement.validTo
                            ? format(new Date(agreement.validTo), "PPP")
                            : "N/A"}
                        </td>
                        <td
                          className="py-3 px-4"
                          data-testid={`text-seats-${agreement.id}`}
                        >
                          {agreement.licenceSeats || "N/A"}
                        </td>
                        <td
                          className="py-3 px-4"
                          data-testid={`text-seats-${agreement.id}`}
                        >
                          {agreement.licenceSeatsRemaining || "N/A"}
                        </td>
                        <td
                          className="py-3 px-4"
                          data-testid={`text-seats-${agreement.id}`}
                        >
                          {agreement.licenceSeatsUsed || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-muted-foreground text-center py-8"
              data-testid="text-no-payments"
            >
              Payment functionality coming soon
            </p>
          </CardContent>
        </Card>

        {/* Branding Card */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoUpload
              companyId={company.id}
              currentLogoUrl={company.logoUrl}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
