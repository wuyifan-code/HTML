import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/HTML/" : "/",
  plugins: [react()],
  build: {
    // esbuild minifier 在 chunk 内部对变量名做 scope-mangle,
    // 会把 jszip 模块 namespace binding 和 pptxgenjs 内部局部变量名冲突,
    // 导致 `new i.def()` 拿到 margin 局部变量。解决方法:
    // 1) 把 pptxgenjs/jszip/pdf-lib 放到单独的 chunk
    // 2) 给这些 chunk 关闭 mangleProperties(但 esbuild 没有 chunk-level 选项)
    // 这里我们转用一个 post-build 脚本,用 esbuild 把这些库打包成
    // 独立、不走 Vite minify 的 UMD 文件,放到 public/,应用里直接
    // 动态 import 静态路径。
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
  optimizeDeps: {
    // 避免 Vite 在 dev 阶段 pre-bundle 这些库,以免 dev/preview 与 build 行为不一致
    exclude: ["pptxgenjs", "jszip", "pdf-lib"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".claude/**", "dist/**", "public/**", "e2e-*.cjs", "scripts/**"],
  },
}));
