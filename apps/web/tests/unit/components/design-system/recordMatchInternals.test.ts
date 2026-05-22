import { describe, it, expect } from "vitest";
import {
  deriveMatchScore,
  TOTAL_CUPS,
} from "@/components/design-system/page-specific/recordMatchInternals";

/**
 * Convention de score « gobelets restants » : le vainqueur marque ses gobelets
 * restants (1..10), le perdant 0. Ces tests verrouillent la cohérence
 * saisie ↔ persistance ↔ validation (cf. bug : la validation affichait un
 * score différent de celui saisi).
 */
describe("deriveMatchScore", () => {
  it("attribue au vainqueur ses gobelets restants et 0 au perdant (équipe A)", () => {
    expect(deriveMatchScore("A", 3)).toEqual({ scoreA: 3, scoreB: 0 });
  });

  it("attribue au vainqueur ses gobelets restants et 0 au perdant (équipe B)", () => {
    expect(deriveMatchScore("B", 7)).toEqual({ scoreA: 0, scoreB: 7 });
  });

  it("encode une victoire « parfaite » comme TOTAL_CUPS – 0", () => {
    expect(deriveMatchScore("A", TOTAL_CUPS)).toEqual({
      scoreA: TOTAL_CUPS,
      scoreB: 0,
    });
  });

  it("ne fige JAMAIS le vainqueur à 10 quand il lui reste moins de gobelets (régression)", () => {
    // Le bug d'origine stockait toujours 10 pour le vainqueur et
    // TOTAL_CUPS - restants pour le perdant.
    const { scoreA, scoreB } = deriveMatchScore("A", 2);
    expect(scoreA).toBe(2);
    expect(scoreB).toBe(0);
    expect(scoreA).not.toBe(TOTAL_CUPS);
  });

  it("garantit score vainqueur > score perdant pour tout 1..10 (invariant ELO)", () => {
    for (let cups = 1; cups <= TOTAL_CUPS; cups++) {
      const a = deriveMatchScore("A", cups);
      expect(a.scoreA).toBeGreaterThan(a.scoreB);
      const b = deriveMatchScore("B", cups);
      expect(b.scoreB).toBeGreaterThan(b.scoreA);
    }
  });
});
