import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface LookupDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (record: any) => void;
  selectedRecordId?: string | null;
  referencedObject: string;
  objectLabel: string;
  objectIcon?: string;
  primaryDisplayField: string;
  displayColumns: string[];
}

export default function LookupDialog({
  open,
  onClose,
  onSelect,
  selectedRecordId,
  referencedObject,
  objectLabel,
  objectIcon = "Package",
  primaryDisplayField,
  displayColumns,
}: LookupDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string>(selectedRecordId || "");

  // Fetch object definition metadata to get field labels
  const { data: objectDefinitions = [] } = useQuery<Array<{
    apiCode: string;
    labelPlural: string;
    labelSingular: string;
    iconSet: string;
    icon: string;
  }>>({
    queryKey: ["/api/object-definitions"],
    enabled: open,
  });

  // Fetch field definitions for the referenced object
  const { data: fieldDefinitions = [] } = useQuery<Array<{
    type: string;
    apiCode: string;
    label: string;
    filePath: string;
  }>>({
    queryKey: ["/api/object-fields", referencedObject],
    enabled: open && !!referencedObject,
  });

  // Fetch records from the API
  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/${referencedObject}`],
    enabled: open && !!referencedObject,
  });

  // Get icon component
  const getIconComponent = () => {
    const iconName = objectIcon || "Package";
    const IconComponent = (LucideIcons as any)[iconName] || Package;
    return IconComponent;
  };

  // Get field label from definitions
  const getFieldLabel = (fieldCode: string): string => {
    const field = fieldDefinitions.find(f => f.apiCode === fieldCode);
    return field?.label || fieldCode;
  };

  // Update selected ID when prop changes
  useEffect(() => {
    setSelectedId(selectedRecordId || "");
  }, [selectedRecordId]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm("");
    }
  }, [open]);

  // Filter records based on search term
  const filteredRecords = records.filter((record) => {
    const searchValue = searchTerm.toLowerCase();
    // Search in primary display field
    const primaryValue = String(record[primaryDisplayField] || "").toLowerCase();
    if (primaryValue.includes(searchValue)) return true;
    
    // Search in display columns
    return displayColumns.some(col => {
      const value = String(record[col] || "").toLowerCase();
      return value.includes(searchValue);
    });
  });

  const handleSelect = () => {
    const selectedRecord = records.find(
      (record) => record.id === selectedId,
    );
    if (selectedRecord) {
      onSelect(selectedRecord);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  const handleRowClick = (recordId: string) => {
    setSelectedId(recordId);
  };

  const IconComponent = getIconComponent();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{objectLabel} Lookup</DialogTitle>
          <DialogDescription>
            Search and select a {objectLabel.toLowerCase()} record.
          </DialogDescription>
        </DialogHeader>

        {/* Search Box */}
        <div className="flex items-center space-x-2 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${objectLabel.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-records"
              autoFocus
            />
          </div>
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          <RadioGroup value={selectedId} onValueChange={setSelectedId}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  {displayColumns.map((col) => (
                    <TableHead key={col}>{getFieldLabel(col)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                      {displayColumns.map((_, colIdx) => (
                        <TableCell key={colIdx}>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={displayColumns.length + 2}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <IconComponent className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      {searchTerm
                        ? `No records found matching "${searchTerm}"`
                        : `No ${objectLabel.toLowerCase()} records available`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedId === record.id ? "bg-muted/30" : ""}`}
                      onClick={() => handleRowClick(record.id)}
                      data-testid={`row-record-${record.id}`}
                    >
                      <TableCell>
                        <RadioGroupItem
                          value={record.id}
                          id={record.id}
                          data-testid={`radio-record-${record.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                      </TableCell>
                      {displayColumns.map((col) => (
                        <TableCell key={col}>
                          <Label
                            htmlFor={record.id}
                            className={`cursor-pointer ${col === primaryDisplayField ? 'font-medium' : 'text-muted-foreground'}`}
                          >
                            {record[col] || "-"}
                          </Label>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            data-testid="button-cancel-lookup"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedId || isLoading}
            data-testid="button-select-record"
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
