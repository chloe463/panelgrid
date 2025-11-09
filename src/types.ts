import "react";

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

export type PanelId = number | string;

export interface PanelCoordinate {
  id: PanelId;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Custom rearrangement function type
 * Takes a moved/resized panel, all panels, and column count
 * Returns the new panel arrangement after resolving collisions
 */
export type RearrangementFunction = (
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
) => PanelCoordinate[];
