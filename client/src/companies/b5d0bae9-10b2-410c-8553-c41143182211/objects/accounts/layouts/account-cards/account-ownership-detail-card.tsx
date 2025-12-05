/**
 * Account Ownership Detail Card (Clean Version)
 * 
 * Uses LayoutContext to access form and editing state.
 * Uses the smart Field component for metadata-driven rendering.
 */

import { useLayoutContext } from "@/contexts/LayoutContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "../../../../components/ui/Field";

export default function AccountOwnershipDetailCard() {
  const { record, isEditing } = useLayoutContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ownership</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Field name="ownerId" />
      </CardContent>
    </Card>
  );
}
