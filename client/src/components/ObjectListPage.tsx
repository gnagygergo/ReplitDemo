import { Suspense, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loadCompanyComponent } from "@/lib/loadCompanyComponent";

interface ObjectListPageProps {
  objectCode: string;
}

export default function ObjectListPage({ objectCode }: ObjectListPageProps) {
  const { user } = useAuth();
  const companyId = user?.companyId?.trim() || "0_default";
  
  const componentRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  const prevObjectCodeRef = useRef<string>("");
  
  if (!componentRef.current || prevCompanyIdRef.current !== companyId || prevObjectCodeRef.current !== objectCode) {
    componentRef.current = loadCompanyComponent(companyId, objectCode, `${objectCode}.table-view`);
    prevCompanyIdRef.current = companyId;
    prevObjectCodeRef.current = objectCode;
  }
  
  const Component = componentRef.current;
  
  return (
    <Suspense fallback={<div data-testid={`loading-${objectCode}`} className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div>}>
      <Component />
    </Suspense>
  );
}
