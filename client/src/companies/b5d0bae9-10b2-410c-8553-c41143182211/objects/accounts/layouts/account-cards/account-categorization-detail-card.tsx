/**
 * Account Categorization Detail Card (Clean Version)
 * 
 * Uses LayoutContext to access form and editing state.
 * Uses the smart Field component for metadata-driven rendering.
 */

import { useLayoutContext } from "@/contexts/LayoutContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "../../../../components/ui/Field";

export default function AccountCategorizationDetailCard() {
  const { record, isEditing } = useLayoutContext();

  if (!isEditing && !record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categorization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No account data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field name="industry" />
      </CardContent>
    </Card>
  );
}
