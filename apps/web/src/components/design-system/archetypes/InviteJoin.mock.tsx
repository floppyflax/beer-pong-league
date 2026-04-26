/**
 * InviteJoin archetype — represents EventInvite / EventJoin / LeagueJoin.
 *
 * Pattern: header + event recap card + identity choice prompt + sticky CTA.
 */

import { ChevronLeft } from "lucide-react";
import { PButton } from "@/components/ponglo/PButton";

export function InviteJoinMock() {
  return (
    <div className="min-h-full bg-navy text-white relative">
      <div className="px-4 pt-4 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 pt-2 pb-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full border-[1.5px] border-card flex items-center justify-center text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="font-archivo font-extrabold uppercase text-[17px] tracking-[-0.3px]">
            Rejoindre
          </div>
        </div>

        {/* Event recap */}
        <div className="bg-navy-soft border border-card rounded-card p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-ping-yellow mb-1">
            Événement · 2v2
          </p>
          <h2 className="font-archivo font-black text-2xl uppercase tracking-tight">
            Méchoui XIII
          </h2>
          <p className="text-sm text-cool-gray mt-1">8 joueurs · 5 matchs</p>
        </div>

        {/* Identity choice */}
        <div className="bg-navy-soft border border-card rounded-card p-4 space-y-3">
          <h3 className="font-archivo font-extrabold uppercase tracking-tight text-sm">
            Comment tu joues ?
          </h3>
          <button className="w-full text-left bg-navy border border-electric-blue/40 hover:border-electric-blue rounded-card px-3 py-3 transition-colors">
            <div className="text-sm font-archivo font-bold text-white">
              Continuer en tant que Florian
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-electric-blue mt-0.5">
              Identifié
            </div>
          </button>
          <button className="w-full text-left bg-navy border border-card hover:border-cool-gray rounded-card px-3 py-3 transition-colors">
            <div className="text-sm font-archivo font-bold text-white">
              Me connecter par email
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cool-gray mt-0.5">
              Code OTP
            </div>
          </button>
          <button className="w-full text-left bg-navy border border-card hover:border-cool-gray rounded-card px-3 py-3 transition-colors">
            <div className="text-sm font-archivo font-bold text-white">
              Jouer en invité
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cool-gray mt-0.5">
              Anonyme
            </div>
          </button>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="absolute left-0 right-0 bottom-0 px-4 py-3 bg-gradient-to-t from-navy via-navy/95 to-transparent">
        <PButton variant="primary" size="lg" full>
          Rejoindre l&apos;événement
        </PButton>
      </div>
    </div>
  );
}
