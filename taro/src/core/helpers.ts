export function formatRotation(hours: number | null): string {
  if (hours == null) return '暂无';
  const abs = Math.abs(hours);
  const direction = hours < 0 ? '（逆行）' : '';
  if (abs >= 24) return `${(abs / 24).toFixed(1)} 地球日${direction}`;
  return `${abs.toFixed(1)} 小时${direction}`;
}

export function formatOrbit(days: number | null): string {
  if (days == null) return '不适用';
  const abs = Math.abs(days);
  const direction = days < 0 ? '（逆行）' : '';
  if (abs >= 365) return `${(abs / 365.25).toFixed(2)} 地球年${direction}`;
  return `${abs.toFixed(1)} 地球日${direction}`;
}

export function buildFacts(rotationHours: number | null, orbitalPeriodDays: number | null, facts: string[]): string[] {
  return [`自转周期：${formatRotation(rotationHours)}`, `公转周期：${formatOrbit(orbitalPeriodDays)}`, ...facts];
}
