import { useMemo } from "react";
import type { PanelId } from "./PanelistProvider";
import { useResize } from "./useResize";
import { useDnd } from "./useDnd";
import { gridToPixels, gridPositionToPixels } from "./helpers/gridCalculations";
import { useGridConfig } from "./contexts/GridConfigContext";

interface UsePanelOptions {
  panelId: PanelId;
  x: number;
  y: number;
  w: number;
  h: number;
  ref: React.RefObject<HTMLDivElement | null>;
}

export function usePanel(options: UsePanelOptions) {
  const { panelId, x, y, w, h, ref } = options;
  const { baseSize, gap } = useGridConfig();

  useResize<HTMLDivElement>({ panelId, ref: ref });
  useDnd({ panelId, ref: ref });

  const style = useMemo(() => {
    const width = gridToPixels(w, baseSize, gap);
    const height = gridToPixels(h, baseSize, gap);

    const left = gridPositionToPixels(x, baseSize, gap);
    const top = gridPositionToPixels(y, baseSize, gap);

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [x, y, w, h, baseSize, gap]);

  return { style, ref };
}
