import { expect, type APIRequestContext } from "@playwright/test";
import { TAG, api, removeEntries, rolePage, saveNew, testA as test, warm, re, anonContext } from "./support/ui";

// 시음 노트 v2(/notes/new, /notes/entries, /notes/[id]). 사진 업로드는 범위 밖.
// 앱은 "자유/구조화" 모드 전환이 없다: 한 폼에서 메모만 쓰거나 "향·맛·여운 나눠 적기"를 펼쳐 쓴다. 위스키는 직접 입력만 있다(검색·선택 목록 미구현).
test.describe.configure({ mode: "serial" });

const ids: number[] = [];
let a: APIRequestContext;
let freeId = 0;
let structId = 0;
const POST_ENTRY = (r: { url(): string; method(): string }) => r.url().endsWith("/api/tasting-entries") && r.method() === "POST";

test.beforeAll(async () => { test.setTimeout(300_000); a = await api("a"); await warm(a, ["/notes/new", "/notes/entries", "/notes/1"]); });
test.afterAll(async () => { await removeEntries(a, ids); await a.dispose(); });

test.describe("TN 시음 노트", () => {
  test("TN-01 자유 기록(메모만) 저장 → 상세에 표시, 기본은 나만 보기", async ({ page }) => {
    await page.goto("/notes/new");
    await page.getByLabel("위스키 이름").fill(`${TAG} 자유 기록`);
    await page.getByLabel(/한 잔의 메모/).fill(`${TAG} 자유 메모 한 줄`);
    freeId = await saveNew(page, ids);
    await expect(page).toHaveURL(new RegExp(`/notes/${freeId}$`));
    await expect(page.getByText(`${TAG} 자유 메모 한 줄`)).toBeVisible();
    await expect(page.getByText(/나만 보기/).first()).toBeVisible();
    const row = await (await a.get(`/api/tasting-entries/${freeId}`)).json();
    expect(row.visibility).toBe("PRIVATE");
    expect(row.memo).toBe(`${TAG} 자유 메모 한 줄`);
  });

  test("TN-02 구조화 기록(향·맛·여운·점수·마신 방법) 저장 → 상세 표시", async ({ page }) => {
    await page.goto("/notes/new");
    await page.getByLabel("위스키 이름").fill(`${TAG} 구조화 기록`);
    await page.getByRole("button", { name: "스트레이트" }).click();
    await page.getByText("향·맛·여운 나눠 적기").click();
    await page.getByLabel("향", { exact: true }).fill(`${TAG} 바닐라`);
    await page.getByLabel("맛", { exact: true }).fill(`${TAG} 달콤`);
    await page.getByLabel("여운", { exact: true }).fill(`${TAG} 길다`);
    await page.getByRole("button", { name: "4점", exact: true }).click();
    await expect(page.getByText("4.0 / 5.0").first()).toBeVisible();
    structId = await saveNew(page, ids);
    await expect(page.getByText(`${TAG} 바닐라`)).toBeVisible();
    await expect(page.getByText(`${TAG} 달콤`)).toBeVisible();
    await expect(page.getByText(`${TAG} 길다`)).toBeVisible();
    await expect(page.getByText("4.0 / 5.0").first()).toBeVisible();
    const row = await (await a.get(`/api/tasting-entries/${structId}`)).json();
    expect([row.rating, row.serving, row.nose]).toEqual([4, "NEAT", `${TAG} 바닐라`]);
  });

  test("TN-03 마실 목록(WISH) 저장 → 탭 '마실 목록'에만 표시", async ({ page }) => {
    await page.goto("/notes/new");
    await page.getByLabel("위스키 이름").fill(`${TAG} 마실 것`);
    await page.getByLabel(/아직 마시지 않았어요/).check();
    await page.getByRole("button", { name: "마실 목록에 담기" }).click();
    await expect(page).toHaveURL(/\/notes\/\d+$/);
    ids.push(Number(page.url().split("/").pop()));
    await page.goto("/notes/entries?tab=WISH");
    await expect(page.getByRole("link", { name: re(`${TAG} 마실 것`) })).toBeVisible();
    await page.goto("/notes/entries?tab=TASTED");
    await expect(page.getByRole("link", { name: re(`${TAG} 구조화 기록`) })).toBeVisible();
    await expect(page.getByRole("link", { name: re(`${TAG} 마실 것`) })).toHaveCount(0);
  });

  test("TN-04 목록 표시, 탭 주소 유지, 항목 열기 → 상세 → 뒤로 가면 같은 탭", async ({ page }) => {
    await page.goto("/notes/entries");
    await expect(page.getByRole("link", { name: re(`${TAG} 자유 기록`) })).toBeVisible();
    await page.getByRole("button", { name: "마신 기록", exact: true }).click();
    await expect(page).toHaveURL(/tab=TASTED/);
    await expect(page.getByRole("button", { name: "마신 기록", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("link", { name: re(`${TAG} 구조화 기록`) }).click();
    await expect(page).toHaveURL(new RegExp(`/notes/${structId}$`));
    await page.goBack();
    await expect(page).toHaveURL(/tab=TASTED/);
  });

  test("TN-05 수정: 메모 변경 → PUT → 상세 갱신·저장 안내, 새로고침 후에도 유지", async ({ page }) => {
    await page.goto(`/notes/${freeId}`);
    await page.getByRole("button", { name: "수정", exact: true }).click();
    await page.getByLabel(/한 잔의 메모/).fill(`${TAG} 수정된 메모`);
    const put = page.waitForResponse((r) => r.url().endsWith(`/api/tasting-entries/${freeId}`) && r.request().method() === "PUT");
    await page.getByRole("button", { name: "기록 저장" }).click();
    expect((await put).status()).toBe(200);
    await expect(page.getByText("기록을 저장했어요")).toBeVisible();
    await expect(page.getByText(`${TAG} 수정된 메모`)).toBeVisible();
    await page.reload();
    await expect(page.getByText(`${TAG} 수정된 메모`)).toBeVisible();
  });

  test("TN-06 공개 ↔ 비공개 전환: 상태 문구와 서버 값 반영", async ({ page }) => {
    await page.goto(`/notes/${freeId}`);
    for (const [pub, text, value] of [[true, "라운지에 공개 중", "PUBLIC"], [false, "나만 보기", "PRIVATE"]] as const) {
      await page.getByRole("button", { name: "수정", exact: true }).click();
      const box = page.getByLabel("시음 노트 라운지에 공개하기");
      if (pub) await box.check(); else await box.uncheck();
      await page.getByRole("button", { name: "기록 저장" }).click();
      await expect(page.getByText("기록을 저장했어요")).toBeVisible();
      await expect(page.getByText(text).first()).toBeVisible();
      expect((await (await a.get(`/api/tasting-entries/${freeId}`)).json()).visibility).toBe(value);
    }
  });

  test("TN-07 입력 검증: 이름 비움 → 안내 문구, 저장 요청 없음", async ({ page }) => {
    await page.goto("/notes/new");
    let posts = 0;
    page.on("request", (r) => { if (POST_ENTRY(r)) posts++; });
    await page.getByRole("button", { name: "기록 저장" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "위스키 이름을 적어 주세요." })).toBeVisible();
    expect(posts).toBe(0);
  });

  test("TN-08 길이 제한: 메모 2001자·이름 256자 → 입력 차단(maxLength), 한도 초과 값은 저장되지 않음", async ({ page }) => {
    await page.goto("/notes/new");
    await page.getByLabel("위스키 이름").fill("가".repeat(256));
    await page.getByLabel(/한 잔의 메모/).fill("나".repeat(2001));
    const memoLen = (await page.getByLabel(/한 잔의 메모/).inputValue()).length;
    const nameLen = (await page.getByLabel("위스키 이름").inputValue()).length;
    test.info().annotations.push({ type: "observed", description: `입력 후 길이 메모=${memoLen}, 이름=${nameLen}` });
    expect(memoLen).toBeLessThanOrEqual(2000);
    expect(nameLen).toBeLessThanOrEqual(255);
    await expect(page.getByText(/\d+ \/ 2000/)).toBeVisible();
    // 서버 직접 호출: 한도 초과는 400 이어야 한다
    const over = await a.post("/api/tasting-entries", { data: { clientKey: crypto.randomUUID(), status: "TASTED", whiskeyName: `${TAG} 초과`, memo: "나".repeat(2001), visibility: "PRIVATE" } });
    test.info().annotations.push({ type: "observed", description: `API 메모 2001자 → ${over.status()}` });
    expect(over.status()).toBe(400);
  });

  test("TN-09 저장 버튼 연타 → POST 1건, 노트 1개만 생성", async ({ page }) => {
    await page.goto("/notes/new");
    await page.getByLabel("위스키 이름").fill(`${TAG} 연타`);
    let posts = 0;
    page.on("request", (r) => { if (POST_ENTRY(r)) posts++; });
    const res = page.waitForResponse((r) => POST_ENTRY(r.request()));
    await page.getByRole("button", { name: "기록 저장" }).dblclick();
    ids.push((await (await res).json()).id);
    await expect(page).toHaveURL(/\/notes\/\d+$/);
    expect(posts).toBe(1);
    const mine = await (await a.get("/api/tasting-entries")).json();
    expect(mine.items.filter((e: { whiskeyName: string }) => e.whiskeyName === `${TAG} 연타`)).toHaveLength(1);
  });

  test("TN-10 저장 실패(서버 500 모의) → 오류 안내, 입력값 보존, 재시도 성공", async ({ page }) => {
    await page.goto("/notes/new");
    await page.getByLabel("위스키 이름").fill(`${TAG} 재시도`);
    await page.getByLabel(/한 잔의 메모/).fill(`${TAG} 보존 메모`);
    let fail = true;
    await page.route("**/api/tasting-entries", (route) => {
      if (route.request().method() === "POST" && fail) return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      return route.fallback();
    });
    await page.getByRole("button", { name: "기록 저장" }).click();
    await expect(page.getByRole("alert").filter({ hasText: /못했어요/ })).toBeVisible();
    await expect(page.getByLabel("위스키 이름")).toHaveValue(`${TAG} 재시도`);
    await expect(page.getByLabel(/한 잔의 메모/)).toHaveValue(`${TAG} 보존 메모`);
    fail = false;
    await saveNew(page, ids);
    await expect(page.getByText(`${TAG} 보존 메모`)).toBeVisible();
  });

  test("TN-11 타인(b) 접근 차단: 비공개 노트 읽기·수정·삭제 불가, 원본 유지", async ({ browser }, info) => {
    // 대조군: 소유자 a 의 같은 방식 PUT 은 성공해야 한다(CSRF 등 다른 이유의 거부와 구분).
    const body = { status: "TASTED", whiskeyName: `${TAG} 구조화 기록`, whiskeyNameEn: null, tastedOn: null, serving: "NEAT", memo: null, nose: `${TAG} 바닐라`, palate: `${TAG} 달콤`, finish: `${TAG} 길다`, rating: 4, visibility: "PRIVATE" };
    expect((await a.put(`/api/tasting-entries/${structId}`, { data: body })).status()).toBe(200);
    const b = await api("b");
    const read = await b.get(`/api/tasting-entries/${structId}`);
    const put = await b.put(`/api/tasting-entries/${structId}`, { data: { ...body, memo: `${TAG} 탈취` } });
    const del = await b.delete(`/api/tasting-entries/${structId}`);
    info.annotations.push({ type: "observed", description: `b → GET ${read.status()} PUT ${put.status()} DELETE ${del.status()}` });
    for (const r of [read, put, del]) expect(r.ok()).toBeFalsy();
    expect(read.status()).toBe(404);
    const after = await (await a.get(`/api/tasting-entries/${structId}`)).json();
    expect(after.memo).toBeNull();
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.goto(`/notes/${structId}`);
    await expect(page.getByText(/기록을 찾지 못했어요/)).toBeVisible();
    await expect(page.getByText(`${TAG} 바닐라`)).toHaveCount(0);
    await ctx.close();
    await b.dispose();
  });

  test("TN-12 비로그인: 화면은 로그인 안내, API 는 401/403", async ({ browser }) => {
    const ctx = await anonContext(browser);
    const page = await ctx.newPage();
    await page.goto("/notes/entries");
    await expect(page.getByRole("link", { name: "로그인하러 가기" })).toBeVisible();
    await ctx.close();
    const anon = await api();
    expect([401, 403]).toContain((await anon.get("/api/tasting-entries")).status());
    expect([401, 403]).toContain((await anon.get(`/api/tasting-entries/${freeId}`)).status());
    await anon.dispose();
  });

  test("TN-13 잘못된 주소 /notes/abc, 없는 id → 찾지 못했다는 안내", async ({ page }) => {
    await page.goto("/notes/abc");
    await expect(page.getByText(/기록을 찾지 못했어요/)).toBeVisible();
    await page.goto("/notes/999999999");
    await expect(page.getByText(/기록을 찾지 못했어요/)).toBeVisible();
  });

  test("TN-14 삭제: '그대로 두기'는 유지, '지우기'는 DELETE 후 목록 이동·404", async ({ page }) => {
    await page.goto(`/notes/${structId}`);
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "그대로 두기" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect((await a.get(`/api/tasting-entries/${structId}`)).status()).toBe(200);
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    const del = page.waitForResponse((r) => r.request().method() === "DELETE" && r.url().endsWith(`/api/tasting-entries/${structId}`));
    await page.getByRole("button", { name: "지우기" }).click();
    expect((await del).status()).toBeLessThan(300);
    await expect(page).toHaveURL(/\/notes\/entries/);
    await expect(page.getByRole("link", { name: re(`${TAG} 구조화 기록`) })).toHaveCount(0);
    expect((await a.get(`/api/tasting-entries/${structId}`)).status()).toBe(404);
  });
});
