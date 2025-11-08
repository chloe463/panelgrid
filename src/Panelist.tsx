import { useEffect, useRef, useState } from "react";
import { usePanelist, type PanelCoordinate } from "./usePanelist";
import type { PanelId } from "./PanelistProvider";

interface PanelistProps {
  panels: PanelCoordinate[];
  columnCount: number;
  gap: number;
  itemRenderer: (id: PanelId) => React.ReactNode;
}

export function Panelist({ panels: panelOptions, columnCount = 6, gap = 8, itemRenderer }: PanelistProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [baseSize, setBaseSize] = useState(80);
  const panels = usePanelist({ panels: panelOptions, baseSize, gap, columnCount });
  const count = columnCount * columnCount;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      const rect = entry.contentRect;
      const baseSize = Math.floor((rect.width - gap * (columnCount - 1)) / columnCount);
      setBaseSize(baseSize);
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [columnCount, gap]);

  return (
    <div
      className="panelist-renderer"
      style={{
        "--column-count": `${columnCount}`,
        "--gap": `${gap}px`,
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
            {itemRenderer(key)}
            <span className="resize-handle" {...resizeHandleProps}></span>
          </div>
        );
      })}
    </div>
  );
}
