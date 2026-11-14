/**
 * 바 장면의 시간 기준. 기기 시간대와 상관없이 서울 시각을 쓴다("서울의 바").
 * 하루하루의 일출·일몰은 월별 표를 보간한 연출용 값이다.
 */
export type SkyPhase = 'PREDAWN' | 'MORNING' | 'DAY' | 'GOLDEN' | 'SUNSET' | 'NIGHT';
export interface SeoulParts { year: number; month: number; day: number; hour: number; minute: number }

/**
 * 서울(37.5665N, 126.9780E), 2026년 각 달 15일의 [일출, 일몰] (KST, 자정부터 분).
 * NOAA 일출 공식(천정각 90.833°)으로 계산했고, 공개 자료와 1~3분 이내로 맞는 것을 확인했다
 * (1/15 07:46·17:37, 2/1 07:36·17:55, 4/15 일몰 19:07). 해마다 1~2분 차이는 연출에 영향이 없다.
 */
export const SEOUL_SUN: readonly (readonly [number, number])[] = [
  [466, 1057], [443, 1091], [404, 1119], [358, 1147], [323, 1174], [310, 1195],
  [322, 1193], [347, 1166], [373, 1121], [400, 1076], [431, 1042], [459, 1035],
];

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
});

export function seoulParts(date: Date): SeoulParts {
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(formatter.formatToParts(date).find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute') };
}

const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** 그날의 일출·일몰: 이웃한 두 달의 15일 값을 날짜로 선형 보간해 월 경계에서 계단이 생기지 않게 한다. */
export function seoulSunTimes(date: Date): { sunrise: number; sunset: number } {
  const { year, month, day } = seoulParts(date);
  const from = day >= 15 ? month : month === 1 ? 12 : month - 1;
  const to = from === 12 ? 1 : from + 1;
  const span = daysIn(year, day >= 15 ? month : month === 1 ? 12 : month - 1) || 30;
  const t = day >= 15 ? (day - 15) / span : (day + span - 15) / span;
  const [r1, s1] = SEOUL_SUN[from - 1], [r2, s2] = SEOUL_SUN[to - 1];
  return { sunrise: Math.round(r1 + (r2 - r1) * t), sunset: Math.round(s1 + (s2 - s1) * t) };
}

/**
 * 하늘 구간, 구간 안 진행률(0~1), 해·달의 궤적 단계(0~11). 해는 일출~일몰, 달은 일몰~다음 일출 동안 움직인다.
 * 진행률은 새벽→아침, 골든아워→노을, 노을→밤을 분 단위로 이어 붙이는 데 쓴다.
 */
export function skyPhase(date: Date): { phase: SkyPhase; progress: number; sunStep: number | null; moonStep: number | null } {
  const { hour, minute } = seoulParts(date);
  const now = hour * 60 + minute;
  const { sunrise: S, sunset: E } = seoulSunTimes(date);
  const phase: SkyPhase = now >= S - 50 && now < S ? 'PREDAWN'
    : now >= S && now < S + 120 ? 'MORNING'
    : now >= S + 120 && now < E - 90 ? 'DAY'
    : now >= E - 90 && now < E - 20 ? 'GOLDEN'
    : now >= E - 20 && now < E + 30 ? 'SUNSET' : 'NIGHT';
  const bounds: Record<SkyPhase, [number, number]> = {
    PREDAWN: [S - 50, S], MORNING: [S, S + 120], DAY: [S + 120, E - 90], GOLDEN: [E - 90, E - 20], SUNSET: [E - 20, E + 30], NIGHT: [E + 30, S - 50 + 1440],
  };
  const [from, to] = bounds[phase], elapsed = (now - from + 1440) % 1440;
  const progress = Math.min(1, Math.max(0, elapsed / (to - from)));
  const step = (p: number) => Math.min(11, Math.max(0, Math.round(p * 11)));
  const daylight = now >= S && now < E;
  const sinceSunset = (now - E + 1440) % 1440, nightLength = S + 1440 - E;
  return { phase, progress, sunStep: daylight ? step((now - S) / (E - S)) : null, moonStep: daylight ? null : step(sinceSunset / nightLength) };
}
