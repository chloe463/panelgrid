import { type CSSProperties, useMemo } from "react";

import { useDragState } from "./contexts/DragStateContext";
import { useGridConfig } from "./contexts/GridConfigContext";
import { gridToPixels, gridPositionToPixels } from "./helpers/gridCalculations";

export function Ghost() {
  const { ghostPanel } = useDragState();
  const { baseSize, gap } = useGridConfig();
  const style: CSSProperties = useMemo(() => {
    if (!ghostPanel) return {};
    return {
      left: gridPositionToPixels(ghostPanel.x, baseSize, gap),
      top: gridPositionToPixels(ghostPanel.y, baseSize, gap),
      width: gridToPixels(ghostPanel.w, baseSize, gap),
      height: gridToPixels(ghostPanel.h, baseSize, gap),
    };
  }, [ghostPanel, baseSize, gap]);

  if (!ghostPanel) return null;
  return <div className="panel-ghost" style={style}></div>;
}
