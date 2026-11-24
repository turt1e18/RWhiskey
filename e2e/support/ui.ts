import { test as base, expect, request, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import { account } from "./accounts";

// 역할 a 의 로그인 상태로 시작하는 test. account()는 실행 시점에 파일을 읽는다(setup 프로젝트 이후).
export const testA = base.extend({
  storageState: async ({}, use) => { await use(account("a").state); },
});

export const TAG = "[M3-QA]";
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/** FE 프록시(localhost:3000/api)로 호출하는 API 컨텍스트. role 이 없으면 비로그인. */
export async function api(role?: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL: BASE, storageState: role ? account(role).state : { cookies: [], origins: [] } });
}

/** 다른 역할(예: b)의 화면. 프로젝트(기기) 설정을 이어받는다. 호출한 쪽이 ctx.close() 한다. */
export async function rolePage(browser: Browser, role: string, project: Record<string, unknown>) {
  const keys = ["viewport", "userAgent", "isMobile", "hasTouch", "deviceScaleFactor", "locale", "baseURL"];
  const opts = Object.fromEntries(keys.filter((k) => k in project).map((k) => [k, project[k]]));
  const ctx = await browser.newContext({ ...opts, storageState: account(role).state });
  return { ctx, page: await ctx.newPage() };
}

/** 시음 노트를 API 로 만든다(준비용). 본문은 TAG 로 시작해야 한다. */
export async function createEntry(a: APIRequestContext, over: Record<string, unknown> = {}) {
  const res = await a.post("/api/tasting-entries", {
    data: { clientKey: crypto.randomUUID(), status: "TASTED", whiskeyName: `${TAG} API 준비`, whiskeyNameEn: null, tastedOn: null, serving: null,
      memo: `${TAG} 준비용 메모`, nose: null, palate: null, finish: null, rating: null, visibility: "PRIVATE", ...over },
  });
  expect(res.ok(), `create entry status ${res.status()}`).toBeTruthy();
  return (await res.json()) as { id: number; likeCount: number; [k: string]: unknown };
}

export async function removeEntries(a: APIRequestContext, ids: number[]) {
  for (const id of ids) await a.delete(`/api/tasting-entries/${id}`).catch(() => {});
}

/** 저장 버튼 클릭 → POST 응답에서 노트 id 를 돌려준다. */
export async function saveNew(page: Page, ids: number[]) {
  const res = page.waitForResponse((r) => r.url().endsWith("/api/tasting-entries") && r.request().method() === "POST");
  await page.getByRole("button", { name: "기록 저장" }).click();
  const r = await res;
  expect(r.status(), "POST 상태").toBeLessThan(300);
  const id = (await r.json()).id as number;
  ids.push(id);
  return id;
}

/** Next dev 서버의 첫 컴파일 지연(수십 초)이 시험 실패로 번지지 않게 경로를 미리 한 번 연다. */
export async function warm(a: APIRequestContext, paths: string[]) {
  for (const p of paths) await a.get(p, { timeout: 120_000 }).catch(() => {});
}

/** 문자열을 그대로 찾는 정규식(TAG 의 대괄호 때문에 필요). */
export const re = (s: string, flags = "") => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);

/** 비로그인 컨텍스트. testA 의 storageState 가 browser.newContext()에도 적용되므로 비어 있는 상태를 명시한다. */
export const anonContext = (browser: Browser) => browser.newContext({ storageState: { cookies: [], origins: [] } });
