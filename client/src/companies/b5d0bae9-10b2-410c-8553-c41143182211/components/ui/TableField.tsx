import { useLayoutContext } from "@/contexts/LayoutContext";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { TextField } from "@/components/ui/text-field";
import { NumberField } from "@/components/ui/number-field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { DropDownListField } from "@/components/ui/dropdown-list-field";
import LookupFormField from "@/components/ui/lookup-form-field";
import { CheckboxField } from "@/components/ui/checkbox-field";

interface TableFieldProps {
  name: string;
  linkPath?: string;
  onRecordClick?: (id: string) => void;
}

export function TableField({
  name,
  linkPath,
  onRecordClick,
}: TableFieldProps) {
  const { objectCode, record } = useLayoutContext();
  
  const { data: fieldDef, isLoading: isLoadingFieldDef } = useFieldDefinition({
    objectCode,
    fieldCode: name,
  });

  if (isLoadingFieldDef) {
    return <span className="text-muted-foreground">...</span>;
  }

  if (!fieldDef) {
    return <span className="text-muted-foreground">-</span>;
  }

  const value = record?.[name];
  const recordId = record?.id as string | undefined;
  const fieldType = fieldDef.type;

  const commonProps = {
    objectCode,
    fieldCode: name,
    mode: "table" as const,
    value,
  };

  switch (fieldType) {
    case "TextField":
      return (
        <TextField
          {...commonProps}
          value={value as string}
          linkPath={linkPath}
          recordId={recordId}
        />
      );

    case "NumberField":
      return (
        <NumberField
          {...commonProps}
          value={value as number}
        />
      );

    case "DateTimeField":
      return (
        <DateTimeField
          {...commonProps}
          value={value as string}
        />
      );

    case "PicklistField":
    case "DropDownListField":
      return (
        <DropDownListField
          {...commonProps}
          value={value as string}
        />
      );

    case "LookupField":
      return (
        <LookupFormField
          {...commonProps}
          value={value as string}
          onRecordClick={onRecordClick}
        />
      );

    case "CheckboxField":
      return (
        <CheckboxField
          {...commonProps}
          value={value as boolean}
        />
      );

    default:
      return (
        <TextField
          {...commonProps}
          value={value as string}
          linkPath={linkPath}
          recordId={recordId}
        />
      );
  }
}

export default TableField;
