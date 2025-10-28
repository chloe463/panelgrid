import { useMemo } from "react";
import { usePanelState } from "./PanelistProvider";

interface UsePanelOptions {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function usePanel(options: UsePanelOptions) {
  const { x, y, w, h } = options;
  const { baseSize, gap } = usePanelState();

  return useMemo(() => {
    const width = baseSize * w + gap * Math.max(0, w - 1);
    const height = baseSize * h + gap * Math.max(0, h - 1);

    const left = x * (baseSize + gap);
    const top = y * (baseSize + gap);

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [x, y, w, h, baseSize, gap]);
}
