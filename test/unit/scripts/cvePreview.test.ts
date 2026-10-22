import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { attachCvePreview } from "@/scripts/cve-preview";

let cleanup: () => void;
let root: HTMLElement;
let trigger: HTMLAnchorElement;
let tooltip: HTMLElement;
let show: ReturnType<typeof vi.fn>;
let hide: ReturnType<typeof vi.fn>;

function pointer(
  element: HTMLElement,
  type: string,
  pointerType = "mouse",
): void {
  const event = new Event(type);
  Object.defineProperty(event, "pointerType", { value: pointerType });
  element.dispatchEvent(event);
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = `<cve-reference>
    <a href="https://www.cve.org/CVERecord?id=CVE-2026-109618" data-cve-trigger>CVE</a>
    <span data-cve-preview popover="manual" role="tooltip">Preview</span>
  </cve-reference>`;
  root = document.querySelector<HTMLElement>("cve-reference")!;
  trigger = root.querySelector<HTMLAnchorElement>("a")!;
  tooltip = root.querySelector<HTMLElement>("[role=tooltip]")!;
  show = vi.fn();
  hide = vi.fn();
  tooltip.showPopover = show;
  tooltip.hidePopover = hide;
  vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(
    new DOMRect(100, 100, 150, 30),
  );
  vi.spyOn(tooltip, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 300, 180),
  );
  cleanup = attachCvePreview(root);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("CVE preview interactions", () => {
  it("waits for deliberate hover, then keeps the preview open while hovered", () => {
    pointer(trigger, "pointerenter");
    vi.advanceTimersByTime(179);
    expect(show).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(show).toHaveBeenCalledTimes(1);

    pointer(trigger, "pointerleave");
    vi.advanceTimersByTime(60);
    pointer(tooltip, "pointerenter");
    vi.advanceTimersByTime(500);
    expect(hide).not.toHaveBeenCalled();

    pointer(tooltip, "pointerleave");
    vi.advanceTimersByTime(120);
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("does not open after a brief hover or a touch pointer", () => {
    pointer(trigger, "pointerenter");
    pointer(trigger, "pointerleave");
    vi.advanceTimersByTime(500);
    pointer(trigger, "pointerenter", "touch");
    vi.advanceTimersByTime(500);
    expect(show).not.toHaveBeenCalled();
  });

  it("opens immediately on focus and closes after blur", () => {
    trigger.focus();
    expect(show).toHaveBeenCalledTimes(1);
    pointer(trigger, "pointerleave");
    vi.advanceTimersByTime(500);
    expect(hide).not.toHaveBeenCalled();
    trigger.blur();
    vi.advanceTimersByTime(120);
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("dismisses with Escape without moving focus or reopening", () => {
    trigger.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    vi.advanceTimersByTime(500);
    expect(hide).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
  });

  it("positions below the badge and clamps to the viewport", () => {
    trigger.focus();
    expect(tooltip.style.top).toBe("138px");
    expect(tooltip.style.left).toBe("25px");

    vi.mocked(trigger.getBoundingClientRect).mockReturnValue(
      new DOMRect(window.innerWidth - 160, window.innerHeight - 40, 150, 30),
    );
    window.dispatchEvent(new Event("resize"));
    expect(tooltip.style.left).toBe(`${window.innerWidth - 312}px`);
    expect(tooltip.style.top).toBe(`${window.innerHeight - 228}px`);
  });

  it("tracks nested scrolling and hides when the badge leaves the viewport", () => {
    trigger.focus();
    vi.mocked(trigger.getBoundingClientRect).mockReturnValue(
      new DOMRect(0, -100, 150, 30),
    );
    trigger.dispatchEvent(new Event("scroll"));
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("cancels pending work and removes event listeners on disconnect", () => {
    pointer(trigger, "pointerenter");
    cleanup();
    vi.advanceTimersByTime(500);
    trigger.focus();
    expect(show).not.toHaveBeenCalled();
  });

  it("leaves the link usable when metadata or Popover API support is absent", () => {
    cleanup();
    tooltip.remove();
    expect(() => attachCvePreview(root)()).not.toThrow();
    root.append(tooltip);
    Object.defineProperty(tooltip, "showPopover", { value: undefined });
    expect(() => attachCvePreview(root)()).not.toThrow();
    trigger.focus();
    expect(show).not.toHaveBeenCalled();
    expect(trigger.href).toContain("CVERecord?id=CVE-2026-109618");
  });
});
