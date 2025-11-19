import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { CreateEditFieldDialog } from "./create-edit-field-dialog";
import { ObjectBuilder } from "./object-builder";

interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  filePath: string;
}

interface CustomFieldBuilderProps {
  selectedObject: string;
}

export function CustomFieldBuilder({ selectedObject }: CustomFieldBuilderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<FieldDefinition | null>(null);

  const handleAddField = () => {
    setFieldToEdit(null);
    setDialogOpen(true);
  };

  const handleEditField = (field: FieldDefinition) => {
    setFieldToEdit(field);
    setDialogOpen(true);
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Field Definitions</h3>
        <Button onClick={handleAddField} data-testid="button-add-field">
          <Plus className="h-4 w-4 mr-2" />
          Add New Field
        </Button>
      </div>

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
                <TableHead className="w-24" data-testid="header-actions">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!fieldDefinitions || fieldDefinitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground" data-testid="empty-state">
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField(field)}
                        data-testid={`button-edit-${field.apiCode}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateEditFieldDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        objectName={selectedObject}
        fieldToEdit={fieldToEdit}
      />
    </div>
  );
}

export default function BusinessObjectsBuilderModule() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Object and Process Builder</h2>
        <p className="text-muted-foreground">Define custom fields, layouts, and business processes</p>
      </div>
      <ObjectBuilder />
    </div>
  );
}
