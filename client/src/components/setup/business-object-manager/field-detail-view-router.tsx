import { TextFieldDetail } from "./field-details/text-field-detail";
import { NumberFieldDetail } from "./field-details/number-field-detail";
import { DateTimeFieldDetail } from "./field-details/datetime-field-detail";
import { CheckboxFieldDetail } from "./field-details/checkbox-field-detail";
import { DropDownListFieldDetail } from "./field-details/dropdown-list-field-detail";
import { LookupFieldDetail } from "./field-details/lookup-field-detail";

interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  filePath: string;
}

interface FieldDetailViewRouterProps {
  field: FieldDefinition;
  objectName: string;
  mode: 'view' | 'edit';
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function FieldDetailViewRouter({
  field,
  objectName,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
}: FieldDetailViewRouterProps) {
  // Route to appropriate detail component based on field type
  switch (field.type) {
    case 'TextField':
      return (
        <TextFieldDetail
          field={field}
          objectName={objectName}
          mode={mode}
          onBack={onBack}
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    
    case 'NumberField':
      return (
        <NumberFieldDetail
          field={field}
          objectName={objectName}
          mode={mode}
          onBack={onBack}
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    
    case 'DateTimeField':
      return (
        <DateTimeFieldDetail
          field={field}
          objectName={objectName}
          mode={mode}
          onBack={onBack}
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    
    case 'CheckboxField':
      return (
        <CheckboxFieldDetail
          field={field}
          objectName={objectName}
          mode={mode}
          onBack={onBack}
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    
    case 'DropDownListField':
      return (
        <DropDownListFieldDetail
          field={field}
          objectName={objectName}
          mode={mode}
          onBack={onBack}
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    
    case 'LookupField':
      return (
        <LookupFieldDetail
          field={field}
          objectName={objectName}
          mode={mode}
          onBack={onBack}
          onEdit={onEdit}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    
    default:
      return (
        <div className="p-6 border rounded-md">
          <p className="text-destructive" data-testid="error-unsupported-type">
            Unsupported field type: {field.type}
          </p>
          <button
            onClick={onBack}
            className="mt-4 text-primary hover:underline"
            data-testid="button-back"
          >
            ← Back to Field List
          </button>
        </div>
      );
  }
}
