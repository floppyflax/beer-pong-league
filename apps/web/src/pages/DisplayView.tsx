import { useParams } from "react-router-dom";
import { DisplayShell } from "../features/display/DisplayShell";
import { useLeagueDisplaySource } from "../features/display/hooks/useLeagueDisplaySource";

/**
 * Mode diffusion d'une league (plein écran TV / projecteur).
 *
 * Wrapper mince — toute l'UI vit dans `DisplayShell` + scènes.
 */
export const DisplayView = () => {
  const { id } = useParams<{ id: string }>();
  const source = useLeagueDisplaySource(id);
  return <DisplayShell source={source} />;
};
