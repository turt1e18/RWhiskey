import { test, expect, type Page } from "@playwright/test";
import { account } from "./support/accounts";

// 계정 유무와 관계없이 같은 문구여야 한다(401 → loginErrorMessage)
const FAIL_MSG = /이메일 또는 비밀번호가 올바르지 않아요/;

async function fillLogin(page: Page, email: string, pw: string) {
  await page.goto("/login");
  // hydration 전에 입력하면 React가 값을 지운다(WebKit dev에서 재현) → 값이 남을 때까지 다시 입력
  await expect(async () => {
    await page.getByLabel("연락처").fill(email);
    await page.getByLabel("비밀번호").fill(pw);
    await expect(page.getByLabel("연락처")).toHaveValue(email, { timeout: 1000 });
  }).toPass({ timeout: 20_000 });
}

async function me(page: Page) {
  const res = await page.request.get("/api/auth/me");
  return { status: res.status(), body: res.ok() ? await res.json().catch(() => null) : null };
}

test.describe("LI 로그인·세션", () => {
  test("LI-01 정상 로그인 → /main 이동, 새로고침·이동 후 세션 유지", async ({ page }) => {
    const a = account("a");
    await fillLogin(page, a.email, a.password);
    const loginRes = page.waitForResponse((r) => r.url().includes("/api/auth/login"));
    await page.getByRole("button", { name: "바 방문" }).click();
    expect((await loginRes).status()).toBe(200);
    await expect(page).toHaveURL(/\/main/);
    await page.reload();
    expect((await me(page)).body?.email).toBe(a.email);
    await page.goto("/notes");
    await expect(page).toHaveURL(/\/notes/);
    expect((await me(page)).body?.email).toBe(a.email);
  });

  test("LI-02 잘못된 비밀번호 → 안내 문구, 로그인 안 됨", async ({ page }) => {
    const a = account("pw");
    await fillLogin(page, a.email, a.password + "x");
    await page.getByRole("button", { name: "바 방문" }).click();
    await expect(page.getByText(FAIL_MSG)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    expect((await me(page)).body?.uid ?? null).toBeNull();
  });

  test("LI-03 존재하지 않는 사용자 → LI-02와 같은 문구(계정 존재 유추 방지)", async ({ page }) => {
    await fillLogin(page, `m3qa-nobody-${Date.now()}@example.test`, "Wrongpass123!");
    await page.getByRole("button", { name: "바 방문" }).click();
    await expect(page.getByText(FAIL_MSG)).toBeVisible();
  });

  test("LI-04 로그인 버튼 연타 → 로그인 요청 1건", async ({ page }) => {
    const a = account("a");
    await fillLogin(page, a.email, a.password);
    let calls = 0;
    page.on("request", (r) => { if (r.url().includes("/api/auth/login")) calls++; });
    const btn = page.getByRole("button", { name: "바 방문" });
    await btn.dblclick();
    await expect(page).toHaveURL(/\/main/);
    expect(calls).toBe(1);
  });

  test("LI-05 세션 쿠키 속성 HttpOnly·SameSite (로컬 프로필 기준)", async ({ page, context }) => {
    const a = account("a");
    await fillLogin(page, a.email, a.password);
    await page.getByRole("button", { name: "바 방문" }).click();
    await expect(page).toHaveURL(/\/main/);
    const session = (await context.cookies()).find((c) => /SESSION/i.test(c.name));
    expect(session, "세션 쿠키 존재").toBeTruthy();
    expect(session!.httpOnly).toBe(true);
    // 로컬은 secure=false·SameSite=Lax. 운영 Secure/None은 운영 설정 정적 확인으로 따로 기록.
    test.info().annotations.push({ type: "cookie", description: `name=${session!.name} sameSite=${session!.sameSite} secure=${session!.secure}` });
  });

  test("LI-06 로그아웃 → 세션 무효화, 보호 화면 차단", async ({ page, context }) => {
    const a = account("a");
    await fillLogin(page, a.email, a.password);
    await page.getByRole("button", { name: "바 방문" }).click();
    await expect(page).toHaveURL(/\/main/);
    const before = (await context.cookies()).find((c) => /SESSION/i.test(c.name));
    page.on("dialog", (d) => d.accept());
    // 첫 방문 공지 모달은 사용자가 닫는 것처럼 닫는다
    const notice = page.getByRole("button", { name: "확인 및 닫기" });
    if (await notice.waitFor({ timeout: 4000 }).then(() => true, () => false)) await notice.click();
    const menu = page.getByRole("button", { name: "메뉴 열기" });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("button", { name: "로그아웃" }).filter({ visible: true }).first().click();
    await expect.poll(async () => (await me(page)).body?.uid ?? null).toBeNull();
    // 옛 세션 쿠키를 다시 붙여도 인증되지 않아야 한다(서버 측 무효화)
    if (before) {
      await context.addCookies([before]);
      expect((await me(page)).body?.uid ?? null).toBeNull();
    }
    await page.goto("/notes");
    await expect(page).toHaveURL(/\/login/);
  });

  test("LI-07 브라우저 컨텍스트 간 세션 분리", async ({ browser }) => {
    const a = account("a");
    const b = account("b");
    const ctxA = await browser.newContext({ storageState: a.state });
    const ctxB = await browser.newContext({ storageState: b.state });
    const anon = await browser.newContext();
    const [pa, pb, pn] = await Promise.all([ctxA.newPage(), ctxB.newPage(), anon.newPage()]);
    await Promise.all([pa.goto("/main"), pb.goto("/main"), pn.goto("/main")]);
    expect((await me(pa)).body?.email).toBe(a.email);
    expect((await me(pb)).body?.email).toBe(b.email);
    expect((await me(pn)).body?.uid ?? null).toBeNull();
    await Promise.all([ctxA.close(), ctxB.close(), anon.close()]);
  });

  test("LI-08 비인증 보호 API 서버 측 차단", async ({ request }) => {
    for (const p of ["/api/notes", "/api/user/profile", "/api/recommendations/history"]) {
      const res = await request.get(p);
      test.info().annotations.push({ type: "unauth", description: `${p} → ${res.status()}` });
      expect(res.status(), p).not.toBe(200);
    }
  });
});
