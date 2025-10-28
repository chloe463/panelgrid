import { useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

import { usePanelState, usePanelContrls } from "./PanelistProvider";
import type { PanelId } from "./PanelistProvider";
import { Panel } from "./Panel";

interface PanelRendererProps {
  itemRenderer: (id: PanelId) => ReactNode;
}

export function PanelRenderer(props: PanelRendererProps) {
  const { itemRenderer } = props;
  const { panels, columnCount, gap } = usePanelState();
  const { setBaseSize } = usePanelContrls();

  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const baseSize = Math.floor(
      (rect.width - gap * (columnCount - 1)) / columnCount
    );
    setBaseSize(baseSize);
  }, [columnCount, gap, setBaseSize]);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      const rect = entry.contentRect;
      const baseSize = Math.floor(
        (rect.width - gap * (columnCount - 1)) / columnCount
      );
      setBaseSize(baseSize);
    });
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [columnCount, gap, setBaseSize]);

  const count = columnCount * columnCount;
  return (
    <div
      className="panelist-renderer"
      style={{
        "--column-count": `${columnCount || 6}`,
        "--gap": `${gap || 8}px`,
      }}
      ref={ref}
    >
      {Array.from({ length: count }).map((_, i) => {
        return <div key={i} className="panel-placeholder" />;
      })}
      {panels.map((panel) => (
        <Panel
          key={panel.id}
          panelId={panel.id}
          x={panel.x}
          y={panel.y}
          w={panel.w}
          h={panel.h}
        >
          {itemRenderer(panel.id)}
        </Panel>
      ))}
    </div>
  );
}
