/**
 * SearchBar — Story 14-8
 *
 * Composant de recherche réutilisable pour listes (tournois, leagues).
 * Icône loupe à gauche, debounce 300ms.
 *
 * @see design-system-convergence.md section 4.7
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";

/**
 * Props for the SearchBar component.
 *
 * @param value - Controlled value (synced from parent)
 * @param onChange - Callback invoked after 300ms debounce when value changes
 * @param placeholder - Placeholder text (default: "Rechercher...")
 */
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 300;

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Rechercher...",
}: SearchBarProps) => {
  const [internalValue, setInternalValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync from parent when value changes externally (e.g. reset)
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounce onChange 300ms (onChangeRef avoids effect re-runs when parent passes unstable callback)
  useEffect(() => {
    if (internalValue === value) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChangeRef.current(internalValue);
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [internalValue, value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
    },
    [],
  );

  return (
    <div className="relative">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        size={20}
        aria-hidden
      />
      <input
        type="search"
        role="searchbox"
        aria-label={placeholder}
        autoComplete="off"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
      />
    </div>
  );
};
