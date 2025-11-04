import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Company, insertCompanySchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Edit, Save, X, Eye, EyeOff, Map } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const aiServicesSchema = insertCompanySchema.partial().pick({
  openaiApiKey: true,
  openaiOrganizationId: true,
  openaiPreferredModel: true,
  tavilyApiKey: true,
});

type AIServicesFormData = z.infer<typeof aiServicesSchema>;

// Schema for Google Maps API Key
const googleMapsSchema = z.object({
  settingValue: z.string().optional(),
});

type GoogleMapsFormData = z.infer<typeof googleMapsSchema>;

// Type for company setting
type CompanySetting = {
  id: string;
  settingCode: string;
  settingName: string;
  settingValue: string | null;
  settingDescription: string | null;
};

export default function IntegrationsGeneral() {
  const [isEditingAI, setIsEditingAI] = useState(false);
  const [isEditingGoogleMaps, setIsEditingGoogleMaps] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showTavilyKey, setShowTavilyKey] = useState(false);
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const { toast } = useToast();

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/auth/my-company"],
  });

  // Query for Google Maps API key setting
  const { data: googleMapsSetting, isLoading: isLoadingGoogleMaps } = useQuery<CompanySetting>({
    queryKey: ["/api/business-objects/company-settings/by-code", "google_maps_api_key"],
    queryFn: async () => {
      const response = await fetch("/api/business-objects/company-settings/by-code/google_maps_api_key");
      if (!response.ok) {
        throw new Error("Failed to fetch Google Maps setting");
      }
      return response.json();
    },
  });

  const aiForm = useForm<AIServicesFormData>({
    resolver: zodResolver(aiServicesSchema),
    defaultValues: {
      openaiApiKey: "",
      openaiOrganizationId: "",
      openaiPreferredModel: "gpt-4o",
      tavilyApiKey: "",
    },
  });

  const googleMapsForm = useForm<GoogleMapsFormData>({
    resolver: zodResolver(googleMapsSchema),
    defaultValues: {
      settingValue: "",
    },
  });

  const updateAIMutation = useMutation({
    mutationFn: async (data: AIServicesFormData) => {
      const response = await apiRequest("PATCH", `/api/auth/my-company`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/my-company"] });
      toast({
        title: "Success",
        description: "AI services configuration updated successfully",
      });
      setIsEditingAI(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update AI services configuration",
        variant: "destructive",
      });
    },
  });

  const updateGoogleMapsMutation = useMutation({
    mutationFn: async (data: GoogleMapsFormData) => {
      if (!googleMapsSetting?.id) {
        throw new Error("Google Maps setting not found");
      }
      const response = await apiRequest("PATCH", `/api/business-objects/company-settings/${googleMapsSetting.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-objects/company-settings/by-code", "google_maps_api_key"] });
      toast({
        title: "Success",
        description: "Google Maps API key updated successfully",
      });
      setIsEditingGoogleMaps(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update Google Maps API key",
        variant: "destructive",
      });
    },
  });

  const handleEditAI = () => {
    if (company) {
      aiForm.reset({
        openaiApiKey: company.openaiApiKey || "",
        openaiOrganizationId: company.openaiOrganizationId || "",
        openaiPreferredModel: company.openaiPreferredModel || "gpt-4o",
        tavilyApiKey: company.tavilyApiKey || "",
      });
      setIsEditingAI(true);
    }
  };

  const handleEditGoogleMaps = () => {
    if (googleMapsSetting) {
      googleMapsForm.reset({
        settingValue: googleMapsSetting.settingValue || "",
      });
      setIsEditingGoogleMaps(true);
    }
  };

  const handleCancelAI = () => {
    setIsEditingAI(false);
    setShowApiKey(false);
    setShowTavilyKey(false);
    aiForm.reset();
  };

  const handleCancelGoogleMaps = () => {
    setIsEditingGoogleMaps(false);
    setShowGoogleMapsKey(false);
    googleMapsForm.reset();
  };

  const onSubmitAI = (data: AIServicesFormData) => {
    updateAIMutation.mutate(data);
  };

  const onSubmitGoogleMaps = (data: GoogleMapsFormData) => {
    updateGoogleMapsMutation.mutate(data);
  };

  if (isLoading || isLoadingGoogleMaps) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">External Systems Connection</h1>
          <p className="text-muted-foreground">
            Configure your company's external API integrations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>OpenAI Configuration</CardTitle>
              <CardDescription>
                Connect your company's OpenAI subscription to enable AI-powered features
              </CardDescription>
            </div>
            {!isEditingAI && (
              <Button
                onClick={handleEditAI}
                variant="outline"
                size="sm"
                data-testid="button-edit-ai-services"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingAI ? (
            <Form {...aiForm}>
              <form onSubmit={aiForm.handleSubmit(onSubmitAI)} className="space-y-6">
                <FormField
                  control={aiForm.control}
                  name="openaiApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormDescription>
                        Your OpenAI API key (starts with sk-). Keep this secure.
                      </FormDescription>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            value={field.value || ""}
                            type={showApiKey ? "text" : "password"}
                            placeholder="sk-..."
                            data-testid="input-openai-api-key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowApiKey(!showApiKey)}
                            data-testid="button-toggle-api-key-visibility"
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={aiForm.control}
                  name="openaiOrganizationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization ID (Optional)</FormLabel>
                      <FormDescription>
                        Required if your API key belongs to multiple organizations
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="org-..."
                          data-testid="input-openai-org-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={aiForm.control}
                  name="openaiPreferredModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Model</FormLabel>
                      <FormDescription>
                        The default GPT model to use for AI features
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "gpt-4o"}
                        data-testid="select-openai-model"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={aiForm.control}
                  name="tavilyApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tavily API Key (Required for Web Search)</FormLabel>
                      <FormDescription>
                        Your Tavily API key for web search functionality. Get one at tavily.com (free tier available)
                      </FormDescription>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            value={field.value || ""}
                            type={showTavilyKey ? "text" : "password"}
                            placeholder="tvly-..."
                            data-testid="input-tavily-api-key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowTavilyKey(!showTavilyKey)}
                            data-testid="button-toggle-tavily-key-visibility"
                          >
                            {showTavilyKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateAIMutation.isPending}
                    data-testid="button-save-ai-services"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateAIMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelAI}
                    disabled={updateAIMutation.isPending}
                    data-testid="button-cancel-ai-services"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  API Key
                </h3>
                <p className="text-sm" data-testid="text-api-key-status">
                  {company?.openaiApiKey
                    ? "••••••••••••••••••••••••"
                    : "Not configured"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Organization ID
                </h3>
                <p className="text-sm" data-testid="text-org-id">
                  {company?.openaiOrganizationId || "Not set"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Preferred Model
                </h3>
                <p className="text-sm" data-testid="text-preferred-model">
                  {company?.openaiPreferredModel || "gpt-4o"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Tavily API Key (Web Search)
                </h3>
                <p className="text-sm" data-testid="text-tavily-key-status">
                  {company?.tavilyApiKey
                    ? "••••••••••••••••••••••••"
                    : "Not configured"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About OpenAI Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This integration allows your company to use AI-powered features throughout the
            application using your own OpenAI subscription.
          </p>
          <p>
            <strong>Current Features:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Account Data Finder: Automatically search for company registration IDs</li>
            <li>Digital Office: AI assistants for various business roles</li>
          </ul>
          <p className="mt-4">
            <strong>To get started:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Sign up for an OpenAI account at platform.openai.com</li>
            <li>Generate an API key from your account settings</li>
            <li>Enter the API key above to enable AI features</li>
          </ol>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Google Maps Integration
              </CardTitle>
              <CardDescription>
                Connect your Google Maps API key to enable address autocomplete and mapping features
              </CardDescription>
            </div>
            {!isEditingGoogleMaps && (
              <Button
                onClick={handleEditGoogleMaps}
                variant="outline"
                size="sm"
                data-testid="button-edit-google-maps"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingGoogleMaps ? (
            <Form {...googleMapsForm}>
              <form onSubmit={googleMapsForm.handleSubmit(onSubmitGoogleMaps)} className="space-y-6">
                <FormField
                  control={googleMapsForm.control}
                  name="settingValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps API Key</FormLabel>
                      <FormDescription>
                        Your Google Maps JavaScript API key. Get one from Google Cloud Console.
                      </FormDescription>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            value={field.value || ""}
                            type={showGoogleMapsKey ? "text" : "password"}
                            placeholder="AIza..."
                            data-testid="input-google-maps-api-key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
                            data-testid="button-toggle-google-maps-key-visibility"
                          >
                            {showGoogleMapsKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateGoogleMapsMutation.isPending}
                    data-testid="button-save-google-maps"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateGoogleMapsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelGoogleMaps}
                    disabled={updateGoogleMapsMutation.isPending}
                    data-testid="button-cancel-google-maps"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  API Key
                </h3>
                <p className="text-sm" data-testid="text-google-maps-key-status">
                  {googleMapsSetting?.settingValue
                    ? "••••••••••••••••••••••••"
                    : "Not configured"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Google Maps Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This integration enables Google Maps features in your account management system.
          </p>
          <p>
            <strong>Current Features:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Address Autocomplete: Search and select addresses with structured fields</li>
            <li>Google Maps Links: Click addresses to view them on Google Maps</li>
          </ul>
          <p className="mt-4">
            <strong>To get started:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to Google Cloud Console (console.cloud.google.com)</li>
            <li>Create a new project or select an existing one</li>
            <li>Enable the "Maps JavaScript API" and "Places API"</li>
            <li>Create an API key in the Credentials section</li>
            <li>Enter the API key above to enable mapping features</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
