export interface MoodWhiskyDataInterface {
  oid?: number; // 백엔드에서 발급된 주문 번호
  whiskyName: string;
  whiskyNameEn: string;
  classification: string;
  featureTags: string[];
  foodName: string;
  pairingNote: string;
  bartenderWord: string;
  image: string | null;
}
