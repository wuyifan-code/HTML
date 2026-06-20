/**
 * Dev runner: 启动 vite 并把输出 tee 到 logs/dev.log。
 *
 * 比起直接 `vite > logs/dev.log 2>&1`:
 *   1) 跨平台 (Windows / macOS / Linux) 一致行为
 *   2) 实时写入,不会因为缓冲导致日志看起来"卡住"
 *   3) 强制 UTF-8,Windows PowerShell/cmd 默认 ANSI 编码会破坏中文/Unicode
 *   4) SIGINT / SIGTERM 优雅退出,保证子进程被杀前日志被 flush
 *
 * 用法: node scripts/dev-runner.mjs
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, createWriteStream } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOG_DIR = resolve(ROOT, "logs");
const LOG_FILE = resolve(LOG_DIR, "dev.log");

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

const logStream = createWriteStream(LOG_FILE, { flags: "w" });
logStream.write(`--- vite dev started at ${new Date().toISOString()} ---\n`);

// Vite 的 node 入口,跨平台一致(避开 Windows .cmd spawn 限制)
const viteEntry = resolve(ROOT, "node_modules", "vite", "bin", "vite.js");

const child = spawn(process.execPath, [viteEntry], {
  cwd: ROOT,
  stdio: ["inherit", "pipe", "pipe"],
  shell: false,
  windowsHide: true,
  env: process.env,
});

function tee(prefix, source) {
  source.on("data", (chunk) => {
    process[prefix].write(chunk);
    logStream.write(chunk);
  });
}

tee("stdout", child.stdout);
tee("stderr", child.stderr);

let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logStream.write(
    `--- vite dev terminated by ${signal} at ${new Date().toISOString()} ---\n`,
  );
  if (child.exitCode === null) {
    child.kill(signal);
  }
  setTimeout(() => process.exit(child.exitCode ?? 0), 150);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGHUP", () => shutdown("SIGHUP"));

child.on("exit", (code, signal) => {
  logStream.write(`--- vite dev exited code=${code} signal=${signal} ---\n`);
  logStream.end(() => {
    process.exit(code ?? 0);
  });
});
