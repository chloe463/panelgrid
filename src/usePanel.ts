import { useMemo } from "react";
import { usePanelState, type PanelId } from "./PanelistProvider";
import { useResize } from "./useResize";
import { useDnd } from "./useDnd";

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
  const { baseSize, gap } = usePanelState();

  useResize<HTMLDivElement>({ panelId, el: ref });
  useDnd({ panelId, el: ref });

  const style = useMemo(() => {
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

  return { style, ref };
}
