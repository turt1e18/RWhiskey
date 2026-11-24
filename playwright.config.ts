import { defineConfig, devices } from "@playwright/test";

// 로컬 FE는 반드시 localhost로 연다(BE CORS 허용 목록). 브라우저 에뮬레이션이며 실기기 시험이 아니다.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const chromeChannel = process.env.E2E_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.output",
  // 인증·DB·추천 한도를 공유하므로 순차 실행
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "./e2e/.report", open: "never" }]],
  use: {
    baseURL,
    locale: "ko-KR",
    // trace·스크린샷·error-context.md에 입력값(시험 비밀번호 포함)이 평문으로 남는다 → 실패 시에만 보존, Git 제외.
    // shortcut: 마스킹 옵션이 없어 검토 뒤 e2e/.output* 를 지운다. 공유·업로드 전에는 반드시 삭제.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    // Chromium 계열은 설치된 Chrome 채널을 쓴다(E2E_CHANNEL로 바꿀 수 있음). 태블릿만 WebKit.
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: chromeChannel, viewport: { width: 1440, height: 900 } }, dependencies: ["setup"] },
    { name: "tablet", use: { ...devices["iPad (gen 7)"] }, dependencies: ["setup"] },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: chromeChannel }, dependencies: ["setup"] },
  ],
});
