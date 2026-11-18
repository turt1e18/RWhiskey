interface CocktailCheckInput {
  experienceLevel?: string;
  isNonAlcoholic?: boolean;
  dislikes?: unknown;
}

/** AI 칵테일 응답이 사용자의 안전 조건과 맞는지 본다. 어긋나면 사유를, 맞으면 null을 돌려준다. */
export function cocktailMismatch(result: any, req: CocktailCheckInput): string | null {
  if (!result || typeof result.cocktailName !== "string" || !result.cocktailName.trim()) return "name";
  const list: string[] = Array.isArray(result.checkList) ? result.checkList.filter((x: unknown) => typeof x === "string") : [];
  const dislikes = Array.isArray(req.dislikes) ? req.dislikes.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
  const haystack = [result.cocktailName, ...list].join(" ").toLowerCase();
  if (dislikes.some((d) => haystack.includes(d.trim().toLowerCase()))) return "dislike";
  if (req.isNonAlcoholic) {
    const nums = String(result.abv ?? "").match(/\d+(\.\d+)?/g) ?? [];
    if (nums.some((n) => Number(n) >= 1)) return "alcohol";
  }
  if (req.experienceLevel === "home_bar" && (list.length === 0 || !Array.isArray(result.method) || result.method.length === 0)) return "recipe";
  return null;
}
