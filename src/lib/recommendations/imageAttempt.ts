/** At most two resources from the same attributed search hit, inside one eight-second display budget. */
export function imageFailureAction(index:number,hasFallback:boolean,elapsedMs:number):'fallback'|'unavailable' {
  return index===0 && hasFallback && elapsedMs<8000?'fallback':'unavailable';
}
export function imageAttemptWait(index:number,hasFallback:boolean,elapsedMs:number):number {
  return Math.max(0,Math.min(index===0 && hasFallback?4000:8000,8000-elapsedMs));
}
