import { useLayoutContext } from "@/contexts/LayoutContext";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";
import { NumberField } from "@/components/ui/number-field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { DropDownListField } from "@/components/ui/dropdown-list-field";
import LookupFormField from "@/components/ui/lookup-form-field";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { AddressField } from "@/components/ui/address-field";

interface FieldProps {
  name: string;
  layoutMandatory?: boolean;
  linkPath?: string;
  recordId?: string;
  onRecordClick?: (id: string) => void;
  className?: string;
}

export function Field({
  name,
  layoutMandatory,
  linkPath,
  recordId,
  onRecordClick,
  className,
}: FieldProps) {
  const { objectCode, form, isEditing } = useLayoutContext();
  
  const { data: fieldDef, isLoading: isLoadingFieldDef } = useFieldDefinition({
    objectCode,
    fieldCode: name,
  });

  if (isLoadingFieldDef) {
    return <div className="h-10 bg-muted animate-pulse rounded" />;
  }

  if (!fieldDef) {
    return (
      <div className="text-sm text-muted-foreground">
        Field "{name}" not found in metadata
      </div>
    );
  }

  const mode = isEditing ? "edit" : "view";
  const fieldType = fieldDef.type;

  const commonProps = {
    objectCode,
    fieldCode: name,
    mode: mode as "edit" | "view",
    layoutMandatory: layoutMandatory ? "true" : undefined,
    className,
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {renderFieldByType(fieldType, {
            ...commonProps,
            value: field.value,
            onChange: field.onChange,
            linkPath,
            recordId,
            onRecordClick,
          })}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface RenderProps {
  objectCode: string;
  fieldCode: string;
  mode: "edit" | "view";
  value: unknown;
  onChange: (value: unknown) => void;
  layoutMandatory?: string;
  linkPath?: string;
  recordId?: string;
  onRecordClick?: (id: string) => void;
  className?: string;
}

function renderFieldByType(fieldType: string, props: RenderProps) {
  const {
    objectCode,
    fieldCode,
    mode,
    value,
    onChange,
    layoutMandatory,
    linkPath,
    recordId,
    onRecordClick,
  } = props;

  switch (fieldType) {
    case "TextField":
      return (
        <TextField
          objectCode={objectCode}
          fieldCode={fieldCode}
          mode={mode}
          value={value as string}
          onChange={onChange}
          layoutMandatory={layoutMandatory}
          linkPath={linkPath}
          recordId={recordId}
        />
      );

    case "NumberField":
      return (
        <NumberField
          objectCode={objectCode}
          fieldCode={fieldCode}
          mode={mode}
          value={value as number}
          onChange={onChange}
          layoutMandatory={layoutMandatory}
        />
      );

    case "DateTimeField":
      return (
        <DateTimeField
          objectCode={objectCode}
          fieldCode={fieldCode}
          mode={mode}
          value={value as string}
          onChange={onChange}
          layoutMandatory={layoutMandatory}
        />
      );

    case "PicklistField":
    case "DropDownListField":
      return (
        <DropDownListField
          objectCode={objectCode}
          fieldCode={fieldCode}
          mode={mode}
          value={value as string}
          onChange={onChange}
          layoutMandatory={layoutMandatory}
        />
      );

    case "LookupField":
      return (
        <LookupFormField
          objectCode={objectCode}
          fieldCode={fieldCode}
          mode={mode}
          value={value as string}
          onChange={onChange}
          onRecordClick={onRecordClick}
          layoutMandatory={layoutMandatory}
        />
      );

    case "CheckboxField":
      return (
        <CheckboxField
          objectCode={objectCode}
          fieldCode={fieldCode}
          mode={mode}
          value={value as boolean}
          onChange={onChange}
        />
      );

    case "AddressField":
      return (
        <AddressField
          objectCode={objectCode}
          fieldCode={fieldCode}
          mode={mode}
          value={value as Record<string, string>}
          onChange={onChange}
          layoutMandatory={layoutMandatory}
        />
      );

    default:
      return (
        <TextField
          objectCode={objectCode}
          fieldCode={fieldCode}
          mode={mode}
          value={value as string}
          onChange={onChange}
          layoutMandatory={layoutMandatory}
        />
      );
  }
}

export default Field;
