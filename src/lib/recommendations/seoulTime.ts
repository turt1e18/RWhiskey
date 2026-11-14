/**
 * 바 장면의 시간 기준. 기기 시간대와 상관없이 서울 시각을 쓴다("서울의 바").
 * 일출·일몰은 연출용 근사값이며 천문 계산이 아니다.
 */
export type SkyPhase = 'PREDAWN' | 'MORNING' | 'DAY' | 'GOLDEN' | 'SUNSET' | 'NIGHT';
export interface SeoulParts { year: number; month: number; day: number; hour: number; minute: number }

/**
 * 서울, 각 달 15일 무렵의 [일출, 일몰] (자정부터 분).
 * shortcut: 기억에 의존한 근사값이다. 운영 반영 전 한국천문연구원 공개 자료와 대조해 교체한다.
 */
export const SEOUL_SUN: readonly (readonly [number, number])[] = [
  [465, 1055], [445, 1085], [410, 1115], [365, 1145], [330, 1170], [312, 1195],
  [325, 1195], [350, 1165], [375, 1125], [400, 1080], [430, 1045], [455, 1035],
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

/** 하늘 구간과 해·달의 궤적 단계(0~11). 해는 일출~일몰, 달은 일몰~다음 일출 동안 움직인다. */
export function skyPhase(date: Date): { phase: SkyPhase; sunStep: number | null; moonStep: number | null } {
  const { hour, minute } = seoulParts(date);
  const now = hour * 60 + minute;
  const { sunrise: S, sunset: E } = seoulSunTimes(date);
  const phase: SkyPhase = now >= S - 50 && now < S ? 'PREDAWN'
    : now >= S && now < S + 120 ? 'MORNING'
    : now >= S + 120 && now < E - 90 ? 'DAY'
    : now >= E - 90 && now < E - 20 ? 'GOLDEN'
    : now >= E - 20 && now < E + 30 ? 'SUNSET' : 'NIGHT';
  const step = (p: number) => Math.min(11, Math.max(0, Math.round(p * 11)));
  const daylight = now >= S && now < E;
  const sinceSunset = (now - E + 1440) % 1440, nightLength = S + 1440 - E;
  return { phase, sunStep: daylight ? step((now - S) / (E - S)) : null, moonStep: daylight ? null : step(sinceSunset / nightLength) };
}
