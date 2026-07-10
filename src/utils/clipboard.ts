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

export async function readHtmlFromClipboard(): Promise<string | null> {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (type === "text/html" || type === "text/plain") {
          return new Promise((resolve) => {
            item.getType(type).then((blob) => {
              blob.text().then(resolve);
            });
          });
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
