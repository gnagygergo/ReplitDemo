import { Suspense, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loadCompanyComponent } from "@/lib/loadCompanyComponent";

interface ObjectDetailPageProps {
  objectCode: string;
}

export default function ObjectDetailPage({ objectCode }: ObjectDetailPageProps) {
  const { user } = useAuth();
  const companyId = user?.companyId?.trim() || "0_default";
  
  const singularObjectCode = objectCode.endsWith('s') ? objectCode.slice(0, -1) : objectCode;
  
  const componentRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  const prevObjectCodeRef = useRef<string>("");
  
  if (!componentRef.current || prevCompanyIdRef.current !== companyId || prevObjectCodeRef.current !== objectCode) {
    componentRef.current = loadCompanyComponent(companyId, objectCode, `${singularObjectCode}-detail.detail-view`);
    prevCompanyIdRef.current = companyId;
    prevObjectCodeRef.current = objectCode;
  }
  
  const Component = componentRef.current;
  
  return (
    <Suspense fallback={<div data-testid={`loading-${singularObjectCode}-detail`} className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div>}>
      <Component />
    </Suspense>
  );
}
