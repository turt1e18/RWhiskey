import type { WhiskeyCatalogFacetsResponse, WhiskeyExperienceLevel, WhiskeyVerifiedRecommendationResponse } from "@/type/ApiInterface";

const categoryLabels: Record<string, string> = {
  "Single Malt Scotch Whisky": "싱글 몰트 스카치",
  "Blended Scotch Whisky": "블렌디드 스카치",
  Bourbon: "버번", "Rye Whiskey": "라이 위스키",
  "Blended Irish Whiskey": "블렌디드 아이리시",
  "Single Pot Still Irish Whiskey": "싱글 팟 스틸 아이리시",
  "Japanese Single Malt Whisky": "일본 싱글 몰트",
  "Japanese Blended Whisky": "일본 블렌디드",
};
const countryLabels: Record<string, string> = {
  Scotland: "스코틀랜드", Ireland: "아일랜드", "United States": "미국", Japan: "일본",
  Canada: "캐나다", Taiwan: "대만", India: "인도", England: "잉글랜드", Wales: "웨일스",
};
const categoryCountries: Record<string, string> = {
  "Single Malt Scotch Whisky": "Scotland", "Blended Scotch Whisky": "Scotland",
  Bourbon: "United States", "Blended Irish Whiskey": "Ireland",
  "Single Pot Still Irish Whiskey": "Ireland", "Japanese Single Malt Whisky": "Japan",
  "Japanese Blended Whisky": "Japan",
};

/** Only named geographic styles constrain the country. Generic rye has no such mapping. */
export function countryForCategory(value: string, facets?: WhiskeyCatalogFacetsResponse | null): string | undefined {
  return facets?.categories.find((item) => item.value === value)?.country ?? categoryCountries[value];
}

export function whiskeyLabel(kind: "category" | "country" | "region", value: string, facets: WhiskeyCatalogFacetsResponse | null): string {
  const options = kind === "category" ? facets?.categories : kind === "country" ? facets?.countries : facets?.regions;
  return options?.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label ??
    (kind === "category" ? categoryLabels[value] : kind === "country" ? countryLabels[value] : undefined) ?? value;
}

export function bilingualLabel(kind: "category" | "country", value: string | null, facets: WhiskeyCatalogFacetsResponse | null): string | null {
  if (!value) return null;
  const key=value.trim().replace(/[_/\-]+/g,' ').replace(/\s+/g,' ').toLowerCase();
  if(['unknown','n a','not available'].includes(key))return null;
  const common:Record<string,[string,string]>=kind==='category'?{
    'single malt':['Single Malt','싱글 몰트'],'blended malt':['Blended Malt','블렌디드 몰트'],
    'blended':['Blended Whisky','블렌디드 위스키'],'blended whisky':['Blended Whisky','블렌디드 위스키'],
    'single grain':['Single Grain','싱글 그레인'],'blended grain':['Blended Grain','블렌디드 그레인'],
    'bourbon':['Bourbon','버번'],'rye':['Rye Whiskey','라이 위스키'],'rye whiskey':['Rye Whiskey','라이 위스키'],
    'tennessee':['Tennessee Whiskey','테네시 위스키'],'tennessee whiskey':['Tennessee Whiskey','테네시 위스키'],
    'single pot still':['Single Pot Still','싱글 팟 스틸']
  }:{'scotland':['Scotland','스코틀랜드'],'ireland':['Ireland','아일랜드'],
    'united states':['United States','미국'],'usa':['United States','미국'],'us':['United States','미국'],
    'japan':['Japan','일본'],'canada':['Canada','캐나다'],'taiwan':['Taiwan','대만'],'india':['India','인도'],
    'england':['England','잉글랜드'],'wales':['Wales','웨일스']};
  const mapped=common[key];if(mapped)return `${mapped[0]} (${mapped[1]})`;
  const known=Object.keys(kind==='category'?categoryLabels:countryLabels).find(k=>k.toLowerCase()===key);
  if(known){const label=whiskeyLabel(kind,known,facets);return label===known?known:`${known} (${label})`;}
  if(/[_/\-]/.test(value))return value.trim().replace(/[_/\-]+/g,' ').replace(/\s+/g,' ').toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase());
  const label = whiskeyLabel(kind, value, facets);
  return label === value ? value : `${value} (${label})`;
}

/** Wording is grounded in the rule codes; provider verification is not a taste reason. */
export function recommendationReasons(result: WhiskeyVerifiedRecommendationResponse, level: WhiskeyExperienceLevel): string[] {
  const beginner = level === "BEGINNER";
  const messages: Record<string, string> = {
    BEGINNER_CORE: "처음 취향을 알아가는 한 잔으로, 정규 제품부터 살펴보실 수 있도록 골랐어요.",
    PREFERRED_SWEET: beginner ? "달콤한 풍미가 끌린다고 하셔서, 그런 인상이 있는 병을 골랐어요." : "선택하신 달콤한 풍미를 이번 한 잔의 기준으로 삼았어요.",
    PREFERRED_FRUITY: beginner ? "과일 향이 궁금하다고 하셔서, 과일 풍미가 있는 병을 골랐어요." : "과일 풍미를 선호하신 주문에 맞춰 골랐어요.",
    PREFERRED_CATEGORY: "좋아하시는 위스키 종류에서 한 병을 골랐어요.",
    PREFERRED_COUNTRY: "선호하신 생산 국가의 위스키를 먼저 살펴봤어요.",
    PREFERRED_REGION: "선택하신 세부 산지의 위스키로 취향을 이어가 보세요.",
    TARGET_ABV_NEAR: "선호하신 도수에 가까운 병을 골랐어요.",
    TASTE_FEEDBACK_MATCH: "전에 마시고 좋다고 남기신 풍미와 닮은 쪽으로 골랐어요.",
    TASTE_FEEDBACK_AVOIDED: "전에 마시고 아쉽다고 남기신 풍미를 고려했어요.",
    RECENT_BOTTLING_PENALTY: "최근 추천과의 반복도 함께 살펴봤어요.",
    RECENT_PRODUCT_PENALTY: "최근에 만나신 제품과의 반복을 고려했어요.",
  };
  const reasons = [...new Set(result.reasonCodes
    .filter((code) => !beginner || !code.startsWith("RECENT_"))
    .map((code) => messages[code]).filter((message): message is string => Boolean(message)))];
  if (reasons.length) return reasons.slice(0, beginner ? 2 : 3);
  const selected = result.selected;
  const kind = selected?.category ? categoryLabels[selected.category] ?? selected.category : "위스키";
  const country = selected?.country ? countryLabels[selected.country] ?? selected.country : null;
  if (beginner) return [
    `오늘은 ${country ? `${country}의 ` : ""}${kind} 한 병을 골랐어요.`,
    "아직 취향을 모르셔도 괜찮아요. 이번 한 잔을 보면서 어떤 스타일이 궁금한지 찾아보세요.",
  ];
  return [`이번에는 ${kind} 한 병을 골랐어요.`, level === "ADVANCED"
    ? "아래 병입 구분과 도수를 살펴보고, 다음 주문에서 더 궁금한 병의 조건을 알려주세요."
    : "이 병의 정보를 살펴보고, 다음 주문에 더 궁금한 향이나 스타일을 알려주세요."];
}
