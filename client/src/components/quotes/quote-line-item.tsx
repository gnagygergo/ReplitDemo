import { useEffect, useRef } from "react";
import { Control, useWatch, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Trash2 } from "lucide-react";

interface QuoteLineItemProps {
  control: Control<any>;
  index: number;
  onRemove: () => void;
  setValue: UseFormSetValue<any>;
}

export function QuoteLineItem({ control, index, onRemove, setValue }: QuoteLineItemProps) {
  const lastEditedDiscountField = useRef<'percent' | 'amount' | null>(null);
  const isInitialLoad = useRef(true);
  const isInitializing = useRef(false);

  const productUnitPrice = useWatch({
    control,
    name: `lines.${index}.productUnitPrice`,
  });

  const productUnitPriceOverride = useWatch({
    control,
    name: `lines.${index}.productUnitPriceOverride`,
  });

  const unitPriceDiscountPercent = useWatch({
    control,
    name: `lines.${index}.unitPriceDiscountPercent`,
  });

  const unitPriceDiscountAmount = useWatch({
    control,
    name: `lines.${index}.unitPriceDiscountAmount`,
  });

  const quoteUnitPrice = useWatch({
    control,
    name: `lines.${index}.quoteUnitPrice`,
  });

  const finalUnitPrice = useWatch({
    control,
    name: `lines.${index}.finalUnitPrice`,
  });

  const safeParseFloat = (value: any): number => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  useEffect(() => {
    const override = safeParseFloat(productUnitPriceOverride);
    const base = safeParseFloat(productUnitPrice);
    const calculatedQuotePrice = (productUnitPriceOverride !== null && productUnitPriceOverride !== undefined && productUnitPriceOverride !== '') ? override : base;

    const currentQuotePrice = safeParseFloat(quoteUnitPrice);
    
    if (!(isInitialLoad.current && currentQuotePrice > 0)) {
      if (Math.abs(calculatedQuotePrice - currentQuotePrice) > 0.001) {
        setValue(`lines.${index}.quoteUnitPrice`, calculatedQuotePrice.toFixed(3), { shouldDirty: false });
      }
    }

    const discountAmt = safeParseFloat(unitPriceDiscountAmount);
    const calculatedFinalPrice = calculatedQuotePrice - discountAmt;
    const currentFinalPrice = safeParseFloat(finalUnitPrice);

    if (Math.abs(calculatedFinalPrice - currentFinalPrice) > 0.001) {
      setValue(`lines.${index}.finalUnitPrice`, calculatedFinalPrice.toFixed(3), { shouldDirty: false });
    }
  }, [productUnitPrice, productUnitPriceOverride, unitPriceDiscountAmount, quoteUnitPrice, finalUnitPrice, index, setValue]);

  useEffect(() => {
    if (isInitializing.current) return;
    
    if (lastEditedDiscountField.current === 'percent') {
      const override = safeParseFloat(productUnitPriceOverride);
      const base = safeParseFloat(productUnitPrice);
      const quotePrice = (productUnitPriceOverride !== null && productUnitPriceOverride !== undefined && productUnitPriceOverride !== '') ? override : base;
      const percent = safeParseFloat(unitPriceDiscountPercent);
      const amount = (quotePrice * percent) / 100;
      setValue(`lines.${index}.unitPriceDiscountAmount`, amount.toFixed(3), { shouldDirty: false });
      lastEditedDiscountField.current = null;
    }
  }, [unitPriceDiscountPercent, productUnitPrice, productUnitPriceOverride, index, setValue]);

  useEffect(() => {
    if (isInitializing.current) return;
    
    if (lastEditedDiscountField.current === 'amount') {
      const override = safeParseFloat(productUnitPriceOverride);
      const base = safeParseFloat(productUnitPrice);
      const quotePrice = (productUnitPriceOverride !== null && productUnitPriceOverride !== undefined && productUnitPriceOverride !== '') ? override : base;
      const amount = safeParseFloat(unitPriceDiscountAmount);
      const percent = quotePrice > 0 ? (amount / quotePrice) * 100 : 0;
      setValue(`lines.${index}.unitPriceDiscountPercent`, percent.toFixed(3), { shouldDirty: false });
      lastEditedDiscountField.current = null;
    }
  }, [unitPriceDiscountAmount, productUnitPrice, productUnitPriceOverride, index, setValue]);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitializing.current = true;
      
      const percent = safeParseFloat(unitPriceDiscountPercent);
      const amount = safeParseFloat(unitPriceDiscountAmount);
      const override = safeParseFloat(productUnitPriceOverride);
      const base = safeParseFloat(productUnitPrice);
      const quotePrice = (productUnitPriceOverride !== null && productUnitPriceOverride !== undefined && productUnitPriceOverride !== '') ? override : base;

      if (percent === 0 && amount > 0 && quotePrice > 0) {
        const calculatedPercent = (amount / quotePrice) * 100;
        setValue(`lines.${index}.unitPriceDiscountPercent`, calculatedPercent.toFixed(3), { shouldDirty: false });
      } else if (amount === 0 && percent > 0 && quotePrice > 0) {
        const calculatedAmount = (quotePrice * percent) / 100;
        setValue(`lines.${index}.unitPriceDiscountAmount`, calculatedAmount.toFixed(3), { shouldDirty: false });
      }

      isInitialLoad.current = false;
      isInitializing.current = false;
    }
  }, [unitPriceDiscountPercent, unitPriceDiscountAmount, productUnitPrice, productUnitPriceOverride, index, setValue]);

  return (
    <div
      className="border rounded-lg p-4 space-y-4 relative"
      data-testid={`line-section-${index}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium">Line {index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          data-testid={`button-remove-line-${index}`}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      {/* Row 1: Product and Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormField
          control={control}
          name={`lines.${index}.productName`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  placeholder="Product name"
                  data-testid={`input-line-${index}-product-name`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.productUnitPrice`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Product Unit Price</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  disabled
                  data-testid={`input-line-${index}-product-unit-price`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.unitPriceCurrency`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  placeholder="USD"
                  disabled
                  data-testid={`input-line-${index}-currency`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.productUnitPriceOverride`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Product Unit Price Override</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-product-unit-price-override`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 2: Quote Price and Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <FormField
          control={control}
          name={`lines.${index}.quoteUnitPrice`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Quote Unit Price</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  disabled
                  data-testid={`input-line-${index}-quote-unit-price`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.unitPriceDiscountPercent`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Discount %</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value ?? 0}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  onChange={(e) => {
                    lastEditedDiscountField.current = 'percent';
                    f.onChange(e);
                  }}
                  data-testid={`input-line-${index}-discount-percent`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.unitPriceDiscountAmount`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Discount Amount</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value ?? 0}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  onChange={(e) => {
                    lastEditedDiscountField.current = 'amount';
                    f.onChange(e);
                  }}
                  data-testid={`input-line-${index}-discount-amount`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.finalUnitPrice`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Final Unit Price</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  disabled
                  data-testid={`input-line-${index}-final-unit-price`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.quotedQuantity`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="1"
                  data-testid={`input-line-${index}-quantity`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: Subtotals and VAT */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <FormField
          control={control}
          name={`lines.${index}.salesUom`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>UOM</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  placeholder="Unit"
                  data-testid={`input-line-${index}-uom`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.subtotalBeforeRowDiscounts`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Subtotal Before Discounts</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-subtotal-before-discounts`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.discountPercentOnSubtotal`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Row Discount %</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-row-discount-percent`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.discountAmountOnSubtotal`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Row Discount Amount</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-row-discount-amount`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.finalSubtotal`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Final Subtotal</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-final-subtotal`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.vatPercent`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>VAT %</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-vat-percent`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 4: VAT Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control}
          name={`lines.${index}.vatUnitAmount`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>VAT Unit Amount</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-vat-unit-amount`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.vatOnSubtotal`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>VAT on Subtotal</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-vat-on-subtotal`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.grossSubtotal`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel>Gross Subtotal</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="0.001"
                  placeholder="0.00"
                  data-testid={`input-line-${index}-gross-subtotal`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
