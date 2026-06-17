import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import {
  normalizeHexColor,
  isValidHexColor,
  hexToHsv,
  hsvToHex,
  hexToRgb,
  rgbToHex,
  clampNumber,
  colorPresets,
  type HsvColor,
} from "../utils/color";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
}

const colorPopoverMetrics = {
  width: 280,
  height: 292,
  gap: 8,
  margin: 10,
};

function ColorFieldComponent({ label, value, onChange, full = false }: ColorFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedValue = normalizeHexColor(value);
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>();
  const [picker, setPicker] = useState<HsvColor>(() => hexToHsv(normalizedValue));
  const pickerHex = useMemo(() => hsvToHex(picker), [picker]);
  const rgb = useMemo(() => hexToRgb(pickerHex), [pickerHex]);

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

  useEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  const commitPicker = (nextPicker: HsvColor) => {
    setPicker(nextPicker);
    onChange(hsvToHex(nextPicker));
  };

  const updateMapPosition = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = clampNumber(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const brightness = clampNumber((1 - (event.clientY - rect.top) / rect.height) * 100, 0, 100);
    commitPicker({ ...picker, s: saturation, v: brightness });
  };

  return (
    <div className={`field color-field${full ? " field-full" : ""}`} ref={rootRef}>
      <span>{label}</span>
      <div className="color-row">
        <button
          className="color-swatch-button"
          type="button"
          aria-label={`选择${label}`}
          aria-expanded={isOpen}
          onClick={() => {
            if (!isOpen) updatePopoverPosition();
            setIsOpen((current) => !current);
          }}
        >
          <span style={{ backgroundColor: normalizedValue }} />
        </button>
        <input
          type="text"
          placeholder="#c96442"
          value={value || ""}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue);
            if (isValidHexColor(nextValue)) {
              setPicker(hexToHsv(normalizeHexColor(nextValue)));
            }
          }}
        />
        {isOpen ? (
          <div
            className="color-popover"
            style={popoverStyle}
            role="dialog"
            aria-label={`${label}颜色选择器`}
          >
            <div
              className="color-map"
              style={{ "--picker-hue": `hsl(${picker.h} 100% 50%)` } as CSSProperties}
              role="slider"
              aria-label="饱和度与明度"
              aria-valuetext={`${Math.round(picker.s)}% / ${Math.round(picker.v)}%`}
              tabIndex={0}
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
              <span className="color-current" style={{ backgroundColor: pickerHex }} />
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
                  type="button"
                  aria-label={`选择 ${preset}`}
                  title={preset}
                  style={{ backgroundColor: preset }}
                  onClick={() => {
                    const nextPicker = hexToHsv(preset);
                    setPicker(nextPicker);
                    onChange(preset);
                  }}
                />
              ))}
            </div>
          </div>
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
