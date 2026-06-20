/**
 * 浏览器 Blob 下载工具
 *
 * 接受一个 Blob + 文件名,触发浏览器下载。
 * 设计为可注入 hook,方便测试时验证"触发下载"动作。
 */

export interface DownloadHooks {
  /** 创建临时 URL;默认使用 URL.createObjectURL */
  createObjectUrl?: (blob: Blob) => string;
  /** 撤销临时 URL;默认使用 URL.revokeObjectURL */
  revokeObjectUrl?: (url: string) => void;
  /** 构造 <a> 元素;默认 document.createElement('a') */
  createAnchor?: () => HTMLAnchorElement;
  /** 注入锚点到 DOM;默认 document.body.appendChild */
  appendAnchor?: (anchor: HTMLAnchorElement) => void;
  /** 从 DOM 移除锚点;默认 anchor.remove() */
  removeAnchor?: (anchor: HTMLAnchorElement) => void;
  /** 触发点击;默认 anchor.click() */
  clickAnchor?: (anchor: HTMLAnchorElement) => void;
}

export function downloadBlob(blob: Blob, filename: string, hooks: DownloadHooks = {}): void {
  if (!blob || blob.size === 0) {
    throw new Error("downloadBlob: blob is empty");
  }
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("downloadBlob: requires browser environment");
  }
  const url = hooks.createObjectUrl ? hooks.createObjectUrl(blob) : URL.createObjectURL(blob);
  const anchor = hooks.createAnchor ? hooks.createAnchor() : document.createElement("a");
  anchor.href = url;
  anchor.download = filename;

  try {
    if (hooks.appendAnchor) {
      hooks.appendAnchor(anchor);
    } else if (anchor.parentNode === null) {
      document.body.appendChild(anchor);
    }
    if (hooks.clickAnchor) {
      hooks.clickAnchor(anchor);
    } else {
      anchor.click();
    }
  } finally {
    if (hooks.removeAnchor) {
      hooks.removeAnchor(anchor);
    } else if (anchor.parentNode) {
      anchor.remove();
    }
    const revoke = hooks.revokeObjectUrl ?? ((u: string) => URL.revokeObjectURL(u));
    // 给浏览器一点时间去读取 URL
    setTimeout(() => revoke(url), 0);
  }
}