import { test, expect, request as pwRequest } from "@playwright/test";
import { BE_URL, markEmailVerified, newPassword, redisKeyExists, redisSet } from "./support/accounts";

// 메일 코드 수신을 건너뛰고(사용자 결정) Redis "인증 완료" 표시만 세운 뒤 BE 가입·재설정 규칙을 확인한다.
// 실제 메일 수신·코드 입력 UI 성공 경로는 검증하지 않는다.
test.describe("AB 인증 우회 시험(메일 수신 제외)", () => {
  test("AB-01 인증 없이 가입 거부 / AB-02 인증 후 가입·중복 거부", async ({ request }) => {
    const email = `m3qa-ab-${Date.now()}@example.test`;
    const noVerify = await request.post(`${BE_URL}/api/auth/signup`, { data: { email, pw: newPassword(), name: "QA AB", agreedRequired: true } });
    expect(noVerify.ok(), "미인증 가입은 거부").toBe(false);
    markEmailVerified(email);
    const ok = await request.post(`${BE_URL}/api/auth/signup`, { data: { email, pw: newPassword(), name: "QA AB", agreedRequired: true } });
    expect(ok.ok(), `가입 status ${ok.status()}`).toBe(true);
    markEmailVerified(email);
    const dup = await request.post(`${BE_URL}/api/auth/signup`, { data: { email, pw: newPassword(), name: "QA AB", agreedRequired: true } });
    test.info().annotations.push({ type: "status", description: `unverified=${noVerify.status()} dup=${dup.status()}` });
    expect(dup.ok(), "중복 가입 거부").toBe(false);
  });

  test("AB-03 짧은 비밀번호 가입 거부(BE 검증)", async ({ request }) => {
    const email = `m3qa-ab-short-${Date.now()}@example.test`;
    markEmailVerified(email);
    const res = await request.post(`${BE_URL}/api/auth/signup`, { data: { email, pw: "short1", name: "QA AB", agreedRequired: true } });
    expect(res.ok()).toBe(false);
  });

  test("AB-04~08 재설정: 미인증 거부 → 재설정 → 옛 비번 거부·새 비번 성공 → 재사용 거부, 기존 세션·짧은 비번 기록", async ({ request, baseURL }) => {
    const email = `m3qa-ab-reset-${Date.now()}@example.test`;
    const pw1 = newPassword();
    markEmailVerified(email);
    expect((await request.post(`${BE_URL}/api/auth/signup`, { data: { email, pw: pw1, name: "QA AB", agreedRequired: true } })).ok()).toBe(true);

    const old = await pwRequest.newContext({ baseURL });
    expect((await old.post("/api/auth/login", { data: { email, pw: pw1 } })).ok()).toBe(true);

    const noVerify = await request.post(`${BE_URL}/api/auth/reset-password`, { data: { email, newPassword: newPassword() } });
    expect(noVerify.ok(), "AB-04 미인증 재설정 거부").toBe(false);

    const pw2 = newPassword();
    markEmailVerified(email);
    expect((await request.post(`${BE_URL}/api/auth/reset-password`, { data: { email, newPassword: pw2 } })).status(), "AB-05 재설정").toBe(200);

    const fresh = await pwRequest.newContext({ baseURL });
    expect((await fresh.post("/api/auth/login", { data: { email, pw: pw1 } })).ok(), "AB-06 옛 비번 거부").toBe(false);
    expect((await fresh.post("/api/auth/login", { data: { email, pw: pw2 } })).ok(), "AB-06 새 비번 성공").toBe(true);

    const reuse = await request.post(`${BE_URL}/api/auth/reset-password`, { data: { email, newPassword: newPassword() } });
    expect(reuse.ok(), "AB-07 인증 완료 표시 재사용 거부").toBe(false);

    // AB-08 재설정 뒤 기존 세션은 끊겨야 한다(S-3 수정). 정책 기록, BE 짧은 비밀번호 허용 여부, 미존재 계정 응답 차이
    const meOld = await old.get("/api/auth/me");
    const stillIn = !!(meOld.ok() && (await meOld.json().catch(() => ({})))?.uid);
    markEmailVerified(email);
    const short = await request.post(`${BE_URL}/api/auth/reset-password`, { data: { email, newPassword: "short1" } });
    const ghost = `m3qa-ghost-${Date.now()}@example.test`;
    markEmailVerified(ghost);
    const ghostRes = await request.post(`${BE_URL}/api/auth/reset-password`, { data: { email: ghost, newPassword: newPassword() } });
    test.info().annotations.push({ type: "AB-08", description: `기존세션유지=${stillIn} 짧은비번재설정=${short.status()} 미존재계정=${ghostRes.status()}` });
    await Promise.all([old.dispose(), fresh.dispose()]);
    expect(stillIn, "S-3 재설정 후 기존 세션 무효화").toBe(false);
    expect.soft(short.ok(), "BE가 8자 미만 재설정 거부").toBe(false);
  });

  test("AB-09 로그인 실패 10회 → 맞는 비번도 화면에 시도 초과 안내(429) → 재설정 후 로그인 복구", async ({ page, request, baseURL }) => {
    const email = `m3qa-ab-lock-${Date.now()}@example.test`;
    const pw1 = newPassword();
    markEmailVerified(email);
    expect((await request.post(`${BE_URL}/api/auth/signup`, { data: { email, pw: pw1, name: "QA AB", agreedRequired: true } })).ok()).toBe(true);
    const fe = await pwRequest.newContext({ baseURL });
    for (let i = 0; i < 10; i++) expect((await fe.post("/api/auth/login", { data: { email, pw: pw1 + "x" } })).status()).toBe(401);
    await fe.dispose();

    await page.goto("/login");
    await expect(async () => {
      await page.getByLabel("연락처").fill(email);
      await page.getByLabel("비밀번호").fill(pw1);
      await expect(page.getByLabel("연락처")).toHaveValue(email, { timeout: 1000 });
    }).toPass({ timeout: 20_000 });
    const res = page.waitForResponse((r) => r.url().includes("/api/auth/login"));
    await page.getByRole("button", { name: "바 방문" }).click();
    expect((await res).status()).toBe(429);
    await expect(page.getByText(/시도가 너무 많아요/)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    const pw2 = newPassword();
    markEmailVerified(email);
    expect((await request.post(`${BE_URL}/api/auth/reset-password`, { data: { email, newPassword: pw2 } })).status()).toBe(200);
    const after = await pwRequest.newContext({ baseURL });
    expect((await after.post("/api/auth/login", { data: { email, pw: pw2 } })).status(), "재설정이 실패 횟수를 지움").toBe(200);
    await after.dispose();
  });

  test("AB-10 인증 코드 5회 오입력 → 코드 폐기, 맞는 코드여도 이후 실패", async ({ request }) => {
    const email = `m3qa-ab-code-${Date.now()}@example.test`;
    // 실제 메일 발송 없이 코드 자리만 만든다(해시가 아니므로 어떤 입력도 일치하지 않음)
    redisSet(`email:verify:code:${email}`, "not-a-bcrypt-hash", 300);
    const messages: string[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await request.post(`${BE_URL}/api/auth/email/verify`, { data: { email, emailCode: "000000" } });
      messages.push((await r.json()).message);
    }
    expect(messages[3]).not.toMatch(/새 코드/);
    expect(messages[4]).toMatch(/새 코드/);
    expect(redisKeyExists(`email:verify:code:${email}`), "5회째 코드 폐기").toBe(false);
    expect(redisKeyExists(`email:verify:verified:${email}`)).toBe(false);
  });
});
