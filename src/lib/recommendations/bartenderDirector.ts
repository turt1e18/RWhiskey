import ACTS from './bartenderActs.json';

export type ActName = keyof typeof ACTS.acts;
export type BundleKind = 'wipe' | 'idle' | 'arrange' | 'exit';
export interface SceneState { glass: boolean; liquid: number; bucket: boolean }
/** `to`: the bartender's box walks to this source-pixel x during the step (2px per walk frame). */
export interface Step { act: ActName; ms: number; events: [number, Partial<SceneState>][]; to?: number }

/** Bartender box x (source pixels): behind the guest glass, in front of the back bar, and past the doorway (off scene). */
export const HOME = 124, SHELF = 196, EXIT = -40;
const WALK_FRAME_MS = 100, PX_PER_FRAME = 2;

const length = (act: ActName) => ACTS.acts[act].frames.reduce((s, [, ms]) => s + Number(ms), 0);
const step = (act: ActName, ms = length(act)): Step => {
  const def = ACTS.acts[act] as { events?: [number, Partial<SceneState>][] };
  return { act, ms, events: def.events ?? [] };
};
/**
 * Turn 3/4 → walk → face front again. The walk lasts as many 100ms frames as 2px steps it needs,
 * so feet and position stay in sync (no sliding). Carrying the ice bucket ends by setting it on the counter.
 */
export const walk = (from: number, to: number, carry = false): Step[] => {
  const right = to > from, ms = Math.abs(to - from) / PX_PER_FRAME * WALK_FRAME_MS;
  return [step(right ? 'turnR' : 'turnL'), { ...step(carry ? 'walkRB' : right ? 'walkR' : 'walkL', ms), to },
    step(carry ? 'setDown' : right ? 'faceR' : 'faceL')];
};

/** 결과가 처음 보일 때: 잠깐 대기 → 손님 잔에 따르기 → 내주기. 끝나면 잔은 30%, 닦은 잔은 카운터 위. */
export const INTRO: Step[] = [step('idle', 1000), step('pour'), step('serve'), step('idle', 3000)];
export const START_STATE: SceneState = { glass: true, liquid: 0, bucket: false };
export const SERVED_STATE: SceneState = { glass: true, liquid: 3, bucket: false };
/** Bundles between two exits; at ~8–20s per bundle this keeps exits about a minute apart or more. */
export const EXIT_GAP = 4;
/** Bundles between any two walks (shelf or exit), so movement stays occasional while the result is being read. */
export const WALK_GAP = 3;

/**
 * 다음 묶음을 고른다. 모든 묶음은 제자리(HOME)·빈손·잔은 카운터 위에서 시작하고 끝난다. 대기는 연속 두 번 나오지 않는다.
 * - 걷기 불가(태블릿 이하): 잔 닦기 65%, 대기 35%.
 * - 걷기 가능(장면 전체가 보이는 1024px 이상): 잔 닦기 40%, 선반 앞 병 정리 25%, 문으로 나갔다 오기 15%(EXIT_GAP 묶음 간격), 대기 20%.
 *   걷는 묶음끼리는 WALK_GAP 묶음 이상 떨어지고(결과가 뜬 직후 두 묶음은 걷지 않음), 간격 때문에 걸을 수 없을 때 그 몫은 잔 닦기로 간다. 카운터에 얼음통이 없으면 60% 확률로 얼음통을 들고 돌아와 내려놓는다.
 * rand는 테스트에서 고정 시드를 넣기 위해 주입한다.
 */
export function nextBundle(rand: () => number, last: BundleKind | null, opts: { walk?: boolean; sinceExit?: number; sinceWalk?: number; bucket?: boolean } = {}):
  { kind: BundleKind; steps: Step[] } {
  const r = rand();
  let kind: BundleKind;
  if (!opts.walk) kind = r < 0.65 ? 'wipe' : 'idle';
  else kind = r < 0.4 ? 'wipe' : r < 0.65 ? 'arrange' : r < 0.8 ? 'exit' : 'idle';
  if (kind === 'exit' && (opts.sinceExit ?? EXIT_GAP) < EXIT_GAP) kind = 'wipe';
  if ((kind === 'exit' || kind === 'arrange') && (opts.sinceWalk ?? WALK_GAP) < WALK_GAP) kind = 'wipe';
  if (kind === 'idle' && last === 'idle') kind = 'wipe';
  const pause = step('idle', 600 + Math.round(rand() * 900));
  switch (kind) {
    case 'wipe': return { kind, steps: [step('pick'), step('wipe'), step('place'), pause] };
    case 'arrange': return { kind, steps: [...walk(HOME, SHELF), step('arrange'), ...walk(SHELF, HOME), pause] };
    // Off scene behind the doorway for 4–8s, then back the same way.
    case 'exit': {
      const carry = !opts.bucket && rand() < 0.6;
      return { kind, steps: [...walk(HOME, EXIT), step('rest', 4000 + Math.round(rand() * 4000)), ...walk(EXIT, HOME, carry), pause] };
    }
    default: return { kind, steps: [step('idle', 3000 + Math.round(rand() * 3000)), pause] };
  }
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
