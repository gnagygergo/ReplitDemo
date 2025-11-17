import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  filePath: string;
}

function CustomFieldBuilder() {
  const [selectedObject, setSelectedObject] = useState<string>("assets");

  const { data: fieldDefinitions, isLoading, error } = useQuery<FieldDefinition[]>({
    queryKey: ["/api/object-fields", selectedObject],
    queryFn: async () => {
      const response = await fetch(`/api/object-fields/${selectedObject}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch field definitions");
      }
      return response.json();
    },
    enabled: !!selectedObject,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Custom Field Builder</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Object Selection Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="object-select" className="text-muted-foreground">
            Select Object
          </Label>
          <Select
            value={selectedObject}
            onValueChange={setSelectedObject}
          >
            <SelectTrigger id="object-select" data-testid="select-object" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assets">Assets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Object Field List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Field Definitions</h3>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="border rounded-md p-6 text-center">
              <p className="text-destructive" data-testid="error-message">
                Error loading field definitions: {error.message}
              </p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-field-type">Field Type</TableHead>
                    <TableHead data-testid="header-field-code">Field Code</TableHead>
                    <TableHead data-testid="header-label">Label</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!fieldDefinitions || fieldDefinitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground" data-testid="empty-state">
                        No field definitions found for {selectedObject}
                      </TableCell>
                    </TableRow>
                  ) : (
                    fieldDefinitions.map((field, index) => (
                      <TableRow key={`${field.apiCode}-${index}`} data-testid={`row-field-${field.apiCode}`}>
                        <TableCell data-testid={`cell-type-${field.apiCode}`}>
                          {field.type}
                        </TableCell>
                        <TableCell data-testid={`cell-code-${field.apiCode}`}>
                          {field.apiCode}
                        </TableCell>
                        <TableCell data-testid={`cell-label-${field.apiCode}`}>
                          {field.label}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BusinessObjectsBuilderModule() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Object and Process Builder</h2>
        <p className="text-muted-foreground">Define custom fields, layouts, and business processes</p>
      </div>
      <CustomFieldBuilder />
    </div>
  );
}
