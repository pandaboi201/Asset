import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[] | string[];
  placeholder?: string;
  allLabel?: string;
  className?: string;
}

const ALL_VALUE = "__all__";

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = "Filter",
  allLabel = "All",
  className,
}: FilterSelectProps) {
  const normalized: FilterOption[] = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt,
  );

  return (
    <Select
      value={value === "" ? ALL_VALUE : value}
      onValueChange={(v) => onChange(v === ALL_VALUE ? "" : v)}
    >
      <SelectTrigger className={cn("h-9 w-[160px] capitalize", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
        {normalized.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="capitalize">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
