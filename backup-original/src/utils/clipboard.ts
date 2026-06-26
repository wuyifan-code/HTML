export async function copyHtmlToClipboard(html: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(html);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = html;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const didCopy = document.execCommand("copy");
    textarea.remove();

    if (!didCopy) {
      throw new Error("execCommand copy failed");
    }
  } catch {
    throw new Error("剪贴板写入失败");
  }
}
