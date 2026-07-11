export interface HtmlFormatOptions {
  mode: "pretty" | "minified";
  includeComments: boolean;
}

/**
 * Format HTML for export preview, copy, and download.
 * Only affects HTML output — PDF/PPTX continue receiving the original clean HTML.
 */
export function formatExportHtml(html: string, options: HtmlFormatOptions): string {
  let result = html;

  // Remove comments if not included
  if (!options.includeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, "");
  }

  if (options.mode === "minified") {
    // Minify: collapse whitespace between tags
    result = result
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();
  } else {
    // Pretty print: add newlines and indentation
    result = prettyPrintHtml(result);
  }

  return result;
}

function prettyPrintHtml(html: string): string {
  let indent = 0;
  const indentStr = "  ";
  const lines: string[] = [];

  // Simple tokenizer: split on < and >
  const tokens = html.split(/(<[^>]*>)/g).filter(Boolean);

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("</")) {
      // Closing tag
      indent = Math.max(0, indent - 1);
      lines.push(indentStr.repeat(indent) + trimmed);
    } else if (trimmed.startsWith("<") && !trimmed.startsWith("<!") && !isSelfClosing(trimmed)) {
      // Opening tag
      lines.push(indentStr.repeat(indent) + trimmed);
      indent++;
    } else if (trimmed.startsWith("<") && isSelfClosing(trimmed)) {
      // Self-closing tag
      lines.push(indentStr.repeat(indent) + trimmed);
    } else {
      // Content or comment/doctype
      lines.push(indentStr.repeat(indent) + trimmed);
    }
  }

  return lines.join("\n");
}

function isSelfClosing(tag: string): boolean {
  return /\/>$/.test(tag) || /^(<area|<base|<br|<col|<embed|<hr|<img|<input|<link|<meta|<param|<source|<track|<wbr)\b/i.test(tag);
}
