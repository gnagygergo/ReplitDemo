import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";

interface Timezone {
  timezoneId: string;
  displayName: string;
  region: string;
  utcOffset: string;
  utcOffsetDST: string;
}

interface TimezoneSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
}

export function TimezoneSelector({
  value,
  onValueChange,
  placeholder = "Select timezone...",
  testId,
}: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: timezones = [], isLoading } = useQuery<Timezone[]>({
    queryKey: ["/api/universal/timezones"],
  });

  const selectedTimezone = timezones.find((tz) => tz.timezoneId === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid={testId}
        >
          {selectedTimezone ? (
            <span className="truncate">
              {selectedTimezone.displayName} ({selectedTimezone.utcOffset})
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <div className="py-6 text-center text-sm">Loading timezones...</div>
              ) : (
                timezones.map((timezone) => (
                  <CommandItem
                    key={timezone.timezoneId}
                    value={`${timezone.displayName} ${timezone.timezoneId} ${timezone.region}`}
                    onSelect={() => {
                      onValueChange(timezone.timezoneId);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === timezone.timezoneId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{timezone.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {timezone.region} • {timezone.utcOffset}
                      </span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
