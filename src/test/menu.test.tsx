import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { Menu, type MenuItem } from "../components/ui/Menu";

const items: MenuItem[] = [
  { key: "edit", label: "编辑" },
  { key: "duplicate", label: "复制" },
  { key: "divider1", label: "", divider: true },
  { key: "delete", label: "删除", disabled: true },
];

describe("Menu", () => {
  it("renders menu items", () => {
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={triggerRef} type="button">打开菜单</button>
          <Menu items={items} onSelect={vi.fn()} onClose={vi.fn()} triggerRef={triggerRef} />
        </div>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "编辑" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "复制" })).toBeTruthy();
  });

  it("disables disabled items", () => {
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={triggerRef} type="button">打开菜单</button>
          <Menu items={items} onSelect={vi.fn()} onClose={vi.fn()} triggerRef={triggerRef} />
        </div>
      );
    }
    render(<Harness />);
    const deleteItem = screen.getByRole("menuitem", { name: "删除" }) as HTMLButtonElement;
    expect(deleteItem.disabled).toBe(true);
  });

  it("renders menu in a portal", () => {
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={triggerRef} type="button">打开菜单</button>
          <Menu items={items} onSelect={vi.fn()} onClose={vi.fn()} triggerRef={triggerRef} />
        </div>
      );
    }
    render(<Harness />);
    expect(document.querySelector(".menu")).toBeTruthy();
    expect(document.querySelector(".menu-divider")).toBeTruthy();
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={triggerRef} type="button">打开菜单</button>
          <Menu items={items} onSelect={vi.fn()} onClose={onClose} triggerRef={triggerRef} />
        </div>
      );
    }
    render(<Harness />);
    const menu = document.querySelector("[role=\"menu\"]") as HTMLElement;
    menu.focus();
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("selects item on Enter key", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={triggerRef} type="button">打开菜单</button>
          <Menu items={items} onSelect={onSelect} onClose={onClose} triggerRef={triggerRef} />
        </div>
      );
    }
    render(<Harness />);
    const menu = document.querySelector("[role=\"menu\"]") as HTMLElement;
    menu.focus();
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    fireEvent.keyDown(menu, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("edit");
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates with arrow keys", () => {
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={triggerRef} type="button">打开菜单</button>
          <Menu items={items} onSelect={vi.fn()} onClose={vi.fn()} triggerRef={triggerRef} />
        </div>
      );
    }
    render(<Harness />);
    const menu = document.querySelector("[role=\"menu\"]") as HTMLElement;
    menu.focus();
    const editItem = screen.getByRole("menuitem", { name: "编辑" });
    const duplicateItem = screen.getByRole("menuitem", { name: "复制" });

    expect(editItem.className).not.toContain("menu-item-active");
    expect(duplicateItem.className).not.toContain("menu-item-active");

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(editItem.className).toContain("menu-item-active");

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(editItem.className).not.toContain("menu-item-active");
    expect(duplicateItem.className).toContain("menu-item-active");
  });

  it("closes on click outside", () => {
    const onClose = vi.fn();
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={triggerRef} type="button">打开菜单</button>
          <Menu items={items} onSelect={vi.fn()} onClose={onClose} triggerRef={triggerRef} />
        </div>
      );
    }
    render(<Harness />);
    expect(document.querySelector(".menu.is-open")).toBeTruthy();
    const trigger = screen.getByText("打开菜单");
    fireEvent.mouseDown(trigger);
    expect(onClose).toHaveBeenCalled();
  });
});
