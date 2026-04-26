/**
 * FormWizard archetype — represents CreateEvent / CreateLeague / RecordMatch.
 *
 * Pattern: minimal back header + stepper + form fields stack + sticky CTA.
 */

import { ChevronLeft } from "lucide-react";
import { Stepper } from "../molecules/Stepper";
import { PButton } from "@/components/ponglo/PButton";

export function FormWizardMock() {
  return (
    <div className="min-h-full bg-navy text-white relative">
      <div className="px-4 pt-4 pb-20 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2.5 pt-2 pb-2">
          <button
            type="button"
            className="w-9 h-9 rounded-full border-[1.5px] border-card flex items-center justify-center text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="font-archivo font-extrabold uppercase text-[17px] tracking-[-0.3px]">
            Nouvel événement
          </div>
        </div>

        <Stepper total={3} current={2} label="Étape 2/3 — Détails" />

        {/* Field 1 */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">
            Nom de l&apos;événement
          </label>
          <input
            type="text"
            value="Méchoui XIII"
            readOnly
            className="w-full bg-navy-soft border border-card rounded-input px-3 py-3 text-white"
          />
        </div>

        {/* Field 2 */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">
            Format
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["1v1", "2v2", "3v3", "Libre"].map((f, i) => (
              <button
                key={f}
                className={`h-12 rounded-card border ${i === 1 ? "bg-electric-blue/15 border-electric-blue text-electric-blue" : "bg-navy border-card text-white"} font-archivo font-extrabold uppercase`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Field 3 */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">
            Lieu (optionnel)
          </label>
          <input
            type="text"
            placeholder="Bordeaux"
            className="w-full bg-navy-soft border border-card rounded-input px-3 py-3 text-white placeholder-cool-gray/50"
          />
        </div>
      </div>

      {/* Sticky CTA (cosmetic — positioned absolutely inside the frame) */}
      <div className="absolute left-0 right-0 bottom-0 px-4 py-3 bg-gradient-to-t from-navy via-navy/95 to-transparent">
        <PButton variant="primary" size="lg" full>
          Continuer →
        </PButton>
      </div>
    </div>
  );
}
