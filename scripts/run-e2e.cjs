/**
 * 统一 E2E 测试运行脚本
 *
 * 1. 自动选择空闲端口启动 e2e-serve.cjs 服务器
 * 2. 等待 http://localhost:PORT/HTML/ 返回 200
 * 3. 顺序执行 UI/AI/Export 三个 E2E 脚本
 * 4. 关闭服务器并向上汇报退出码
 */
const { spawn } = require("child_process");
const net = require("net");
const http = require("http");
const path = require("path");

function log(...args) {
  console.log("[run-e2e]", ...args);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
}

function waitUrl(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`等待服务器就绪超时: ${url}`));
        return;
      }
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            setTimeout(check, 400);
          }
        })
        .on("error", () => {
          setTimeout(check, 400);
        });
    }
    check();
  });
}

function runScript(scriptPath, port) {
  return new Promise((resolve) => {
    log(`Starting E2E script: ${scriptPath} on port ${port}...`);
    const p = spawn("node", [scriptPath], {
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: String(port),
        PREVIEW_URL: `http://localhost:${port}/HTML/`,
      },
    });
    p.on("close", (code) => {
      if (code === 0) {
        log(`✓ E2E script PASS: ${scriptPath}`);
        resolve(true);
      } else {
        log(`× E2E script FAIL: ${scriptPath} (code ${code})`);
        resolve(false);
      }
    });
  });
}

(async () => {
  let serverProcess = null;
  let port = 4174;
  try {
    port = await getFreePort();
    log(`Selected free port: ${port}`);
  } catch (err) {
    log(`Failed to detect free port, fallback to default 4174: ${err.message}`);
  }

  // 1. 启动服务器
  log("Starting e2e-serve.cjs server...");
  serverProcess = spawn("node", [path.join(__dirname, "../e2e-serve.cjs")], {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
    },
  });

  // 确保在主进程退出时强制清理子进程
  const cleanUp = () => {
    if (serverProcess) {
      log("Terminating server process...");
      serverProcess.kill("SIGTERM");
      serverProcess = null;
    }
  };
  process.on("exit", cleanUp);
  process.on("SIGINT", () => { cleanUp(); process.exit(1); });
  process.on("uncaughtException", (err) => {
    log("Uncaught Exception:", err);
    cleanUp();
    process.exit(1);
  });

  try {
    // 2. 等待服务就绪
    const checkUrl = `http://localhost:${port}/HTML/`;
    log(`Waiting for ${checkUrl} to be ready...`);
    await waitUrl(checkUrl);
    log("Server is ready for tests!");

    // 3. 顺序运行 E2E 脚本
    const scripts = [
      path.join(__dirname, "../e2e-ui.cjs"),
      path.join(__dirname, "../e2e-ai.cjs"),
      path.join(__dirname, "../e2e-export.cjs"),
    ];

    // 4. 可选：14 状态视觉对比（仅在 --compare 时运行）
    if (process.argv.includes("--compare")) {
      scripts.push(path.join(__dirname, "../scripts/e2e-design-14.cjs"));
    }

    let allPassed = true;
    for (const script of scripts) {
      const ok = await runScript(script, port);
      if (!ok) {
        allPassed = false;
        // 如果任何测试失败，我们继续执行，以便运行剩下的测试，但在最后标志失败
      }
    }

    cleanUp();

    if (allPassed) {
      log("ALL E2E SCENARIOS PASSED!");
      process.exit(0);
    } else {
      log("SOME E2E SCENARIOS FAILED.");
      process.exit(1);
    }
  } catch (err) {
    log("Error during E2E orchestration:", err.message);
    cleanUp();
    process.exit(1);
  }
})();
