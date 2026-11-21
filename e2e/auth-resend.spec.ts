import { test, expect, type Page } from "@playwright/test";
import { redisSet } from "./support/accounts";

// 실제 메일을 보내지 않는다: BE 제한은 Redis에 대기·횟수 키를 미리 세워 실제 FE→BE 429 응답을 받고,
// 발송 성공 뒤 버튼 대기 표시는 발송 API만 모의한다(모의 범위: /api/auth/email/send 응답).
async function openForm(page: Page, link: string, emailSel: string) {
  page.on("dialog", (d) => d.accept());
  await page.goto("/login");
  await expect(async () => {
    await page.getByRole("button", { name: link }).click({ timeout: 1000 });
    await expect(page.locator(emailSel)).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
}

const sendButton = (page: Page, emailSel: string) =>
  page.locator(emailSel).locator("xpath=..").getByRole("button", { name: /인증 요청|재발송/ });

const FORMS = [
  { name: "가입", link: "회원 명부에 등록하기", sel: "#signup-email" },
  { name: "재설정", link: "암호를 잊으셨나요?", sel: "#reset-email" },
];

test.describe("RS 인증 코드 재전송 제한", () => {
  for (const f of FORMS) {
    test(`RS-01 ${f.name}: 1분 안 재요청 → 실제 BE 429, 화면에 대기 안내`, async ({ page }) => {
      const email = `m3qa-rs-cd-${Date.now()}@example.test`;
      redisSet(`email:verify:send:cooldown:${email}`, "1", 60);
      await openForm(page, f.link, f.sel);
      await page.locator(f.sel).fill(email);
      const res = page.waitForResponse((r) => r.url().includes("/api/auth/email/send"));
      await sendButton(page, f.sel).click();
      expect((await res).status()).toBe(429);
      await expect(page.getByText(/1분에 한 번만/)).toBeVisible();
      await expect(page.locator(f.sel)).toHaveValue(email);
    });

    test(`RS-02 ${f.name}: 24시간 한도 소진 → 실제 BE 429, 한도 안내`, async ({ page }) => {
      const email = `m3qa-rs-day-${Date.now()}@example.test`;
      redisSet(`email:verify:send:daily:${email}`, "10", 3600);
      await openForm(page, f.link, f.sel);
      await page.locator(f.sel).fill(email);
      const res = page.waitForResponse((r) => r.url().includes("/api/auth/email/send"));
      await sendButton(page, f.sel).click();
      expect((await res).status()).toBe(429);
      await expect(page.getByText(/24시간 뒤에/)).toBeVisible();
    });

    test(`RS-03 ${f.name}: 발송 성공(모의) → 버튼 60초 대기 표시·잠김 / 발송 실패(모의) → 실패 안내, 대기 없음`, async ({ page }) => {
      let ok = false;
      await page.route("**/api/auth/email/send", (r) =>
        r.fulfill({ json: ok ? { success: true, message: "sent" } : { success: false, message: "Failed" } }));
      await openForm(page, f.link, f.sel);
      await page.locator(f.sel).fill(`m3qa-rs-ui-${Date.now()}@example.test`);
      await sendButton(page, f.sel).click();
      await expect(page.getByText(/코드 발송에 실패했습니다/)).toBeVisible();
      await expect(sendButton(page, f.sel)).toBeEnabled();

      ok = true;
      await sendButton(page, f.sel).click();
      await expect(sendButton(page, f.sel)).toHaveText(/재발송 \(\d+초\)/);
      await expect(sendButton(page, f.sel)).toBeDisabled();
    });
  }
});
