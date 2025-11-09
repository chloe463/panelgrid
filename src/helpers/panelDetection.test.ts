import { describe, expect, it } from "vitest";
import type { PanelCoordinate } from "../types";
import { detectAnimatingPanels } from "./panelDetection";

describe("panelDetection", () => {
  describe("detectAnimatingPanels", () => {
    it("should detect panels that have changed position", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 },
        { id: 3, x: 4, y: 0, w: 2, h: 1 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 }, // No change
        { id: 2, x: 3, y: 1, w: 2, h: 2 }, // Position changed
        { id: 3, x: 4, y: 0, w: 2, h: 1 }, // No change
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(1);
      expect(result.has(2)).toBe(true);
      expect(result.has(1)).toBe(false);
      expect(result.has(3)).toBe(false);
    });

    it("should detect panels that have changed size", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 }, // No change
        { id: 2, x: 2, y: 0, w: 3, h: 3 }, // Size changed
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(1);
      expect(result.has(2)).toBe(true);
    });

    it("should detect panels that have changed both position and size", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 }, // No change
        { id: 2, x: 3, y: 1, w: 3, h: 3 }, // Position and size changed
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(1);
      expect(result.has(2)).toBe(true);
    });

    it("should exclude the specified panel from detection", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 },
        { id: 3, x: 4, y: 0, w: 2, h: 1 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: 1, x: 1, y: 1, w: 2, h: 2 }, // Changed
        { id: 2, x: 3, y: 1, w: 2, h: 2 }, // Changed but excluded
        { id: 3, x: 5, y: 1, w: 2, h: 1 }, // Changed
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 2,
      });

      expect(result.size).toBe(2);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(false); // Excluded
      expect(result.has(3)).toBe(true);
    });

    it("should return empty set when no panels changed", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 },
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(0);
    });

    it("should handle empty panel arrays", () => {
      const result = detectAnimatingPanels({
        oldPanels: [],
        newPanels: [],
        excludePanelId: 999,
      });

      expect(result.size).toBe(0);
    });

    it("should handle panels that exist in old but not in new", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        // Panel 2 removed
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      // Panel 2 doesn't exist in new, so it shouldn't be in animating set
      expect(result.size).toBe(0);
    });

    it("should handle panels that exist in new but not in old", () => {
      const oldPanels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 2 }];

      const newPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 }, // New panel
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      // New panel doesn't exist in old, so it's not considered "changed"
      expect(result.size).toBe(0);
    });

    it("should detect multiple panels changing at once", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2 },
        { id: 2, x: 2, y: 0, w: 2, h: 2 },
        { id: 3, x: 4, y: 0, w: 2, h: 1 },
        { id: 4, x: 0, y: 2, w: 1, h: 1 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: 1, x: 1, y: 1, w: 2, h: 2 }, // Changed
        { id: 2, x: 2, y: 0, w: 2, h: 2 }, // No change
        { id: 3, x: 4, y: 1, w: 2, h: 2 }, // Changed
        { id: 4, x: 1, y: 3, w: 1, h: 1 }, // Changed
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(3);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(false);
      expect(result.has(3)).toBe(true);
      expect(result.has(4)).toBe(true);
    });

    it("should handle string IDs", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: "panel-1", x: 0, y: 0, w: 2, h: 2 },
        { id: "panel-2", x: 2, y: 0, w: 2, h: 2 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: "panel-1", x: 0, y: 0, w: 2, h: 2 },
        { id: "panel-2", x: 3, y: 1, w: 2, h: 2 },
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: "panel-999",
      });

      expect(result.size).toBe(1);
      expect(result.has("panel-2")).toBe(true);
    });

    it("should exclude panel with string ID", () => {
      const oldPanels: PanelCoordinate[] = [
        { id: "panel-1", x: 0, y: 0, w: 2, h: 2 },
        { id: "panel-2", x: 2, y: 0, w: 2, h: 2 },
      ];

      const newPanels: PanelCoordinate[] = [
        { id: "panel-1", x: 1, y: 1, w: 2, h: 2 },
        { id: "panel-2", x: 3, y: 1, w: 2, h: 2 },
      ];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: "panel-1",
      });

      expect(result.size).toBe(1);
      expect(result.has("panel-1")).toBe(false);
      expect(result.has("panel-2")).toBe(true);
    });

    it("should detect only x position change", () => {
      const oldPanels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 2 }];

      const newPanels: PanelCoordinate[] = [{ id: 1, x: 1, y: 0, w: 2, h: 2 }];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(1);
      expect(result.has(1)).toBe(true);
    });

    it("should detect only y position change", () => {
      const oldPanels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 2 }];

      const newPanels: PanelCoordinate[] = [{ id: 1, x: 0, y: 1, w: 2, h: 2 }];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(1);
      expect(result.has(1)).toBe(true);
    });

    it("should detect only width change", () => {
      const oldPanels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 2 }];

      const newPanels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 3, h: 2 }];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(1);
      expect(result.has(1)).toBe(true);
    });

    it("should detect only height change", () => {
      const oldPanels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 2 }];

      const newPanels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 3 }];

      const result = detectAnimatingPanels({
        oldPanels,
        newPanels,
        excludePanelId: 999,
      });

      expect(result.size).toBe(1);
      expect(result.has(1)).toBe(true);
    });
  });
});
