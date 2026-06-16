export interface FontSelectOption {
  value: string;
  label: string;
  familyNames: string[];
  remote?: boolean;
}

export const FONT_LIBRARY_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400;500;600;700;800&family=Noto+Serif+SC:wght@400;500;600;700;900&family=ZCOOL+QingKe+HuangYou&family=ZCOOL+XiaoWei&display=swap";

export const FONT_LIBRARY_PRECONNECT_ORIGINS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

export const FONT_LIBRARY_ATTRIBUTE = "data-html-finetune-font-library";

export const FONT_SELECT_OPTIONS: FontSelectOption[] = [
  {
    value: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    label: "系统无衬线",
    familyNames: ["Inter", "system-ui", "Segoe UI"],
  },
  {
    value: 'Georgia, "Times New Roman", serif',
    label: "编辑感衬线",
    familyNames: ["Georgia", "Times New Roman"],
  },
  {
    value: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    label: "等宽字体",
    familyNames: ["SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"],
  },
  {
    value: "Arial, Helvetica, sans-serif",
    label: "Arial",
    familyNames: ["Arial", "Helvetica"],
  },
  {
    value: '"Times New Roman", Times, serif',
    label: "Times New Roman",
    familyNames: ["Times New Roman", "Times"],
  },
  {
    value: '"Noto Sans SC", sans-serif',
    label: "Noto Sans SC · 开源远端",
    familyNames: ["Noto Sans SC"],
    remote: true,
  },
  {
    value: '"Noto Serif SC", serif',
    label: "Noto Serif SC · 开源远端",
    familyNames: ["Noto Serif SC"],
    remote: true,
  },
  {
    value: '"ZCOOL QingKe HuangYou", sans-serif',
    label: "ZCOOL QingKe HuangYou · 开源远端",
    familyNames: ["ZCOOL QingKe HuangYou"],
    remote: true,
  },
  {
    value: '"ZCOOL XiaoWei", serif',
    label: "ZCOOL XiaoWei · 开源远端",
    familyNames: ["ZCOOL XiaoWei"],
    remote: true,
  },
  {
    value: '"Ma Shan Zheng", cursive',
    label: "Ma Shan Zheng · 开源远端",
    familyNames: ["Ma Shan Zheng"],
    remote: true,
  },
];

export function normalizeFontValue(fontFamily: string): string {
  const normalized = normalizeFontName(fontFamily);
  const matched = FONT_SELECT_OPTIONS.find((option) =>
    option.familyNames.some((familyName) => normalized.includes(normalizeFontName(familyName)))
  );

  return matched?.value ?? FONT_SELECT_OPTIONS[0].value;
}

export function isRemoteFontValue(fontFamily: string): boolean {
  const normalized = normalizeFontName(fontFamily);
  return FONT_SELECT_OPTIONS.some((option) => {
    if (!option.remote) return false;
    return normalizeFontName(option.value) === normalized ||
      option.familyNames.some((familyName) => normalized.includes(normalizeFontName(familyName)));
  });
}

export function syncRemoteFontLibraryLinks(documentRef: Document): void {
  const shouldLoadLibrary = documentUsesRemoteFont(documentRef);
  documentRef.head.querySelectorAll("link").forEach((node) => {
    if (isManagedFontLink(node)) node.remove();
  });
  if (!shouldLoadLibrary) return;

  FONT_LIBRARY_PRECONNECT_ORIGINS.forEach((origin) => {
    const link = documentRef.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.setAttribute(FONT_LIBRARY_ATTRIBUTE, "preconnect");
    if (origin.includes("gstatic")) {
      link.crossOrigin = "anonymous";
    }
    documentRef.head.appendChild(link);
  });

  const stylesheet = documentRef.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = FONT_LIBRARY_STYLESHEET;
  stylesheet.setAttribute(FONT_LIBRARY_ATTRIBUTE, "stylesheet");
  documentRef.head.appendChild(stylesheet);
}

export function getFontLibraryScriptConfig() {
  return {
    attribute: FONT_LIBRARY_ATTRIBUTE,
    stylesheetHref: FONT_LIBRARY_STYLESHEET,
    preconnectOrigins: FONT_LIBRARY_PRECONNECT_ORIGINS,
    remoteFamilies: FONT_SELECT_OPTIONS
      .filter((option) => option.remote)
      .flatMap((option) => option.familyNames),
  };
}

function documentUsesRemoteFont(documentRef: Document): boolean {
  const searchableText = [
    ...Array.from(documentRef.querySelectorAll("style")).map((style) => style.textContent ?? ""),
    ...Array.from(documentRef.querySelectorAll<HTMLElement>("[style]")).map((element) => element.getAttribute("style") ?? ""),
  ].join("\n");

  return isRemoteFontValue(searchableText);
}

function isManagedFontLink(link: HTMLLinkElement): boolean {
  if (link.hasAttribute(FONT_LIBRARY_ATTRIBUTE)) return true;
  if (link.href === FONT_LIBRARY_STYLESHEET) return true;

  const normalizedHref = link.href.replace(/\/$/, "");
  return FONT_LIBRARY_PRECONNECT_ORIGINS.includes(normalizedHref);
}

function normalizeFontName(value: string): string {
  return value.toLowerCase().replace(/["']/g, "").replace(/\s+/g, " ").trim();
}
