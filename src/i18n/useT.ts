import fr from "./fr.json";

type Dict = Record<string, unknown>;
type Vars = Record<string, string | number>;

const DICT: Dict = fr as Dict;

function resolve(path: string, dict: Dict): string | undefined {
  const parts = path.split(".");
  let node: unknown = dict;
  for (const p of parts) {
    if (node && typeof node === "object" && p in (node as Dict)) {
      node = (node as Dict)[p];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] === undefined ? `{${k}}` : String(vars[k]),
  );
}

/**
 * Minimal i18n — French only for now.
 *
 * Usage:
 *   const t = useT();
 *   t("common.save")                            // "Enregistrer"
 *   t("league.createSuccess", { name: "BPL" })  // "Ligue « BPL » créée"
 *   t("tournament.status.pending")              // "En attente"
 *
 * If the key is missing it returns the key itself to make the gap obvious in dev.
 */
export function useT() {
  return function t(key: string, vars?: Vars): string {
    const raw = resolve(key, DICT);
    if (raw === undefined) {
      if (import.meta.env?.DEV) {
        console.warn(`[i18n] missing key: ${key}`);
      }
      return key;
    }
    return interpolate(raw, vars);
  };
}

export type TFn = ReturnType<typeof useT>;
