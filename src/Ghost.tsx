import { type CSSProperties, useMemo } from "react";

import { usePanelState } from "./PanelistProvider";

export function Ghost() {
  const { ghostPanel, baseSize, gap } = usePanelState();
  const style: CSSProperties = useMemo(() => {
    if (!ghostPanel) return {};
    return {
      left: ghostPanel.x * (baseSize + gap),
      top: ghostPanel.y * (baseSize + gap),
      width: ghostPanel.w * baseSize + (ghostPanel.w - 1) * gap,
      height: ghostPanel.h * baseSize + (ghostPanel.h - 1) * gap,
    };
  }, [ghostPanel, baseSize, gap]);

  if (!ghostPanel) return null;
  return <div className="panel-ghost" style={style}></div>;
}
