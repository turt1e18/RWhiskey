export type TimeOfDay = 'MORNING' | 'DAY' | 'EVENING' | 'NIGHT';

/**
 * 창문 장면이 바뀌는 시작 시각(기기 현지 시각, 0~23시). 분위기 연출용 구간이며 실제 일출·일몰과는 무관하다.
 * 위치·날씨는 쓰지 않는다.
 */
export const TIME_RANGES: Record<TimeOfDay, number> = { MORNING: 6, DAY: 10, EVENING: 17, NIGHT: 20 };

export function timeOfDay(date: Date, ranges: Record<TimeOfDay, number> = TIME_RANGES): TimeOfDay {
  const h = date.getHours();
  // The latest start not after the current hour wins; before the earliest start it is still last night.
  const order = (Object.keys(ranges) as TimeOfDay[]).sort((a, b) => ranges[a] - ranges[b]);
  return [...order].reverse().find((t) => h >= ranges[t]) ?? order[order.length - 1];
}
