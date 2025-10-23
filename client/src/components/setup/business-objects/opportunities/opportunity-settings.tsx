import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SetupToggleLister from "@/components/setup/setup-toggle-lister";

export default function OpportunitySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" data-testid="heading-opportunity-settings">
          Quote Settings
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure the basics of your Opportunity Management
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Opportunity Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SetupToggleLister 
            settingPrefix="general_opportunity_setting"
            title=""
          />
        </CardContent>
      </Card>
    </div>
  );
}
