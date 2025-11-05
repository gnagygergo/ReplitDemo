import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SetupToggleLister from "@/components/setup/setup-toggle-lister";

export default function StandardAIServices() {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-3xl font-bold"
          data-testid="heading-opportunity-settings"
        >
          Standard AI Services
        </h2>
        <p className="text-muted-foreground mt-2">
          Activate and train your standard AI Agents and Bots
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Services for Account Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SetupToggleLister 
            settingPrefix="account_data_web_search"
            title=""
          />
        </CardContent>
      </Card>
    </div>
  );
}
