import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(join(process.cwd(), "src/App.tsx"), "utf8");
const drawerSource = readFileSync(join(process.cwd(), "src/components/HistoryDrawer.tsx"), "utf8");
const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("history drawer polish", () => {
  it("renders history as a dialog with an outside-close backdrop", () => {
    expect(appSource).toContain("history-drawer-backdrop");
    expect(drawerSource).toContain('role="dialog"');
    expect(drawerSource).toContain('aria-modal="true"');
    expect(drawerSource).toContain('aria-labelledby="history-drawer-title"');
  });

  it("styles history with material backdrop, drawer animation, and mobile sheet fallback", () => {
    expect(styles).toMatch(/\.history-drawer-backdrop\s*\{/);
    expect(styles).toContain("history-backdrop-in");
    expect(styles).toContain("history-drawer-in");
    expect(styles).toContain("history-mobile-sheet-in");
  });
});
