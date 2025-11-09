import type { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export interface LookupFieldProps {
  mode: "edit" | "view" | "table";
  value: { id: string; name: string } | null;
  onOpenLookup: () => void;
  placeholder?: string;
  icon?: ReactNode;
  linkPath?: string;
  testId?: string;
  valueTestIdPrefix?: string;
  className?: string;
  ariaLabel?: string;
}

export function LookupField({
  mode,
  value,
  onOpenLookup,
  placeholder = "Select item",
  icon,
  linkPath = "/",
  testId,
  valueTestIdPrefix,
  className = "",
  ariaLabel,
}: LookupFieldProps) {
  if (mode === "edit") {
    return (
      <Button
        type="button"
        variant="outline"
        className={`w-full justify-start h-auto p-3 ${className}`}
        onClick={onOpenLookup}
        data-testid={testId}
        aria-label={ariaLabel}
      >
        {value ? (
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 text-primary flex items-center justify-center">
                  {icon}
                </div>
              </div>
            )}
            <div className="flex flex-col items-start">
              <span className="font-medium" data-testid={valueTestIdPrefix ? `text-${valueTestIdPrefix}-${value.id}` : undefined}>
                {value.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-muted-foreground">
            {icon && <div className="h-4 w-4 flex items-center justify-center">{icon}</div>}
            <span>{placeholder}</span>
          </div>
        )}
      </Button>
    );
  }

  if (mode === "view") {
    return (
      <div className={`text-sm py-2 ${className}`} data-testid={testId} aria-disabled={!value}>
        {value ? (
          <Link href={`${linkPath}/${value.id}`}>
            <span className="text-primary hover:underline cursor-pointer">
              {value.name}
            </span>
          </Link>
        ) : (
          <span>-</span>
        )}
      </div>
    );
  }

  if (mode === "table") {
    return (
      <div className={className} data-testid={testId} aria-disabled={!value}>
        {value ? (
          <Link href={`${linkPath}/${value.id}`}>
            <span className="text-primary hover:underline cursor-pointer text-sm">
              {value.name}
            </span>
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>
    );
  }

  return null;
}
