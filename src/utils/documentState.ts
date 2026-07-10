export function hasMeaningfulHtml(html: string): boolean {
  if (!html || html.trim().length === 0) return false;

  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!(DOCTYPE|doctype)[^>]*>/i, "")
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>[\s\S]*?<\/body>/gi, (match) => {
      const inner = match.replace(/<body[^>]*>/i, "").replace(/<\/body>/i, "");
      return inner.trim() ? match : "";
    })
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "")
    .trim();

  return stripped.length > 0;
}

export function createEmptyDocument() {
  return {
    html: "<!DOCTYPE html><html><head></head><body></body></html>",
    selectedId: null as string | null,
  };
}
