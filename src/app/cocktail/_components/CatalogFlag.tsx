"use client";

import { createContext, useContext, type ReactNode } from "react";

/** 서버의 카탈로그 기능 플래그. 꺼져 있으면 도수를 보장할 수 없어 도수 선택을 숨긴다. */
const CatalogFlag = createContext(false);

export function CatalogFlagProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <CatalogFlag.Provider value={value}>{children}</CatalogFlag.Provider>;
}

export const useCatalogEnabled = () => useContext(CatalogFlag);
