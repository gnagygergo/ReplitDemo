import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SetupToggleLister from "@/components/setup/setup-toggle-lister";

export default function CompanyDefaultSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-3xl font-bold"
          data-testid="heading-opportunity-settings"
        >
          Your Company's Default Settings
        </h2>
        <p className="text-muted-foreground mt-2">
          Currency, Language, and other default settings for your company.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Currency settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SetupToggleLister
            settingPrefix="currency_setting"
            title=""
          />
        </CardContent>
      </Card>
    </div>
  );
}
