/**
 * Post-build 脚本:把 pptxgenjs + jszip 打包成单一 IIFE 文件,放到 public/。
 * 这样:
 *   1) 它们不走 Vite/esbuild 的 minify scope-mangle
 *   2) 它们共享一个 closure,JSZip 引用不会丢失
 *   3) 应用通过 dynamic import("/pptxgen.bundle.js") 加载,绕开 Vite 处理
 *
 * 同时把 pdf-lib 也独立打包,避免同样的问题。
 *
 * 用法: node scripts/bundle-vendors.mjs
 */
import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC = resolve(ROOT, "public");

if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });

async function bundle() {
  // pptxgenjs + jszip 一起
  await build({
    entryPoints: [resolve(ROOT, "node_modules/pptxgenjs/dist/pptxgen.es.js")],
    bundle: true,
    format: "iife",
    globalName: "PptxGenBundle",
    outfile: resolve(PUBLIC, "pptxgen.bundle.js"),
    platform: "browser",
    target: ["es2020"],
    minify: false, // 关闭 minify,避免 scope-mangle 破坏 JSZip.default
    legalComments: "none",
    logLevel: "info",
  });

  // pdf-lib 单独
  await build({
    entryPoints: [resolve(ROOT, "node_modules/pdf-lib/cjs/index.js")],
    bundle: true,
    format: "iife",
    globalName: "PdfLibBundle",
    outfile: resolve(PUBLIC, "pdf-lib.bundle.js"),
    platform: "browser",
    target: ["es2020"],
    minify: false,
    legalComments: "none",
    logLevel: "info",
  });

  console.log("[bundle-vendors] OK");
}

bundle().catch((err) => {
  console.error(err);
  process.exit(1);
});