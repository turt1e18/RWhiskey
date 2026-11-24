import { test, expect, request as pwRequest, type Page } from "@playwright/test";
import { BE_URL, markEmailVerified, newPassword } from "./support/accounts";
import { TAG, api, createEntry } from "./support/ui";

// 탈퇴·가입 동의·보안 헤더·방침 페이지(Phase 4). 실제 FE→BE→DB. 메일 발송만 Redis 인증 표시로 대신한다.
async function signup(email: string, pw: string) {
  markEmailVerified(email);
  const be = await pwRequest.newContext({ baseURL: BE_URL });
  const res = await be.post("/api/auth/signup", { data: { email, pw, name: "QA 탈퇴", agreedRequired: true } });
  await be.dispose();
  return res.status();
}

async function openWithdraw(page: Page) {
  page.on("dialog", (d) => d.accept());
  await page.goto("/main");
  const notice = page.getByRole("button", { name: "확인 및 닫기" });
  if (await notice.waitFor({ timeout: 4000 }).then(() => true, () => false)) await notice.click();
  const menu = page.getByRole("button", { name: "메뉴 열기" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "회원 탈퇴" }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/account\/withdraw$/);
}

const uid = async (ctx: { get: (p: string) => Promise<{ ok(): boolean; json(): Promise<any> }> }) => {
  const r = await ctx.get("/api/auth/me");
  return r.ok() ? ((await r.json())?.uid ?? null) : null;
};

test.describe("WD 회원 탈퇴", () => {
  test("WD-01 오입력 안내 → 탈퇴 → 모든 기기 로그아웃·재로그인 불가·공개 글 숨김·같은 이메일 재가입", async ({ page, baseURL }) => {
    const email = `m3qa-wd-${Date.now()}@example.test`;
    const pw = newPassword();
    expect(await signup(email, pw)).toBe(201);
    expect((await page.request.post("/api/auth/login", { data: { email, pw } })).ok()).toBe(true);
    const other = await pwRequest.newContext({ baseURL });
    expect((await other.post("/api/auth/login", { data: { email, pw } })).ok()).toBe(true);

    const entry = await createEntry(page.request, { whiskeyName: `${TAG} 탈퇴자 공개 글`, visibility: "PUBLIC" });
    const b = await api("b");
    const latestIds = async () => ((await (await b.get("/api/lounge/entries?sort=latest")).json()).items as { id: number }[]).map((e) => e.id);
    expect(await latestIds()).toContain(entry.id);

    await openWithdraw(page);
    const submit = page.getByRole("button", { name: "탈퇴하기" });
    await page.getByLabel("비밀번호 확인").fill(pw + "x");
    await expect(submit).toBeDisabled();
    await page.getByLabel("위 내용을 확인했고 탈퇴에 동의해요.").check();
    await submit.click();
    await expect(page.getByRole("alert").filter({ hasText: "비밀번호가 올바르지 않아요" })).toBeVisible();
    await expect(page.getByLabel("비밀번호 확인"), "오입력 뒤 비우고 다시 입력하게 한다").toHaveValue("");
    await expect(page.getByLabel("비밀번호 확인")).toBeFocused();
    expect(await uid(page.request), "오입력은 탈퇴하지 않음").not.toBeNull();

    await page.getByLabel("비밀번호 확인").fill(pw);
    const res = page.waitForResponse((r) => r.url().includes("/api/user/withdraw"));
    await submit.click();
    expect((await res).status()).toBe(204);
    await expect(page.getByRole("heading", { level: 1, name: "탈퇴가 끝났어요" })).toBeVisible();
    await page.getByRole("link", { name: "메인으로" }).click();
    await expect(page).toHaveURL(/\/main/);

    expect(await uid(page.request)).toBeNull();
    expect(await uid(other), "다른 기기 세션도 끊김").toBeNull();
    expect((await other.post("/api/auth/login", { data: { email, pw } })).status()).toBe(401);
    expect(await latestIds(), "탈퇴자 공개 글 숨김").not.toContain(entry.id);
    expect(await signup(email, newPassword()), "같은 이메일 재가입").toBe(201);
    await Promise.all([other.dispose(), b.dispose()]);
  });

  test("WD-02 비로그인으로 탈퇴 화면 → 로그인 안내, API는 거부", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("/account/withdraw");
    await expect(page.getByRole("link", { name: "로그인", exact: true })).toBeVisible();
    expect((await page.request.post("/api/user/withdraw", { data: { pw: "x" } })).status()).toBeGreaterThanOrEqual(401);
    await ctx.close();
  });
});

test.describe("CN 가입 동의", () => {
  test("CN-01 동의 없이 가입 API 직접 호출 → 400과 안내", async () => {
    const email = `m3qa-cn-${Date.now()}@example.test`;
    markEmailVerified(email);
    const be = await pwRequest.newContext({ baseURL: BE_URL });
    const res = await be.post("/api/auth/signup", { data: { email, pw: newPassword(), name: "QA 동의" } });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toMatch(/동의해 주세요/);
    await be.dispose();
  });

  test("CN-02 가입 화면: 약관·방침 링크, 필수 동의가 가입 요청에 실린다(발송·인증·가입 응답만 모의)", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    page.on("dialog", (d) => d.accept());
    await page.route("**/api/auth/email/send", (r) => r.fulfill({ json: { success: true, message: "sent" } }));
    await page.route("**/api/auth/email/verify", (r) => r.fulfill({ json: { success: true, message: "ok" } }));
    let body: Record<string, unknown> | null = null;
    await page.route("**/api/auth/signup", (r) => { body = r.request().postDataJSON(); return r.fulfill({ status: 201, json: { uid: 1, email: "x", name: "x", message: "ok" } }); });
    await page.goto("/login");
    await expect(async () => {
      await page.getByRole("button", { name: "회원 명부에 등록하기" }).click({ timeout: 1000 });
      await expect(page.locator("#signup-email")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "이용약관" })).toHaveAttribute("href", "/terms");
    await expect(page.getByRole("link", { name: "개인정보처리방침" })).toHaveAttribute("href", "/privacy");
    await page.locator("#signup-name").fill("QA 동의");
    await page.locator("#signup-email").fill(`m3qa-cn-ui-${Date.now()}@example.test`);
    await page.locator("#signup-email").locator("xpath=..").getByRole("button", { name: "인증 요청" }).click();
    await page.locator("#verification-code").fill("123456");
    await page.locator("#verification-code").locator("xpath=..").getByRole("button").click();
    await page.locator("#signup-password").fill(newPassword());
    await page.locator("#agree-required").check();
    await page.getByRole("button", { name: "회원 명단에 등록하기" }).click();
    await expect.poll(() => body?.agreedRequired).toBe(true);
    await ctx.close();
  });

  test("CN-03 실제 가입: 발송·인증만 모의, 가입은 FE→BE→DB 저장 후 로그인 가능", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    page.on("dialog", (d) => d.accept());
    const email = `m3qa-cn-real-${Date.now()}@example.test`;
    const pw = newPassword();
    markEmailVerified(email);
    await page.route("**/api/auth/email/send", (r) => r.fulfill({ json: { success: true, message: "sent" } }));
    await page.route("**/api/auth/email/verify", (r) => r.fulfill({ json: { success: true, message: "ok" } }));
    await page.goto("/login");
    await expect(async () => {
      await page.getByRole("button", { name: "회원 명부에 등록하기" }).click({ timeout: 1000 });
      await expect(page.locator("#signup-email")).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 20_000 });
    await page.locator("#signup-name").fill("QA 동의 실가입");
    await page.locator("#signup-email").fill(email);
    await page.locator("#signup-email").locator("xpath=..").getByRole("button", { name: "인증 요청" }).click();
    await page.locator("#verification-code").fill("123456");
    await page.locator("#verification-code").locator("xpath=..").getByRole("button").click();
    await page.locator("#signup-password").fill(pw);
    await page.locator("#agree-required").check();
    const signup = page.waitForResponse((r) => r.url().includes("/api/auth/signup"));
    await page.getByRole("button", { name: "회원 명단에 등록하기" }).click();
    expect((await signup).status(), "실제 BE 가입 응답").toBeLessThan(300);
    const be = await pwRequest.newContext({ baseURL: BE_URL });
    expect((await be.post("/api/auth/login", { data: { email, pw } })).ok(), "가입 계정 로그인").toBeTruthy();
    await be.dispose();
    await ctx.close();
  });
});

test.describe("HD 보안 헤더·방침 페이지", () => {
  test("HD-01 화면 응답에 보안 헤더", async ({ request }) => {
    const h = (await request.get("/main")).headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
  });

  test("HD-02 개인정보처리방침·이용약관 페이지가 열린다", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1, name: "개인정보처리방침" })).toBeVisible();
    await expect(page.getByText(/Gemini/).first()).toBeVisible();
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1, name: "이용약관" })).toBeVisible();
  });
});
