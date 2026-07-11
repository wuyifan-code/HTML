import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  normalizeHexColor,
  isValidHexColor,
  hexToHsv,
  hsvToHex,
  hexToRgb,
  rgbToHex,
  clampNumber,
  colorPresets,
  COLOR_PALETTE,
  type HsvColor,
} from "../utils/color";
import { useColorHistory } from "../hooks/useColorHistory";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
}

const colorPopoverMetrics = {
  width: 300,
  height: 392,
  gap: 8,
  margin: 10,
};

function ColorFieldComponent({ label, value, onChange, full = false }: ColorFieldProps) {
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const normalizedValue = normalizeHexColor(value);
  const { history, record } = useColorHistory();
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordDebounced = useCallback(
    (hex: string) => {
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = setTimeout(() => {
        record(hex);
        recordTimeoutRef.current = null;
      }, 300);
    },
    [record]
  );
  useEffect(() => {
    return () => {
      if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    };
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  // isClosing extends isOpen so the closing keyframe (.is-closing) can play
  // before the portal is unmounted via handleClosingEnd.
  const [isClosing, setIsClosing] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>();
  const [picker, setPicker] = useState<HsvColor>(() => hexToHsv(normalizedValue));
  const pickerHex = useMemo(() => hsvToHex(picker), [picker]);
  const rgb = useMemo(() => hexToRgb(pickerHex), [pickerHex]);
  const isInvalidValue = value.trim().length > 0 && !isValidHexColor(value);

  useEffect(() => {
    if (isValidHexColor(value)) {
      setPicker(hexToHsv(normalizeHexColor(value)));
    }
  }, [value]);

  const updatePopoverPosition = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const { width, height, gap, margin } = colorPopoverMetrics;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const hasRoomBelow = rect.bottom + gap + height <= window.innerHeight - margin;
    const preferredTop = hasRoomBelow ? rect.bottom + gap : rect.top - height - gap;

    setPopoverStyle({
      left: Math.round(clampNumber(rect.left, margin, maxLeft)),
      top: Math.round(clampNumber(preferredTop, margin, maxTop)),
    });
  }, []);

  const closingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClosingEnd = useCallback(() => {
    if (closingTimerRef.current) {
      clearTimeout(closingTimerRef.current);
      closingTimerRef.current = null;
    }
    setIsOpen(false);
    setIsClosing(false);
  }, []);

  const closePopover = useCallback((restoreFocus = false) => {
    if (!isOpen) return;
    setIsClosing(true);
    if (restoreFocus) {
      const focusSwatch = () => swatchRef.current?.focus();
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(focusSwatch);
      } else {
        window.setTimeout(focusSwatch, 0);
      }
    }
    // setTimeout fallback for environments that don't fire animationend (jsdom + older engines).
    closingTimerRef.current = setTimeout(() => {
      closingTimerRef.current = null;
      handleClosingEnd();
    }, 260);
  }, [handleClosingEnd, isOpen]);

  useEffect(() => {
    return () => {
      if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
    };
  }, []);

  const openPopover = useCallback(() => {
    updatePopoverPosition();
    setIsOpen(true);
  }, [updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        closePopover();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopover(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [closePopover, isOpen, updatePopoverPosition]);

  const commitPicker = useCallback((nextPicker: HsvColor, historyMode: "debounced" | "instant" | "none" = "debounced") => {
    const nextHex = hsvToHex(nextPicker);
    setPicker(nextPicker);
    onChange(nextHex);
    if (historyMode === "instant") record(nextHex);
    if (historyMode === "debounced") recordDebounced(nextHex);
  }, [onChange, record, recordDebounced]);

  const updateMapPosition = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = clampNumber(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = clampNumber((1 - (event.clientY - rect.top) / rect.height) * 100, 0, 100);
    commitPicker({ ...picker, s: saturation, v: brightness });
  }, [commitPicker, picker]);

  const handleMapKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    let nextPicker: HsvColor | null = null;

    if (event.key === "ArrowLeft") nextPicker = { ...picker, s: clampNumber(picker.s - step, 0, 100) };
    if (event.key === "ArrowRight") nextPicker = { ...picker, s: clampNumber(picker.s + step, 0, 100) };
    if (event.key === "ArrowUp") nextPicker = { ...picker, v: clampNumber(picker.v + step, 0, 100) };
    if (event.key === "ArrowDown") nextPicker = { ...picker, v: clampNumber(picker.v - step, 0, 100) };
    if (event.key === "Home") nextPicker = { ...picker, s: 0 };
    if (event.key === "End") nextPicker = { ...picker, s: 100 };
    if (event.key === "PageUp") nextPicker = { ...picker, v: clampNumber(picker.v + 10, 0, 100) };
    if (event.key === "PageDown") nextPicker = { ...picker, v: clampNumber(picker.v - 10, 0, 100) };

    if (nextPicker) {
      event.preventDefault();
      commitPicker(nextPicker);
    }
  }, [commitPicker, picker]);

  const pickColor = useCallback((color: string, historyMode: "instant" | "none" = "instant") => {
    const nextPicker = hexToHsv(color);
    setPicker(nextPicker);
    onChange(color);
    if (historyMode === "instant") record(color);
  }, [onChange, record]);

  return (
    <div className={`field color-field${full ? " field-full" : ""}`} ref={rootRef}>
      <span>{label}</span>
      <div className="color-row" data-invalid={isInvalidValue ? "true" : undefined}>
        <button
          ref={swatchRef}
          className="color-swatch-button"
          type="button"
          aria-label={`选择${label}`}
          aria-controls={isOpen ? popoverId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onClick={() => {
            if (isOpen) {
              closePopover();
            } else {
              openPopover();
            }
          }}
        >
          <span style={{ backgroundColor: normalizedValue }} />
        </button>
        <input
          type="text"
          placeholder="#c96442"
          value={value || ""}
          aria-controls={isOpen ? popoverId : undefined}
          aria-invalid={isInvalidValue ? "true" : undefined}
          onFocus={openPopover}
          onClick={() => {
            if (!isOpen) openPopover();
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue);
            if (isValidHexColor(nextValue)) {
              setPicker(hexToHsv(normalizeHexColor(nextValue)));
              // debounced:同一笔输入只在停顿后才入栈,避免 #c/#c9/#c96 把 #c96442 顶掉
              recordDebounced(normalizeHexColor(nextValue));
            }
          }}
        />
        {(isOpen || isClosing) ? createPortal(
          <div
            id={popoverId}
            ref={popoverRef}
            className={`color-popover${isClosing ? " is-closing" : ""}`}
            style={popoverStyle}
            role="dialog"
            aria-label={`${label}颜色选择器`}
            onAnimationEnd={(event) => {
              if (isClosing && event.animationName === "color-popover-out") {
                handleClosingEnd();
              }
            }}
          >
            <div className="color-popover-header">
              <div>
                <span className="color-popover-eyebrow">{label}</span>
                <strong>{pickerHex}</strong>
              </div>
              <span className="color-current" style={{ backgroundColor: pickerHex }} />
            </div>
            <div
              className="color-map"
              style={{ "--picker-hue": `hsl(${picker.h} 100% 50%)` } as CSSProperties}
              role="slider"
              aria-label="饱和度与明度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(picker.s)}
              aria-valuetext={`${Math.round(picker.s)}% / ${Math.round(picker.v)}%`}
              tabIndex={0}
              onKeyDown={handleMapKeyDown}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                updateMapPosition(event);
              }}
              onPointerMove={(event) => {
                if (event.buttons === 1) updateMapPosition(event);
              }}
            >
              <span
                className="color-map-thumb"
                style={{ left: `${picker.s}%`, top: `${100 - picker.v}%` }}
              />
            </div>
            <div className="color-controls">
              <input
                className="color-hue-slider"
                type="range"
                min="0"
                max="360"
                value={Math.round(picker.h)}
                aria-label="色相"
                onChange={(event) => {
                  commitPicker({ ...picker, h: Number(event.target.value) });
                }}
              />
            </div>
            <div className="color-rgb-grid">
              <ColorChannelInput label="R" value={rgb.r} onChange={(next) => commitPicker(hexToHsv(rgbToHex({ ...rgb, r: next })))} />
              <ColorChannelInput label="G" value={rgb.g} onChange={(next) => commitPicker(hexToHsv(rgbToHex({ ...rgb, g: next })))} />
              <ColorChannelInput label="B" value={rgb.b} onChange={(next) => commitPicker(hexToHsv(rgbToHex({ ...rgb, b: next })))} />
            </div>
            <div className="color-preset-row" aria-label="主题色快捷选择">
              {colorPresets.map((preset) => (
                <button
                  key={preset}
                  className={normalizeHexColor(preset) === pickerHex ? "is-active" : undefined}
                  type="button"
                  aria-pressed={normalizeHexColor(preset) === pickerHex}
                  aria-label={`选择 ${preset}`}
                  title={preset}
                  style={{ backgroundColor: preset }}
                  onClick={() => pickColor(preset)}
                />
              ))}
            </div>
            <div className="color-swatch-grid color-swatch-grid-palette" aria-label="常用色">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={`palette-${color}`}
                  className={normalizeHexColor(color) === pickerHex ? "is-active" : undefined}
                  type="button"
                  aria-pressed={normalizeHexColor(color) === pickerHex}
                  aria-label={`选择 ${color}`}
                  title={color}
                  style={{ backgroundColor: color }}
                  onClick={() => pickColor(color)}
                />
              ))}
            </div>
            {history.length > 0 ? (
              <div className="color-swatch-grid color-swatch-grid-history" aria-label="最近使用">
                <span className="color-history-label">最近</span>
                {history.map((color) => (
                  <button
                    key={`history-${color}`}
                    className={normalizeHexColor(color) === pickerHex ? "is-active" : undefined}
                    type="button"
                    aria-pressed={normalizeHexColor(color) === pickerHex}
                    aria-label={`选择最近色 ${color}`}
                    title={color}
                    style={{ backgroundColor: color }}
                    onClick={() => pickColor(color)}
                  />
                ))}
              </div>
            ) : null}
          </div>,
          document.body
        ) : null}
      </div>
    </div>
  );
}

export const ColorField = memo(ColorFieldComponent);

function ColorChannelInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="color-channel">
      <input
        type="number"
        min={0}
        max={255}
        value={value}
        onChange={(event) => onChange(clampNumber(Number(event.target.value), 0, 255))}
      />
      <span>{label}</span>
    </label>
  );
}
