export const getWinRateColorClass = (winRate: number): string => {
  if (winRate < 40) return 'text-signal-red';
  if (winRate > 60) return 'text-lime';
  return 'text-white';
};
