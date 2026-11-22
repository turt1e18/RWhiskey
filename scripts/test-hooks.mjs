// `npm test`용 로더: node --test가 Next 프로젝트 코드를 그대로 읽게 한다.
// @/ 별칭, 확장자 없는 import, .ts/.tsx(esbuild 변환), next/*, server-only, JSON import 처리.
// Node 22.15+ (module.registerHooks) 필요.
import { registerHooks, createRequire } from "node:module";
import { readFileSync, statSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const esbuild = createRequire(import.meta.url)("esbuild");
const candidates = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx"];

const findFile = (base) =>
  candidates.map((ext) => base + ext).find((p) => statSync(p, { throwIfNoEntry: false })?.isFile());

registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (/^next\/[a-z-]+$/.test(spec)) return next(`${spec}.js`, ctx);
    let base = null;
    if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
    else if (/^\.\.?\//.test(spec) && ctx.parentURL?.startsWith("file:"))
      base = path.resolve(path.dirname(fileURLToPath(ctx.parentURL)), spec);
    const file = base && findFile(base);
    return file ? { url: pathToFileURL(file).href, shortCircuit: true } : next(spec, ctx);
  },
  load(url, ctx, next) {
    if (/\.tsx?$/.test(url)) {
      const file = fileURLToPath(url);
      const { code } = esbuild.transformSync(readFileSync(file, "utf8"), {
        loader: file.endsWith(".tsx") ? "tsx" : "ts", format: "esm", jsx: "automatic", sourcefile: file,
      });
      return { format: "module", source: code, shortCircuit: true };
    }
    if (url.endsWith(".json")) return next(url, { ...ctx, importAttributes: { type: "json" } });
    return next(url, ctx);
  },
});
