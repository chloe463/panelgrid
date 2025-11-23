import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PanelCoordinate } from "./types";
import { type PanelGridAction, type PanelGridState, panelGridReducer, usePanelGrid } from "./usePanelGrid";

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

describe("panelGridReducer", () => {
  const initialState: PanelGridState = {
    panels: [
      { id: "panel-1", x: 0, y: 0, w: 2, h: 2 },
      { id: "panel-2", x: 2, y: 0, w: 1, h: 1 },
      { id: "panel-3", x: 0, y: 2, w: 1, h: 1 },
    ],
  };

  describe("UPDATE_PANELS", () => {
    it("should update panels with new array", () => {
      const newPanels: PanelCoordinate[] = [
        { id: "panel-1", x: 1, y: 1, w: 2, h: 2 },
        { id: "panel-2", x: 3, y: 1, w: 1, h: 1 },
      ];

      const action: PanelGridAction = {
        type: "UPDATE_PANELS",
        payload: newPanels,
      };

      const result = panelGridReducer(initialState, action);

      expect(result.panels).toEqual(newPanels);
      expect(result.panels).toHaveLength(2);
    });

    it("should replace all panels completely", () => {
      const newPanels: PanelCoordinate[] = [];

      const action: PanelGridAction = {
        type: "UPDATE_PANELS",
        payload: newPanels,
      };

      const result = panelGridReducer(initialState, action);

      expect(result.panels).toEqual([]);
      expect(result.panels).toHaveLength(0);
    });

    it("should not mutate the original state", () => {
      const originalPanels = [...initialState.panels];
      const newPanels: PanelCoordinate[] = [{ id: "panel-new", x: 0, y: 0, w: 1, h: 1 }];

      const action: PanelGridAction = {
        type: "UPDATE_PANELS",
        payload: newPanels,
      };

      const result = panelGridReducer(initialState, action);

      // Result should be a new object
      expect(result).not.toBe(initialState);
      expect(result.panels).not.toBe(initialState.panels);

      // Original state should remain unchanged
      expect(initialState.panels).toEqual(originalPanels);
      expect(initialState.panels).toHaveLength(3);
    });
  });

  describe("ADD_PANEL", () => {
    it("should add a new panel to the panels array", () => {
      const newPanel: PanelCoordinate = {
        id: "panel-4",
        x: 3,
        y: 0,
        w: 1,
        h: 1,
      };

      const action: PanelGridAction = {
        type: "ADD_PANEL",
        payload: newPanel,
      };

      const result = panelGridReducer(initialState, action);

      expect(result.panels).toHaveLength(4);
      expect(result.panels[3]).toEqual(newPanel);
      expect(result.panels).toContainEqual(newPanel);
    });

    it("should preserve existing panels when adding new one", () => {
      const newPanel: PanelCoordinate = {
        id: "panel-4",
        x: 3,
        y: 0,
        w: 1,
        h: 1,
      };

      const action: PanelGridAction = {
        type: "ADD_PANEL",
        payload: newPanel,
      };

      const result = panelGridReducer(initialState, action);

      expect(result.panels[0]).toEqual(initialState.panels[0]);
      expect(result.panels[1]).toEqual(initialState.panels[1]);
      expect(result.panels[2]).toEqual(initialState.panels[2]);
    });

    it("should not mutate the original state", () => {
      const originalPanels = [...initialState.panels];
      const newPanel: PanelCoordinate = {
        id: "panel-4",
        x: 3,
        y: 0,
        w: 1,
        h: 1,
      };

      const action: PanelGridAction = {
        type: "ADD_PANEL",
        payload: newPanel,
      };

      const result = panelGridReducer(initialState, action);

      // Result should be a new object
      expect(result).not.toBe(initialState);
      expect(result.panels).not.toBe(initialState.panels);

      // Original state should remain unchanged
      expect(initialState.panels).toEqual(originalPanels);
      expect(initialState.panels).toHaveLength(3);
    });
  });

  describe("REMOVE_PANEL", () => {
    it("should remove panel by string id", () => {
      const action: PanelGridAction = {
        type: "REMOVE_PANEL",
        payload: "panel-2",
      };

      const result = panelGridReducer(initialState, action);

      expect(result.panels).toHaveLength(2);
      expect(result.panels.find((p) => p.id === "panel-2")).toBeUndefined();
      expect(result.panels[0]).toEqual(initialState.panels[0]);
      expect(result.panels[1]).toEqual(initialState.panels[2]);
    });

    it("should remove panel by number id", () => {
      const stateWithNumberIds: PanelGridState = {
        panels: [
          { id: 1, x: 0, y: 0, w: 2, h: 2 },
          { id: 2, x: 2, y: 0, w: 1, h: 1 },
          { id: 3, x: 0, y: 2, w: 1, h: 1 },
        ],
      };

      const action: PanelGridAction = {
        type: "REMOVE_PANEL",
        payload: 2,
      };

      const result = panelGridReducer(stateWithNumberIds, action);

      expect(result.panels).toHaveLength(2);
      expect(result.panels.find((p) => p.id === 2)).toBeUndefined();
    });

    it("should do nothing if panel id does not exist", () => {
      const action: PanelGridAction = {
        type: "REMOVE_PANEL",
        payload: "nonexistent-id",
      };

      const result = panelGridReducer(initialState, action);

      expect(result.panels).toHaveLength(3);
      expect(result.panels).toEqual(initialState.panels);
    });

    it("should not mutate the original state", () => {
      const originalPanels = [...initialState.panels];
      const action: PanelGridAction = {
        type: "REMOVE_PANEL",
        payload: "panel-1",
      };

      const result = panelGridReducer(initialState, action);

      // Result should be a new object
      expect(result).not.toBe(initialState);
      expect(result.panels).not.toBe(initialState.panels);

      // Original state should remain unchanged
      expect(initialState.panels).toEqual(originalPanels);
      expect(initialState.panels).toHaveLength(3);
    });

    it("should handle removing from empty array", () => {
      const emptyState: PanelGridState = { panels: [] };

      const action: PanelGridAction = {
        type: "REMOVE_PANEL",
        payload: "panel-1",
      };

      const result = panelGridReducer(emptyState, action);

      expect(result.panels).toHaveLength(0);
      expect(result.panels).toEqual([]);
    });
  });

  describe("Unknown action", () => {
    it("should return the same state for unknown action type", () => {
      const unknownAction = {
        type: "UNKNOWN_ACTION",
      } as PanelGridAction & { type: "UNKNOWN_ACTION" };

      const result = panelGridReducer(initialState, unknownAction);

      expect(result).toBe(initialState);
    });
  });
});
