import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package, ArrowLeft } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { CustomFieldBuilder } from "./business-objects-builder-module";

interface ObjectDefinition {
  apiCode: string;
  labelPlural: string;
  labelSingular: string;
  iconSet: string;
  icon: string;
}

export function ObjectBuilder() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObject, setSelectedObject] = useState<ObjectDefinition | null>(null);

  const { data: objects, isLoading } = useQuery<ObjectDefinition[]>({
    queryKey: ["/api/object-definitions"],
    queryFn: async () => {
      const response = await fetch("/api/object-definitions", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch object definitions");
      }
      return response.json();
    },
  });

  const filteredObjects = objects?.filter((obj) =>
    obj.labelPlural.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obj.labelSingular.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obj.apiCode.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Package;
    return Icon;
  };

  if (selectedObject) {
    const Icon = getIcon(selectedObject.icon);
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedObject(null)}
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle data-testid="text-object-detail-title">{selectedObject.labelPlural}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedObject.apiCode}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="object-details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="object-details" data-testid="tab-object-details">
                Object Details
              </TabsTrigger>
              <TabsTrigger value="fields" data-testid="tab-fields">
                Fields
              </TabsTrigger>
              <TabsTrigger value="layouts" data-testid="tab-layouts">
                Layouts
              </TabsTrigger>
            </TabsList>
            <TabsContent value="object-details" className="mt-6">
              <div className="text-center py-12 text-muted-foreground" data-testid="content-object-details">
                <p>Object details configuration coming soon</p>
              </div>
            </TabsContent>
            <TabsContent value="fields" className="mt-6">
              <CustomFieldBuilder selectedObject={selectedObject.apiCode} />
            </TabsContent>
            <TabsContent value="layouts" className="mt-6">
              <div className="text-center py-12 text-muted-foreground" data-testid="content-layouts">
                <p>Layout configuration coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Object Builder</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your business objects and their configurations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-objects"
          />
        </div>

        {/* Object Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? (
              <p data-testid="text-no-results">No objects found matching "{searchTerm}"</p>
            ) : (
              <p data-testid="text-no-objects">No business objects defined yet</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredObjects.map((obj) => {
              const Icon = getIcon(obj.icon);
              return (
                <Card
                  key={obj.apiCode}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedObject(obj)}
                  data-testid={`card-object-${obj.apiCode}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1" data-testid={`text-object-label-${obj.apiCode}`}>
                          {obj.labelPlural}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-object-code-${obj.apiCode}`}>
                          {obj.apiCode}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
