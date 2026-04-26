/**
 * PlayerPool — searchable list of available players + inline create flow.
 *
 * Used in RecordMatch step 1 to assign players to teams. `canCreate` toggles
 * the "Ajouter un joueur" form (off for league context, on for event
 * context where guest players are allowed).
 */

import { useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import type { Player } from "@/types";
import { SearchBar } from "../SearchBar";
import { PlayerChip } from "../atoms/PlayerChip";

type PlayerWithAvatar = Player & { avatarUrl?: string | null };

export interface PlayerPoolProps {
  players: PlayerWithAvatar[];
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
  onCreateNew: (name: string) => Promise<void>;
  isCreating: boolean;
  canCreate: boolean;
}

export function PlayerPool({
  players,
  query,
  onQueryChange,
  onSelect,
  onCreateNew,
  isCreating,
  canCreate,
}: PlayerPoolProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await onCreateNew(name);
    setNewName("");
    setShowAdd(false);
  };

  return (
    <div className="bg-navy-soft rounded-card p-4 border border-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm">
          Joueurs disponibles
        </h3>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cool-gray">
          {players.length} dispo
        </span>
      </div>

      <SearchBar
        value={query}
        onChange={onQueryChange}
        placeholder="Rechercher un joueur..."
      />

      {players.length === 0 ? (
        <p className="text-xs text-cool-gray/60 italic text-center py-2">
          {query
            ? "Aucun joueur ne matche."
            : "Tous les joueurs sont assignés."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className="rounded-full transition-transform active:scale-95 hover:brightness-110"
              aria-label={`Ajouter ${p.name}`}
            >
              <PlayerChip
                name={p.name}
                avatarUrl={p.avatarUrl}
                side="neutral"
              />
            </button>
          ))}
        </div>
      )}

      {canCreate &&
        (showAdd ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreate();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du joueur"
              className="flex-1 bg-navy border border-card rounded-input px-3 py-2 text-sm text-white placeholder-cool-gray/50 focus:outline-none focus:ring-2 focus:ring-lime/30"
              autoFocus
              maxLength={100}
              required
            />
            <button
              type="submit"
              disabled={!newName.trim() || isCreating}
              className="h-9 w-9 shrink-0 rounded-full bg-lime text-navy flex items-center justify-center disabled:opacity-50 transition-opacity"
              aria-label="Valider le nouveau joueur"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewName("");
              }}
              className="h-9 w-9 shrink-0 rounded-full bg-navy border border-card flex items-center justify-center"
              aria-label="Annuler"
            >
              <X size={16} className="text-cool-gray" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-electric-blue hover:text-white text-sm font-archivo font-bold uppercase tracking-tight transition-colors"
          >
            <UserPlus size={14} />
            Ajouter un joueur
          </button>
        ))}
    </div>
  );
}
