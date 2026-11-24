import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// 시험 계정·비밀번호·인증 상태는 Git이 무시하는 e2e/.auth 에만 둔다. 로그·보고서에 값을 출력하지 않는다.
export const AUTH_DIR = path.join(__dirname, "..", ".auth");
export const RUN = process.env.E2E_RUN ?? new Date().toISOString().slice(0, 10).replace(/-/g, "");
// 실행 ID마다 계정 파일을 따로 둔다(다른 기기 실행이 덮어쓰지 않게)
const ACCOUNTS_FILE = path.join(AUTH_DIR, `accounts-${RUN}.json`);
export const BE_URL = process.env.E2E_BE_URL ?? "http://127.0.0.1:8080";
const REDIS_CONTAINER = process.env.E2E_REDIS_CONTAINER ?? "turtle-redis";
const REDIS_DB = process.env.E2E_REDIS_DB ?? "15";

export type Account = { role: string; email: string; password: string; name: string; state: string };

export const newPassword = () => `Qa!${randomBytes(9).toString("base64url")}`;

export function readAccounts(): Record<string, Account> {
  return fs.existsSync(ACCOUNTS_FILE) ? JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf8")) : {};
}

export function saveAccount(a: Account) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const all = readAccounts();
  all[a.role] = a;
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(all, null, 2));
}

export function account(role: string): Account {
  const a = readAccounts()[role];
  if (!a) throw new Error(`시험 계정 ${role} 없음 — setup 프로젝트를 먼저 실행`);
  return a;
}

// 로컬 시험 환경 전용: 이메일 수신 없이 BE 회원가입 경로를 쓰기 위해 "인증 완료" 플래그만 Redis에 세운다.
// 실제 메일 수신 검증은 auth-email.spec.ts 에서 따로 한다.
export function markEmailVerified(email: string) {
  redisSet(`email:verify:verified:${email}`, "true", 1800);
}

export function redisSet(key: string, value: string, ttlSec: number) {
  execFileSync("docker", ["exec", REDIS_CONTAINER, "redis-cli", "-n", REDIS_DB, "SET", key, value, "EX", String(ttlSec)], { stdio: "ignore" });
}

// 모든 요청이 같은 로컬 IP라 기기 프로젝트 3개를 돌면 IP 실패 한도(15분 30회)에 걸린다. 인증 시험 전에 비운다.
export function clearLocalIpLimits() {
  const keys = ["127.0.0.1", "0:0:0:0:0:0:0:1"].flatMap((ip) => [`auth:login:ip-fail:${ip}`, `email:verify:ip-fail:${ip}`]);
  execFileSync("docker", ["exec", REDIS_CONTAINER, "redis-cli", "-n", REDIS_DB, "DEL", ...keys], { stdio: "ignore" });
}

export function redisKeyExists(key: string): boolean {
  return execFileSync("docker", ["exec", REDIS_CONTAINER, "redis-cli", "-n", REDIS_DB, "EXISTS", key]).toString().trim() === "1";
}

// 사용자가 채팅으로 준 인증 코드를 이 파일로 받는다(테스트가 폴링). 값은 출력하지 않는다.
export async function waitForCode(id: string, timeoutMs = 10 * 60_000): Promise<string> {
  const file = path.join(AUTH_DIR, `code-${id}.txt`);
  const until = Date.now() + timeoutMs;
  console.log(`[E2E] 인증 코드 대기: ${id}`);
  while (Date.now() < until) {
    if (fs.existsSync(file)) {
      const code = fs.readFileSync(file, "utf8").trim();
      fs.unlinkSync(file);
      return code;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`인증 코드 대기 시간 초과: ${id}`);
}
