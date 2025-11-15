import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PanelCoordinate } from "./types";
import { usePanelGrid } from "./usePanelGrid";

describe("usePanelGrid", () => {
  describe("lockSize functionality", () => {
    it("should include resizeHandleProps when lockSize is not set", () => {
      const panels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 2 }];

      const { result } = renderHook(() =>
        usePanelGrid({
          panels,
          columnCount: 4,
          baseSize: 100,
          gap: 10,
        })
      );

      expect(result.current.panels).toHaveLength(1);
      expect(result.current.panels[0].resizeHandleProps).toBeDefined();
      expect(result.current.panels[0].resizeHandleProps).toHaveProperty("onMouseDown");
    });

    it("should include resizeHandleProps when lockSize is false", () => {
      const panels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 2, lockSize: false }];

      const { result } = renderHook(() =>
        usePanelGrid({
          panels,
          columnCount: 4,
          baseSize: 100,
          gap: 10,
        })
      );

      expect(result.current.panels).toHaveLength(1);
      expect(result.current.panels[0].resizeHandleProps).toBeDefined();
      expect(result.current.panels[0].resizeHandleProps).toHaveProperty("onMouseDown");
    });

    it("should not include resizeHandleProps when lockSize is true", () => {
      const panels: PanelCoordinate[] = [{ id: 1, x: 0, y: 0, w: 2, h: 2, lockSize: true }];

      const { result } = renderHook(() =>
        usePanelGrid({
          panels,
          columnCount: 4,
          baseSize: 100,
          gap: 10,
        })
      );

      expect(result.current.panels).toHaveLength(1);
      expect(result.current.panels[0].resizeHandleProps).toBeUndefined();
    });

    it("should handle mixed lockSize values correctly", () => {
      const panels: PanelCoordinate[] = [
        { id: 1, x: 0, y: 0, w: 2, h: 2, lockSize: true },
        { id: 2, x: 2, y: 0, w: 2, h: 2, lockSize: false },
        { id: 3, x: 0, y: 2, w: 2, h: 2 },
      ];

      const { result } = renderHook(() =>
        usePanelGrid({
          panels,
          columnCount: 4,
          baseSize: 100,
          gap: 10,
        })
      );

      expect(result.current.panels).toHaveLength(3);
      expect(result.current.panels[0].resizeHandleProps).toBeUndefined();
      expect(result.current.panels[1].resizeHandleProps).toBeDefined();
      expect(result.current.panels[2].resizeHandleProps).toBeDefined();
    });
  });
});
