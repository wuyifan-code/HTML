import type { PreviewViewportMode } from "../types/editor";

export type ViewportPresetKey = Exclude<PreviewViewportMode, "fit">;

export interface ViewportPreset {
  width: number;
  height: number;
  /** Localized label shown in the preset dropdown, e.g. "桌面 1280×800". */
  label: string;
}

export const VIEWPORT_PRESETS: Record<ViewportPresetKey, ViewportPreset> = {
  desktop: { width: 1280, height: 800,  label: "桌面 1280×800" },
  wide:    { width: 1440, height: 900,  label: "宽屏 1440×900" },
  tablet:  { width: 820,  height: 1180, label: "平板 820×1180" },
  mobile:  { width: 390,  height: 844,  label: "手机 390×844" },
};

export const VIEWPORT_PRESET_KEYS: ViewportPresetKey[] = ["desktop", "wide", "tablet", "mobile"];

export function isPresetMatch(key: ViewportPresetKey, width: number, height: number): boolean {
  const preset = VIEWPORT_PRESETS[key];
  return preset.width === width && preset.height === height;
}

/**
 * Returns the preset key whose dimensions match (width, height), or null if none match.
 * Use this to derive `presetKey` for the CustomSelect in the editor.
 */
export function findMatchingPresetKey(width: number, height: number): ViewportPresetKey | null {
  for (const key of VIEWPORT_PRESET_KEYS) {
    if (isPresetMatch(key, width, height)) return key;
  }
  return null;
}
