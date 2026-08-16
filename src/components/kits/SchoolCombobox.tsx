import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, School as SchoolIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

export type SchoolOption = {
  id: string;
  name: string;
  code: string | null;
  logo_url?: string | null;
  city?: string | null;
};

interface SchoolComboboxProps {
  value?: string | null;
  onChange: (school: SchoolOption | null) => void;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  /** Restrict to admin-visible schools (bypass public filter) */
  adminMode?: boolean;
}

export const SchoolCombobox = ({
  value,
  onChange,
  placeholder = "Rechercher votre établissement",
  emptyLabel = "Aucun établissement trouvé.",
  className,
  adminMode = false,
}: SchoolComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const table = adminMode ? "schools" : "public_schools";
      const { data } = await (supabase.from(table as any) as any)
        .select("id,name,code,logo_url,city")
        .order("name", { ascending: true })
        .limit(1000);
      if (mounted && data) setSchools(data as SchoolOption[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [adminMode]);

  const selected = useMemo(() => schools.find((s) => s.id === value) || null, [schools, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code || "").toLowerCase().includes(q) ||
        (s.city || "").toLowerCase().includes(q),
    );
  }, [schools, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-11", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <SchoolIcon className="h-4 w-4 shrink-0 opacity-60" />
            {selected ? (
              <span className="truncate">
                {selected.name}
                {selected.code ? <span className="text-muted-foreground"> · {selected.code}</span> : null}
              </span>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nom ou code référent…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{loading ? "Chargement…" : emptyLabel}</CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 100).map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.id}
                  onSelect={() => {
                    onChange(s.id === value ? null : s);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === s.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.code || "—"}
                      {s.city ? ` · ${s.city}` : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SchoolCombobox;
