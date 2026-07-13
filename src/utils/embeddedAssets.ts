const MIN_COMPACT_DATA_URL_LENGTH = 4 * 1024;
const EMBEDDED_ASSET_TOKEN_PREFIX = "hft-embedded-asset://";
const EMBEDDED_ASSET_TOKEN_PATTERN = /hft-embedded-asset:\/\/\d{4}/g;

const BASE64_DATA_URL_PATTERN =
  /data:[a-z0-9.+-]+\/[a-z0-9.+-]+(?:;[a-z0-9.+-]+=[^;,\s]+)*;base64,[a-z0-9+/=\r\n]+/gi;

interface EmbeddedAsset {
  token: string;
  value: string;
}

interface EmbeddedAssetContext {
  assets: EmbeddedAsset[];
  valuesByToken: Map<string, string>;
}

const documentAssetContexts = new WeakMap<Document, EmbeddedAssetContext>();

export function compactEmbeddedDataUrls(html: string): {
  html: string;
  context: EmbeddedAssetContext | null;
} {
  const assets: EmbeddedAsset[] = [];
  const compactHtml = html.replace(BASE64_DATA_URL_PATTERN, (value) => {
    if (value.length < MIN_COMPACT_DATA_URL_LENGTH) return value;

    const token = `${EMBEDDED_ASSET_TOKEN_PREFIX}${String(assets.length + 1).padStart(4, "0")}`;
    assets.push({ token, value });
    return token;
  });

  return {
    html: compactHtml,
    context: assets.length > 0
      ? { assets, valuesByToken: new Map(assets.map((asset) => [asset.token, asset.value])) }
      : null,
  };
}

export function attachEmbeddedAssetContext(
  documentRef: Document,
  context: EmbeddedAssetContext | null,
): void {
  if (context) documentAssetContexts.set(documentRef, context);
}

export function transferEmbeddedAssetContext(source: Document, target: Document): void {
  const context = documentAssetContexts.get(source);
  if (context) documentAssetContexts.set(target, context);
}

export function restoreEmbeddedDataUrls(documentRef: Document, value: string): string {
  const context = documentAssetContexts.get(documentRef);
  if (!context) return value;

  return value.replace(
    EMBEDDED_ASSET_TOKEN_PATTERN,
    (token) => context.valuesByToken.get(token) ?? token,
  );
}

export function restoreEmbeddedAssetValue(documentRef: Document, value: string): string {
  if (!value.startsWith(EMBEDDED_ASSET_TOKEN_PREFIX)) return value;
  const context = documentAssetContexts.get(documentRef);
  return context?.valuesByToken.get(value) ?? value;
}

export function isEmbeddedAssetToken(value: string): boolean {
  return value.startsWith(EMBEDDED_ASSET_TOKEN_PREFIX);
}
