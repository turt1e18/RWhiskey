import type { CocktailImageCredit } from './ApiInterface';

export interface CocktailDataInterface {
  oid?: number;
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
