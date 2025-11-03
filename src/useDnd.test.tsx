import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDnd } from "./useDnd";
import { PanelistProvider } from "./PanelistProvider";
import { createRef } from "react";
import type { ReactNode } from "react";

// Mock throttleRAF to execute immediately for testing
vi.mock("./helpers/throttle", () => ({
  throttleRAF: (fn: (...args: unknown[]) => void) => fn,
}));

describe("useDnd", () => {
  let container: HTMLDivElement;
  let draggable: HTMLDivElement;

  beforeEach(() => {
    // Create DOM structure
    container = document.createElement("div");
    draggable = document.createElement("div");

    container.appendChild(draggable);
    document.body.appendChild(container);

    // Set initial dimensions and position
    Object.defineProperty(draggable, "offsetLeft", {
      value: 100,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(draggable, "offsetTop", {
      value: 80,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  const createWrapper = (panelId: string | number = "test-panel") => {
    return ({ children }: { children: ReactNode }) => (
      <PanelistProvider columnCount={4} gap={8} panelCoordinates={[{ id: panelId, x: 1, y: 1, w: 2, h: 2 }]}>
        {children}
      </PanelistProvider>
    );
  };

  it("should attach mousedown event listener to draggable element", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    const addEventListenerSpy = vi.spyOn(draggable, "addEventListener");

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("should set cursor to grabbing on mousedown", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    act(() => {
      draggable.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    expect(draggable.style.cursor).toBe("grabbing");
    expect(draggable.style.position).toBe("absolute");
    expect(draggable.style.zIndex).toBe("calc(infinity)");
  });

  it("should update position during mousemove", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Simulate mousedown
    act(() => {
      draggable.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    // Simulate mousemove
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 200,
          clientY: 180,
          bubbles: true,
        })
      );
    });

    // Position should be updated (offsetLeft: 100, offsetTop: 80)
    // deltaX = 200 - 150 = 50, deltaY = 180 - 150 = 30
    expect(draggable.style.left).toBe("150px"); // 100 + 50
    expect(draggable.style.top).toBe("110px"); // 80 + 30
  });

  it("should snap to grid on mouseup", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    // Mock requestAnimationFrame
    let rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Store initial styles
    draggable.style.boxShadow = "initial-shadow";
    draggable.style.zIndex = "5";

    // Simulate mousedown
    act(() => {
      draggable.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    // Simulate mousemove
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 200,
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

    // Position should be snapped to grid
    // left: 150px -> grid position 1 (floor(150/88)) -> 88px (1 * 88)
    // top: 110px -> grid position 1 (floor(110/88)) -> 88px (1 * 88)
    expect(draggable.style.left).toBe("88px");
    expect(draggable.style.top).toBe("88px");

    vi.unstubAllGlobals();
  });

  it("should restore cursor and z-index on mouseup", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Set initial z-index
    draggable.style.zIndex = "10";

    // Simulate mousedown (this captures the initial z-index)
    act(() => {
      draggable.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    expect(draggable.style.cursor).toBe("grabbing");
    expect(draggable.style.zIndex).toBe("calc(infinity)");

    // Simulate mouseup
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // Cursor should be restored to default
    expect(draggable.style.cursor).toBe("default");
    // z-index should be restored to the captured value (which was '10')
    expect(draggable.style.zIndex).toBe("10");
    // boxShadow should be restored to what it was before mousedown
    // (empty string in this case since we didn't set it before mousedown)
    expect(draggable.style.boxShadow).toBe("");
  });

  it("should prevent default during mousemove to prevent text selection", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Simulate mousedown
    act(() => {
      draggable.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    // Create a mousemove event with preventDefault spy
    const mouseMoveEvent = new MouseEvent("mousemove", {
      clientX: 200,
      clientY: 180,
      bubbles: true,
    });
    const preventDefaultSpy = vi.spyOn(mouseMoveEvent, "preventDefault");

    // Simulate mousemove
    act(() => {
      document.dispatchEvent(mouseMoveEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("should not move if not dragging", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    const initialLeft = draggable.style.left;

    // Simulate mousemove without mousedown
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 200,
          clientY: 180,
          bubbles: true,
        })
      );
    });

    // Position should not change
    expect(draggable.style.left).toBe(initialLeft);
  });

  it("should cleanup event listeners on unmount", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    // Spy on AbortController to verify cleanup is called
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");

    const { unmount } = renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
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

  it("should handle drag with different baseSize and gap", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    const customWrapper = ({ children }: { children: ReactNode }) => (
      <PanelistProvider columnCount={4} gap={10} panelCoordinates={[{ id: "test-panel", x: 1, y: 1, w: 2, h: 2 }]}>
        {children}
      </PanelistProvider>
    );

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: customWrapper,
    });

    // Simulate drag
    act(() => {
      draggable.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 200,
          clientY: 180,
          bubbles: true,
        })
      );
    });

    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // With baseSize=80 and gap=10:
    // left: 150px -> grid position 1 (floor(150/90)) -> 90px (1 * 90)
    // top: 110px -> grid position 1 (floor(110/90)) -> 90px (1 * 90)
    expect(draggable.style.left).toBe("90px");
    expect(draggable.style.top).toBe("90px");
  });

  it("should apply animation transform on mouseup", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    // Mock requestAnimationFrame
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Simulate drag
    act(() => {
      draggable.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 200,
          clientY: 180,
          bubbles: true,
        })
      );
    });

    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // Execute first RAF callback
    if (rafCallbacks[0]) {
      act(() => {
        rafCallbacks[0](0);
      });
    }

    // Should have set initial transform and transition
    expect(draggable.style.transform).toBeTruthy();

    // Execute second RAF callback
    if (rafCallbacks[1]) {
      act(() => {
        rafCallbacks[1](0);
      });
    }

    // Should have reset transform and set transition properties
    expect(draggable.style.transform).toBe("translate3D(0, 0, 0)");

    vi.unstubAllGlobals();
  });

  it("should stop dragging after mouseup", () => {
    const ref = createRef<HTMLDivElement>();
    Object.defineProperty(ref, "current", { value: draggable, writable: true });

    renderHook(() => useDnd({ panelId: "test-panel", el: ref }), {
      wrapper: createWrapper("test-panel"),
    });

    // Simulate mousedown
    act(() => {
      draggable.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        })
      );
    });

    // Simulate mousemove - should work
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 200,
          clientY: 180,
          bubbles: true,
        })
      );
    });

    // Simulate mouseup
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // Store position after mouseup
    const positionAfterMouseup = draggable.style.left;

    // Simulate another mousemove - should not work
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: 300,
          clientY: 280,
          bubbles: true,
        })
      );
    });

    // Position should not change after mouseup
    expect(draggable.style.left).toBe(positionAfterMouseup);
  });
});
