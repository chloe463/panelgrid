import type { PanelCoordinate } from "../types";

/**
 * Options for detecting animating panels
 */
interface DetectAnimatingPanelsOptions {
  oldPanels: PanelCoordinate[];
  newPanels: PanelCoordinate[];
  excludePanelId: number | string;
}

/**
 * Detects which panels have changed position/size and marks them for animation
 * Returns a Set of panel IDs that should be animated
 */
export function detectAnimatingPanels(options: DetectAnimatingPanelsOptions): Set<number | string> {
  const { oldPanels, newPanels, excludePanelId } = options;
  const animatingPanels = new Set<number | string>();

  oldPanels.forEach((oldPanel) => {
    const newPanel = newPanels.find((p) => p.id === oldPanel.id);
    if (newPanel && oldPanel.id !== excludePanelId) {
      const hasChanged =
        oldPanel.x !== newPanel.x ||
        oldPanel.y !== newPanel.y ||
        oldPanel.w !== newPanel.w ||
        oldPanel.h !== newPanel.h;
      if (hasChanged) {
        animatingPanels.add(oldPanel.id);
      }
    }
  });

  return animatingPanels;
}
