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
  GripVertical,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface DropDownListFieldTypeEditorProps {
  sourceType: "metadata";
  sourcePath: string;
  title?: string;
  description?: string;
  rootKey?: string;
  itemKey?: string;
}

interface CustomValue {
  label: string[];
  code: string[];
  default: string[];
  iconSet: string[];
  icon: string[];
  order: string[];
  _tempId?: string;
}

interface SortableRowProps {
  item: CustomValue;
  onCellEdit: (tempId: string, field: keyof CustomValue, value: string) => void;
  onCheckboxChange: (tempId: string, checked: boolean) => void;
  onDeleteRow: (tempId: string) => void;
}

function SortableRow({ item, onCellEdit, onCheckboxChange, onDeleteRow }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._tempId! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-testid={`row-${item._tempId}`}
      className={isDragging ? "bg-muted" : ""}
    >
      <TableCell className="w-[40px]">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
          data-testid={`drag-handle-${item._tempId}`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <Input
          value={item.label?.[0] || ""}
          onChange={(e) =>
            onCellEdit(item._tempId!, "label", e.target.value)
          }
          className="h-8"
          data-testid={`input-label-${item._tempId}`}
        />
      </TableCell>
      <TableCell>
        <Input
          value={item.code?.[0] || ""}
          onChange={(e) =>
            onCellEdit(item._tempId!, "code", e.target.value)
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
              onCheckboxChange(item._tempId!, checked === true)
            }
            data-testid={`checkbox-default-${item._tempId}`}
          />
        </div>
      </TableCell>
      <TableCell>
        <Input
          value={item.iconSet?.[0] || ""}
          onChange={(e) =>
            onCellEdit(item._tempId!, "iconSet", e.target.value)
          }
          className="h-8"
          data-testid={`input-iconset-${item._tempId}`}
        />
      </TableCell>
      <TableCell>
        <Input
          value={item.icon?.[0] || ""}
          onChange={(e) =>
            onCellEdit(item._tempId!, "icon", e.target.value)
          }
          className="h-8"
          data-testid={`input-icon-${item._tempId}`}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteRow(item._tempId!)}
          className="h-8 w-8 p-0"
          data-testid={`button-delete-${item._tempId}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: metadataResponse, isLoading } = useMetadata({
    sourcePath,
    enabled: sourceType === "metadata",
  });

  // Build canonical state for comparison (excludes UI-only fields like _tempId)
  const buildCanonicalState = (currentItems: CustomValue[], sorting: string, titleValue: string) => {
    const canonicalItems = currentItems.map((item, index) => {
      const { _tempId, ...rest } = item;
      return {
        ...rest,
        order: [String(index + 1)],
      };
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
      
      // Compare each field including order
      if (
        (current.label?.[0] || "") !== (orig.label?.[0] || "") ||
        (current.code?.[0] || "") !== (orig.code?.[0] || "") ||
        (current.default?.[0] || "false") !== (orig.default?.[0] || "false") ||
        (current.iconSet?.[0] || "") !== (orig.iconSet?.[0] || "") ||
        (current.icon?.[0] || "") !== (orig.icon?.[0] || "") ||
        (current.order?.[0] || "") !== (orig.order?.[0] || "")
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
        
        // Sort by existing order if present, otherwise use array index
        const sortedLoadedItems = [...loadedItems].sort((a, b) => {
          const orderA = parseInt(a.order?.[0] || "0", 10) || 0;
          const orderB = parseInt(b.order?.[0] || "0", 10) || 0;
          return orderA - orderB;
        });
        
        const itemsWithIds = sortedLoadedItems.map((item: any, index: number) => ({
          ...item,
          order: item.order || [String(index + 1)],
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
      const sortedForSnapshot = [...loadedItems].sort((a, b) => {
        const orderA = parseInt(a.order?.[0] || "0", 10) || 0;
        const orderB = parseInt(b.order?.[0] || "0", 10) || 0;
        return orderA - orderB;
      });
      
      initialStateRef.current = buildCanonicalState(
        sortedForSnapshot.map((item: any, index: number) => ({
          ...item,
          order: item.order || [String(index + 1)],
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item._tempId === active.id);
      const newIndex = items.findIndex((item) => item._tempId === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      
      // Update order values based on new positions
      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        order: [String(index + 1)],
      }));

      setItems(updatedItems);
      recomputeHasChanges(updatedItems, xmlSorting, xmlTitle);
    }
  };

  const handleAddRow = () => {
    const newOrder = items.length + 1;
    const newItem: CustomValue = {
      label: [""],
      code: [""],
      default: ["false"],
      iconSet: [""],
      icon: [""],
      order: [String(newOrder)],
      _tempId: `new-${Date.now()}`,
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    recomputeHasChanges(updatedItems, xmlSorting, xmlTitle);
  };

  const handleDeleteRow = (tempId: string) => {
    const filteredItems = items.filter((item) => item._tempId !== tempId);
    // Renumber order values after deletion
    const updatedItems = filteredItems.map((item, index) => ({
      ...item,
      order: [String(index + 1)],
    }));
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
    // Map items with order tags and remove _tempId
    const itemsToSave = items.map((item, index) => {
      const { _tempId, ...rest } = item;
      return {
        ...rest,
        order: [String(index + 1)],
      };
    });

    // Build clean XML structure
    const updatedXmlStructure: any = {
      [rootKey]: {
        [itemKey]: itemsToSave,
      },
    };

    // Add header-level fields (xml2js expects arrays)
    if (xmlTitle.trim()) {
      updatedXmlStructure[rootKey].title = [xmlTitle.trim()];
    }
    
    if (xmlSorting && xmlSorting !== "no sorting") {
      updatedXmlStructure[rootKey].sorting = [xmlSorting];
    }

    updateMutation.mutate(updatedXmlStructure);
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

  const itemIds = items.map((item) => item._tempId!);

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
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="border rounded-md overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead data-testid="header-label">Label</TableHead>
                  <TableHead data-testid="header-code">Code</TableHead>
                  <TableHead className="text-center" data-testid="header-default">Default</TableHead>
                  <TableHead data-testid="header-iconset">Icon Set</TableHead>
                  <TableHead data-testid="header-icon">Icon</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No items. Click "Add Row" to create a new entry.
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                      <SortableRow
                        key={item._tempId}
                        item={item}
                        onCellEdit={handleCellEdit}
                        onCheckboxChange={handleCheckboxChange}
                        onDeleteRow={handleDeleteRow}
                      />
                    ))}
                  </SortableContext>
                )}
              </TableBody>
            </Table>
          </DndContext>
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
