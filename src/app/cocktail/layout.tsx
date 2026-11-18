import type { ReactNode } from "react";
import { catalogEnabled } from "@/server/cocktailCatalog";
import { CatalogFlagProvider } from "./_components/CatalogFlag";

// 플래그는 서버 환경 변수라 빌드 때 굳지 않게 요청마다 읽는다.
export const dynamic = "force-dynamic";

export default function CocktailLayout({ children }: { children: ReactNode }) {
  return <CatalogFlagProvider value={catalogEnabled()}>{children}</CatalogFlagProvider>;
}
