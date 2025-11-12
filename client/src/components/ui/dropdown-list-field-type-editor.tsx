import { useState, useEffect, useRef } from "react";
import { useMetadata } from "@/hooks/useMetadata";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export interface DropDownListFieldTypeEditorProps {
  sourceType: "metadata";
  sourcePath: string;
  title?: string;
  description?: string;
  rootKey?: string;
  itemKey?: string;
}

type SortDirection = "asc" | "desc" | "none";

interface CustomValue {
  label: string[];
  code: string[];
  default: string[];
  iconSet: string[];
  icon: string[];
  _tempId?: string;
}

export function DropDownListFieldTypeEditor({
  sourceType,
  sourcePath,
  title = "Metadata Editor",
  description,
  rootKey = "GlobalValueSet",
  itemKey = "customValue",
}: DropDownListFieldTypeEditorProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<CustomValue[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Header-level XML fields
  const [xmlSorting, setXmlSorting] = useState<string>("no sorting");
  const [xmlTitle, setXmlTitle] = useState<string>("");
  
  // Snapshot of initial state for change detection
  const initialStateRef = useRef<{
    sorting: string;
    title: string;
    items: any[];
  } | null>(null);

  const { data: metadataResponse, isLoading } = useMetadata({
    sourcePath,
    enabled: sourceType === "metadata",
  });

  // Build canonical state for comparison (excludes UI-only fields like _tempId)
  const buildCanonicalState = (currentItems: CustomValue[], sorting: string, titleValue: string) => {
    const canonicalItems = currentItems.map(item => {
      const { _tempId, ...rest } = item;
      return rest;
    });
    
    return {
      sorting,
      title: titleValue,
      items: canonicalItems,
    };
  };

  // Check if current state differs from initial state
  const recomputeHasChanges = (currentItems: CustomValue[], sorting: string, titleValue: string) => {
    if (!initialStateRef.current) {
      setHasChanges(false);
      return;
    }

    const currentState = buildCanonicalState(currentItems, sorting, titleValue);
    const initial = initialStateRef.current;

    // Compare header fields
    if (currentState.sorting !== initial.sorting || currentState.title !== initial.title) {
      setHasChanges(true);
      return;
    }

    // Compare items (deep comparison)
    if (currentState.items.length !== initial.items.length) {
      setHasChanges(true);
      return;
    }

    for (let i = 0; i < currentState.items.length; i++) {
      const current = currentState.items[i];
      const orig = initial.items[i];
      
      // Compare each field (use optional chaining for fields that might be missing)
      if (
        (current.label?.[0] || "") !== (orig.label?.[0] || "") ||
        (current.code?.[0] || "") !== (orig.code?.[0] || "") ||
        (current.default?.[0] || "false") !== (orig.default?.[0] || "false") ||
        (current.iconSet?.[0] || "") !== (orig.iconSet?.[0] || "") ||
        (current.icon?.[0] || "") !== (orig.icon?.[0] || "")
      ) {
        setHasChanges(true);
        return;
      }
    }

    setHasChanges(false);
  };

  useEffect(() => {
    if (metadataResponse?.[rootKey]) {
      // Load items
      let loadedItems: any[] = [];
      if (metadataResponse[rootKey][itemKey]) {
        loadedItems = Array.isArray(metadataResponse[rootKey][itemKey])
          ? metadataResponse[rootKey][itemKey]
          : [metadataResponse[rootKey][itemKey]];
        
        const itemsWithIds = loadedItems.map((item: any, index: number) => ({
          ...item,
          _tempId: `existing-${index}`,
        }));
        setItems(itemsWithIds);
      }
      
      // Load header-level fields (xml2js returns arrays)
      const sorting = metadataResponse[rootKey].sorting?.[0] || "no sorting";
      const titleValue = metadataResponse[rootKey].title?.[0] || "";
      
      setXmlSorting(sorting);
      setXmlTitle(titleValue);

      // Snapshot initial state for change detection
      initialStateRef.current = buildCanonicalState(
        loadedItems.map((item: any, index: number) => ({
          ...item,
          _tempId: `existing-${index}`,
        })),
        sorting,
        titleValue
      );

      setHasChanges(false);
    }
  }, [metadataResponse, rootKey, itemKey]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await fetch(`/api/metadata/${sourcePath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update metadata");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Metadata updated successfully",
      });
      
      // Reset initial state to current state after successful save
      initialStateRef.current = buildCanonicalState(items, xmlSorting, xmlTitle);
      setHasChanges(false);
      
      queryClient.invalidateQueries({ queryKey: ["/api/metadata", sourcePath] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update metadata",
        variant: "destructive",
      });
    },
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection("none");
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedItems = () => {
    if (!sortColumn || sortDirection === "none") {
      return items;
    }

    return [...items].sort((a: any, b: any) => {
      const aValue = a[sortColumn]?.[0] || "";
      const bValue = b[sortColumn]?.[0] || "";

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  const handleAddRow = () => {
    const newItem: CustomValue = {
      label: [""],
      code: [""],
      default: ["false"],
      iconSet: [""],
      icon: [""],
      _tempId: `new-${Date.now()}`,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    recomputeHasChanges(updatedItems, xmlSorting, xmlTitle);
  };

  const handleDeleteRow = (tempId: string) => {
    const updatedItems = items.filter((item) => item._tempId !== tempId);
    setItems(updatedItems);
    recomputeHasChanges(updatedItems, xmlSorting, xmlTitle);
  };

  const handleCellEdit = (tempId: string, field: keyof CustomValue, value: string) => {
    const updatedItems = items.map((item) =>
      item._tempId === tempId ? { ...item, [field]: [value] } : item
    );
    setItems(updatedItems);
    recomputeHasChanges(updatedItems, xmlSorting, xmlTitle);
  };

  const handleCheckboxChange = (tempId: string, checked: boolean) => {
    const updatedItems = items.map((item) =>
      item._tempId === tempId
        ? { ...item, default: [checked.toString()] }
        : item
    );
    setItems(updatedItems);
    recomputeHasChanges(updatedItems, xmlSorting, xmlTitle);
  };

  const handleSortingChange = (value: string) => {
    setXmlSorting(value);
    recomputeHasChanges(items, value, xmlTitle);
  };

  const handleTitleChange = (value: string) => {
    setXmlTitle(value);
    recomputeHasChanges(items, xmlSorting, value);
  };

  const handleSave = () => {
    const itemsToSave = items.map((item) => {
      const { _tempId, ...rest } = item;
      return rest;
    });

    // Build clean XML structure to avoid carrying over old values
    const updatedXmlStructure: any = {
      [rootKey]: {
        [itemKey]: itemsToSave,
      },
    };

    // Add header-level fields (xml2js expects arrays)
    // Only include if they have values
    if (xmlTitle.trim()) {
      updatedXmlStructure[rootKey].title = [xmlTitle.trim()];
    }
    
    if (xmlSorting && xmlSorting !== "no sorting") {
      updatedXmlStructure[rootKey].sorting = [xmlSorting];
    }

    updateMutation.mutate(updatedXmlStructure);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-2 inline" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 ml-2 inline" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-4 w-4 ml-2 inline" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-2 inline opacity-50" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const sortedItems = getSortedItems();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddRow}
              size="sm"
              variant="outline"
              data-testid="button-add-row"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              size="sm"
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Header-level fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="xml-title" className="text-muted-foreground">
              Title
            </Label>
            <Input
              id="xml-title"
              value={xmlTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter value set title"
              data-testid="input-xml-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xml-sorting" className="text-muted-foreground">
              Sorting
            </Label>
            <Select
              value={xmlSorting}
              onValueChange={handleSortingChange}
            >
              <SelectTrigger id="xml-sorting" data-testid="select-xml-sorting">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no sorting">No Sorting</SelectItem>
                <SelectItem value="ascending">Ascending</SelectItem>
                <SelectItem value="descending">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-md overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("label")}
                  data-testid="header-label"
                >
                  Label
                  <SortIcon column="label" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("code")}
                  data-testid="header-code"
                >
                  Code
                  <SortIcon column="code" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none text-center"
                  onClick={() => handleSort("default")}
                  data-testid="header-default"
                >
                  Default
                  <SortIcon column="default" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("iconSet")}
                  data-testid="header-iconset"
                >
                  Icon Set
                  <SortIcon column="iconSet" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("icon")}
                  data-testid="header-icon"
                >
                  Icon
                  <SortIcon column="icon" />
                </TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No items. Click "Add Row" to create a new entry.
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item) => (
                  <TableRow key={item._tempId} data-testid={`row-${item._tempId}`}>
                    <TableCell>
                      <Input
                        value={item.label?.[0] || ""}
                        onChange={(e) =>
                          handleCellEdit(item._tempId!, "label", e.target.value)
                        }
                        className="h-8"
                        data-testid={`input-label-${item._tempId}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.code?.[0] || ""}
                        onChange={(e) =>
                          handleCellEdit(item._tempId!, "code", e.target.value)
                        }
                        className="h-8"
                        data-testid={`input-code-${item._tempId}`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={item.default?.[0] === "true"}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(item._tempId!, checked === true)
                          }
                          data-testid={`checkbox-default-${item._tempId}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.iconSet?.[0] || ""}
                        onChange={(e) =>
                          handleCellEdit(item._tempId!, "iconSet", e.target.value)
                        }
                        className="h-8"
                        data-testid={`input-iconset-${item._tempId}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.icon?.[0] || ""}
                        onChange={(e) =>
                          handleCellEdit(item._tempId!, "icon", e.target.value)
                        }
                        className="h-8"
                        data-testid={`input-icon-${item._tempId}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(item._tempId!)}
                        className="h-8 w-8 p-0"
                        data-testid={`button-delete-${item._tempId}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {hasChanges && (
          <p className="text-sm text-muted-foreground mt-4">
            You have unsaved changes. Click "Save Changes" to persist your modifications.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
