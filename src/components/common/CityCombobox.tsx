import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CITIES } from "@/lib/ivoryCities";

interface CityComboboxProps {
  value: string;
  /** Reçoit la ville choisie (ou saisie libre). */
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/** Combobox recherchable des villes de Côte d'Ivoire, avec saisie libre autorisée. */
const CityCombobox = ({
  value,
  onChange,
  placeholder = "Rechercher une ville…",
  className,
  id,
}: CityComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const norm = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return CITIES;
    return CITIES.filter((c) => norm(c).includes(q));
  }, [query]);

  const select = (city: string) => {
    onChange(city);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tapez le nom de la ville…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim() ? (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent"
                  onClick={() => select(query.trim())}
                >
                  Utiliser « {query.trim()} »
                </button>
              ) : (
                "Aucune ville trouvée."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((city) => (
                <CommandItem key={city} value={city} onSelect={() => select(city)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === city ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CityCombobox;
