export function exportHtml(html: string, filename = "edited-page.html"): void {
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("导出失败:", error);
    throw new Error("导出 HTML 文件失败，请检查浏览器下载权限");
  }
}
