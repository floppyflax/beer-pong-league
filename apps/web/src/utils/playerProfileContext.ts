export type PlayerProfileContext =
  | { type: "league"; id: string }
  | { type: "event"; id: string };

const encode = (ctx: PlayerProfileContext) => `${ctx.type}:${ctx.id}`;

export const buildPlayerProfilePath = (
  playerId: string,
  context?: PlayerProfileContext | null,
): string => {
  const base = `/player/${playerId}`;
  return context ? `${base}?ctx=${encode(context)}` : base;
};

export const buildHeadToHeadPath = (
  playerId: string,
  opponentId: string,
  context?: PlayerProfileContext | null,
): string => {
  const base = `/player/${playerId}/vs/${opponentId}`;
  return context ? `${base}?ctx=${encode(context)}` : base;
};

export const parsePlayerProfileContext = (
  search: string,
): PlayerProfileContext | null => {
  const params = new URLSearchParams(search);
  const raw = params.get("ctx");
  if (!raw) return null;
  const sep = raw.indexOf(":");
  if (sep < 1) return null;
  const type = raw.slice(0, sep);
  const id = raw.slice(sep + 1);
  if (!id) return null;
  if (type !== "league" && type !== "event") return null;
  return { type, id };
};
