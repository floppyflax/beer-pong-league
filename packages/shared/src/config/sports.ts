/**
 * Sport configuration for the ELO-Fight platform.
 *
 * Each sport defines its own rules, scoring, terminology, and branding.
 * Icons are referenced by name — each platform resolves them to its own icon library.
 */

export interface SportConfig {
  id: string;
  name: string;
  brandName: string;
  tagline: string;
  /** Icon name (resolved per-platform: lucide-react on web, expo-vector-icons on mobile) */
  iconName: string;
  emoji: string;

  theme: {
    primary: string;
    gradient: string;
  };

  scoring: {
    maxScore: number;
    hasCupsRemaining: boolean;
    scoreUnitSingular: string;
    scoreUnitPlural: string;
  };

  formats: Array<'1v1' | '2v2' | '3v3' | 'libre'>;
  defaultFormat: '1v1' | '2v2' | '3v3' | 'libre';

  elo: {
    initialRating: number;
    kFactor: number;
  };

  terms: {
    match: string;
    matches: string;
    tournament: string;
    tournaments: string;
    league: string;
    leagues: string;
    player: string;
    players: string;
    winner: string;
  };
}

export const SPORTS: Record<string, SportConfig> = {
  beerpong: {
    id: 'beerpong',
    name: 'Beer Pong',
    brandName: 'BeerPong ELO',
    tagline: 'Le classement ELO du beer pong',
    iconName: 'beer',
    emoji: '🍺',
    theme: {
      primary: '#f59e0b',
      gradient: 'linear-gradient(to right, #f59e0b, #eab308)',
    },
    scoring: {
      maxScore: 10,
      hasCupsRemaining: true,
      scoreUnitSingular: 'gobelet',
      scoreUnitPlural: 'gobelets',
    },
    formats: ['1v1', '2v2'],
    defaultFormat: '2v2',
    elo: { initialRating: 1000, kFactor: 32 },
    terms: {
      match: 'Match', matches: 'Matchs',
      tournament: 'Tournoi', tournaments: 'Tournois',
      league: 'Ligue', leagues: 'Ligues',
      player: 'Joueur', players: 'Joueurs',
      winner: 'Gagnant',
    },
  },

  darts: {
    id: 'darts',
    name: 'Fléchettes',
    brandName: 'Darts ELO',
    tagline: 'Le classement ELO des fléchettes',
    iconName: 'target',
    emoji: '🎯',
    theme: {
      primary: '#ef4444',
      gradient: 'linear-gradient(to right, #ef4444, #dc2626)',
    },
    scoring: {
      maxScore: 501,
      hasCupsRemaining: false,
      scoreUnitSingular: 'point',
      scoreUnitPlural: 'points',
    },
    formats: ['1v1', '2v2'],
    defaultFormat: '1v1',
    elo: { initialRating: 1000, kFactor: 32 },
    terms: {
      match: 'Partie', matches: 'Parties',
      tournament: 'Tournoi', tournaments: 'Tournois',
      league: 'Ligue', leagues: 'Ligues',
      player: 'Joueur', players: 'Joueurs',
      winner: 'Vainqueur',
    },
  },

  boardgames: {
    id: 'boardgames',
    name: 'Jeux de Société',
    brandName: 'BoardGame ELO',
    tagline: 'Le classement ELO des jeux de société',
    iconName: 'dices',
    emoji: '🎲',
    theme: {
      primary: '#8b5cf6',
      gradient: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
    },
    scoring: {
      maxScore: 1,
      hasCupsRemaining: false,
      scoreUnitSingular: 'victoire',
      scoreUnitPlural: 'victoires',
    },
    formats: ['1v1', '2v2', '3v3', 'libre'],
    defaultFormat: 'libre',
    elo: { initialRating: 1000, kFactor: 24 },
    terms: {
      match: 'Partie', matches: 'Parties',
      tournament: 'Tournoi', tournaments: 'Tournois',
      league: 'Ligue', leagues: 'Ligues',
      player: 'Joueur', players: 'Joueurs',
      winner: 'Gagnant',
    },
  },

  videogames: {
    id: 'videogames',
    name: 'Jeux Vidéo',
    brandName: 'Gaming ELO',
    tagline: 'Le classement ELO des jeux vidéo',
    iconName: 'gamepad-2',
    emoji: '🎮',
    theme: {
      primary: '#06b6d4',
      gradient: 'linear-gradient(to right, #06b6d4, #0891b2)',
    },
    scoring: {
      maxScore: 1,
      hasCupsRemaining: false,
      scoreUnitSingular: 'victoire',
      scoreUnitPlural: 'victoires',
    },
    formats: ['1v1', '2v2', '3v3', 'libre'],
    defaultFormat: '1v1',
    elo: { initialRating: 1000, kFactor: 32 },
    terms: {
      match: 'Match', matches: 'Matchs',
      tournament: 'Tournoi', tournaments: 'Tournois',
      league: 'Ligue', leagues: 'Ligues',
      player: 'Joueur', players: 'Joueurs',
      winner: 'Vainqueur',
    },
  },

  generic: {
    id: 'generic',
    name: 'ELO Fight',
    brandName: 'ELO Fight',
    tagline: 'Le classement ELO universel',
    iconName: 'swords',
    emoji: '⚔️',
    theme: {
      primary: '#f59e0b',
      gradient: 'linear-gradient(to right, #f59e0b, #eab308)',
    },
    scoring: {
      maxScore: 1,
      hasCupsRemaining: false,
      scoreUnitSingular: 'victoire',
      scoreUnitPlural: 'victoires',
    },
    formats: ['1v1', '2v2', '3v3', 'libre'],
    defaultFormat: '1v1',
    elo: { initialRating: 1000, kFactor: 32 },
    terms: {
      match: 'Match', matches: 'Matchs',
      tournament: 'Tournoi', tournaments: 'Tournois',
      league: 'Ligue', leagues: 'Ligues',
      player: 'Joueur', players: 'Joueurs',
      winner: 'Gagnant',
    },
  },
};

export const DEFAULT_SPORT_ID = 'beerpong';
