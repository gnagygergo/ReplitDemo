import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SetupToggleLister from "@/components/setup/setup-toggle-lister";

export default function PricingMethods() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" data-testid="heading-quote-settings">
          Pricing Methods
        </h2>
        <p className="text-muted-foreground mt-2">
          Discounts, scale pricing, collar prices, etc.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discount settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SetupToggleLister 
            settingPrefix="discount_setting"
            title=""
          />
        </CardContent>
      </Card>
    </div>
  );
}
