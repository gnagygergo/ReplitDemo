import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { LayoutModeProvider, useLayoutMode } from "@/contexts/LayoutModeContext";
import { useObjectDetail } from "@/hooks/useObjectDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { RelatedList } from "@/components/ui/related-list";
import * as LucideIcons from "lucide-react";
import { Edit, Save, X, Package } from "lucide-react";
import type { ComponentType } from "react";
import { Field } from "./Field";

interface ObjectDefinition {
  apiCode: string;
  labelPlural: string;
  labelSingular: string;
  iconSet: string;
  icon: string;
  nameField?: string;
}

interface DetailViewHandlerProps {
  objectCode: string;
  id: string;
  Layout: ComponentType<LayoutComponentProps>;
}

export interface LayoutComponentProps {
  Field: ComponentType<FieldProps>;
  Card: typeof Card;
  CardContent: typeof CardContent;
  CardHeader: typeof CardHeader;
  CardTitle: typeof CardTitle;
  RelatedList: ComponentType<RelatedListProps>;
  record: Record<string, unknown> | null;
  isCreating: boolean;
}

interface FieldProps {
  name: string;
  layoutMandatory?: boolean;
  linkPath?: string;
  recordId?: string;
  onRecordClick?: (id: string) => void;
  className?: string;
}

interface RelatedListProps {
  objectCode: string;
  fieldCode: string;
  columns: string;
  mode: "view" | "edit";
  parentId: string;
  testId?: string;
  title?: string;
  showAddButton?: boolean;
  showDeleteButton?: boolean;
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

export function DetailViewHandler({ objectCode, id, Layout }: DetailViewHandlerProps) {
  return (
    <LayoutModeProvider key={`${objectCode}-${id}`}>
      <DetailViewHandlerContent objectCode={objectCode} id={id} Layout={Layout} />
    </LayoutModeProvider>
  );
}

function DetailViewHandlerContent({ objectCode, id, Layout }: DetailViewHandlerProps) {
  const { data: objectDefinitions, isLoading: isLoadingMeta } = useObjectDefinitions();
  
  const objectMeta = objectDefinitions?.find(obj => obj.apiCode === objectCode) || null;
  
  const labelSingular = objectMeta?.labelSingular || objectCode;
  const labelPlural = objectMeta?.labelPlural || objectCode;
  const iconName = objectMeta?.icon || "Package";
  const nameField = objectMeta?.nameField || "name";
  
  const {
    record,
    isLoading: isLoadingRecord,
    isCreating,
    isEditing,
    setIsEditing,
    form,
    createMutation,
    updateMutation,
    onSubmit,
    handleCancel,
  } = useObjectDetail({
    objectCode,
    id,
    labelSingular,
    labelPlural,
  });

  const { validateMandatoryFields } = useLayoutMode();
  
  const IconComponent = getIconComponent(iconName);
  
  const isLoading = isLoadingMeta || isLoadingRecord;

  if (!isCreating && isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!isCreating && !record) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <IconComponent className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{labelSingular} not found</h3>
          <p className="text-muted-foreground mb-4">
            The {labelSingular.toLowerCase()} you're looking for doesn't exist.
          </p>
          <Link href={`/${objectCode}`}>
            <Button variant="outline">Back to {labelPlural}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const recordTitle = isCreating 
    ? `New ${labelSingular}` 
    : (record as Record<string, unknown>)?.[nameField] as string || labelSingular;

  const contextValue = {
    objectCode,
    objectMeta: objectMeta ? {
      apiCode: objectMeta.apiCode,
      labelSingular: objectMeta.labelSingular,
      labelPlural: objectMeta.labelPlural,
      icon: objectMeta.icon,
      iconSet: objectMeta.iconSet,
      nameField: objectMeta.nameField,
    } : null,
    record: record as Record<string, unknown> | null,
    form,
    isEditing,
    isCreating,
    isLoading,
    setIsEditing,
  };


  return (
    <LayoutProvider value={contextValue}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href={`/${objectCode}`} className="hover:text-foreground">
            {labelPlural}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {recordTitle}
          </span>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1
                className="text-3xl font-bold text-foreground"
                data-testid={`text-${objectCode}-title`}
              >
                {recordTitle}
              </h1>
              <p
                className="text-muted-foreground"
                data-testid={`text-${objectCode}-subtitle`}
              >
                {isCreating
                  ? `Create a new ${labelSingular.toLowerCase()}`
                  : `${labelSingular} Details`}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                
                <Button
                  onClick={() => {
                    if (!validateMandatoryFields()) {
                      return;
                    }
                    form.handleSubmit(onSubmit)();
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-edit"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : isCreating
                      ? `Create ${labelSingular}`
                      : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                data-testid={`button-edit-${objectCode}`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Layout
              Field={Field}
              Card={Card}
              CardContent={CardContent}
              CardHeader={CardHeader}
              CardTitle={CardTitle}
              RelatedList={RelatedList}
              record={record as Record<string, unknown> | null}
              isCreating={isCreating}
            />
          </form>
        </Form>
      </div>
    </LayoutProvider>
  );
}

export default DetailViewHandler;
