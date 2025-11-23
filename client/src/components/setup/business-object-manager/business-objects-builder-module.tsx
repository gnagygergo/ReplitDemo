import { ObjectBuilder } from "./object-builder";

export default function BusinessObjectsBuilderModule() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Object and Process Builder</h2>
        <p className="text-muted-foreground">Define custom fields, layouts, and business processes</p>
      </div>
      <ObjectBuilder />
    </div>
  );
}
