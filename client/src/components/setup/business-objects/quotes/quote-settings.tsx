import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SetupToggleLister from "@/components/setup/setup-toggle-lister";

export default function QuoteSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" data-testid="heading-quote-settings">
          Quote Settings
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure how your Quoting system should work
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Quote Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SetupToggleLister 
            settingPrefix="general_quote_setting"
            title=""
          />
        </CardContent>
      </Card>
    </div>
  );
}
