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
      expect(pixelsToGridSize(0, 50, 10)).toBe(1); // Minimum size is 1
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

  // Test cases for overflow handling (issue #23)
  describe("overflow handling", () => {
    describe("pixelsToGridSize with columnCount", () => {
      it("should constrain size to columnCount", () => {
        const columnCount = 6;
        // Size that would normally be 8
        expect(pixelsToGridSize(500, 50, 10, columnCount)).toBe(6);
      });

      it("should allow size equal to columnCount", () => {
        const columnCount = 6;
        // Size that equals columnCount
        expect(pixelsToGridSize(360, 50, 10, columnCount)).toBe(6);
      });

      it("should not constrain size below columnCount", () => {
        const columnCount = 6;
        // Size that is less than columnCount
        expect(pixelsToGridSize(120, 50, 10, columnCount)).toBe(2);
      });

      it("should enforce minimum size of 1", () => {
        const columnCount = 6;
        expect(pixelsToGridSize(0, 50, 10, columnCount)).toBe(1);
        expect(pixelsToGridSize(-10, 50, 10, columnCount)).toBe(1);
      });

      it("should work without columnCount parameter", () => {
        // Should work as before without columnCount
        expect(pixelsToGridSize(500, 50, 10)).toBe(9);
        expect(pixelsToGridSize(100, 50, 10)).toBe(2);
      });
    });

    describe("pixelsToGridPosition with columnCount", () => {
      it("should constrain position to columnCount - 1 (without width)", () => {
        const columnCount = 6;
        // Position that would normally be 10
        expect(pixelsToGridPosition(600, 50, 10, columnCount)).toBe(5);
      });

      it("should allow position equal to columnCount - 1 (without width)", () => {
        const columnCount = 6;
        // Position that equals columnCount - 1
        expect(pixelsToGridPosition(300, 50, 10, columnCount)).toBe(5);
      });

      it("should not constrain position below columnCount - 1 (without width)", () => {
        const columnCount = 6;
        // Position that is less than columnCount - 1
        expect(pixelsToGridPosition(120, 50, 10, columnCount)).toBe(2);
      });

      it("should still enforce non-negative values", () => {
        const columnCount = 6;
        expect(pixelsToGridPosition(-100, 50, 10, columnCount)).toBe(0);
      });

      it("should work without columnCount parameter", () => {
        // Should work as before without columnCount
        expect(pixelsToGridPosition(600, 50, 10)).toBe(10);
        expect(pixelsToGridPosition(100, 50, 10)).toBe(1);
      });

      describe("with width parameter", () => {
        it("should prevent panel w=2 from being placed at x=5 when columnCount=6", () => {
          const columnCount = 6;
          const width = 2;
          // Position that would be 5, but x + w = 5 + 2 = 7 > 6
          // Should constrain to x = 4 (so x + w = 4 + 2 = 6)
          expect(pixelsToGridPosition(300, 50, 10, columnCount, width)).toBe(4);
        });

        it("should allow panel w=2 at x=4 when columnCount=6", () => {
          const columnCount = 6;
          const width = 2;
          // x + w = 4 + 2 = 6, which is valid
          expect(pixelsToGridPosition(240, 50, 10, columnCount, width)).toBe(4);
        });

        it("should constrain panel w=6 to x=0 when columnCount=6", () => {
          const columnCount = 6;
          const width = 6;
          // Panel takes up entire width, must be at x=0
          expect(pixelsToGridPosition(300, 50, 10, columnCount, width)).toBe(0);
        });

        it("should handle panel w=1 normally", () => {
          const columnCount = 6;
          const width = 1;
          // With w=1, max position is 5 (x + w = 5 + 1 = 6)
          expect(pixelsToGridPosition(300, 50, 10, columnCount, width)).toBe(5);
        });

        it("should handle panel wider than columnCount", () => {
          const columnCount = 6;
          const width = 8;
          // Panel is wider than grid, constrain to x=0
          expect(pixelsToGridPosition(300, 50, 10, columnCount, width)).toBe(0);
        });
      });
    });
  });
});
