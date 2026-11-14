export type TimeOfDay = 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';

/** 창문 장면용 시간대. 기기 현지 시각만 쓰고 위치·날씨는 쓰지 않는다. */
export function timeOfDay(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'DAWN';
  if (h >= 8 && h < 17) return 'DAY';
  if (h >= 17 && h < 19) return 'SUNSET';
  return 'NIGHT';
}
