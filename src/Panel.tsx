import React, { useRef } from "react";

import { useDnd } from "./useDnd";
import { useResize } from "./useResize";

import "./styles.css";
import { usePanel } from "./usePanel";
import type { PanelId } from "./PanelistProvider";

type PanelBaseProps = Parameters<typeof usePanel>[0];

interface Props extends PanelBaseProps {
  panelId: PanelId;
  children: React.ReactNode;
}

export function Panel(props: Props) {
  const { x, y, w, h } = props;
  const style = usePanel({ x, y, w, h });

  const ref = useRef<HTMLDivElement | null>(null);
  useResize<HTMLDivElement>({ panelId: props.panelId, el: ref });
  useDnd({ panelId: props.panelId, el: ref });

  return (
    <div className="panel" ref={ref} style={style}>
      {props.children}
      <span className="resize-handle"></span>
    </div>
  );
}
