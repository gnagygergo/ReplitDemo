import { useEffect, useRef, useState } from "react";
import { Control, useWatch, UseFormSetValue } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Trash2, Search } from "lucide-react";
import { type Product, type UnitOfMeasure, type CompanySettingWithMaster } from "@shared/schema";
import ProductLookupDialog from "@/components/ui/product-lookup-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuoteLineItemProps {
  control: Control<any>;
  index: number;
  onRemove: () => void;
  setValue: UseFormSetValue<any>;
}

export function QuoteLineItem({ control, index, onRemove, setValue }: QuoteLineItemProps) {
  const [showProductLookup, setShowProductLookup] = useState(false);
  const lastEditedDiscountField = useRef<'percent' | 'amount' | null>(null);
  const lastEditedSubtotalDiscountField = useRef<'percent' | 'amount' | null>(null);
  const isInitialLoad = useRef(true);
  const isInitialSubtotalLoad = useRef(true);
  const isInitializing = useRef(false);
  const isInitializingSubtotal = useRef(false);

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

  const quotedQuantity = useWatch({
    control,
    name: `lines.${index}.quotedQuantity`,
  });

  const subtotalBeforeRowDiscounts = useWatch({
    control,
    name: `lines.${index}.subtotalBeforeRowDiscounts`,
  });

  const discountPercentOnSubtotal = useWatch({
    control,
    name: `lines.${index}.discountPercentOnSubtotal`,
  });

  const discountAmountOnSubtotal = useWatch({
    control,
    name: `lines.${index}.discountAmountOnSubtotal`,
  });

  const finalSubtotal = useWatch({
    control,
    name: `lines.${index}.finalSubtotal`,
  });

  const vatPercent = useWatch({
    control,
    name: `lines.${index}.vatPercent`,
  });

  const vatUnitAmount = useWatch({
    control,
    name: `lines.${index}.vatUnitAmount`,
  });

  const vatOnSubtotal = useWatch({
    control,
    name: `lines.${index}.vatOnSubtotal`,
  });

  const grossSubtotal = useWatch({
    control,
    name: `lines.${index}.grossSubtotal`,
  });

  const productId = useWatch({
    control,
    name: `lines.${index}.productId`,
  });

  const salesUom = useWatch({
    control,
    name: `lines.${index}.salesUom`,
  });

  // Fetch unit of measures
  const { data: unitOfMeasures = [] } = useQuery<UnitOfMeasure[]>({
    queryKey: ["/api/unit-of-measures"],
  });

  // Fetch selected product to get its sales UoM type
  const { data: selectedProduct } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  // Fetch discount settings
  const { data: discountSettings = [] } = useQuery<CompanySettingWithMaster[]>({
    queryKey: ["/api/business-objects/company-settings/by-prefix/discount_setting"],
  });

  // Extract setting values (uppercase TRUE/FALSE)
  // Default to true if setting not found to preserve existing behavior
  const unitPriceDiscountSetting = discountSettings.find(
    s => s.settingCode === "discount_setting_show_unit_price_discount"
  );
  const showUnitPriceDiscount = unitPriceDiscountSetting?.settingValue !== "FALSE";

  const rowDiscountSetting = discountSettings.find(
    s => s.settingCode === "discount_setting_show_row_discount"
  );
  const showRowDiscount = rowDiscountSetting?.settingValue !== "FALSE";

  // Get the type of the selected product's sales UoM
  const productUomType = selectedProduct?.salesUomId
    ? unitOfMeasures.find((uom) => uom.id === selectedProduct.salesUomId)?.type
    : null;

  // Filter UoMs by product's sales UoM type
  const filteredUnitOfMeasures = productUomType
    ? unitOfMeasures.filter((uom) => uom.type === productUomType)
    : unitOfMeasures;

  const safeParseFloat = (value: any): number => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleProductSelect = (product: Product) => {
    setValue(`lines.${index}.productId`, product.id, { shouldDirty: true });
    setValue(`lines.${index}.productName`, product.productName, { shouldDirty: true });
    setValue(`lines.${index}.productUnitPrice`, product.salesUnitPrice, { shouldDirty: true });
    setValue(`lines.${index}.unitPriceCurrency`, product.salesUnitPriceCurrency, { shouldDirty: true });
    setValue(`lines.${index}.vatPercent`, product.vatPercent, { shouldDirty: true });
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

  // Subtotal before row discounts = Quoted Quantity × Final Unit Price
  useEffect(() => {
    const quantity = safeParseFloat(quotedQuantity);
    const finalPrice = safeParseFloat(finalUnitPrice);
    const calculatedSubtotal = quantity * finalPrice;
    const currentSubtotal = safeParseFloat(subtotalBeforeRowDiscounts);

    if (Math.abs(calculatedSubtotal - currentSubtotal) > 0.001) {
      setValue(`lines.${index}.subtotalBeforeRowDiscounts`, calculatedSubtotal.toFixed(3), { shouldDirty: false });
    }
  }, [quotedQuantity, finalUnitPrice, subtotalBeforeRowDiscounts, index, setValue]);

  // Discount percent on subtotal → amount
  useEffect(() => {
    if (isInitializingSubtotal.current) return;
    
    if (lastEditedSubtotalDiscountField.current === 'percent') {
      const subtotal = safeParseFloat(subtotalBeforeRowDiscounts);
      const percent = safeParseFloat(discountPercentOnSubtotal);
      const amount = (subtotal * percent) / 100;
      setValue(`lines.${index}.discountAmountOnSubtotal`, amount.toFixed(3), { shouldDirty: false });
      lastEditedSubtotalDiscountField.current = null;
    }
  }, [discountPercentOnSubtotal, subtotalBeforeRowDiscounts, index, setValue]);

  // Discount amount on subtotal → percent
  useEffect(() => {
    if (isInitializingSubtotal.current) return;
    
    if (lastEditedSubtotalDiscountField.current === 'amount') {
      const subtotal = safeParseFloat(subtotalBeforeRowDiscounts);
      const amount = safeParseFloat(discountAmountOnSubtotal);
      const percent = subtotal > 0 ? (amount / subtotal) * 100 : 0;
      setValue(`lines.${index}.discountPercentOnSubtotal`, percent.toFixed(3), { shouldDirty: false });
      lastEditedSubtotalDiscountField.current = null;
    }
  }, [discountAmountOnSubtotal, subtotalBeforeRowDiscounts, index, setValue]);

  // Initial load: calculate missing subtotal discount field
  useEffect(() => {
    if (isInitialSubtotalLoad.current) {
      isInitializingSubtotal.current = true;
      
      const percent = safeParseFloat(discountPercentOnSubtotal);
      const amount = safeParseFloat(discountAmountOnSubtotal);
      const subtotal = safeParseFloat(subtotalBeforeRowDiscounts);

      if (percent === 0 && amount > 0 && subtotal > 0) {
        const calculatedPercent = (amount / subtotal) * 100;
        setValue(`lines.${index}.discountPercentOnSubtotal`, calculatedPercent.toFixed(3), { shouldDirty: false });
      } else if (amount === 0 && percent > 0 && subtotal > 0) {
        const calculatedAmount = (subtotal * percent) / 100;
        setValue(`lines.${index}.discountAmountOnSubtotal`, calculatedAmount.toFixed(3), { shouldDirty: false });
      }

      isInitialSubtotalLoad.current = false;
      isInitializingSubtotal.current = false;
    }
  }, [discountPercentOnSubtotal, discountAmountOnSubtotal, subtotalBeforeRowDiscounts, index, setValue]);

  // Final subtotal = Subtotal before row discounts - Discount amount on subtotal
  useEffect(() => {
    const subtotal = safeParseFloat(subtotalBeforeRowDiscounts);
    const discount = safeParseFloat(discountAmountOnSubtotal);
    const calculatedFinalSubtotal = subtotal - discount;
    const currentFinalSubtotal = safeParseFloat(finalSubtotal);

    if (Math.abs(calculatedFinalSubtotal - currentFinalSubtotal) > 0.001) {
      setValue(`lines.${index}.finalSubtotal`, calculatedFinalSubtotal.toFixed(3), { shouldDirty: false });
    }
  }, [subtotalBeforeRowDiscounts, discountAmountOnSubtotal, finalSubtotal, index, setValue]);

  // VAT unit amount = Final Unit Price × (VAT percent/100)
  useEffect(() => {
    const finalPrice = safeParseFloat(finalUnitPrice);
    const vat = safeParseFloat(vatPercent);
    const calculatedVatUnit = (finalPrice * vat) / 100;
    const currentVatUnit = safeParseFloat(vatUnitAmount);

    if (Math.abs(calculatedVatUnit - currentVatUnit) > 0.001) {
      setValue(`lines.${index}.vatUnitAmount`, calculatedVatUnit.toFixed(3), { shouldDirty: false });
    }
  }, [finalUnitPrice, vatPercent, vatUnitAmount, index, setValue]);

  // VAT on subtotal = VAT unit amount × Quoted Quantity
  useEffect(() => {
    const vatUnit = safeParseFloat(vatUnitAmount);
    const quantity = safeParseFloat(quotedQuantity);
    const calculatedVatSubtotal = vatUnit * quantity;
    const currentVatSubtotal = safeParseFloat(vatOnSubtotal);

    if (Math.abs(calculatedVatSubtotal - currentVatSubtotal) > 0.001) {
      setValue(`lines.${index}.vatOnSubtotal`, calculatedVatSubtotal.toFixed(3), { shouldDirty: false });
    }
  }, [vatUnitAmount, quotedQuantity, vatOnSubtotal, index, setValue]);

  // Gross Subtotal = Final subtotal + VAT on subtotal
  useEffect(() => {
    const finalSub = safeParseFloat(finalSubtotal);
    const vatSub = safeParseFloat(vatOnSubtotal);
    const calculatedGross = finalSub + vatSub;
    const currentGross = safeParseFloat(grossSubtotal);

    if (Math.abs(calculatedGross - currentGross) > 0.001) {
      setValue(`lines.${index}.grossSubtotal`, calculatedGross.toFixed(3), { shouldDirty: false });
    }
  }, [finalSubtotal, vatOnSubtotal, grossSubtotal, index, setValue]);

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

      {/* Hidden Product ID field */}
      <FormField
        control={control}
        name={`lines.${index}.productId`}
        render={({ field: f }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input {...f} value={f.value || ""} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Row 1: Magnifier, Product Name, Unit Price, Currency, Price Override */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <FormItem className="md:col-span-1 flex items-end">
          <FormLabel className="sr-only">Product Lookup</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => setShowProductLookup(true)}
            data-testid={`button-product-lookup-${index}`}
          >
            <Search className="w-4 h-4" />
          </Button>
        </FormItem>

        <FormField
          control={control}
          name={`lines.${index}.productName`}
          render={({ field: f }) => (
            <FormItem className="md:col-span-6">
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  placeholder="Product name"
                  onClick={(e) => e.currentTarget.select()}
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
            <FormItem className="md:col-span-2">
              <FormLabel>Product Unit Price</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="1"
                  placeholder="0.00"
                  disabled
                  className="disabled:opacity-100"
                  onClick={(e) => e.currentTarget.select()}
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
            <FormItem className="md:col-span-1">
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  placeholder="USD"
                  disabled
                  className="disabled:opacity-100"
                  onClick={(e) => e.currentTarget.select()}
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
            <FormItem className="md:col-span-2">
              <FormLabel>Unit Price Override</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="1"
                  placeholder="0.00"
                  onClick={(e) => e.currentTarget.select()}
                  data-testid={`input-line-${index}-product-unit-price-override`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Hidden Quote Unit Price field */}
      <FormField
        control={control}
        name={`lines.${index}.quoteUnitPrice`}
        render={({ field: f }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input {...f} value={f.value || ""} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Row 2: Discount fields, Final Unit Price, Quantity, UoM */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {showUnitPriceDiscount && (
          <>
            <FormField
              control={control}
              name={`lines.${index}.unitPriceDiscountPercent`}
              render={({ field: f }) => (
                <FormItem className="md:col-start-2 md:col-span-2">
                  <FormLabel>Discount %</FormLabel>
                  <FormControl>
                    <Input
                      {...f}
                      value={f.value ?? 0}
                      type="number"
                      step="1"
                      placeholder="0.00"
                      onChange={(e) => {
                        lastEditedDiscountField.current = 'percent';
                        f.onChange(e);
                      }}
                      onClick={(e) => e.currentTarget.select()}
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
                <FormItem className="md:col-span-2">
                  <FormLabel>Discount Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...f}
                      value={f.value ?? 0}
                      type="number"
                      step="1"
                      placeholder="0.00"
                      onChange={(e) => {
                        lastEditedDiscountField.current = 'amount';
                        f.onChange(e);
                      }}
                      onClick={(e) => e.currentTarget.select()}
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
                <FormItem className="md:col-span-2">
                  <FormLabel>Final Unit Price</FormLabel>
                  <FormControl>
                    <Input
                      {...f}
                      value={f.value || ""}
                      type="number"
                      step="1"
                      placeholder="0.00"
                      disabled
                      className="disabled:opacity-100"
                      onClick={(e) => e.currentTarget.select()}
                      data-testid={`input-line-${index}-final-unit-price`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={control}
          name={`lines.${index}.quotedQuantity`}
          render={({ field: f }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="1"
                  placeholder="1"
                  onClick={(e) => e.currentTarget.select()}
                  data-testid={`input-line-${index}-quantity`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.salesUom`}
          render={({ field: f }) => (
            <FormItem className="md:col-span-1">
              <FormLabel>UoM</FormLabel>
              <Select
                value={f.value || ""}
                onValueChange={f.onChange}
                disabled={!productId}
              >
                <FormControl>
                  <SelectTrigger data-testid={`select-line-${index}-uom`}>
                    <SelectValue placeholder="UoM" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredUnitOfMeasures.map((uom) => (
                    <SelectItem key={uom.id} value={uom.uomName}>
                      {uom.uomName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
            
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.subtotalBeforeRowDiscounts`}
          render={({ field: f }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Subtotal Before Discounts</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="1"
                  placeholder="0.00"
                  disabled
                  className="disabled:opacity-100"
                  onClick={(e) => e.currentTarget.select()}
                  data-testid={`input-line-${index}-subtotal-before-discounts`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 3: Subtotal before discount, row discount, row discount amount, final subtotal */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {showRowDiscount && (
          <>
            <FormField
              control={control}
              name={`lines.${index}.discountPercentOnSubtotal`}
              render={({ field: f }) => (
                <FormItem className="md:col-start-2 md:col-span-2">
                  <FormLabel>Row Discount %</FormLabel>
                  <FormControl>
                    <Input
                      {...f}
                      value={f.value ?? 0}
                      type="number"
                      step="1"
                      placeholder="0.00"
                      onChange={(e) => {
                        lastEditedSubtotalDiscountField.current = 'percent';
                        f.onChange(e);
                      }}
                      onClick={(e) => e.currentTarget.select()}
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
                <FormItem className="md:col-span-2">
                  <FormLabel>Row Discount Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...f}
                      value={f.value ?? 0}
                      type="number"
                      step="1"
                      placeholder="0.00"
                      onChange={(e) => {
                        lastEditedSubtotalDiscountField.current = 'amount';
                        f.onChange(e);
                      }}
                      onClick={(e) => e.currentTarget.select()}
                      data-testid={`input-line-${index}-row-discount-amount`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={control}
          name={`lines.${index}.finalSubtotal`}
          render={({ field: f }) => (
            <FormItem className="md:col-start-11 md:col-span-2">
              <FormLabel>Final Subtotal</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="1"
                  placeholder="0.00"
                  disabled
                  className="disabled:opacity-100"
                  onClick={(e) => e.currentTarget.select()}
                  data-testid={`input-line-${index}-final-subtotal`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Row 4: VAT%, VAT Unit Amount, VAT on subtotal, Gross Subtotal */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <FormField
          control={control}
          name={`lines.${index}.vatPercent`}
          render={({ field: f }) => (
            <FormItem className="md:col-start-2 md:col-span-2">
              <FormLabel>VAT %</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value ?? 0}
                  type="number"
                  step="1"
                  placeholder="0.00"
                  className="disabled:opacity-100"
                  onClick={(e) => e.currentTarget.select()}
                  data-testid={`input-line-${index}-vat-percent`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`lines.${index}.vatUnitAmount`}
          render={({ field: f }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>VAT Unit Amount</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="1"
                  placeholder="0.00"
                  disabled
                  className="disabled:opacity-100"
                  onClick={(e) => e.currentTarget.select()}
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
            <FormItem className="md:col-span-2">
              <FormLabel>VAT on Subtotal</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="1"
                  placeholder="0.00"
                  disabled
                  className="disabled:opacity-100"
                  onClick={(e) => e.currentTarget.select()}
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
            <FormItem className="md:col-start-11 md:col-span-2">
              <FormLabel>Gross Subtotal</FormLabel>
              <FormControl>
                <Input
                  {...f}
                  value={f.value || ""}
                  type="number"
                  step="1"
                  placeholder="0.00"
                  disabled
                  className="disabled:opacity-100"
                  onClick={(e) => e.currentTarget.select()}
                  data-testid={`input-line-${index}-gross-subtotal`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Product Lookup Dialog */}
      <ProductLookupDialog
        open={showProductLookup}
        onClose={() => setShowProductLookup(false)}
        onSelect={handleProductSelect}
        selectedProductId={productId || undefined}
      />
    </div>
  );
}
