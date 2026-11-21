import { test, expect, type Page } from "@playwright/test";
import { newPassword, redisKeyExists, saveAccount, readAccounts, waitForCode, AUTH_DIR, BE_URL } from "./support/accounts";
import path from "node:path";

// 실제 Resend 발송 + 사람이 받은 코드를 e2e/.auth/code-<id>.txt 로 전달하는 시험.
// E2E_REAL_EMAIL(실제 수신 가능한 주소)이 없으면 건너뛴다. 주소·코드·비밀번호는 출력하지 않는다.
const REAL = process.env.E2E_REAL_EMAIL;
test.skip(!REAL, "E2E_REAL_EMAIL 미설정");
// 사람이 코드를 전달할 시간을 둔다(코드 대기 10분 + 여유)
test.describe.configure({ mode: "serial", timeout: 15 * 60_000 });

const ERR = /일치|실패|만료|없거나/;

async function openForm(page: Page, link: string) {
  page.on("dialog", (d) => d.accept());
  await page.goto("/login");
  await page.getByRole("button", { name: link }).click();
}

async function sendCode(page: Page, emailSel: string) {
  const res = page.waitForResponse((r) => r.url().includes("/api/auth/email/send"));
  await page.locator(emailSel).locator("xpath=..").getByRole("button", { name: /인증 요청|재발송/ }).click();
  const r = await res;
  const body = await r.json().catch(() => ({}));
  expect(r.status(), "send status").toBe(200);
  expect(body.success, "Resend 발송 성공 응답").toBe(true);
}

test("SU-01~05 회원가입: 입력 검증 → 실제 메일 코드 → 오답·재사용 차단 → 가입 → 로그인", async ({ page, request }) => {
  const email = REAL!;
  const password = newPassword();
  await openForm(page, "회원 명부에 등록하기");

  // SU-01 인증 전에는 등록 버튼 비활성, 빈 이메일로 인증 요청 시 안내
  const submit = page.getByRole("button", { name: "회원 명단에 등록하기" });
  await expect(submit).toBeDisabled();
  await page.locator("#signup-email").locator("xpath=..").getByRole("button", { name: "인증 요청" }).click();
  await expect(page.getByText("이메일을 입력해주세요.")).toBeVisible();

  await page.locator("#signup-name").fill("QA 메일");
  await page.locator("#signup-email").fill(email);
  await sendCode(page, "#signup-email");
  expect(redisKeyExists(`email:verify:code:${email}`), "코드 해시 저장").toBe(true);

  // SU-02 틀린 코드
  await page.locator("#verification-code").fill("000000");
  await page.getByRole("button", { name: "확인", exact: true }).click();
  await expect(page.getByText(ERR)).toBeVisible();

  // SU-03 실제 메일로 받은 코드
  // 사람이 다른 메일의 코드를 줄 수 있어 재발송 없이 최대 3번 받는다
  let code = "";
  for (let i = 0; i < 3; i++) {
    code = await waitForCode("signup");
    await page.locator("#verification-code").fill(code);
    const v = page.waitForResponse((r) => r.url().includes("/api/auth/email/verify"));
    await page.getByRole("button", { name: "확인", exact: true }).click();
    if ((await (await v).json().catch(() => ({}))).success) break;
    console.log(`[E2E] 코드 불일치, 재입력 대기 (${i + 1}/3)`);
  }
  await expect(page.getByText("✓ 이메일 인증이 완료되었습니다.")).toBeVisible();

  // SU-04 같은 코드 재사용 차단(API 직접)
  const reuse = await request.post(`${BE_URL}/api/auth/email/verify`, { data: { email, emailCode: code } });
  const reuseBody = await reuse.json().catch(() => ({}));
  expect(reuseBody.success, "코드 재사용 거부").not.toBe(true);

  // SU-05 가입 → 로그인
  await page.locator("#signup-password").fill(password);
  await page.locator("#agree-required").check();
  await expect(submit).toBeEnabled();
  const signup = page.waitForResponse((r) => r.url().includes("/api/auth/signup"));
  await submit.click();
  expect((await signup).status()).toBe(200);
  await expect(page.getByText("회원 명단에 등록되었습니다.", { exact: false })).toBeVisible();
  saveAccount({ role: "mail", email, password, name: "QA 메일", state: path.join(AUTH_DIR, "mail.json") });

  await expect(page.getByLabel("연락처")).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("연락처").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "바 방문" }).click();
  await expect(page).toHaveURL(/\/main/);
});

test("SU-06 중복 이메일 가입 거부", async ({ request }) => {
  const res = await request.post(`${BE_URL}/api/auth/signup`, { data: { email: REAL, pw: newPassword(), name: "중복" } });
  test.info().annotations.push({ type: "dup", description: `status=${res.status()}` });
  expect(res.ok()).toBe(false);
});

test("PW-01~05 비밀번호 찾기: 실제 메일 코드 → 재설정 → 옛 비번 거부·새 비번 성공·인증 재사용 차단", async ({ page, browser, request }) => {
  const acc = readAccounts()["mail"];
  test.skip(!acc, "SU-01 선행 필요");
  // 재설정 전 다른 컨텍스트의 기존 세션(세션 무효화 정책 확인용)
  const old = await browser.newContext();
  const oldLogin = await old.request.post("/api/auth/login", { data: { email: acc.email, pw: acc.password } });
  expect(oldLogin.ok()).toBe(true);

  await openForm(page, "암호를 잊으셨나요?");
  await page.locator("#reset-email").fill(acc.email);
  await sendCode(page, "#reset-email");
  for (let i = 0; i < 3; i++) {
    const code = await waitForCode("reset");
    await page.locator("#verification-code").fill(code);
    const v = page.waitForResponse((r) => r.url().includes("/api/auth/email/verify"));
    await page.getByRole("button", { name: "확인", exact: true }).click();
    if ((await (await v).json().catch(() => ({}))).success) break;
    console.log(`[E2E] 코드 불일치, 재입력 대기 (${i + 1}/3)`);
  }

  const next = newPassword();
  // PW-02 새 비밀번호 불일치 시 버튼 비활성
  await page.locator("#new-password").fill(next);
  await page.locator("#confirm-password").fill(next + "x");
  await expect(page.getByRole("button", { name: "변경 사항 서명하기" })).toBeDisabled();
  await page.locator("#confirm-password").fill(next);
  const reset = page.waitForResponse((r) => r.url().includes("/api/auth/reset-password"));
  await page.getByRole("button", { name: "변경 사항 서명하기" }).click();
  expect((await reset).status()).toBe(200);
  await expect(page.getByText("비밀번호가 성공적으로 재설정되었습니다.", { exact: false })).toBeVisible();

  // PW-03 옛 비번 거부, 새 비번 성공
  const ctx = await browser.newContext();
  expect((await ctx.request.post("/api/auth/login", { data: { email: acc.email, pw: acc.password } })).ok()).toBe(false);
  expect((await ctx.request.post("/api/auth/login", { data: { email: acc.email, pw: next } })).ok()).toBe(true);
  saveAccount({ ...acc, password: next });

  // PW-04 인증 완료 상태 재사용 차단: 코드 인증 없이 다시 재설정
  const again = await request.post(`${BE_URL}/api/auth/reset-password`, { data: { email: acc.email, newPassword: newPassword() } });
  expect(again.ok(), "재설정 재사용 거부").toBe(false);

  // PW-05 기존 세션 무효화 여부(정책 기록 — 실패 시 보안 후보 S-3 확정)
  const meOld = await old.request.get("/api/auth/me");
  const stillIn = meOld.ok() && !!(await meOld.json().catch(() => ({})))?.uid;
  test.info().annotations.push({ type: "PW-05", description: `재설정 후 기존 세션 유지=${stillIn}` });
  await Promise.all([old.close(), ctx.close()]);
  expect.soft(stillIn, "재설정 후 기존 세션은 무효화돼야 함(S-3)").toBe(false);
});
