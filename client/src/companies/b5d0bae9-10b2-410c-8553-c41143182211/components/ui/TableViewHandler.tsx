import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { useObjectList } from "@/hooks/useObjectList";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import * as LucideIcons from "lucide-react";
import { Plus, Search, Edit, Trash2, ArrowUp, ArrowDown, Package } from "lucide-react";
import type { ComponentType } from "react";
import { TableField } from "./TableField";

interface ObjectDefinition {
  apiCode: string;
  labelPlural: string;
  labelSingular: string;
  iconSet: string;
  icon: string;
}

interface TableViewHandlerProps {
  objectCode: string;
  Layout: ComponentType<TableLayoutProps>;
}

export interface TableLayoutProps {
  records: Record<string, unknown>[];
  TableRow: typeof TableRow;
  TableCell: typeof TableCell;
  TableField: typeof TableField;
  Link: typeof Link;
  Button: typeof Button;
  EditButton: ComponentType<{ recordId: string }>;
  DeleteButton: ComponentType<{ record: Record<string, unknown> }>;
  RowWrapper: ComponentType<{ record: Record<string, unknown>; children: React.ReactNode }>;
}

function useObjectDefinitions() {
  return useQuery<ObjectDefinition[]>({
    queryKey: ["/api/object-definitions"],
  });
}

function getIconComponent(iconName: string): ComponentType<{ className?: string }> {
  const icons = LucideIcons as unknown as Record<string, ComponentType<{ className?: string }>>;
  const IconComponent = icons[iconName];
  return IconComponent || Package;
}

export function TableViewHandler({ objectCode, Layout }: TableViewHandlerProps) {
  const { data: objectDefinitions, isLoading: isLoadingMeta } = useObjectDefinitions();

  const objectMeta = objectDefinitions?.find((obj) => obj.apiCode === objectCode) || null;

  const labelSingular = objectMeta?.labelSingular || objectCode;
  const labelPlural = objectMeta?.labelPlural || objectCode;
  const iconName = objectMeta?.icon || "Package";

  const {
    records,
    isLoading: isLoadingRecords,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    handleSort,
    handleDelete,
  } = useObjectList<Record<string, unknown> & { id: string }>({
    objectCode,
    defaultSortBy: "name",
    labelSingular,
    labelPlural,
  });

  const dummyForm = useForm<Record<string, unknown>>({
    defaultValues: {},
  });

  const IconComponent = getIconComponent(iconName);

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 inline" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline" />
    );
  };

  const isLoading = isLoadingMeta || isLoadingRecords;

  const EditButton = ({ recordId }: { recordId: string }) => (
    <Link href={`/${objectCode}/${recordId}`}>
      <Button
        variant="ghost"
        size="sm"
        data-testid={`button-edit-${recordId}`}
      >
        <Edit className="w-4 h-4" />
      </Button>
    </Link>
  );

  const DeleteButton = ({ record }: { record: Record<string, unknown> }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleDelete(record as Record<string, unknown> & { id: string }, record.id as string)}
      data-testid={`button-delete-${record.id}`}
    >
      <Trash2 className="w-4 h-4 text-destructive" />
    </Button>
  );

  const RowWrapper = ({ record, children }: { record: Record<string, unknown>; children: React.ReactNode }) => (
    <LayoutProvider
      value={{
        objectCode,
        objectMeta: objectMeta ? {
          apiCode: objectMeta.apiCode,
          labelSingular: objectMeta.labelSingular,
          labelPlural: objectMeta.labelPlural,
          icon: objectMeta.icon,
          iconSet: objectMeta.iconSet,
        } : null,
        record,
        form: dummyForm,
        isEditing: false,
        isCreating: false,
        isLoading: false,
        setIsEditing: () => {},
      }}
    >
      {children}
    </LayoutProvider>
  );

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{labelPlural}</h2>
        </div>
        <Link href={`/${objectCode}/new`}>
          <Button
            className="flex items-center space-x-2"
            data-testid={`button-create-${objectCode}`}
          >
            <Plus className="w-4 h-4" />
            <span>Create {labelSingular}</span>
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search {labelPlural}
            </label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={`Search ${labelPlural.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid={`input-search-${objectCode}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <IconComponent className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No {labelPlural.toLowerCase()} found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : `Get started by creating your first ${labelSingular.toLowerCase()}`}
              </p>
              <Link href={`/${objectCode}/new`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create {labelSingular}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <Layout
                    records={[]}
                    TableRow={TableRow}
                    TableCell={TableHead as typeof TableCell}
                    TableField={TableField}
                    Link={Link}
                    Button={Button}
                    EditButton={EditButton}
                    DeleteButton={DeleteButton}
                    RowWrapper={RowWrapper}
                  />
                </TableHeader>
                <TableBody>
                  <Layout
                    records={records}
                    TableRow={TableRow}
                    TableCell={TableCell}
                    TableField={TableField}
                    Link={Link}
                    Button={Button}
                    EditButton={EditButton}
                    DeleteButton={DeleteButton}
                    RowWrapper={RowWrapper}
                  />
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TableViewHandler;
