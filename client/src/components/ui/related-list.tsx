import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Save, X, Trash2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { useToast } from "@/hooks/use-toast";
import { useCultureFormat } from "@/hooks/useCultureFormat";

export interface RelatedListColumn {
  fieldCode: string;
  width?: string;
}

export interface RelatedListProps {
  objectCode: string;
  fieldCode: string;
  columns: string;
  mode: "edit" | "view";
  parentId: string;
  testId?: string;
  title?: string;
  showAddButton?: boolean;
  showDeleteButton?: boolean;
}

interface RelatedRecord {
  id: string;
  [key: string]: any;
}

interface RelatedRecordsResponse {
  records: RelatedRecord[];
  meta: {
    parentObjectCode: string;
    parentId: string;
    relationshipApiCode: string;
    childObjectCode: string;
    lookupFieldApiCode: string;
    count: number;
  };
}

export function RelatedList({
  objectCode,
  fieldCode,
  columns,
  mode,
  parentId,
  testId,
  title,
  showAddButton = false,
  showDeleteButton = false,
}: RelatedListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatNumber } = useCultureFormat();
  
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  
  const columnList = columns.split(",").map(c => c.trim()).filter(c => c);

  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  const relationshipApiCode = fieldDef?.relationshipApiCode;
  const referencedObject = fieldDef?.referencedObject;
  const relationshipName = fieldDef?.relationshipName || title || "Related Records";

  const { data, isLoading, error } = useQuery<RelatedRecordsResponse>({
    queryKey: [`/api/${referencedObject}/${parentId}/related/${relationshipApiCode}`],
    enabled: !!referencedObject && !!parentId && !!relationshipApiCode,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ recordId, updates }: { recordId: string; updates: Record<string, any> }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/${referencedObject}/${parentId}/related/${relationshipApiCode}/${recordId}`,
        updates
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/${referencedObject}/${parentId}/related/${relationshipApiCode}`],
      });
      setEditingRowId(null);
      setEditedValues({});
      toast({
        title: "Record updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditRow = (record: RelatedRecord) => {
    setEditingRowId(record.id);
    const values: Record<string, any> = {};
    columnList.forEach(col => {
      values[col] = record[col];
    });
    setEditedValues(values);
  };

  const handleSaveRow = () => {
    if (!editingRowId) return;
    updateMutation.mutate({
      recordId: editingRowId,
      updates: editedValues,
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditedValues({});
  };

  const handleValueChange = (fieldCode: string, value: any) => {
    setEditedValues(prev => ({
      ...prev,
      [fieldCode]: value,
    }));
  };

  if (!referencedObject || !relationshipApiCode) {
    if (!fieldDef) {
      return (
        <Card data-testid={testId}>
          <CardHeader>
            <CardTitle className="text-lg">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      );
    }
    return (
      <Card data-testid={testId}>
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Configuration Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Missing referencedObject or relationshipApiCode in field definition for {objectCode}.{fieldCode}
          </p>
        </CardContent>
      </Card>
    );
  }

  const records = data?.records || [];
  const childObjectCode = data?.meta?.childObjectCode;

  return (
    <Card data-testid={testId || `related-list-${relationshipApiCode}`}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-lg font-semibold">
          {relationshipName} ({records.length})
        </CardTitle>
        {showAddButton && mode === "edit" && (
          <Button size="sm" variant="outline" data-testid={`button-add-${relationshipApiCode}`}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive">
            Failed to load related records
          </div>
        ) : records.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No records found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {columnList.map((col) => (
                  <RelatedListHeaderCell
                    key={col}
                    objectCode={childObjectCode || objectCode}
                    fieldCode={col}
                  />
                ))}
                {mode === "edit" && (
                  <TableHead className="w-24 text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} data-testid={`row-${relationshipApiCode}-${record.id}`}>
                  {columnList.map((col, colIndex) => (
                    <TableCell key={col}>
                      {editingRowId === record.id ? (
                        <RelatedListEditCell
                          objectCode={childObjectCode || objectCode}
                          fieldCode={col}
                          value={editedValues[col]}
                          onChange={(val) => handleValueChange(col, val)}
                        />
                      ) : (
                        <RelatedListViewCell
                          objectCode={childObjectCode || objectCode}
                          fieldCode={col}
                          value={record[col]}
                          recordId={record.id}
                          isFirstColumn={colIndex === 0}
                          childObjectCode={childObjectCode}
                        />
                      )}
                    </TableCell>
                  ))}
                  {mode === "edit" && (
                    <TableCell className="text-right">
                      {editingRowId === record.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={handleSaveRow}
                            disabled={updateMutation.isPending}
                            data-testid={`button-save-row-${record.id}`}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={handleCancelEdit}
                            disabled={updateMutation.isPending}
                            data-testid={`button-cancel-row-${record.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEditRow(record)}
                            data-testid={`button-edit-row-${record.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {showDeleteButton && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              data-testid={`button-delete-row-${record.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function RelatedListHeaderCell({
  objectCode,
  fieldCode,
}: {
  objectCode: string;
  fieldCode: string;
}) {
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  const label = fieldDef?.label || fieldCode;

  return (
    <TableHead className="font-medium">
      {label}
    </TableHead>
  );
}

function RelatedListViewCell({
  objectCode,
  fieldCode,
  value,
  recordId,
  isFirstColumn,
  childObjectCode,
}: {
  objectCode: string;
  fieldCode: string;
  value: any;
  recordId: string;
  isFirstColumn: boolean;
  childObjectCode?: string;
}) {
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });
  const { formatNumber } = useCultureFormat();

  const fieldType = fieldDef?.type || "TextField";

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (fieldType === "CheckboxField") {
    return (
      <Checkbox checked={Boolean(value)} disabled className="opacity-100" />
    );
  }

  if (fieldType === "NumberField") {
    const decimalPlaces = fieldDef?.decimalPlaces ? parseInt(fieldDef.decimalPlaces) : 2;
    const formattedValue = formatNumber(value, { decimalPlaces });
    return <span className="font-mono text-sm">{formattedValue}</span>;
  }

  if (fieldType === "DateTimeField") {
    try {
      const date = new Date(value);
      const subtype = fieldDef?.subtype || "date";
      if (subtype === "datetime") {
        return <span>{date.toLocaleString()}</span>;
      }
      return <span>{date.toLocaleDateString()}</span>;
    } catch {
      return <span>{String(value)}</span>;
    }
  }

  if (isFirstColumn && childObjectCode) {
    return (
      <Link
        href={`/${childObjectCode}/${recordId}`}
        className="text-primary hover:underline inline-flex items-center gap-1"
      >
        {String(value)}
        <ExternalLink className="h-3 w-3" />
      </Link>
    );
  }

  return <span className="text-sm">{String(value)}</span>;
}

function RelatedListEditCell({
  objectCode,
  fieldCode,
  value,
  onChange,
}: {
  objectCode: string;
  fieldCode: string;
  value: any;
  onChange: (value: any) => void;
}) {
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  const fieldType = fieldDef?.type || "TextField";

  if (fieldType === "CheckboxField") {
    return (
      <Checkbox
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(checked)}
        data-testid={`input-${fieldCode}`}
      />
    );
  }

  if (fieldType === "NumberField") {
    return (
      <Input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full"
        data-testid={`input-${fieldCode}`}
      />
    );
  }

  if (fieldType === "DateTimeField") {
    const subtype = fieldDef?.subtype || "date";
    return (
      <Input
        type={subtype === "datetime" ? "datetime-local" : "date"}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full"
        data-testid={`input-${fieldCode}`}
      />
    );
  }

  return (
    <Input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full"
      data-testid={`input-${fieldCode}`}
    />
  );
}

export default RelatedList;
