import type { Match } from "@/types";

export type DisplaySourceKind = "event" | "league";

export interface DisplaySourcePlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  elo: number;
  /** 1-based, calculé localement à l'event/league. */
  rank: number;
  /** Variation de rang depuis avant le dernier match terminé. >0 = monté, <0 = descendu. */
  rankDelta?: number;
  /** Delta ELO sur le dernier match terminé (pour l'effet "match qui tombe"). */
  eloDelta?: number;
  wins: number;
  losses: number;
  /** 0..100. Calculé depuis wins/(wins+losses). */
  winRate: number;
  /** 5 derniers résultats — le plus récent en premier. true = victoire. */
  recentResults: boolean[];
}

export interface DisplaySource {
  kind: DisplaySourceKind;
  /** Nom de l'event ou de la league. */
  name: string;
  /** URL absolue à mettre dans le QR code (page join). */
  joinUrl: string;
  /** Event uniquement : code 6-char alphanumérique pour rejoindre. */
  joinCode?: string;
  /** Statut live (true tant qu'on accepte des matchs). */
  isLive: boolean;
  /** Pour event : date de l'event ; pour league : type ou date dérivée. */
  subtitle?: string;
  /** Tous les joueurs, triés par rang croissant. */
  players: DisplaySourcePlayer[];
  /** Tous les matchs — le plus récent en premier. */
  matches: Match[];
  /** Nombre total de matchs joués. */
  matchesPlayedCount: number;
  /** Chargement initial (avant que le `players` soit prêt). */
  isLoading: boolean;
  /** ID de la ressource source (event.id ou league.id) — utile pour la nav retour. */
  sourceId: string;
  /** Path React Router pour revenir à la page parente sur ESC. */
  exitPath: string;
}
