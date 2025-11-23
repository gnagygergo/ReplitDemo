import { ObjectBuilder } from "./object-builder";

export default function BusinessObjectsBuilderModule() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground">This is the place where you can overview or customize the business objects that build up your system. Define custom fields, layouts, and govern the lifecycle of any business objects that you have.</p>
      </div>
      <ObjectBuilder />
    </div>
  );
}
