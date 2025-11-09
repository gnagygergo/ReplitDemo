import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type QuoteLine, type InsertQuoteLine, insertQuoteLineSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Edit, Save, X, Package, Plus } from "lucide-react";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QuoteLineItem } from "@/components/quotes/quote-cards/quote-line-item";
import { z } from "zod";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";

const quoteLinesFormSchema = z.object({
  lines: z.array(
    insertQuoteLineSchema.partial().extend({
      id: z.string().optional(),
    }),
  ),
});

type QuoteLinesFormData = z.infer<typeof quoteLinesFormSchema>;

interface QuoteLinesCardProps {
  quoteId: string;
  quoteLines: QuoteLine[];
  isLoadingLines: boolean;
  isQuoteEditing: boolean;
}

export default function QuoteLinesCard({
  quoteId,
  quoteLines,
  isLoadingLines,
  isQuoteEditing,
}: QuoteLinesCardProps) {
  const [isEditingLines, setIsEditingLines] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isSettingEnabled } = useCompanySettings();

  const linesForm = useForm<QuoteLinesFormData>({
    resolver: zodResolver(quoteLinesFormSchema),
    defaultValues: {
      lines: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: linesForm.control,
    name: "lines",
  });

  const batchSaveLinesMutation = useMutation({
    mutationFn: async (data: QuoteLinesFormData) => {
      const response = await apiRequest(
        "POST",
        `/api/quotes/${quoteId}/quote-lines/batch`,
        { lines: data.lines },
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/quotes", quoteId, "quote-lines"],
      });
      // Invalidate the quote data to refresh totals in quote-footer-card
      queryClient.invalidateQueries({
        queryKey: ["/api/quotes", quoteId],
      });
      toast({
        title: "Quote lines saved successfully",
      });
      setIsEditingLines(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save quote lines",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitLines = (data: QuoteLinesFormData) => {
    // Conditional validation: if products cannot be optional on quote lines, validate productId
    const allowQuoteWithoutProduct = isSettingEnabled("general_quote_setting_allow_quote_creation_without_productKey");
    
    if (!allowQuoteWithoutProduct) {
      // Check each line for missing productId
      let hasError = false;
      data.lines.forEach((line, index) => {
        if (!line.productId || line.productId.trim() === '') {
          linesForm.setError(`lines.${index}.productId`, {
            type: "manual",
            message: "Product is required",
          });
          hasError = true;
        }
      });
      
      if (hasError) {
        toast({
          title: "Validation Error",
          description: "All quote lines must have a product selected",
          variant: "destructive",
        });
        return;
      }
    }
    
    batchSaveLinesMutation.mutate(data);
  };

  const handleCancelLines = () => {
    setIsEditingLines(false);
    linesForm.reset({
      lines: quoteLines.map((line) => ({
        ...line,
        quoteId: quoteId,
        productUnitPrice: line.productUnitPrice != null ? parseFloat(line.productUnitPrice) : null,
        productUnitPriceOverride: line.productUnitPriceOverride != null ? parseFloat(line.productUnitPriceOverride) : null,
        quoteUnitPrice: line.quoteUnitPrice != null ? parseFloat(line.quoteUnitPrice) : null,
        unitPriceDiscountPercent: line.unitPriceDiscountPercent != null ? parseFloat(line.unitPriceDiscountPercent) : 0,
        unitPriceDiscountAmount: line.unitPriceDiscountAmount != null ? parseFloat(line.unitPriceDiscountAmount) : 0,
        finalUnitPrice: line.finalUnitPrice != null ? parseFloat(line.finalUnitPrice) : null,
        quotedQuantity: line.quotedQuantity != null ? parseFloat(line.quotedQuantity) : null,
        subtotalBeforeRowDiscounts: line.subtotalBeforeRowDiscounts != null ? parseFloat(line.subtotalBeforeRowDiscounts) : null,
        discountPercentOnSubtotal: line.discountPercentOnSubtotal != null ? parseFloat(line.discountPercentOnSubtotal) : 0,
        discountAmountOnSubtotal: line.discountAmountOnSubtotal != null ? parseFloat(line.discountAmountOnSubtotal) : 0,
        finalSubtotal: line.finalSubtotal != null ? parseFloat(line.finalSubtotal) : null,
        vatPercent: line.vatPercent != null ? parseFloat(line.vatPercent) : null,
        vatUnitAmount: line.vatUnitAmount != null ? parseFloat(line.vatUnitAmount) : null,
        vatOnSubtotal: line.vatOnSubtotal != null ? parseFloat(line.vatOnSubtotal) : null,
        grossSubtotal: line.grossSubtotal != null ? parseFloat(line.grossSubtotal) : null,
      })),
    });
  };

  const handleEditLines = () => {
    setIsEditingLines(true);
  };

  const handleAddLine = () => {
    append({
      quoteId: quoteId,
      productId: null,
      productName: null,
      productUnitPrice: null,
      unitPriceCurrency: null,
      productUnitPriceOverride: null,
      quoteUnitPrice: null,
      unitPriceDiscountPercent: 0,
      unitPriceDiscountAmount: 0,
      finalUnitPrice: null,
      salesUom: null,
      quotedQuantity: null,
      subtotalBeforeRowDiscounts: null,
      discountPercentOnSubtotal: 0,
      discountAmountOnSubtotal: 0,
      finalSubtotal: null,
      vatPercent: null,
      vatUnitAmount: null,
      vatOnSubtotal: null,
      grossSubtotal: null,
      quoteName: null,
    });
  };

  useEffect(() => {
    if (quoteLines.length > 0) {
      linesForm.reset({
        lines: quoteLines.map((line) => ({
          ...line,
          quoteId: quoteId,
          productUnitPrice: line.productUnitPrice != null ? parseFloat(line.productUnitPrice) : null,
          productUnitPriceOverride: line.productUnitPriceOverride != null ? parseFloat(line.productUnitPriceOverride) : null,
          quoteUnitPrice: line.quoteUnitPrice != null ? parseFloat(line.quoteUnitPrice) : null,
          unitPriceDiscountPercent: line.unitPriceDiscountPercent != null ? parseFloat(line.unitPriceDiscountPercent) : 0,
          unitPriceDiscountAmount: line.unitPriceDiscountAmount != null ? parseFloat(line.unitPriceDiscountAmount) : 0,
          finalUnitPrice: line.finalUnitPrice != null ? parseFloat(line.finalUnitPrice) : null,
          quotedQuantity: line.quotedQuantity != null ? parseFloat(line.quotedQuantity) : null,
          subtotalBeforeRowDiscounts: line.subtotalBeforeRowDiscounts != null ? parseFloat(line.subtotalBeforeRowDiscounts) : null,
          discountPercentOnSubtotal: line.discountPercentOnSubtotal != null ? parseFloat(line.discountPercentOnSubtotal) : 0,
          discountAmountOnSubtotal: line.discountAmountOnSubtotal != null ? parseFloat(line.discountAmountOnSubtotal) : 0,
          finalSubtotal: line.finalSubtotal != null ? parseFloat(line.finalSubtotal) : null,
          vatPercent: line.vatPercent != null ? parseFloat(line.vatPercent) : null,
          vatUnitAmount: line.vatUnitAmount != null ? parseFloat(line.vatUnitAmount) : null,
          vatOnSubtotal: line.vatOnSubtotal != null ? parseFloat(line.vatOnSubtotal) : null,
          grossSubtotal: line.grossSubtotal != null ? parseFloat(line.grossSubtotal) : null,
        })),
      });
    }
  }, [quoteLines, linesForm, quoteId]);

  // Close line editing when quote header editing starts
  useEffect(() => {
    if (isQuoteEditing && isEditingLines) {
      setIsEditingLines(false);
    }
  }, [isQuoteEditing, isEditingLines]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Package className="w-5 h-5" />
          <span>Products</span>
        </CardTitle>
        <div className="flex space-x-3">
          {isEditingLines ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelLines}
                disabled={batchSaveLinesMutation.isPending}
                data-testid="button-cancel-lines-edit"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={linesForm.handleSubmit(onSubmitLines)}
                disabled={batchSaveLinesMutation.isPending}
                data-testid="button-save-lines"
              >
                <Save className="w-4 h-4 mr-2" />
                {batchSaveLinesMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={handleEditLines}
              disabled={isQuoteEditing}
              data-testid="button-edit-lines"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Lines
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditingLines ? (
          <Form {...linesForm}>
            <form className="space-y-6">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>
                    No products added yet. Click "Add Line" to get
                    started.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <QuoteLineItem
                      key={field.id}
                      control={linesForm.control}
                      index={index}
                      onRemove={() => remove(index)}
                      setValue={linesForm.setValue}
                    />
                  ))}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddLine}
                data-testid="button-add-line"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Line
              </Button>
            </form>
          </Form>
        ) : (
          <div>
            {isLoadingLines ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading quote lines...
              </div>
            ) : quoteLines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No products added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quoteLines.map((line, index) => (
                  <div
                    key={line.id}
                    className="border rounded-lg p-4"
                    data-testid={`line-view-${index}`}
                  >
                    <h4 className="text-sm font-medium mb-3">
                      Line {index + 1}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="text-muted-foreground">
                          Product
                        </label>
                        <div className="font-medium">
                          {line.productName || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="text-muted-foreground">
                          Quantity
                        </label>
                        <div className="font-medium">
                          {line.quotedQuantity || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="text-muted-foreground">
                          Final Unit Price
                        </label>
                        <div className="font-medium">
                          {line.finalUnitPrice
                            ? `${line.finalUnitPrice} ${line.unitPriceCurrency || ""}`
                            : "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="text-muted-foreground">
                          Final Subtotal
                        </label>
                        <div className="font-medium">
                          {line.finalSubtotal
                            ? `${line.finalSubtotal} ${line.unitPriceCurrency || ""}`
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
