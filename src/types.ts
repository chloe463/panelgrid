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
