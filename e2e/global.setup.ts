import { test as setup, expect, request } from "@playwright/test";
import path from "node:path";
import { AUTH_DIR, BE_URL, RUN as run, markEmailVerified, newPassword, readAccounts, saveAccount } from "./support/accounts";

// 역할별 시험 계정: a(기본 사용자), b(타인 — 인가 시험), pw(로그인 실패·비밀번호 시험)
const ROLES = ["a", "b", "pw"];

setup("시험 계정 준비와 인증 상태 저장", async ({ baseURL }) => {
  const existing = readAccounts();
  for (const role of ROLES) {
    let a = existing[role];
    if (!a || !a.email.includes(run)) {
      const email = `m3qa-${run}-${role}@example.test`;
      a = { role, email, password: newPassword(), name: `QA ${role.toUpperCase()}`, state: path.join(AUTH_DIR, `${run}-${role}.json`) };
      markEmailVerified(email);
      const be = await request.newContext({ baseURL: BE_URL });
      const res = await be.post("/api/auth/signup", { data: { email, pw: a.password, name: a.name, agreedRequired: true } });
      expect(res.ok(), `signup ${role} status ${res.status()}`).toBeTruthy();
      await be.dispose();
      saveAccount(a);
    }
    // FE 프록시(localhost:3000/api)로 로그인해 FE 출처의 세션 쿠키를 저장
    const fe = await request.newContext({ baseURL });
    const login = await fe.post("/api/auth/login", { data: { email: a.email, pw: a.password } });
    expect(login.ok(), `login ${role} status ${login.status()}`).toBeTruthy();
    await fe.storageState({ path: a.state });
    await fe.dispose();
  }
});
