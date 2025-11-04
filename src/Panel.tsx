import React, { useRef } from "react";

import "./styles.css";
import { usePanel } from "./usePanel";
import { type PanelId } from "./PanelistProvider";

type PanelBaseProps = Omit<Parameters<typeof usePanel>[0], "ref">;

interface Props extends PanelBaseProps {
  panelId: PanelId;
  isActive: boolean;
  children: React.ReactNode;
}

function PanelComponent(props: Props) {
  const { panelId, x, y, w, h, baseSize, gap, isActive } = props;

  const ref = useRef<HTMLDivElement | null>(null);
  const { style } = usePanel({ panelId, x, y, w, h, baseSize, gap, ref });

  return (
    <div className={`panel ${isActive ? "" : "panel--with-transition"}`} ref={ref} style={style}>
      {props.children}
      <span className="resize-handle"></span>
    </div>
  );
}

// Memoize Panel component to prevent unnecessary re-renders
// Only re-render when panel's own coordinates or size changes
export const Panel = React.memo(PanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.panelId === nextProps.panelId &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.w === nextProps.w &&
    prevProps.h === nextProps.h &&
    prevProps.baseSize === nextProps.baseSize &&
    prevProps.gap === nextProps.gap
  );
});
