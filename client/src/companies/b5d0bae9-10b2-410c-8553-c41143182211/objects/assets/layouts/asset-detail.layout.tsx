import type { LayoutComponentProps } from "../../../components/ui/DetailViewHandler";
import { useLayoutContext } from "@/contexts/LayoutContext";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

export default function AssetDetailLayout({
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
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Field name="serialNumber" layoutMandatory />
              <Field name="name" />
              <Field name="description" layoutMandatory />
              <Field name="quantity" />
              <Field name="installationDate" />
              <Field name="AssetInstallStatus" />
              <Field name="location" />
              <Field name="accountId" />
              <Field name="productId" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Field name="location" />
            </CardContent>
          </Card>
        </div>
      </Panel>

      <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

      <Panel defaultSize={50} minSize={30} maxSize={70}>
        <div className="flex flex-col gap-6 h-full overflow-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Related Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field name="accountId" />
              <Field name="productId" />
            </CardContent>
          </Card>
        </div>
      </Panel>
    </PanelGroup>
  );
}
