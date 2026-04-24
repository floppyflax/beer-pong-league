/**
 * ExportService — Phase E
 *
 * Client-side export of league data (JSON + CSV).
 * No server round-trip: works entirely from in-memory context data.
 *
 * Exported functions:
 *   exportLeagueJSON(league, options?)  → downloads <league-name>.json
 *   exportLeagueCSV(league, options?)   → downloads <league-name>-joueurs.csv
 *   exportMatchesCSV(league, options?)  → downloads <league-name>-matchs.csv
 */

import type { League, Player, Match } from "@/types";

// ── Internal helpers ────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells
    .map((c) => {
      const val = c == null ? "" : String(c);
      // Escape double-quotes, wrap in quotes if needed
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    })
    .join(",");
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface ExportOptions {
  /** Override the file base name (without extension). Defaults to slugified league name. */
  basename?: string;
}

/**
 * Downloads the full league as a pretty-printed JSON file.
 * Includes name, type, players (with stats), and matches (with ELO deltas).
 */
export function exportLeagueJSON(league: League, options: ExportOptions = {}): void {
  const basename = options.basename ?? slugify(league.name);

  const payload = {
    exportedAt: new Date().toISOString(),
    league: {
      id:        league.id,
      name:      league.name,
      type:      league.type,
      createdAt: league.createdAt,
      players:   league.players.map((p: Player) => ({
        id:            p.id,
        name:          p.name,
        elo:           p.elo,
        wins:          p.wins,
        losses:        p.losses,
        matchesPlayed: p.matchesPlayed,
        streak:        p.streak,
        winRate:       p.matchesPlayed > 0
          ? Math.round((p.wins / p.matchesPlayed) * 100)
          : 0,
      })),
      matches: league.matches.map((m: Match) => ({
        id:         m.id,
        date:       m.date,
        teamA:      m.teamA,
        teamB:      m.teamB,
        scoreA:     m.scoreA,
        scoreB:     m.scoreB,
        eloChanges: m.eloChanges ?? {},
      })),
    },
  };

  triggerDownload(
    JSON.stringify(payload, null, 2),
    `${basename}.json`,
    "application/json",
  );
}

/**
 * Downloads a CSV of league players ranked by ELO.
 * Columns: Rang, Joueur, ELO, Victoires, Défaites, Matchs, Win Rate, Série
 */
export function exportPlayersCSV(league: League, options: ExportOptions = {}): void {
  const basename = options.basename ?? slugify(league.name);

  const sorted = [...league.players].sort((a, b) => b.elo - a.elo);

  const header = csvRow(["Rang", "Joueur", "ELO", "Victoires", "Défaites", "Matchs", "Win Rate (%)", "Série"]);
  const rows   = sorted.map((p: Player, idx: number) =>
    csvRow([
      idx + 1,
      p.name,
      p.elo,
      p.wins,
      p.losses,
      p.matchesPlayed,
      p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0,
      p.streak,
    ]),
  );

  const csv = [
    `# Classement — ${league.name}`,
    `# Exporté le ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    header,
    ...rows,
  ].join("\n");

  triggerDownload(csv, `${basename}-joueurs.csv`, "text/csv;charset=utf-8;");
}

/**
 * Downloads a CSV of all matches in the league.
 * Columns: Date, Équipe A, Score A, Score B, Équipe B, Vainqueur
 */
export function exportMatchesCSV(
  league: League,
  playersMap: Record<string, string>,
  options: ExportOptions = {},
): void {
  const basename = options.basename ?? slugify(league.name);

  const header = csvRow(["Date", "Équipe A", "Score A", "Score B", "Équipe B", "Vainqueur"]);
  const rows   = [...league.matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((m: Match) => {
      const teamA  = m.teamA.map((id) => playersMap[id] ?? id).join(" & ");
      const teamB  = m.teamB.map((id) => playersMap[id] ?? id).join(" & ");
      const winner = m.scoreA > m.scoreB ? `Équipe A (${teamA})` : `Équipe B (${teamB})`;
      return csvRow([
        new Date(m.date).toLocaleDateString("fr-FR"),
        teamA,
        m.scoreA,
        m.scoreB,
        teamB,
        winner,
      ]);
    });

  const csv = [
    `# Matchs — ${league.name}`,
    `# Exporté le ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    header,
    ...rows,
  ].join("\n");

  triggerDownload(csv, `${basename}-matchs.csv`, "text/csv;charset=utf-8;");
}
