import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { states, getState } = require(
  resolve(process.cwd(), "scripts/design-states.cjs"),
);

const state = (id: string) => getState(id);

describe("design-states contract", () => {
  it("exports exactly 14 states", () => {
    expect(states).toHaveLength(14);
  });

  it("has 14 unique IDs (D01–D14)", () => {
    expect(new Set(states.map((s: any) => s.id)).size).toBe(14);
  });

  it("IDs are sequential D01 through D14", () => {
    const ids = states.map((s: any) => s.id);
    expect(ids).toEqual([
      "D01", "D02", "D03", "D04", "D05", "D06", "D07",
      "D08", "D09", "D10", "D11", "D12", "D13", "D14",
    ]);
  });

  it("every state has all required fields", () => {
    const required = ["id", "name", "viewport", "reference", "driver", "geometry", "masks", "maxMismatchRatio"];
    for (const s of states) {
      for (const key of required) {
        expect(s).toHaveProperty(key);
      }
    }
  });

  it("every state has a non-empty name", () => {
    for (const s of states) {
      expect(typeof s.name).toBe("string");
      expect(s.name.length).toBeGreaterThan(0);
    }
  });

  it("every viewport has width and height as numbers", () => {
    for (const s of states) {
      expect(typeof s.viewport.width).toBe("number");
      expect(typeof s.viewport.height).toBe("number");
      expect(s.viewport.width).toBeGreaterThan(0);
      expect(s.viewport.height).toBeGreaterThan(0);
    }
  });

  it("every reference path is a string starting with docs/design-references/", () => {
    for (const s of states) {
      expect(typeof s.reference).toBe("string");
      expect(s.reference.startsWith("docs/design-references/")).toBe(true);
    }
  });

  it("every maxMismatchRatio is <= 0.015", () => {
    for (const s of states) {
      expect(s.maxMismatchRatio).toBeLessThanOrEqual(0.015);
    }
  });
});

describe("D01 empty-workspace geometry", () => {
  it("matches the design contract shell dimensions", () => {
    expect(state("D01").geometry).toMatchObject({
      topbar: 56,
      source: 280,
      inspector: 320,
      statusbar: 28,
    });
  });

  it("viewport is 1440x900", () => {
    expect(state("D01").viewport).toEqual({ width: 1440, height: 900 });
  });

  it("driver is empty", () => {
    expect(state("D01").driver).toBe("empty");
  });
});

describe("D06 mobile-drawer geometry", () => {
  it("viewport is 390x844", () => {
    expect(state("D06").viewport).toEqual({ width: 390, height: 844 });
  });

  it("has mobile shell dimensions", () => {
    expect(state("D06").geometry).toMatchObject({
      header: 52,
      bottomNav: 52,
      drawer: { width: 320, z: 50 },
    });
  });
});

describe("D11 export-light geometry", () => {
  it("has the five-segment dialog heights", () => {
    expect(state("D11").geometry).toMatchObject({
      dialogWidth: 680,
      header: 48,
      tabs: 40,
      preview: 360,
      options: 44,
      footer: 48,
    });
  });
});

describe("dark state corrections", () => {
  it("D03 has theme dark and sourceRootCorrection", () => {
    expect(state("D03")).toMatchObject({
      theme: "dark",
      sourceRootCorrection: true,
    });
  });

  it("D12 has theme dark and sourceRootCorrection", () => {
    expect(state("D12")).toMatchObject({
      theme: "dark",
      sourceRootCorrection: true,
    });
  });

  it("D14 has theme dark and sourceRootCorrection", () => {
    expect(state("D14")).toMatchObject({
      theme: "dark",
      sourceRootCorrection: true,
    });
  });

  it("light states do not have sourceRootCorrection", () => {
    for (const id of ["D01", "D02", "D04", "D11", "D13"]) {
      const s = state(id);
      expect(s.sourceRootCorrection).toBeFalsy();
    }
  });
});

describe("driver coverage", () => {
  it("every state has a non-empty driver string", () => {
    for (const s of states) {
      expect(typeof s.driver).toBe("string");
      expect(s.driver.length).toBeGreaterThan(0);
    }
  });

  it("D05 driver is device-preview", () => {
    expect(state("D05").driver).toBe("device-preview");
  });

  it("D10 driver is diagnostics", () => {
    expect(state("D10").driver).toBe("diagnostics");
  });
});
