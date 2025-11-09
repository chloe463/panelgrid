import { useLayoutEffect, useRef } from "react";
import type { PanelId } from "./types";
import { usePanelistState, usePanelistControls } from "./PanelistProvider";

interface PanelistRendererProps {
  itemRenderer: React.ComponentType<{ id: PanelId }>;
}

export function PanelistRenderer({ itemRenderer: ItemRenderer }: PanelistRendererProps) {
  const { panels, columnCount, gap, baseSize } = usePanelistState();
  const { setBaseSize } = usePanelistControls();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const count = columnCount * columnCount;

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      const rect = entry.contentRect;
      const baseSize = Math.floor((rect.width - gap * (columnCount - 1)) / columnCount);
      setBaseSize(baseSize);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [columnCount, gap, setBaseSize]);

  return (
    <div
      className="panelist-renderer"
      style={{
        "--column-count": `${columnCount}`,
        "--gap": `${gap}px`,
        opacity: baseSize ? 1 : 0,
      }}
      ref={containerRef}
    >
      {Array.from({ length: count }).map((_, i) => {
        return <div key={i} className="panel-placeholder" />;
      })}

      {panels.map((panel) => {
        const { panelProps: _panelProps, resizeHandleProps } = panel;
        const { key, ...panelProps } = _panelProps;
        return (
          <div key={key} className="panel" {...panelProps}>
            <ItemRenderer id={key} />
            <span className="resize-handle" {...resizeHandleProps}></span>
          </div>
        );
      })}
    </div>
  );
}
