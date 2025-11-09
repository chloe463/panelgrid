import { beforeEach, describe, expect, it, vi } from "vitest";
import { applySnapAnimation } from "./animation";

describe("animation", () => {
  describe("applySnapAnimation", () => {
    let mockElement: HTMLElement;
    let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Create a mock HTMLElement
      mockElement = {
        style: {
          transform: "",
          transition: "",
          left: "",
          top: "",
        },
      } as unknown as HTMLElement;

      // Mock requestAnimationFrame
      mockRequestAnimationFrame = vi.fn((callback) => {
        callback();
        return 0;
      });
      globalThis.requestAnimationFrame = mockRequestAnimationFrame;
    });

    it("should apply snap animation with correct transform values", () => {
      applySnapAnimation({
        element: mockElement,
        droppedLeft: 150,
        droppedTop: 200,
        nextLeft: 100,
        nextTop: 150,
        originalTransition: "all 0.3s ease",
      });

      // Should calculate delta correctly (dropped - next)
      // deltaX = 150 - 100 = 50
      // deltaY = 200 - 150 = 50
      expect(mockElement.style.transform).toBe("translate3D(0, 0, 0)");
      expect(mockElement.style.left).toBe("100px");
      expect(mockElement.style.top).toBe("150px");
      expect(mockElement.style.transition).toBe("all 0.3s ease");
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it("should handle zero delta (no animation needed)", () => {
      applySnapAnimation({
        element: mockElement,
        droppedLeft: 100,
        droppedTop: 150,
        nextLeft: 100,
        nextTop: 150,
        originalTransition: "all 0.3s ease",
      });

      // deltaX = 0, deltaY = 0
      expect(mockElement.style.left).toBe("100px");
      expect(mockElement.style.top).toBe("150px");
      expect(mockElement.style.transition).toBe("all 0.3s ease");
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it("should handle negative delta values", () => {
      applySnapAnimation({
        element: mockElement,
        droppedLeft: 50,
        droppedTop: 75,
        nextLeft: 100,
        nextTop: 150,
        originalTransition: "all 0.3s ease",
      });

      // deltaX = 50 - 100 = -50
      // deltaY = 75 - 150 = -75
      expect(mockElement.style.left).toBe("100px");
      expect(mockElement.style.top).toBe("150px");
      expect(mockElement.style.transition).toBe("all 0.3s ease");
    });

    it("should preserve original transition", () => {
      const customTransition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";

      applySnapAnimation({
        element: mockElement,
        droppedLeft: 150,
        droppedTop: 200,
        nextLeft: 100,
        nextTop: 150,
        originalTransition: customTransition,
      });

      expect(mockElement.style.transition).toBe(customTransition);
    });

    it("should handle empty original transition", () => {
      applySnapAnimation({
        element: mockElement,
        droppedLeft: 150,
        droppedTop: 200,
        nextLeft: 100,
        nextTop: 150,
        originalTransition: "",
      });

      expect(mockElement.style.transition).toBe("");
    });

    it("should set correct styles in the animation frame callback", () => {
      let animationFrameCallback: FrameRequestCallback | null = null;

      globalThis.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
        animationFrameCallback = callback;
        return 0;
      });

      applySnapAnimation({
        element: mockElement,
        droppedLeft: 150,
        droppedTop: 200,
        nextLeft: 100,
        nextTop: 150,
        originalTransition: "all 0.3s ease",
      });

      // Before animation frame callback (but after initial setup)
      // The function sets transform, left, top, and transition immediately
      expect(mockElement.style.transform).toBe("translate3D(50px, 50px, 0)");
      expect(mockElement.style.left).toBe("100px");
      expect(mockElement.style.top).toBe("150px");

      // Execute animation frame callback
      expect(animationFrameCallback).not.toBeNull();
      animationFrameCallback!(0);

      // After animation frame callback
      expect(mockElement.style.transform).toBe("translate3D(0, 0, 0)");
      expect(mockElement.style.transition).toBe("transform 0.1s ease-out");

      // Note: The originalTransition is set at the end of applySnapAnimation,
      // so it will be "all 0.3s ease" after the full function completes
    });

    it("should handle large delta values", () => {
      applySnapAnimation({
        element: mockElement,
        droppedLeft: 1000,
        droppedTop: 2000,
        nextLeft: 100,
        nextTop: 200,
        originalTransition: "all 0.3s ease",
      });

      // deltaX = 900, deltaY = 1800
      expect(mockElement.style.left).toBe("100px");
      expect(mockElement.style.top).toBe("200px");
    });

    it("should handle floating point positions", () => {
      applySnapAnimation({
        element: mockElement,
        droppedLeft: 123.456,
        droppedTop: 234.567,
        nextLeft: 100.5,
        nextTop: 200.5,
        originalTransition: "all 0.3s ease",
      });

      expect(mockElement.style.left).toBe("100.5px");
      expect(mockElement.style.top).toBe("200.5px");
    });
  });
});
