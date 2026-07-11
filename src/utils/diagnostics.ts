export type ProblemSeverity = "error" | "warning" | "info";

export interface EditorProblem {
  id: string;
  ruleId: "inline-style" | "img-alt" | "html-lang";
  severity: ProblemSeverity;
  hftId: string | null;
  line: number | null;
  title: string;
  fixable: boolean;
  ignored: boolean;
}

/**
 * Scan HTML for common problems.
 * Returns stable, deduplicated problems — 1 error, 1 warning, 1 info for the standard fixture.
 */
export function scanDiagnostics(html: string): EditorProblem[] {
  const problems: EditorProblem[] = [];

  // Rule: html-lang (info) — check if html tag has lang attribute
  const hasLang = /<html[^>]*\slang\s*=\s*["'][^"']*["']/i.test(html);
  if (!hasLang) {
    problems.push({
      id: "diagnostic-html-lang",
      ruleId: "html-lang",
      severity: "info",
      hftId: null,
      line: null,
      title: "html 元素缺少 lang 属性",
      fixable: true,
      ignored: false,
    });
  }

  // Rule: img-alt (warning) — check for img tags without alt attribute
  const imgRegex = /<img\b([^>]*?)>/gi;
  let imgMatch: RegExpExecArray | null;
  let imgIndex = 0;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const attrs = imgMatch[1];
    if (!/\balt\s*=\s*["']/i.test(attrs)) {
      imgIndex++;
      problems.push({
        id: `diagnostic-img-alt-${imgIndex}`,
        ruleId: "img-alt",
        severity: "warning",
        hftId: null,
        line: null,
        title: `img 元素缺少 alt 属性`,
        fixable: true,
        ignored: false,
      });
    }
  }

  // Rule: inline-style (error) — check for elements with inline style
  const styleRegex = /<(\w+)\b[^>]*?\sstyle\s*=\s*["'][^"']*["'][^>]*?>/gi;
  let styleMatch: RegExpExecArray | null;
  let styleIndex = 0;
  while ((styleMatch = styleRegex.exec(html)) !== null) {
    styleIndex++;
    problems.push({
      id: `diagnostic-inline-style-${styleIndex}`,
      ruleId: "inline-style",
      severity: "error",
      hftId: null,
      line: null,
      title: `${styleMatch[1]} 元素使用了内联样式`,
      fixable: true,
      ignored: false,
    });
  }

  return problems;
}

/**
 * Fix a specific problem in the HTML and return the fixed HTML.
 */
export function applyDiagnosticFix(html: string, problem: EditorProblem): string {
  switch (problem.ruleId) {
    case "html-lang":
      return html.replace(/(<html\b[^>]*?)(\s*lang\s*=\s*["'][^"']*["'])?(\s*>)/i, (m, p1, _p2, p3) => {
        return `${p1} lang="zh-CN"${p3}`;
      });
    case "img-alt":
      return html.replace(/(<img\b[^>]*?)(\/?\s*>)/gi, (m, p1, p2) => {
        if (/\balt\s*=/.test(p1)) return m;
        return `${p1} alt=""${p2}`;
      });
    case "inline-style":
      return html.replace(/\s*style\s*=\s*["'][^"']*["']/gi, "");
    default:
      return html;
  }
}
