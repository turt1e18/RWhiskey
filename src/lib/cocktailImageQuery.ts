/** 영어 이름이 있으면 그것으로, 없으면 이름 끝 괄호 안의 영문("기네스 (Gimlet)")으로, 그것도 없으면 이름 그대로 검색한다. */
export function cocktailImageQuery(name: string, nameEn?: string | null): string {
  const en = nameEn?.trim() || name.match(/\(([A-Za-z][A-Za-z0-9 '&.-]*)\)\s*$/)?.[1].trim();
  return en ? `${en} cocktail` : `cocktail ${name}`;
}
