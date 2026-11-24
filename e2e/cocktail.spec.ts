import { expect, type APIRequestContext, type Page, type Route } from "@playwright/test";
import { anonContext, api, rolePage, testA as test, warm } from "./support/ui";

// 칵테일 추천(/cocktail). 앱은 단계(step) 화면이 아니라 "주문서 한 장"에 경험·장소·알코올·도수·맛·탄산·기주·기피 재료·메모를 모두 둔다.
// 기본은 AI 호출(/api/gemini)을 모의한다. 이후 저장(POST /api/cocktails)과 결과 재조회(/cocktail/result/[oid])는 실제 BE·DB 를 쓴다.
// 이미지 검색(/api/google)은 모의(404)로 막는다. 실제 AI 는 E2E_REAL_AI=1 일 때만 @real 한 건 실행.
test.describe.configure({ mode: "serial" });

const MOCK = {
  cocktailName: "[M3-QA] 모의 진 토닉 (Mock Gin Tonic)", baseSpirit: "진", abv: "약 10%", foodPairing: "[M3-QA] 올리브와 견과",
  bartenderMessage: "“[M3-QA] 상큼하게 골랐어요.”\n상큼한 맛 조건과 맞아요", tastingNote: "맛 키워드: 상큼, 드라이\n탄산: 있음",
  checkList: ["진 45ml", "토닉워터 120ml", "라임 1조각"], method: ["얼음 가득 채운 잔에 진을 붓는다", "토닉을 따른다"],
};
const oids: number[] = [];
let a: APIRequestContext;
let savedOid = 0;
const body = (route: Route) => route.request().postDataJSON();

test.beforeAll(async () => { test.setTimeout(300_000); a = await api("a"); await warm(a, ["/cocktail", "/cocktail/result/1"]); });
test.afterAll(async () => { for (const o of oids) await a.delete(`/api/cocktails/${o}`).catch(() => {}); await a.dispose(); });

async function mockCommon(page: Page) {
  await page.route("**/api/google", (r) => r.fulfill({ status: 404, contentType: "application/json", body: "{}" }));
}
const ok = (route: Route, delay = 0) => new Promise<void>((res) => setTimeout(() => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK) }).then(() => res()), delay));
const pressed = (page: Page, name: string | RegExp) => page.getByRole("button", { name, exact: typeof name === "string" });
const submit = (page: Page) => page.getByRole("button", { name: "칵테일 추천받기" });

async function fillOrder(page: Page) {
  await page.goto("/cocktail");
  await expect(submit(page)).toBeEnabled();
  await pressed(page, "마셔 본 적 있어요").click();
  await pressed(page, "상큼한").click();
  await pressed(page, "달콤한").click();
  await pressed(page, "탄산 있음").click();
  await pressed(page, "진").click();
  await pressed(page, "민트").click();
  await page.getByLabel("바텐더에게 남기는 메모 (선택)").fill("[M3-QA] 비 오는 날");
}

test.describe("CR 칵테일 추천", () => {
  test("CR-01 비로그인: 추천 버튼 비활성 + 로그인 안내", async ({ browser }) => {
    const ctx = await anonContext(browser);
    const page = await ctx.newPage();
    await page.goto("/cocktail");
    await expect(page.getByText(/로그인하면 추천을 받을 수 있어요/)).toBeVisible();
    await expect(submit(page)).toBeDisabled();
    await ctx.close();
  });

  test("CR-02 선택값이 요청에 담기고(AI 모의) 결과 화면이 이름·이유·재료·AI 고지와 함께 뜬다, 저장은 실제 DB", async ({ page }) => {
    await mockCommon(page);
    let sent: any = null;
    await page.route("**/api/gemini", (r) => { sent = body(r); return ok(r); });
    await fillOrder(page);
    await expect(pressed(page, "마셔 본 적 있어요")).toHaveAttribute("aria-pressed", "true");
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/cocktails") && r.request().method() === "POST");
    await submit(page).click();
    const res = await saved;
    expect(res.status()).toBeLessThan(300);
    savedOid = await res.json();
    oids.push(savedOid);
    await expect(page.getByRole("heading", { level: 1, name: /모의 진 토닉/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "고른 이유" })).toBeVisible();
    await expect(page.getByText("토닉워터", { exact: true })).toBeVisible();
    await expect(page.getByText("추천 안주")).toBeVisible();
    await expect(page.getByText("AI가 만든 추천이라 재료가 실제와 다를 수 있어요.")).toBeVisible();
    await expect(page.getByText("뺀 재료")).toBeVisible();
    expect(sent.type).toBe(1);
    expect(sent.data).toMatchObject({ experienceLevel: "experienced", isNonAlcoholic: false, carbonation: true, baseSpirit: "진", currentMood: "[M3-QA] 비 오는 날" });
    expect(sent.data.preferredTaste.join()).toMatch(/상큼.*달콤|달콤.*상큼/);
    expect(sent.data.dislikes).toEqual(["민트"]);
  });

  test("CR-03 결과에서 '조건 바꾸기' → 주문서로 돌아가도 선택·메모 유지", async ({ page }) => {
    await mockCommon(page);
    await page.route("**/api/gemini", (r) => ok(r));
    await fillOrder(page);
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/cocktails") && r.request().method() === "POST");
    await submit(page).click();
    oids.push(await (await saved).json());
    await page.getByRole("button", { name: "조건 바꾸기" }).click();
    await expect(submit(page)).toBeVisible();
    await expect(pressed(page, "마셔 본 적 있어요")).toHaveAttribute("aria-pressed", "true");
    await expect(pressed(page, "상큼한")).toHaveAttribute("aria-pressed", "true");
    await expect(pressed(page, /민트/)).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("바텐더에게 남기는 메모 (선택)")).toHaveValue("[M3-QA] 비 오는 날");
  });

  test("CR-04 저장된 결과 /cocktail/result/[oid]: 소유자는 열림, 타인(b)은 막힘(화면·API)", async ({ page, browser }, info) => {
    await page.goto(`/cocktail/result/${savedOid}`);
    await expect(page.getByRole("heading", { level: 1, name: /모의 진 토닉/ })).toBeVisible();
    await expect(page.getByText("토닉워터", { exact: true })).toBeVisible();
    const b = await api("b");
    const r = await b.get(`/api/cocktails/${savedOid}`);
    info.annotations.push({ type: "observed", description: `b → GET /api/cocktails/oid ${r.status()}` });
    expect(r.ok()).toBeFalsy();
    expect((await b.delete(`/api/cocktails/${savedOid}`)).ok()).toBeFalsy();
    await b.dispose();
    const { ctx, page: pb } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await pb.goto(`/cocktail/result/${savedOid}`);
    await expect(pb.getByText(/찾을 수 없는 추천 결과예요/)).toBeVisible();
    await expect(pb.getByText(/토닉워터/)).toHaveCount(0);
    await pb.goto("/cocktail/result/abc");
    await expect(pb.getByText(/찾을 수 없는 추천 결과예요/)).toBeVisible();
    await ctx.close();
    expect((await a.get(`/api/cocktails/${savedOid}`)).status()).toBe(200);
  });

  test("CR-05 AI 실패(500 모의) → 복구 가능한 오류, 입력 유지, '다시 시도'로 성공", async ({ page }) => {
    await mockCommon(page);
    let fail = true;
    await page.route("**/api/gemini", (r) => fail ? r.fulfill({ status: 500, contentType: "application/json", body: "{}" }) : ok(r));
    await fillOrder(page);
    await submit(page).click();
    const alert = page.getByRole("alert").filter({ hasText: "추천을 가져오는 중 문제가 생겼어요" });
    await expect(alert).toBeVisible();
    await expect(pressed(page, "상큼한")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("바텐더에게 남기는 메모 (선택)")).toHaveValue("[M3-QA] 비 오는 날");
    fail = false;
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/cocktails") && r.request().method() === "POST");
    await page.getByRole("button", { name: "다시 시도" }).click();
    oids.push(await (await saved).json());
    await expect(page.getByRole("heading", { level: 1, name: /모의 진 토닉/ })).toBeVisible();
  });

  test("CR-06 일일 한도 초과(DAILY_LIMITED 모의) → 한도 안내, 재시도 버튼 없음", async ({ page }) => {
    await mockCommon(page);
    await page.route("**/api/gemini", (r) => r.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ code: "DAILY_LIMITED" }) }));
    await fillOrder(page);
    await submit(page).click();
    await expect(page.getByRole("alert").filter({ hasText: "오늘 사용할 수 있는 추천 횟수를 모두 사용했어요." })).toBeVisible();
    await expect(page.getByText("내일 다시 이용할 수 있어요.")).toBeVisible();
    await expect(page.getByRole("button", { name: "다시 시도" })).toHaveCount(0);
  });

  test("CR-07 네트워크 끊김(abort 모의) → 일반 오류 안내, 서버 원문 미노출, 입력 유지", async ({ page }) => {
    await mockCommon(page);
    await page.route("**/api/gemini", (r) => r.abort("failed"));
    await fillOrder(page);
    await submit(page).click();
    const alert = page.getByRole("alert").filter({ hasText: "추천을 가져오는 중 문제가 생겼어요" });
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText(/Failed to fetch|TypeError/);
    await expect(pressed(page, /민트/)).toHaveAttribute("aria-pressed", "true");
  });

  test("CR-08 무응답(모의) 60초 → 기다리기 중단 안내, 입력 유지, '다시 시도' 가능", async ({ page }, info) => {
    // 60초를 실제로 기다리므로 데스크톱에서만 돈다(브라우저별 차이 없는 fetch 제한 시간)
    test.skip(info.project.name !== "desktop", "60초 대기 시험은 desktop 한 번만");
    test.setTimeout(120_000);
    await mockCommon(page);
    await page.route("**/api/gemini", () => { /* 응답하지 않음 */ });
    await fillOrder(page);
    await submit(page).click();
    await expect(page.getByRole("alert").filter({ hasText: "응답이 너무 오래 걸려 기다리기를 멈췄어요" })).toBeVisible({ timeout: 75_000 });
    await expect(pressed(page, "상큼한")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("바텐더에게 남기는 메모 (선택)")).toHaveValue("[M3-QA] 비 오는 날");
    await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  });

  test("CR-09 추천 버튼 연타 → AI 요청 1건", async ({ page }) => {
    await mockCommon(page);
    let n = 0;
    await page.route("**/api/gemini", (r) => { n++; return ok(r, 800); });
    await fillOrder(page);
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/cocktails") && r.request().method() === "POST");
    await submit(page).dblclick();
    oids.push(await (await saved).json());
    await expect(page.getByRole("heading", { level: 1, name: /모의 진 토닉/ })).toBeVisible();
    expect(n).toBe(1);
  });

  test("CR-10 무알콜 선택 → 기주·도수 항목 숨김, 요청은 baseSpirit=상관없음·strength=null", async ({ page }) => {
    await mockCommon(page);
    let sent: any = null;
    await page.route("**/api/gemini", (r) => { sent = body(r); return ok(r); });
    await page.goto("/cocktail");
    await expect(submit(page)).toBeEnabled();
    await expect(page.getByText("베이스 기주 지정")).toBeVisible();
    await pressed(page, "알코올 없이").click();
    await expect(page.getByText("베이스 기주 지정")).toHaveCount(0);
    await expect(page.getByText("도수는 어느 정도로 할까요?")).toHaveCount(0);
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/cocktails") && r.request().method() === "POST");
    await submit(page).click();
    oids.push(await (await saved).json());
    expect(sent.data).toMatchObject({ isNonAlcoholic: true, baseSpirit: "상관없음", strength: null });
  });

  test("CR-11 기피 재료 9번째 선택 → 8개 제한 안내 모달", async ({ page }) => {
    await page.goto("/cocktail");
    await expect(submit(page)).toBeEnabled();
    for (const d of ["민트", "오이", "계란 흰자", "시나몬", "고수", "올리브", "견과류", "유제품"]) await pressed(page, d).click();
    await pressed(page, "코코넛").click();
    await expect(page.getByRole("dialog").getByText("8개까지 고를 수 있어요")).toBeVisible();
    await page.getByRole("button", { name: "알겠어요" }).click();
    await expect(pressed(page, "코코넛")).toHaveAttribute("aria-pressed", "false");
  });

  test("CR-12 @real 실제 AI 추천: 이름·재료·이유 표시", async ({ page }) => {
    test.skip(process.env.E2E_REAL_AI !== "1", "E2E_REAL_AI=1 일 때만 실제 AI 호출(비용·한도 소모)");
    test.setTimeout(150_000);
    await page.goto("/cocktail");
    await expect(submit(page)).toBeEnabled();
    await pressed(page, "상큼한").click();
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/cocktails") && r.request().method() === "POST", { timeout: 120_000 });
    await submit(page).click();
    oids.push(await (await saved).json());
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "고른 이유" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "필요한 재료" })).toBeVisible();
  });
});
