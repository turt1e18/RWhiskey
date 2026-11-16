import type { CocktailImageCredit } from './ApiInterface';

export interface CocktailDataInterface {
  oid?: number;
  /** 카탈로그 레시피 id(카탈로그 경로로 만든 결과만). '다른 한 잔'에서 제외할 때 쓴다. */
  cocktailId?: number;
  /** 저장된 결과의 주문 일시(LocalDateTime 문자열). 방금 받은 결과에는 없다. */
  orderDate?: string;
  cocktailName: string;
  baseSpirit: string;
  abv: string;
  foodName: string;
  pairingNote: string;
  bartenderWord?: string;
  images: string[];
  checkList: string[];
  method: string[];
  imageCredit?: CocktailImageCredit | null;
  relaxed?: string[];
  unverifiedDislikes?: string[];
}
