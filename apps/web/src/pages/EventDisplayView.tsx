import { useEffect } from "react";
import {
  Navigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { DisplayShell } from "../features/display/DisplayShell";
import { useEventDisplaySource } from "../features/display/hooks/useEventDisplaySource";

/**
 * Mode diffusion d'un event (plein écran TV / projecteur).
 *
 * Wrapper mince — toute l'UI vit dans `DisplayShell` + scènes.
 *
 * `?variant=drama` (historique) est absorbée par la scène `live-match` et
 * redirige automatiquement vers la nouvelle URL.
 */
export const EventDisplayView = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const variant = searchParams.get("variant");

  useEffect(() => {
    if (variant === "drama") {
      // Une seule rétro-compat : on garde la query string nettoyée.
      const url = new URL(window.location.href);
      url.searchParams.delete("variant");
      window.history.replaceState({}, "", url.toString());
    }
  }, [variant]);

  const source = useEventDisplaySource(id);

  // Si on arrivait avec ?variant=drama, la prochaine scène automatique
  // ne sera pas forcément live-match ; mais l'interruption "new match"
  // ramène dessus dès qu'un match tombe. Pour PR2 c'est OK.
  if (variant === "drama" && id) {
    return <Navigate to={`/event/${id}/display`} replace />;
  }

  return <DisplayShell source={source} />;
};
