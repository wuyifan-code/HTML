import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("mobile panel backdrop polish", () => {
  it("renders a mobile-only backdrop when a side panel is open", () => {
    expect(appSource).toContain("isMobilePanelOpen");
    expect(appSource).toContain("workspace-mobile-panel-open");
    expect(appSource).toContain("mobile-panel-backdrop");
    expect(appSource).toContain("handleCloseMobilePanels");
  });

  it("styles the backdrop and sheet entrance motion", () => {
    expect(styles).toMatch(/\.mobile-panel-backdrop\s*\{/);
    expect(styles).toContain("mobile-panel-backdrop-in");
    expect(styles).toContain("mobile-source-sheet-in");
    expect(styles).toContain("mobile-inspector-sheet-in");
    expect(styles).toContain("workspace-mobile-panel-open > .panel-expand-btn");
  });
});
