import { expect } from "@playwright/test";
import { api, testA as test } from "./support/ui";

// Phase 3 정리 회귀: 지운 쓰기 API는 열리지 않고, 공유 미리보기 이미지는 실제로 내려온다.
test.describe("CL 정리 회귀", () => {
  test("CL-01 로그인 사용자도 위스키 태그 추가 API 사용 불가, 조회는 유지", async () => {
    const a = await api("a");
    for (const p of ["/api/whiskey/tags/categories?label=m3qa", "/api/whiskey/tags/flavors?label=m3qa"]) {
      const res = await a.post(p);
      expect([404, 405], `${p} → ${res.status()}`).toContain(res.status());
    }
    expect((await a.get("/api/whiskey/tags/categories")).status()).toBe(200);
    await a.dispose();
  });

  test("CL-02 공유 미리보기 이미지(og:image)가 200으로 내려온다", async ({ page, request }) => {
    await page.goto("/");
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toBeTruthy();
    const res = await request.get(new URL(og!).pathname);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});
