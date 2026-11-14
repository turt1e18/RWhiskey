import ACTS from './bartenderActs.json';

export type ActName = keyof typeof ACTS.acts;
export interface SceneState { glass: boolean; liquid: number }
export interface Step { act: ActName; ms: number; events: [number, Partial<SceneState>][] }

const length = (act: ActName) => ACTS.acts[act].frames.reduce((s, [, ms]) => s + Number(ms), 0);
const step = (act: ActName, ms = length(act)): Step => {
  const def = ACTS.acts[act] as { events?: [number, Partial<SceneState>][] };
  return { act, ms, events: def.events ?? [] };
};

/** 결과가 처음 보일 때: 잠깐 대기 → 손님 잔에 따르기 → 내주기. 끝나면 잔은 30%, 닦은 잔은 카운터 위. */
export const INTRO: Step[] = [step('idle', 1000), step('pour'), step('serve'), step('idle', 3000)];
export const START_STATE: SceneState = { glass: true, liquid: 0 };
export const SERVED_STATE: SceneState = { glass: true, liquid: 3 };

/**
 * 다음 묶음을 고른다. 잔 닦기 65%(카운터의 잔을 집어 닦고 다시 내려놓기), 대기 35%. 대기는 연속 두 번 나오지 않는다.
 * 묶음 사이에는 0.6~1.5초 멈춤(호흡만)을 둔다. rand는 테스트에서 고정 시드를 넣기 위해 주입한다.
 */
export function nextBundle(rand: () => number, last: 'wipe' | 'idle' | null): { kind: 'wipe' | 'idle'; steps: Step[] } {
  const kind = last === 'idle' || rand() < 0.65 ? 'wipe' : 'idle';
  const pause = step('idle', 600 + Math.round(rand() * 900));
  return kind === 'wipe'
    ? { kind, steps: [step('pick'), step('wipe'), step('place'), pause] }
    : { kind, steps: [step('idle', 3000 + Math.round(rand() * 3000)), pause] };
}

/** 같은 시드면 같은 순서를 돌려주는 작은 난수 생성기(mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const actLength = length;
