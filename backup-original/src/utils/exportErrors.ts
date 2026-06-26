/**
 * 导出相关错误类与友好错误格式化
 *
 * 所有 PDF / PPTX / Snapshot 异常都通过 ExportError 抛出,
 * App 层 catch 后通过 formatExportError() 转成中文消息显示给用户。
 */

/**
 * 通过 <script> 注入方式动态加载 public/ 下的预打包 IIFE bundle。
 * 避免 Vite 把它们纳入 ESM 处理链,绕开 esbuild minify scope-mangle
 * 破坏 JSZip/PDFDocument 等闭包内部 binding 的问题。
 *
 * - url: 相对或绝对 URL,例如 "/pdf-lib.bundle.js" 或 "./pdf-lib.bundle.js"
 *   或 import.meta.env.BASE_URL + "pdf-lib.bundle.js"
 *   (相对路径会自动按当前 page origin 解析,兼容 GitHub Pages 子路径)
 * - globalName: IIFE globalName 暴露的全局变量名
 * - 返回该全局变量(default 优先),失败返回 null
 */
export function loadBundleScript<T = unknown>(url: string, globalName: string): Promise<T | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null);
  }
  // 把相对 URL 解析为绝对 URL — 关键: GitHub Pages 部署在
  // https://owner.github.io/HTML/ 时, 用 "./pdf-lib.bundle.js" 会解析为
  // https://owner.github.io/HTML/pdf-lib.bundle.js, 而非 /pdf-lib.bundle.js
  // (后者会到 https://owner.github.io/pdf-lib.bundle.js 404)
  const absoluteUrl = new URL(url, window.location.href).toString();
  const w = window as unknown as Record<string, unknown>;
  if (w[globalName]) {
    const g = w[globalName] as { default?: T } & T;
    return Promise.resolve((g.default ?? (w[globalName] as T)) ?? null);
  }
  return new Promise<T | null>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-bundle="${globalName}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(w[globalName] as T | null), { once: true });
      existing.addEventListener(
        "error",
        () => {
          // eslint-disable-next-line no-console
          console.warn(`[Export] bundle script failed: ${absoluteUrl}`);
          resolve(null);
        },
        { once: true }
      );
      return;
    }
    const script = document.createElement("script");
    script.src = absoluteUrl;
    script.async = true;
    script.dataset.bundle = globalName;
    script.addEventListener("load", () => {
      const g = w[globalName] as { default?: T } & T | undefined;
      if (!g) {
        resolve(null);
        return;
      }
      resolve((g.default ?? (g as unknown as T)) ?? null);
    });
    script.addEventListener(
      "error",
      () => {
        // eslint-disable-next-line no-console
        console.warn(`[Export] bundle script failed: ${absoluteUrl}`);
        resolve(null);
      },
      { once: true }
    );
    document.head.appendChild(script);
  });
}

/** 导出阶段的细分错误码 */
export type ExportErrorCode =
  | "snapshot-empty"
  | "snapshot-render-failed"
  | "snapshot-no-slide-target"
  | "pdf-empty"
  | "pdf-render-failed"
  | "pptx-empty"
  | "pptx-render-failed"
  | "pptx-write-failed"
  | "library-load-failed"
  | "browser-unsupported"
  | "unknown";

/** App 层 useState 用的导出格式枚举 */
export type DocumentExportFormat = "pdf" | "pptx";

export class ExportError extends Error {
  constructor(
    message: string,
    public readonly code: ExportErrorCode = "unknown",
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ExportError";
  }
}

const FRIENDLY_MESSAGES: Record<ExportErrorCode, string> = {
  "snapshot-empty": "截图结果为空，无法继续导出。请检查页面内容是否可见、尺寸是否大于 0。",
  "snapshot-render-failed":
    "截图失败，可能是跨域图片/字体导致画布被污染。请改用本地资源或移除跨域链接后重试。",
  "snapshot-no-slide-target":
    "没有找到可导出的页面内容。请确认页面包含 `.slide`、`section.slide` 或至少一个 main 元素。",
  "pdf-empty": "PDF 生成失败：没有任何页面可写入。",
  "pdf-render-failed": "PDF 生成失败，请重试或换更轻量的页面。",
  "pptx-empty": "PPTX 生成失败：没有任何页面可写入。",
  "pptx-render-failed": "PPTX 生成失败，请重试或换更轻量的页面。",
  "pptx-write-failed": "PPTX 文件保存失败，请检查浏览器下载权限。",
  "library-load-failed":
    "导出库加载失败，可能是网络问题或被浏览器拦截。请检查网络后重试。",
  "browser-unsupported": "当前浏览器不支持此导出格式，请升级到最新版本。",
  unknown: "导出失败，请重试或换更轻量的页面。",
};

/**
 * 把任意异常归一化为 ExportError,并附上中文友好消息 + 调试上下文
 */
export function toExportError(error: unknown, fallbackCode: ExportErrorCode = "unknown"): ExportError {
  if (error instanceof ExportError) return error;
  const message = error instanceof Error ? error.message : String(error);
  // 简单关键字归因,够 90% 用例
  if (/tainted/i.test(message)) {
    return new ExportError(FRIENDLY_MESSAGES["snapshot-render-failed"], "snapshot-render-failed", error);
  }
  if (/timeout|abort/i.test(message)) {
    return new ExportError("导出超时，请减小页面体积后重试。", "snapshot-render-failed", error);
  }
  return new ExportError(`${FRIENDLY_MESSAGES[fallbackCode]}\n\n调试信息:${message}`, fallbackCode, error);
}

/**
 * 给 UI 用的最终中文消息
 */
export function formatExportError(error: unknown, fallbackCode: ExportErrorCode = "unknown"): string {
  const exportError = toExportError(error, fallbackCode);
  // 始终输出 cause, 方便 e2e 调试
  // eslint-disable-next-line no-console
  console.error(`[Export:${exportError.code}]`, exportError.message, exportError.cause);
  return exportError.message;
}