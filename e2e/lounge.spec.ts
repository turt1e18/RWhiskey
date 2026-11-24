import { expect, type APIRequestContext } from "@playwright/test";
import { TAG, api, createEntry, removeEntries, rolePage, testA as test, warm, re, anonContext } from "./support/ui";

// 시음 노트 라운지(/notes/lounge, /notes/lounge/[id]). BE 규칙(TastingLoungeService): 인기=최근 168시간 좋아요 순 상위 15개(커서 없음), 내 글은 좋아요 불가.
// a 가 공개/비공개 글을 만들고, 화면 확인은 b 로 한다(a 로 같은 일을 하면 내 글이라 좋아요가 막힌다).
test.describe.configure({ mode: "serial" });

const ids: number[] = [];
let a: APIRequestContext;
let b: APIRequestContext;
let pub: { id: number };
let priv: { id: number };
const PUB = `${TAG} 라운지 공개글`;
const PRIV = `${TAG} 라운지 비공개글`;
const likeBtn = (page: import("@playwright/test").Page) => page.getByRole("button", { name: new RegExp(re(PUB).source + " 글 .*좋아요") });

test.beforeAll(async () => {
  test.setTimeout(300_000);
  a = await api("a"); b = await api("b");
  await warm(a, ["/notes/lounge", "/notes/lounge/1", "/notes/likes", "/notes/new"]);
  pub = await createEntry(a, { whiskeyName: PUB, memo: `${TAG} 공개 메모`, visibility: "PUBLIC" });
  priv = await createEntry(a, { whiskeyName: PRIV, memo: `${TAG} 비공개 메모`, visibility: "PRIVATE" });
  ids.push(pub.id, priv.id);
});
test.afterAll(async () => {
  await b.delete(`/api/tasting-entries/${pub.id}/like`).catch(() => {});
  await removeEntries(a, ids);
  await a.dispose(); await b.dispose();
});

test.describe("LG 시음 노트 라운지 (b 계정 시점)", () => {
  test("LG-01 기본 탭은 '이번 주 인기', 7일·최대 15개 안내 문구", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.goto("/notes/lounge");
    await expect(page.getByRole("tab", { name: "이번 주 인기" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(/최근 7일/)).toBeVisible();
    await expect(page.getByText(/최대 15개/)).toBeVisible();
    await ctx.close();
  });

  test("LG-02 인기 목록 ≤ 15개(API·화면), 최신 탭 전환 시 주소 ?sort=latest·공개글 노출", async ({ browser }, info) => {
    const pop = await (await b.get("/api/lounge/entries?sort=popular")).json();
    expect(pop.items.length).toBeLessThanOrEqual(15);
    expect(pop.nextCursor).toBeNull();
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.goto("/notes/lounge");
    await expect(page.locator("#lounge-panel")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(await page.locator("#lounge-panel article").count()).toBeLessThanOrEqual(15);
    await page.getByRole("tab", { name: "최신" }).click();
    await expect(page).toHaveURL(/sort=latest/);
    await expect(page.getByRole("tab", { name: "최신" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: PUB })).toBeVisible();
    await ctx.close();
  });

  test("LG-03 카드 '자세히 보기' → 상세(/notes/lounge/[id]) 본문 표시, 신고 버튼(타인 글)", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.goto("/notes/lounge?sort=latest");
    await page.getByRole("link", { name: `${PUB} 자세히 보기` }).click();
    await expect(page).toHaveURL(new RegExp(`/notes/lounge/${pub.id}\\?sort=latest$`));
    await expect(page.getByRole("heading", { name: PUB })).toBeVisible();
    await expect(page.getByText(`${TAG} 공개 메모`)).toBeVisible();
    await expect(page.getByRole("button", { name: "신고" })).toBeVisible();
    await ctx.close();
  });

  test("LG-04 좋아요/취소: 상태·개수 즉시 반영, 새로고침 후 유지, 서버 값 일치", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.goto(`/notes/lounge/${pub.id}`);
    await expect(likeBtn(page)).toHaveAccessibleName(/좋아요 0개/);
    const put = page.waitForResponse((r) => r.url().endsWith(`/api/tasting-entries/${pub.id}/like`) && r.request().method() === "PUT");
    await likeBtn(page).click();
    expect((await put).status()).toBeLessThan(300);
    await expect(likeBtn(page)).toHaveAccessibleName(/좋아요 1개/);
    await expect(likeBtn(page)).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(likeBtn(page)).toHaveAccessibleName(/좋아요 1개/);
    await expect(likeBtn(page)).toHaveAttribute("aria-pressed", "true");
    // 인기 탭에도 오른다(최근 7일 좋아요 1)
    const pop = await (await b.get("/api/lounge/entries?sort=popular")).json();
    expect(pop.items.some((e: { id: number }) => e.id === pub.id)).toBeTruthy();
    // 내 좋아요 목록
    await page.goto("/notes/likes");
    await expect(page.getByText(PUB).first()).toBeVisible();
    await page.goto(`/notes/lounge/${pub.id}`);
    const del = page.waitForResponse((r) => r.url().endsWith(`/api/tasting-entries/${pub.id}/like`) && r.request().method() === "DELETE");
    await likeBtn(page).click();
    expect((await del).status()).toBeLessThan(300);
    await expect(likeBtn(page)).toHaveAccessibleName(/좋아요 0개/);
    await page.reload();
    await expect(likeBtn(page)).toHaveAttribute("aria-pressed", "false");
    expect((await (await b.get(`/api/tasting-entries/${pub.id}`)).json()).liked).toBe(false);
    await ctx.close();
  });

  test("LG-05 좋아요 실패(500 모의) → 원래 값으로 되돌리고 안내", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.route("**/api/tasting-entries/*/like", (r) => r.fulfill({ status: 500, contentType: "application/json", body: "{}" }));
    await page.goto(`/notes/lounge/${pub.id}`);
    await likeBtn(page).click();
    await expect(page.getByRole("alert").filter({ hasText: /원래대로/ })).toBeVisible();
    await expect(likeBtn(page)).toHaveAccessibleName(/좋아요 0개/);
    await ctx.close();
  });

  test("LG-06 내 글(a)은 좋아요 불가(버튼 비활성) — API 도 거부", async ({ page }) => {
    await page.goto(`/notes/lounge/${pub.id}`);
    const btn = page.getByRole("button", { name: /내 글은 좋아요를 누를 수 없어요/ });
    await expect(btn).toBeDisabled();
    expect((await a.put(`/api/tasting-entries/${pub.id}/like`)).ok()).toBeFalsy();
  });

  test("LG-07 비공개 글은 b 의 라운지 목록·직접 주소·API 에서 보이지 않는다", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.goto("/notes/lounge?sort=latest");
    await expect(page.getByRole("heading", { name: PUB })).toBeVisible();
    await expect(page.getByText(PRIV)).toHaveCount(0);
    await page.goto(`/notes/lounge/${priv.id}`);
    await expect(page.getByText(/더 이상 볼 수 없어요/).first()).toBeVisible();
    await expect(page.getByText(`${TAG} 비공개 메모`)).toHaveCount(0);
    const read = await b.get(`/api/tasting-entries/${priv.id}`);
    const like = await b.put(`/api/tasting-entries/${priv.id}/like`);
    info.annotations.push({ type: "observed", description: `b → 비공개 GET ${read.status()} like ${like.status()}` });
    expect(read.status()).toBe(404);
    expect(like.ok()).toBeFalsy();
    const latest = await (await b.get("/api/lounge/entries?sort=latest")).json();
    expect(latest.items.some((e: { id: number }) => e.id === priv.id)).toBe(false);
    await ctx.close();
  });

  test("LG-08 글쓴이 신원 비노출: 응답 필드·화면에 이메일·이름·uid 없음", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    const raw = await (await b.get(`/api/lounge/entries?sort=latest`)).text();
    const mine = JSON.parse(raw).items.find((e: { id: number }) => e.id === pub.id);
    expect(mine).toBeTruthy();
    const keys = Object.keys(mine).join(",");
    info.annotations.push({ type: "observed", description: `응답 키: ${keys}` });
    expect(keys).not.toMatch(/email|nickname|owner|uid|author/i);
    expect(JSON.stringify(mine)).not.toMatch(/m3qa-|@example\.test|QA A/);
    await page.goto(`/notes/lounge/${pub.id}`);
    await expect(page.getByRole("heading", { name: PUB })).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/m3qa-|@example\.test|QA A/);
    await ctx.close();
  });

  test("LG-09 빈 목록(모의) → 탭별 안내 문구와 이동 링크", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.route("**/api/lounge/entries*", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) }));
    await page.goto("/notes/lounge");
    await expect(page.getByText(/이번 주에 좋아요를 받은 글이 아직 없어요/)).toBeVisible();
    await page.getByRole("button", { name: "최신 글 보기" }).click();
    await expect(page).toHaveURL(/sort=latest/);
    await expect(page.getByText(/아직 공개된 글이 없어요/)).toBeVisible();
    await expect(page.getByRole("link", { name: "시음 기록 쓰기" })).toBeVisible();
    await ctx.close();
  });

  test("LG-10 목록 오류(500 모의) → 오류 안내, '다시 불러오기'로 복구", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    let fail = true;
    await page.route("**/api/lounge/entries*", (r) => fail ? r.fulfill({ status: 500, contentType: "application/json", body: "{}" }) : r.fallback());
    await page.goto("/notes/lounge?sort=latest");
    await expect(page.getByRole("alert").filter({ hasText: /불러오지 못했어요/ })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "다시 불러오기" }).click();
    await expect(page.getByRole("heading", { name: PUB })).toBeVisible();
    await ctx.close();
  });

  test("LG-11 상세에서 돌아와도 탭 유지(?sort=latest), 새로고침해도 유지", async ({ browser }, info) => {
    const { ctx, page } = await rolePage(browser, "b", info.project.use as Record<string, unknown>);
    await page.goto("/notes/lounge?sort=latest");
    await page.getByRole("link", { name: `${PUB} 자세히 보기` }).click();
    await expect(page).toHaveURL(new RegExp(`/notes/lounge/${pub.id}\\?sort=latest$`));
    // 브라우저 뒤로 가기와 "← 라운지" 링크 모두 최신 탭으로 돌아온다(BUG-4 수정)
    await page.goBack();
    await expect(page.getByRole("tab", { name: "최신" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("link", { name: `${PUB} 자세히 보기` }).click();
    await page.getByRole("link", { name: "← 라운지" }).click();
    await expect(page).toHaveURL(/\/notes\/lounge\?sort=latest$/);
    await expect(page.getByRole("tab", { name: "최신" })).toHaveAttribute("aria-selected", "true");
    await page.goto("/notes/lounge?sort=latest");
    await page.reload();
    await expect(page.getByRole("tab", { name: "최신" })).toHaveAttribute("aria-selected", "true");
    await ctx.close();
  });

  test("LG-12 비로그인: 라운지는 로그인 안내", async ({ browser }) => {
    const ctx = await anonContext(browser);
    const page = await ctx.newPage();
    await page.goto("/notes/lounge");
    await expect(page.getByRole("link", { name: "로그인하러 가기" })).toBeVisible();
    await ctx.close();
    const anon = await api();
    expect([401, 403]).toContain((await anon.get("/api/lounge/entries?sort=latest")).status());
    await anon.dispose();
  });
});
