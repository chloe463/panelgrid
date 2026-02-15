"use client";
import type { ComponentType } from "react";
import { useLayoutEffect, useRef } from "react";
import { getGridRowCount } from "./helpers/gridCalculations";
import { usePanelGridControls, usePanelGridState } from "./PanelGridProvider";
import type { PanelId } from "./types";

interface PanelGridRendererProps {
  children: ComponentType<{ id: PanelId }>;
}

export function PanelGridRenderer({ children: ItemComponent }: PanelGridRendererProps) {
  const { panels, columnCount, gap, baseSize, resizeHandlePositions, ghostPanelRef } = usePanelGridState();
  const { setBaseSize } = usePanelGridControls();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowCount = getGridRowCount(
    panels.map(({ panelProps: p }) => ({
      id: p.key,
      x: p.positionData.x,
      y: p.positionData.y,
      w: p.positionData.w,
      h: p.positionData.h,
    }))
  );
  const count = Math.max(columnCount * (rowCount + 1), columnCount * columnCount);

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
      className="panelgrid-renderer"
      style={{
        "--column-count": `${columnCount}`,
        "--gap": `${gap}px`,
        opacity: baseSize ? 1 : 0,
      }}
      ref={containerRef}
    >
      {Array.from({ length: count }).map((_, i) => {
        // biome-ignore lint/suspicious/noArrayIndexKey: The order of placeholders will not be changed.
        return <div key={i} className="panelgrid-panel-placeholder" />;
      })}

      <div className="panelgrid-panel-ghost" ref={ghostPanelRef}></div>

      {panels.map((panel) => {
        const { panelProps, resizeHandleProps } = panel;
        const { key, lockSize, lockPosition, style, positionData, ref, onMouseDown } = panelProps;

        const className = [
          "panelgrid-panel",
          lockSize ? "panelgrid-panel--size-locked" : "",
          lockPosition ? "panelgrid-panel--position-locked" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const { x, y, w, h } = positionData;

        return (
          <div
            key={key}
            className={className}
            style={style}
            ref={ref}
            onMouseDown={onMouseDown}
            data-panel-id={key}
            data-pg-x={x}
            data-pg-y={y}
            data-pg-w={w}
            data-pg-h={h}
          >
            <ItemComponent id={key} />
            {resizeHandleProps &&
              resizeHandlePositions.map((pos) => {
                return (
                  <span
                    key={pos}
                    className={`panelgrid-resize-handle panelgrid-resize-handle--${pos}`}
                    {...resizeHandleProps}
                    data-pg-resize-handle={pos}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
