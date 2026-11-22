import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { testA as test } from "./support/ui";

// 접근성 자동 검사(axe, WCAG 2.1 A/AA). 자동 검사는 문제의 일부만 잡는다: 키보드 흐름·스크린리더 낭독은 따로 확인한다.
// 위반은 critical/serious 만 실패로 본다. moderate 이하는 주석으로 남긴다.
const PAGES = ["/main", "/login", "/cocktail", "/mood", "/notes", "/notes/lounge", "/account/withdraw", "/privacy", "/terms"];

async function scan(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  // 첫 방문 공지 모달은 닫고 본 화면을 검사한다
  const notice = page.getByRole("button", { name: "확인 및 닫기" });
  if (await notice.waitFor({ timeout: 3000 }).then(() => true, () => false)) await notice.click();
  // 서서히 나타나는 애니메이션 중간 색을 대비 위반으로 잡지 않게 끝날 때까지 기다린다
  await page.waitForTimeout(1500);
  // @axe-core/playwright 가 참조하는 playwright-core 타입과 @playwright/test 의 Page 타입 버전이 달라 단언한다(실행은 같은 객체)
  const r = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations;
}

test.describe("AX 접근성 자동 검사", () => {
  for (const path of PAGES) {
    test(`AX ${path}`, async ({ page }) => {
      const v = await scan(page, path);
      for (const x of v) test.info().annotations.push({ type: `${x.impact}:${x.id}`, description: `${x.nodes.length}개 — ${x.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}` });
      const blocking = v.filter((x) => x.impact === "critical" || x.impact === "serious").map((x) => `${x.id}(${x.nodes.length})`);
      expect(blocking, `critical/serious 위반: ${blocking.join(", ")}`).toEqual([]);
    });
  }
});
