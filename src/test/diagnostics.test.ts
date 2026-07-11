import { describe, expect, it } from "vitest";
import { scanDiagnostics, applyDiagnosticFix, type EditorProblem } from "../utils/diagnostics";

describe("scanDiagnostics", () => {
  it("detects missing html lang attribute", () => {
    const html = "<html><head></head><body></body></html>";
    const problems = scanDiagnostics(html);
    expect(problems.some((p) => p.ruleId === "html-lang")).toBe(true);
  });

  it("does not flag html with lang", () => {
    const html = '<html lang="zh-CN"><head></head><body></body></html>';
    const problems = scanDiagnostics(html);
    expect(problems.some((p) => p.ruleId === "html-lang")).toBe(false);
  });

  it("detects img without alt attribute", () => {
    const html = '<html lang="en"><body><img src="test.png"></body></html>';
    const problems = scanDiagnostics(html);
    expect(problems.some((p) => p.ruleId === "img-alt")).toBe(true);
  });

  it("does not flag img with alt", () => {
    const html = '<html lang="en"><body><img src="test.png" alt="test"></body></html>';
    const problems = scanDiagnostics(html);
    expect(problems.some((p) => p.ruleId === "img-alt")).toBe(false);
  });

  it("detects inline style as error", () => {
    const html = '<html lang="en"><body><div style="color:red">test</div></body></html>';
    const problems = scanDiagnostics(html);
    const inlineProblems = problems.filter((p) => p.ruleId === "inline-style");
    expect(inlineProblems.length).toBeGreaterThanOrEqual(1);
    expect(inlineProblems[0].severity).toBe("error");
  });

  it("standard fixture produces exactly 1 error, 1 warning, 1 info", () => {
    const fixtureHtml = `<html><head></head><body>
      <div style="color:red">inline style error</div>
      <img src="photo.png">
    </body></html>`;
    const problems = scanDiagnostics(fixtureHtml);

    const errors = problems.filter((p) => p.severity === "error");
    const warnings = problems.filter((p) => p.severity === "warning");
    const infos = problems.filter((p) => p.severity === "info");

    expect(errors.length).toBe(1);
    expect(warnings.length).toBe(1);
    expect(infos.length).toBe(1);
  });

  it("problem IDs are unique and stable", () => {
    const fixtureHtml = `<html><head></head><body>
      <div style="color:red">a</div>
      <div style="font-size:12px">b</div>
      <img src="a.png">
    </body></html>`;
    const problems = scanDiagnostics(fixtureHtml);
    const ids = problems.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns empty array for clean HTML", () => {
    const cleanHtml = '<html lang="zh-CN"><head></head><body><p>hello</p></body></html>';
    const problems = scanDiagnostics(cleanHtml);
    expect(problems.length).toBe(0);
  });
});

describe("applyDiagnosticFix", () => {
  it("fixes missing html lang by adding lang=\"zh-CN\"", () => {
    const html = "<html><head></head><body></body></html>";
    const problems = scanDiagnostics(html);
    const langProblem = problems.find((p) => p.ruleId === "html-lang")!;
    const fixed = applyDiagnosticFix(html, langProblem);
    expect(fixed).toContain('lang="zh-CN"');
  });

  it("fixes missing img alt by adding empty alt", () => {
    const html = '<html lang="en"><body><img src="test.png"></body></html>';
    const problems = scanDiagnostics(html);
    const imgProblem = problems.find((p) => p.ruleId === "img-alt")!;
    const fixed = applyDiagnosticFix(html, imgProblem);
    expect(fixed).toContain('alt=""');
  });

  it("fixes inline style by removing style attribute", () => {
    const html = '<html lang="en"><body><div style="color:red">test</div></body></html>';
    const problems = scanDiagnostics(html);
    const styleProblem = problems.find((p) => p.ruleId === "inline-style")!;
    const fixed = applyDiagnosticFix(html, styleProblem);
    expect(fixed).not.toContain('style="color:red"');
  });
});

describe("EditorProblem type", () => {
  it("has all required fields", () => {
    const p: EditorProblem = {
      id: "test-1",
      ruleId: "inline-style",
      severity: "error",
      hftId: null,
      line: null,
      title: "test",
      fixable: true,
      ignored: false,
    };
    expect(p.id).toBe("test-1");
    expect(p.severity).toBe("error");
    expect(p.fixable).toBe(true);
  });
});
