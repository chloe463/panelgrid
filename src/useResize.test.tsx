import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResize } from "./useResize";
import { PanelistProvider } from "./PanelistProvider";
import { createRef } from "react";
import type { ReactNode } from "react";

// Mock throttleRAF to execute immediately for testing
vi.mock("./helpers/throttle", () => ({
  throttleRAF: (fn: (...args: unknown[]) => void) => fn,
}));

describe("useResize", () => {
  let container: HTMLDivElement;
  let resizeHandle: HTMLDivElement;
  let panel: HTMLDivElement;

  beforeEach(() => {
    // Create DOM structure
    container = document.createElement("div");
    panel = document.createElement("div");
    resizeHandle = document.createElement("div");
    resizeHandle.className = "resize-handle";

    panel.appendChild(resizeHandle);
    container.appendChild(panel);
    document.body.appendChild(container);

    // Set initial dimensions
    Object.defineProperty(panel, "offsetWidth", { value: 200, writable: true });
    Object.defineProperty(panel, "offsetHeight", {
      value: 160,
      writable: true,
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  const createWrapper = (panelId: string | number = "test-panel") => {
    return ({ children }: { children: ReactNode }) => (
      <PanelistProvider columnCount={4} gap={8} panelCoordinates={[{ id: panelId, x: 0, y: 0, w: 2, h: 2 }]}>
        {children}
      </PanelistProvider>
    );
  };

  it("should attach mousedown event listener to resize handle", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: panel, writable: true });

    const addEventListenerSpy = vi.spyOn(resizeHandle, "addEventListener");

    renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("should throw error if resize handle is not found", () => {
    const ref = createRef<HTMLDivElement>();
    const panelWithoutHandle = document.createElement("div");
    Object.defineProperty(ref, "current", {
      value: panelWithoutHandle,
      writable: true,
    });

    expect(() => {
      renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
        wrapper: createWrapper("test-panel"),
      });
    }).toThrow("No handle found!");
  });

  it("should update panel dimensions during mousemove", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: panel, writable: true });

    renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Simulate mousedown
    const mouseDownEvent = new MouseEvent("mousedown", {
      clientX: 100,
      clientY: 100,
      bubbles: true,
    });
    act(() => {
      resizeHandle.dispatchEvent(mouseDownEvent);
    });

    // Simulate mousemove
    const mouseMoveEvent = new MouseEvent("mousemove", {
      clientX: 150,
      clientY: 180,
      bubbles: true,
    });
    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    // Check if dimensions were updated (deltaX = 50, deltaY = 80)
    expect(panel.style.width).toBe("250px"); // 200 + 50
    expect(panel.style.height).toBe("240px"); // 160 + 80
    expect(panel.style.zIndex).toBe("calc(infinity)");
  });

  it("should snap to grid on mouseup", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: panel, writable: true });

    // Mock getBoundingClientRect
    panel.getBoundingClientRect = vi.fn(() => ({
      width: 250,
      height: 240,
      top: 0,
      left: 0,
      right: 250,
      bottom: 240,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    // Mock requestAnimationFrame
    let rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });

    renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Simulate mousedown
    act(() => {
      resizeHandle.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        })
      );
    });

    // Simulate mousemove
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 150,
          clientY: 180,
          bubbles: true,
        })
      );
    });

    // Clear RAF callbacks before mouseup
    rafCallbacks = [];

    // Simulate mouseup
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // Panel dimensions should be snapped to grid
    // baseSize=80, gap=8 (from PanelistProvider INITIAL_STATE, not from props)
    // width: 250px -> 3 grid units (ceil(250/88)) -> 256px (3*80 + 2*8)
    // height: 240px -> 3 grid units (ceil(240/88)) -> 256px
    expect(panel.style.width).toBe("256px");
    expect(panel.style.height).toBe("256px");

    vi.unstubAllGlobals();
  });

  it("should restore initial z-index on mouseup", () => {
    const ref = createRef<HTMLDivElement>();
    panel.style.zIndex = "10";
    Object.defineProperty(ref, "current", { value: panel, writable: true });

    panel.getBoundingClientRect = vi.fn(() => ({
      width: 200,
      height: 160,
      top: 0,
      left: 0,
      right: 200,
      bottom: 160,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Simulate mousedown
    act(() => {
      resizeHandle.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        })
      );
    });

    // z-index should be calc(infinity) during resize
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 110,
          clientY: 110,
          bubbles: true,
        })
      );
    });
    expect(panel.style.zIndex).toBe("calc(infinity)");

    // Simulate mouseup
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // z-index should be restored
    expect(panel.style.zIndex).toBe("10");
  });

  it("should stop propagation on mousedown", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: panel, writable: true });

    renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    const mouseDownEvent = new MouseEvent("mousedown", {
      clientX: 100,
      clientY: 100,
      bubbles: true,
    });
    const stopPropagationSpy = vi.spyOn(mouseDownEvent, "stopPropagation");

    act(() => {
      resizeHandle.dispatchEvent(mouseDownEvent);
    });

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it("should cleanup event listeners on unmount", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: panel, writable: true });

    // Spy on AbortController to verify cleanup is called
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");

    const { unmount } = renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Verify that abort wasn't called yet
    expect(abortSpy).not.toHaveBeenCalled();

    // Unmount should trigger cleanup and call abort
    unmount();

    // Verify that abort was called (cleanup was executed)
    expect(abortSpy).toHaveBeenCalled();

    abortSpy.mockRestore();
  });

  it("should handle resize with different baseSize and gap", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: panel, writable: true });

    panel.getBoundingClientRect = vi.fn(() => ({
      width: 250,
      height: 240,
      top: 0,
      left: 0,
      right: 250,
      bottom: 240,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    const customWrapper = ({ children }: { children: ReactNode }) => (
      <PanelistProvider columnCount={4} gap={10} panelCoordinates={[{ id: "test-panel", x: 0, y: 0, w: 2, h: 2 }]}>
        {children}
      </PanelistProvider>
    );

    renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
      wrapper: customWrapper,
    });

    // Simulate resize
    act(() => {
      resizeHandle.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        })
      );
    });

    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // With baseSize=80 and gap=10:
    // 250px -> 3 grid units (ceil(250/90)) -> 260px (3*80 + 2*10)
    expect(panel.style.width).toBe("260px");
    expect(panel.style.height).toBe("260px");
  });

  it("should not resize if ref.current is null during mousemove", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: panel, writable: true });

    renderHook(() => useResize({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Simulate mousedown
    act(() => {
      resizeHandle.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        })
      );
    });

    const initialWidth = panel.style.width;

    // Set ref.current to null
    Object.defineProperty(ref, "current", { value: null, writable: true });

    // Simulate mousemove
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    // Width should not change
    expect(panel.style.width).toBe(initialWidth);
  });
});
