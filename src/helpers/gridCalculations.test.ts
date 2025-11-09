import { describe, expect, it } from "vitest";
import {
  gridPositionToPixels,
  gridToPixels,
  pixelsToGridPosition,
  pixelsToGridSize,
  snapToGrid,
} from "./gridCalculations";

describe("gridCalculations", () => {
  describe("pixelsToGridSize", () => {
    it("should convert pixels to grid size with ceiling rounding", () => {
      expect(pixelsToGridSize(100, 50, 10)).toBe(2); // 100 / (50 + 10) = 1.67 -> 2
      expect(pixelsToGridSize(60, 50, 10)).toBe(1); // 60 / (50 + 10) = 1.0 -> 1
      expect(pixelsToGridSize(61, 50, 10)).toBe(2); // 61 / (50 + 10) = 1.02 -> 2
    });

    it("should handle zero pixels", () => {
      expect(pixelsToGridSize(0, 50, 10)).toBe(0);
    });

    it("should handle zero gap", () => {
      expect(pixelsToGridSize(100, 50, 0)).toBe(2); // 100 / 50 = 2
      expect(pixelsToGridSize(75, 50, 0)).toBe(2); // 75 / 50 = 1.5 -> 2
    });

    it("should handle small pixel values", () => {
      expect(pixelsToGridSize(1, 50, 10)).toBe(1); // Any positive value rounds up to 1
    });
  });

  describe("pixelsToGridPosition", () => {
    it("should convert pixels to grid position with floor rounding", () => {
      expect(pixelsToGridPosition(100, 50, 10)).toBe(1); // 100 / (50 + 10) = 1.67 -> 1
      expect(pixelsToGridPosition(120, 50, 10)).toBe(2); // 120 / (50 + 10) = 2.0 -> 2
      expect(pixelsToGridPosition(119, 50, 10)).toBe(1); // 119 / (50 + 10) = 1.98 -> 1
    });

    it("should never return negative values", () => {
      expect(pixelsToGridPosition(-100, 50, 10)).toBe(0);
      expect(pixelsToGridPosition(-1, 50, 10)).toBe(0);
    });

    it("should handle zero pixels", () => {
      expect(pixelsToGridPosition(0, 50, 10)).toBe(0);
    });

    it("should handle zero gap", () => {
      expect(pixelsToGridPosition(100, 50, 0)).toBe(2); // 100 / 50 = 2
      expect(pixelsToGridPosition(99, 50, 0)).toBe(1); // 99 / 50 = 1.98 -> 1
    });
  });

  describe("gridToPixels", () => {
    it("should convert grid units to pixels", () => {
      // Formula: gridUnits * baseSize + max(0, gridUnits - 1) * gap
      expect(gridToPixels(2, 50, 10)).toBe(110); // 2 * 50 + 1 * 10 = 110
      expect(gridToPixels(3, 50, 10)).toBe(170); // 3 * 50 + 2 * 10 = 170
      expect(gridToPixels(1, 50, 10)).toBe(50); // 1 * 50 + 0 * 10 = 50
    });

    it("should handle zero grid units", () => {
      expect(gridToPixels(0, 50, 10)).toBe(0);
    });

    it("should handle zero gap", () => {
      expect(gridToPixels(3, 50, 0)).toBe(150); // 3 * 50 = 150
    });

    it("should not add gap after the last cell", () => {
      // For 1 cell, no gap is added
      expect(gridToPixels(1, 50, 10)).toBe(50);
      // For 2 cells, only 1 gap is added
      expect(gridToPixels(2, 50, 10)).toBe(110);
    });
  });

  describe("gridPositionToPixels", () => {
    it("should convert grid coordinate to pixel coordinate", () => {
      // Formula: max(0, gridCoord * (baseSize + gap))
      expect(gridPositionToPixels(0, 50, 10)).toBe(0);
      expect(gridPositionToPixels(1, 50, 10)).toBe(60); // 1 * (50 + 10) = 60
      expect(gridPositionToPixels(2, 50, 10)).toBe(120); // 2 * (50 + 10) = 120
    });

    it("should handle zero grid coordinate", () => {
      expect(gridPositionToPixels(0, 50, 10)).toBe(0);
    });

    it("should never return negative values", () => {
      expect(gridPositionToPixels(-1, 50, 10)).toBe(0);
      expect(gridPositionToPixels(-10, 50, 10)).toBe(0);
    });

    it("should handle zero gap", () => {
      expect(gridPositionToPixels(2, 50, 0)).toBe(100); // 2 * 50 = 100
    });
  });

  describe("snapToGrid", () => {
    it("should snap pixel values to nearest grid position", () => {
      // 100px -> grid position 1 (floor) -> 60px (1 * 60)
      expect(snapToGrid(100, 50, 10)).toBe(60);

      // 120px -> grid position 2 (floor) -> 120px (2 * 60)
      expect(snapToGrid(120, 50, 10)).toBe(120);

      // 59px -> grid position 0 (floor) -> 0px
      expect(snapToGrid(59, 50, 10)).toBe(0);
    });

    it("should handle values already on grid", () => {
      expect(snapToGrid(0, 50, 10)).toBe(0);
      expect(snapToGrid(60, 50, 10)).toBe(60);
      expect(snapToGrid(120, 50, 10)).toBe(120);
    });

    it("should handle negative values", () => {
      expect(snapToGrid(-10, 50, 10)).toBe(0);
      expect(snapToGrid(-100, 50, 10)).toBe(0);
    });

    it("should be consistent with conversion functions", () => {
      const pixels = 150;
      const baseSize = 50;
      const gap = 10;

      const gridPos = pixelsToGridPosition(pixels, baseSize, gap);
      const snapped = snapToGrid(pixels, baseSize, gap);
      const expected = gridPositionToPixels(gridPos, baseSize, gap);

      expect(snapped).toBe(expected);
    });
  });
});
