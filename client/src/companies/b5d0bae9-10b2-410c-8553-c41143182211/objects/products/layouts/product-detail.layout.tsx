import type { LayoutComponentProps } from "../../../components/ui/DetailViewHandler";
import { useLayoutContext } from "@/contexts/LayoutContext";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

export default function ProductDetailLayout({
  Field,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RelatedList,
  record,
  isCreating,
}: LayoutComponentProps) {
  const { isEditing } = useLayoutContext();

  return (
    <PanelGroup direction="horizontal" className="min-h-[600px]">
      <Panel defaultSize={50} minSize={30} maxSize={70}>
        <div className="flex flex-col gap-6 h-full overflow-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Field name="name" layoutMandatory />
              <Field name="salesUomId" />
              <Field name="salesCategory" />
            </CardContent>
          </Card>
        </div>
      </Panel>

      <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

      <Panel defaultSize={50} minSize={30} maxSize={70}>
        <div className="flex flex-col gap-6 h-full overflow-auto p-4">
          {!isCreating && record?.id && (
            <RelatedList
              objectCode="assets"
              fieldCode="productId"
              columns="name, serialNumber, , installationDate"
              mode={isEditing ? "edit" : "view"}
              parentId={record.id as string}
              testId="related-list-assets"
            />
          )}
        </div>
      </Panel>
    </PanelGroup>
  );
}
