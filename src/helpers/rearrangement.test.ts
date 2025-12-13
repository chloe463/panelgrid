import { describe, expect, it } from "vitest";
import type { PanelCoordinate } from "../types";
import { detectCollisions, findNewPosition, hasCollision, rearrangePanels, rectanglesOverlap } from "./rearrangement";

describe("rectanglesOverlap", () => {
  it("should return true when rectangles overlap", () => {
    const a = { x: 0, y: 0, w: 2, h: 2 };
    const b = { x: 1, y: 1, w: 2, h: 2 };
    expect(rectanglesOverlap(a, b)).toBe(true);
  });

  it("should return false when rectangles do not overlap (horizontal)", () => {
    const a = { x: 0, y: 0, w: 2, h: 2 };
    const b = { x: 2, y: 0, w: 2, h: 2 };
    expect(rectanglesOverlap(a, b)).toBe(false);
  });

  it("should return false when rectangles do not overlap (vertical)", () => {
    const a = { x: 0, y: 0, w: 2, h: 2 };
    const b = { x: 0, y: 2, w: 2, h: 2 };
    expect(rectanglesOverlap(a, b)).toBe(false);
  });

  it("should return false when rectangles are completely separate", () => {
    const a = { x: 0, y: 0, w: 2, h: 2 };
    const b = { x: 3, y: 3, w: 2, h: 2 };
    expect(rectanglesOverlap(a, b)).toBe(false);
  });

  it("should return true when one rectangle contains another", () => {
    const a = { x: 0, y: 0, w: 4, h: 4 };
    const b = { x: 1, y: 1, w: 2, h: 2 };
    expect(rectanglesOverlap(a, b)).toBe(true);
  });
});

describe("detectCollisions", () => {
  it("should detect collisions with other panels", () => {
    const panel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    };

    const panelMap = new Map<string, PanelCoordinate>([
      [
        "panel-2",
        {
          id: "panel-2",
          x: 1,
          y: 1,
          w: 2,
          h: 2,
        },
      ],
      [
        "panel-3",
        {
          id: "panel-3",
          x: 4,
          y: 4,
          w: 1,
          h: 1,
        },
      ],
    ]);

    const collisions = detectCollisions(panel, panelMap);
    expect(collisions).toEqual(["panel-2"]);
  });

  it("should not detect collision with itself", () => {
    const panel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    };

    const panelMap = new Map<string, PanelCoordinate>([["panel-1", panel]]);

    const collisions = detectCollisions(panel, panelMap);
    expect(collisions).toEqual([]);
  });

  it("should return empty array when no collisions", () => {
    const panel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    };

    const panelMap = new Map<string, PanelCoordinate>([
      [
        "panel-2",
        {
          id: "panel-2",
          x: 2,
          y: 0,
          w: 2,
          h: 2,
        },
      ],
    ]);

    const collisions = detectCollisions(panel, panelMap);
    expect(collisions).toEqual([]);
  });
});

describe("hasCollision", () => {
  it("should return true when candidate collides with any panel", () => {
    const candidate = { x: 1, y: 1, w: 2, h: 2 };

    const panelMap = new Map<string, PanelCoordinate>([
      [
        "panel-1",
        {
          id: "panel-1",
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        },
      ],
    ]);

    expect(hasCollision(candidate, "panel-2", panelMap)).toBe(true);
  });

  it("should return false when candidate does not collide", () => {
    const candidate = { x: 3, y: 3, w: 2, h: 2 };

    const panelMap = new Map<string, PanelCoordinate>([
      [
        "panel-1",
        {
          id: "panel-1",
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        },
      ],
    ]);

    expect(hasCollision(candidate, "panel-2", panelMap)).toBe(false);
  });

  it("should exclude panel with excludeId from collision check", () => {
    const candidate = { x: 0, y: 0, w: 2, h: 2 };

    const panelMap = new Map<string, PanelCoordinate>([
      [
        "panel-1",
        {
          id: "panel-1",
          x: 0,
          y: 0,
          w: 2,
          h: 2,
        },
      ],
    ]);

    expect(hasCollision(candidate, "panel-1", panelMap)).toBe(false);
  });
});

describe("findNewPosition", () => {
  it("should push panel horizontally to the right", () => {
    const pusher: PanelCoordinate = {
      id: "pusher",
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    };

    const pushed: PanelCoordinate = {
      id: "pushed",
      x: 1,
      y: 0,
      w: 2,
      h: 2,
    };

    const newPos = findNewPosition(pushed, pusher, 6);
    // pusher occupies x:0-1, so pushed should be pushed to x:2
    // pushRight = pusher.x + pusher.w - pushed.x = 0 + 2 - 1 = 1
    // newX = pushed.x + pushRight = 1 + 1 = 2
    expect(newPos).toEqual({ x: 2, y: 0 });
  });

  it("should push panel vertically down when horizontal push exceeds grid", () => {
    const pusher: PanelCoordinate = {
      id: "pusher",
      x: 0,
      y: 0,
      w: 3,
      h: 2,
    };

    const pushed: PanelCoordinate = {
      id: "pushed",
      x: 2,
      y: 0,
      w: 3,
      h: 2,
    };

    const newPos = findNewPosition(pushed, pusher, 6);
    // pusher occupies x:0-2, pushed is at x:2-4
    // pushRight = 0 + 3 - 2 = 1, newX would be 3, but 3 + 3 = 6 which fits
    // So it should push horizontally
    expect(newPos).toEqual({ x: 3, y: 0 });
  });

  it("should push panel vertically when it cannot fit horizontally", () => {
    const pusher: PanelCoordinate = {
      id: "pusher",
      x: 0,
      y: 0,
      w: 4,
      h: 2,
    };

    const pushed: PanelCoordinate = {
      id: "pushed",
      x: 3,
      y: 0,
      w: 3,
      h: 2,
    };

    const newPos = findNewPosition(pushed, pusher, 6);
    // pusher occupies x:0-3, pushed is at x:3-5
    // pushRight = 0 + 4 - 3 = 1, newX would be 4, but 4 + 3 = 7 > 6
    // Cannot fit horizontally, should push down
    // pushDown = pusher.y + pusher.h - pushed.y = 0 + 2 - 0 = 2
    expect(newPos).toEqual({ x: 3, y: 2 });
  });
});

describe("rearrangePanels", () => {
  it("should not move panels when there is no collision", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      movingPanel,
      {
        id: "panel-2",
        x: 2,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "panel-2",
        x: 2,
        y: 0,
        w: 2,
        h: 2,
      },
    ]);
  });

  it("should move colliding panel horizontally", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 2,
        y: 2,
        w: 2,
        h: 2,
      },
      {
        id: "panel-2",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "panel-2",
        x: 2,
        y: 0,
        w: 2,
        h: 2,
      },
    ]);
  });

  it("should move colliding panel vertically when horizontal is not available", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: 0,
      w: 6,
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 0,
        y: 2,
        w: 6,
        h: 2,
      },
      {
        id: "panel-2",
        x: 0,
        y: 0,
        w: 6,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 6,
        h: 2,
      },
      {
        id: "panel-2",
        x: 0,
        y: 2,
        w: 6,
        h: 2,
      },
    ]);
    const [panel1, panel2] = result;
    expect(rectanglesOverlap(panel1!, panel2!)).toBe(false);
  });

  it("should handle chain collisions", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 4,
        y: 4,
        w: 2,
        h: 2,
      },
      {
        id: "panel-2",
        x: 1,
        y: 1,
        w: 2,
        h: 2,
      },
      {
        id: "panel-3",
        x: 3,
        y: 2,
        w: 2,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "panel-2",
        x: 2,
        y: 1,
        w: 2,
        h: 2,
      },
      {
        id: "panel-3",
        x: 4,
        y: 2,
        w: 2,
        h: 2,
      },
    ]);
    const [panel1, panel2, panel3] = result;

    // No panels should overlap
    expect(rectanglesOverlap(panel1!, panel2!)).toBe(false);
    expect(rectanglesOverlap(panel1!, panel3!)).toBe(false);
    expect(rectanglesOverlap(panel2!, panel3!)).toBe(false);
  });

  it("should complexly rearrange multiple panels", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-3",
      x: 1,
      y: 0,
      w: 2,
      h: 1,
    };

    const allPanels: PanelCoordinate[] = [
      { id: "panel-1", x: 0, y: 0, w: 2, h: 2 },
      { id: "panel-2", x: 2, y: 0, w: 2, h: 2 },
      { id: "panel-3", x: 4, y: 0, w: 2, h: 1 },
      { id: "panel-4", x: 0, y: 2, w: 1, h: 1 },
      { id: "panel-5", x: 1, y: 2, w: 1, h: 1 },
      { id: "panel-6", x: 2, y: 2, w: 2, h: 1 },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(6);
    expect(result).toEqual([
      { id: "panel-1", x: 3, y: 0, w: 2, h: 2 },
      { id: "panel-2", x: 2, y: 2, w: 2, h: 2 },
      { id: "panel-3", x: 1, y: 0, w: 2, h: 1 },
      { id: "panel-4", x: 0, y: 2, w: 1, h: 1 },
      { id: "panel-5", x: 1, y: 2, w: 1, h: 1 },
      { id: "panel-6", x: 4, y: 2, w: 2, h: 1 },
    ]);
  });

  it("should handle resize collisions", () => {
    const resizedPanel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: 0,
      w: 4, // Resized from w: 2 to w: 4
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "panel-2",
        x: 2,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const result = rearrangePanels(resizedPanel, allPanels, 6);

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 4,
        h: 2,
      },
      {
        id: "panel-2",
        x: 4,
        y: 0,
        w: 2,
        h: 2,
      },
    ]);
    const [panel1, panel2] = result;

    expect(panel1).toEqual({ id: "panel-1", x: 0, y: 0, w: 4, h: 2 });

    // panel-2 should be moved to avoid collision
    expect(rectanglesOverlap(panel1!, panel2!)).toBe(false);
  });

  // Test cases for issue #23: prevent panel overflow beyond grid boundaries
  it("should constrain panel within grid boundaries when x + w exceeds columnCount", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: 5, // x + w = 5 + 2 = 7, which exceeds columnCount = 6
      y: 0,
      w: 2,
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 4,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(1);
    expect(result).toEqual([
      {
        id: "panel-1",
        x: 4,
        y: 0,
        w: 2,
        h: 2,
      },
    ]);
    const [panel] = result;

    // Panel should be constrained to x = 4 (so x + w = 4 + 2 = 6)
    expect(panel).toEqual({ id: "panel-1", x: 4, y: 0, w: 2, h: 2 });
    expect(panel!.x + panel!.w).toBeLessThanOrEqual(6);
  });

  it("should constrain panel to x = 0 when x is negative", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: -2, // Negative x
      y: 0,
      w: 2,
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 2,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(1);
    const panel = result.find((p) => p.id === "panel-1");

    // Panel should be constrained to x = 0
    expect(panel).toEqual({ id: "panel-1", x: 0, y: 0, w: 2, h: 2 });
    expect(panel!.x).toBeGreaterThanOrEqual(0);
  });

  it("should constrain panel to y = 0 when y is negative", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: 0,
      y: -3, // Negative y
      w: 2,
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(1);
    const panel = result.find((p) => p.id === "panel-1");

    // Panel should be constrained to y = 0
    expect(panel).toEqual({ id: "panel-1", x: 0, y: 0, w: 2, h: 2 });
    expect(panel!.y).toBeGreaterThanOrEqual(0);
  });

  it("should handle panel width equal to columnCount", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: 1, // x + w = 1 + 6 = 7, which exceeds columnCount = 6
      y: 0,
      w: 6, // Width equals columnCount
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 6,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(1);
    const [panel] = result;

    // Panel should be constrained to x = 0 (so x + w = 0 + 6 = 6)
    expect(panel).toEqual({ id: "panel-1", x: 0, y: 0, w: 6, h: 2 });
    expect(panel!.x + panel!.w).toBeLessThanOrEqual(6);
  });

  it("should constrain panel and handle collisions simultaneously", () => {
    const movingPanel: PanelCoordinate = {
      id: "panel-1",
      x: 5, // x + w = 5 + 2 = 7, which exceeds columnCount = 6
      y: 0,
      w: 2,
      h: 2,
    };

    const allPanels: PanelCoordinate[] = [
      {
        id: "panel-1",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "panel-2",
        x: 4,
        y: 0,
        w: 2,
        h: 2,
      },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 6);

    expect(result).toHaveLength(2);
    const panel1 = result.find((p) => p.id === "panel-1");
    const panel2 = result.find((p) => p.id === "panel-2");

    // panel-1 should be constrained to x = 4
    expect(panel1!.x + panel1!.w).toBeLessThanOrEqual(6);
    // No panels should overlap
    expect(rectanglesOverlap(panel1!, panel2!)).toBe(false);
  });

  it("should handle multiple panel collisions with column size is 12", () => {
    const movingPanel: PanelCoordinate = { id: "panel-7", x: 0, y: 0, w: 4, h: 1 };
    const allPanels: PanelCoordinate[] = [
      { id: "panel-1", x: 0, y: 0, w: 3, h: 2 },
      { id: "panel-2", x: 3, y: 0, w: 3, h: 2 },
      { id: "panel-3", x: 6, y: 0, w: 3, h: 2 },
      { id: "panel-4", x: 9, y: 0, w: 3, h: 2 },
      { id: "panel-5", x: 0, y: 2, w: 4, h: 1 },
      { id: "panel-6", x: 4, y: 2, w: 4, h: 1 },
      { id: "panel-7", x: 8, y: 2, w: 4, h: 1 },
    ];

    const result = rearrangePanels(movingPanel, allPanels, 12);

    expect(result).toHaveLength(7);
    expect(result).toEqual([
      { id: "panel-1", x: 4, y: 0, w: 3, h: 2 },
      { id: "panel-2", x: 7, y: 0, w: 3, h: 2 },
      { id: "panel-3", x: 6, y: 2, w: 3, h: 2 },
      { id: "panel-4", x: 9, y: 2, w: 3, h: 2 },
      { id: "panel-5", x: 0, y: 2, w: 4, h: 1 },
      { id: "panel-6", x: 4, y: 4, w: 4, h: 1 },
      { id: "panel-7", x: 0, y: 0, w: 4, h: 1 },
    ]);
  });

  it("should handle compound resize (both width and height)", () => {
    // Test resizing panel-1 from (0,0,3,2) to (0,0,4,3) - both dimensions change
    const resizingPanel: PanelCoordinate = { id: "panel-1", x: 0, y: 0, w: 4, h: 3 };
    const allPanels: PanelCoordinate[] = [
      { id: "panel-1", x: 0, y: 0, w: 3, h: 2 },
      { id: "panel-2", x: 3, y: 0, w: 3, h: 2 },
      { id: "panel-3", x: 6, y: 0, w: 3, h: 2 },
      { id: "panel-4", x: 9, y: 0, w: 3, h: 2 },
      { id: "panel-5", x: 0, y: 2, w: 4, h: 1 },
      { id: "panel-6", x: 4, y: 2, w: 4, h: 1 },
      { id: "panel-7", x: 8, y: 2, w: 4, h: 1 },
    ];

    const result = rearrangePanels(resizingPanel, allPanels, 12);

    expect(result).toHaveLength(7);
    expect(result).toEqual([
      { id: "panel-1", x: 0, y: 0, w: 4, h: 3 },
      { id: "panel-2", x: 4, y: 0, w: 3, h: 2 },
      { id: "panel-3", x: 7, y: 0, w: 3, h: 2 },
      { id: "panel-4", x: 9, y: 3, w: 3, h: 2 },
      { id: "panel-5", x: 4, y: 2, w: 4, h: 1 },
      { id: "panel-6", x: 8, y: 2, w: 4, h: 1 },
      { id: "panel-7", x: 8, y: 5, w: 4, h: 1 },
    ]);
  });
});
