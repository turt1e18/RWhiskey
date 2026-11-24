import { expect, type Page, type Route } from "@playwright/test";
import { anonContext, api, testA as test, warm } from "./support/ui";

test.beforeAll(async () => { test.setTimeout(300_000); const a = await api("a"); await warm(a, ["/mood/verified"]); await a.dispose(); });

// 위스키 추천(/mood/verified, AI 제안 경로). AI 호출(POST /api/recommendations/v3/ai-suggestions)은 기본적으로 모의한다.
// 모의 범위: 추천 POST 와 결과 카드가 여는 feedback/EXPECTED 조회만. 로그인·세션·카탈로그 선택지는 실제 FE→BE 이다.
// 실제 AI(@real)는 E2E_REAL_AI=1 일 때만.
test.describe.configure({ mode: "serial" });

const OPID = "11111111-2222-4333-8444-555555555555";
const SUGGESTION = {
  apiVersion: "V3", state: "SUCCESS", code: null, nextAction: "NONE", operationId: OPID, recommendationId: null, selected: null, evidenceUrl: null,
  appliedLevel: "INTERMEDIATE", recommendedAt: new Date().toISOString(),
  verification: { atRecommendation: "AI_SUGGESTED", current: "UNVERIFIED", certificateId: null },
  aiSuggestion: {
    id: OPID,
    identity: { brand: "M3QA Distillery", expression: "Mock 12 Year Old", category: "Single Malt", country: "Scotland", abv: 43, ageStatement: "NUMBERED", ageYears: 12 },
    presentation: { summary: ["[M3-QA] 모의 바텐더 소개 문장이에요."], pairings: [{ food: "다크 초콜릿", reason: "[M3-QA] 쌉쌀함이 어울려요" }] },
    notice: "[M3-QA] AI가 제안한 정보라 제품 정보는 아직 교차검증 전이에요.", reasons: [],
  },
};
const V3_URL = "**/api/recommendations/v3/ai-suggestions";
const json = (route: Route, status: number, data: unknown) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
const submit = (page: Page) => page.getByRole("button", { name: /위스키 추천 받기|이전 주문 결과 확인|주문을 살펴보고/ });

async function mockSide(page: Page) {
  // 결과 카드가 열어 보는 첫인상 조회. 모의 operationId 는 서버에 없으므로 빈 값(204)으로 답한다.
  await page.route("**/api/recommendations/v3/ai-suggestions/*/feedback/EXPECTED", (r) => r.fulfill({ status: 204 }));
}
async function chooseOrder(page: Page) {
  await page.goto("/mood/verified");
  await expect(page.getByRole("heading", { level: 1, name: /위스키를 찾아보세요/ })).toBeVisible({ timeout: 20_000 });
  await expect(submit(page)).toBeEnabled({ timeout: 20_000 });
  await page.locator("label", { hasText: "중급" }).click();
  await page.locator("label", { hasText: "피하고 싶어요" }).click();
  await page.getByRole("button", { name: "바닐라·캐러멜" }).click();
  await page.getByRole("button", { name: "과일·감귤" }).click();
  await page.getByLabel("독립 병입 포함").check();
}

test.describe("WR 위스키 추천", () => {
  test("WR-01 비로그인: 추천 버튼 비활성", async ({ browser }) => {
    const ctx = await anonContext(browser);
    const page = await ctx.newPage();
    await page.goto("/mood/verified");
    await expect(page.getByRole("heading", { level: 1, name: /위스키를 찾아보세요/ })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "위스키 추천 받기" })).toBeDisabled();
    await ctx.close();
  });

  test("WR-02 선택값이 POST 본문에 담기고(모의), 결과 카드가 AI 제안·교차검증 전임을 밝힌다", async ({ page }) => {
    await mockSide(page);
    let sent: any = null; let key: string | null = null;
    await page.route(V3_URL, (r) => { if (r.request().method() !== "POST") return r.fallback(); sent = r.request().postDataJSON(); key = r.request().headers()["idempotency-key"]; return json(r, 200, SUGGESTION); });
    await chooseOrder(page);
    await expect(page.getByRole("button", { name: "바닐라·캐러멜" })).toHaveAttribute("aria-pressed", "true");
    await submit(page).click();
    await expect(page.getByRole("heading", { name: /M3QA Distillery/ })).toBeVisible();
    expect(sent).toMatchObject({ experienceLevel: "INTERMEDIATE", includeIndependentBottlings: true, includeOldBottles: false, explorationIntent: "BALANCED" });
    expect(sent.preferences.aromas).toEqual(["VANILLA_CARAMEL", "FRESH_FRUIT"]);
    expect(sent.preferences.smoke).toBe("AVOID");
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    // 미확인 표시 문구 관찰
    await expect(page.getByText("AI 바텐더 추천")).toBeVisible();
    await expect(page.getByText(/교차검증 전/).first()).toBeVisible();
    const found = await page.getByText(/AI 바텐더 추천|참고 정보|교차검증 전|AI/).allInnerTexts();
    test.info().annotations.push({ type: "observed-labels", description: [...new Set(found.map((t) => t.trim().slice(0, 60)))].slice(0, 8).join(" | ") });
    await expect(page.getByText("[M3-QA] 모의 바텐더 소개 문장이에요.")).toBeVisible();
    await expect(page.getByText("다크 초콜릿")).toBeVisible();
    await expect(page.getByText("이전 추천 카드 다시 보기")).toHaveCount(0);
  });

  test("WR-03 결과 → '조건 바꿔 다시 주문' 후 이전 선택 유지", async ({ page }) => {
    await mockSide(page);
    await page.route(V3_URL, (r) => r.request().method() === "POST" ? json(r, 200, SUGGESTION) : r.fallback());
    await chooseOrder(page);
    await submit(page).click();
    await expect(page.getByRole("heading", { name: /M3QA Distillery/ })).toBeVisible();
    await page.getByRole("button", { name: /조건 바꿔 다시 주문/ }).click();
    await expect(page.getByRole("button", { name: "바닐라·캐러멜" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("독립 병입 포함")).toBeChecked();
    await expect(page.getByLabel("중급")).toBeChecked();
  });

  test("WR-04 서버 오류(500 모의) → 결과 확인 안내, 선택 유지, 새 주문 대신 '이전 주문 결과 확인'", async ({ page }) => {
    await page.route(V3_URL, (r) => r.request().method() === "POST" ? json(r, 500, {}) : r.fallback());
    await chooseOrder(page);
    await submit(page).click();
    await expect(page.getByText(/연결 또는 저장 결과를 확인하지 못했어요/)).toBeVisible();
    await expect(page.getByRole("button", { name: "바닐라·캐러멜" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "이전 주문 결과 확인" }).first()).toBeVisible();
  });

  test("WR-05 한도 초과(DAILY_LIMITED 429 모의) → 한도 안내", async ({ page }) => {
    await page.route(V3_URL, (r) => r.request().method() === "POST" ? json(r, 429, { apiVersion: "V3", state: "UNAVAILABLE", code: "DAILY_LIMITED", nextAction: "NONE" }) : r.fallback());
    await chooseOrder(page);
    await submit(page).click();
    await expect(page.getByRole("alertdialog", { name: "오늘 추천을 모두 사용했어요" })).toBeVisible();
    await expect(page.getByRole("button", { name: "바닐라·캐러멜" })).toHaveAttribute("aria-pressed", "true");
  });

  test("WR-06 조건에 맞는 후보 없음(NO_MATCH 모의) → 조건 유지 안내", async ({ page }) => {
    await page.route(V3_URL, (r) => r.request().method() === "POST" ? json(r, 200, { apiVersion: "V3", state: "NO_MATCH", code: null, nextAction: "EDIT_REQUEST" }) : r.fallback());
    await chooseOrder(page);
    await submit(page).click();
    await expect(page.getByText(/조건에 맞는 추천 후보를 고르지 못했어요/)).toBeVisible();
    await expect(page.getByLabel("독립 병입 포함")).toBeChecked();
  });

  test("WR-07 AI 제공자 지연(DISCOVERY_PROVIDER_TIMEOUT 모의) → 횟수 미사용 안내", async ({ page }) => {
    await page.route(V3_URL, (r) => r.request().method() === "POST" ? json(r, 200, { apiVersion: "V3", state: "UNAVAILABLE", code: "DISCOVERY_PROVIDER_TIMEOUT", nextAction: "NEW_REQUEST" }) : r.fallback());
    await chooseOrder(page);
    await submit(page).click();
    await expect(page.getByText(/추천 횟수는 사용하지 않았고 선택은 그대로예요/).first()).toBeVisible();
  });

  test("WR-08 무응답 25초 초과(타임아웃 모의) → 결과 미확인 안내, 선택 유지", async ({ page }) => {
    test.setTimeout(80_000);
    await page.route(V3_URL, (r) => r.request().method() === "POST" ? new Promise(() => { /* 응답 없음 */ }) : r.fallback());
    await chooseOrder(page);
    await submit(page).click();
    await expect(page.getByText(/연결 또는 저장 결과를 확인하지 못했어요/)).toBeVisible({ timeout: 40_000 });
    await expect(page.getByRole("button", { name: "과일·감귤" })).toHaveAttribute("aria-pressed", "true");
  });

  test("WR-09 추천 버튼 연타 → POST 1건", async ({ page }) => {
    await mockSide(page);
    let n = 0;
    await page.route(V3_URL, (r) => { if (r.request().method() !== "POST") return r.fallback(); n++; return new Promise<void>((res) => setTimeout(() => json(r, 200, SUGGESTION).then(() => res()), 800)); });
    await chooseOrder(page);
    await submit(page).dblclick();
    await expect(page.getByRole("heading", { name: /M3QA Distillery/ })).toBeVisible();
    expect(n).toBe(1);
  });

  test("WR-10 @real 실제 AI 추천: 카드·AI 고지 표시", async ({ page }) => {
    test.skip(process.env.E2E_REAL_AI !== "1", "E2E_REAL_AI=1 일 때만 실제 AI 호출(비용·한도 소모)");
    test.setTimeout(150_000);
    await page.goto("/mood/verified");
    await expect(submit(page)).toBeEnabled({ timeout: 20_000 });
    await page.getByRole("button", { name: "바닐라·캐러멜" }).click();
    const res = page.waitForResponse((r) => r.url().includes("/api/recommendations/v3/ai-suggestions") && r.request().method() === "POST", { timeout: 120_000 });
    await submit(page).click();
    expect((await res).status()).toBeLessThan(300);
    await expect(page.getByText("AI 바텐더 추천")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  });
});
