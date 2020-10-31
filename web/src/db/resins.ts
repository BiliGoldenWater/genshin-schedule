export const ResinCap = 120;
export const ResinsPerMinute = 1 / 8;

export function getResinRecharge(ms: number) {
  return (ms / 60000) * ResinsPerMinute;
}

export function clampResin(value: number) {
  return Math.floor(Math.max(0, Math.min(ResinCap, value)));
}