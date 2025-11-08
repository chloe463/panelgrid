import { useState, useRef } from "react";
import { gridPositionToPixels, pixelsToGridSize } from "./helpers";
import { gridToPixels, pixelsToGridPosition } from "./helpers";
import { rearrangePanels } from "./helpers/rearrangement";

export interface PanelCoordinate {
  id: number | string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PanelistOptions {
  panels: PanelCoordinate[];
  columnCount: number;
  baseSize: number;
  gap: number;
}

interface PanelistState {
  panels: PanelCoordinate[];
}

interface InternalPanelState {
  panels: PanelCoordinate[];
  activePanelId: number | string | null;
  isDragging: boolean;
  draggingElement: Record<number | string, HTMLElement | null>;
  isResizing: boolean;
  isMoving: boolean;
}

export function usePanelist({ panels, columnCount, baseSize, gap }: PanelistOptions) {
  const [state, setState] = useState<PanelistState>({
    panels,
  });

  const internalState = useRef<InternalPanelState>({
    panels,
    activePanelId: null,
    isDragging: false,
    isMoving: false,
    draggingElement: {},
    isResizing: false,
  }).current;

  return state.panels.map((panel) => {
    return {
      panelProps: {
        key: panel.id,
        x: panel.x,
        y: panel.y,
        w: panel.w,
        h: panel.h,
        style: {
          top: gridPositionToPixels(panel.y, baseSize, gap),
          left: gridPositionToPixels(panel.x, baseSize, gap),
          width: gridToPixels(panel.w, baseSize, gap),
          height: gridToPixels(panel.h, baseSize, gap),
        },
        ref: (element: HTMLElement | null) => {
          if (!element) return;

          if (!internalState.draggingElement[panel.id]) {
            internalState.draggingElement[panel.id] = element;
            return;
          }

          element.addEventListener("transitionend", () => {
            if (!element) return;
            element.style.transition = "";
          });
        },
        onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
          internalState.activePanelId = panel.id;
          const draggingElement = internalState.draggingElement[panel.id];
          if (!draggingElement) return;

          internalState.isDragging = true;
          const initialX = e.clientX;
          const initialY = e.clientY;
          const offsetX = draggingElement.offsetLeft;
          const offsetY = draggingElement.offsetTop;
          const shadow = draggingElement.style.boxShadow;
          const zIndex = draggingElement.style.zIndex;

          draggingElement.style.cursor = "grabbing";
          draggingElement.style.position = "absolute";
          draggingElement.style.boxShadow = "0px 11px 30px 0px #0000001F";
          draggingElement.style.zIndex = "calc(infinity)";

          const mouseUpListenerCtrl = new AbortController();
          const mouseMoveListenerCtrl = new AbortController();

          document.addEventListener("mousemove", onMouseMove, {
            signal: mouseMoveListenerCtrl.signal,
          });
          document.addEventListener("mouseup", onMouseUp, {
            signal: mouseUpListenerCtrl.signal,
          });

          function onMouseMove(e: MouseEvent) {
            if (!internalState.isDragging) return;
            if (!draggingElement) return;
            const currentX = e.clientX;
            const currentY = e.clientY;

            const deltaX = currentX - initialX;
            const deltaY = currentY - initialY;

            draggingElement.style.left = offsetX + deltaX + "px";
            draggingElement.style.top = offsetY + deltaY + "px";

            // const nextX = pixelsToGridPosition(offsetX + deltaX, baseSize, gap);
            // const nextY = pixelsToGridPosition(offsetY + deltaY, baseSize, gap);

            e.preventDefault(); // Prevent text selection during drag
            // throttledMovingPanel(id, nextX, nextY);
          }

          function onMouseUp() {
            if (!draggingElement) return;
            internalState.isDragging = false;
            draggingElement.style.cursor = "default";

            const droppedLeft = Number(draggingElement.style.left.replace("px", ""));
            const droppedTop = Number(draggingElement.style.top.replace("px", ""));

            const nextGridX = pixelsToGridPosition(droppedLeft, baseSize, gap);
            const nextGridY = pixelsToGridPosition(droppedTop, baseSize, gap);

            const nextLeft = gridPositionToPixels(nextGridX, baseSize, gap);
            const nextTop = gridPositionToPixels(nextGridY, baseSize, gap);

            // Animation
            const deltaX = droppedLeft - nextLeft;
            const deltaY = droppedTop - nextTop;

            draggingElement.style.transform = `translate3D(${deltaX}px, ${deltaY}px, 0)`;
            draggingElement.style.transition = "";

            window.requestAnimationFrame(() => {
              draggingElement.style.transform = "translate3D(0, 0, 0)";
              draggingElement.style.transition = "transform 0.1s ease-out";
            });

            draggingElement.style.left = `${nextLeft}px`;
            draggingElement.style.top = `${nextTop}px`;
            draggingElement.style.boxShadow = shadow;
            draggingElement.style.zIndex = zIndex;

            const nextPanels = rearrangePanels({ ...panel, x: nextGridX, y: nextGridY }, state.panels, columnCount);
            setState((current) => {
              return {
                ...current,
                panels: nextPanels,
              };
            });
            internalState.activePanelId = null;

            mouseMoveListenerCtrl.abort();
            mouseUpListenerCtrl.abort();
          }
        },
      },
      resizeHandleProps: {
        onMouseDown: (e: React.MouseEvent<HTMLSpanElement>) => {
          e.stopPropagation();
          internalState.isResizing = true;
          internalState.activePanelId = panel.id;
          const draggingElement = internalState.draggingElement[panel.id];
          if (!draggingElement) return;

          const startX = e.clientX;
          const startY = e.clientY;
          const initialWidth = draggingElement.offsetWidth;
          const initialHeight = draggingElement.offsetHeight;
          const initialZIndex = draggingElement.style.zIndex;

          const mouseMoveController = new AbortController();
          const mouseUpController = new AbortController();

          document.addEventListener("mousemove", onMouseMove, { signal: mouseMoveController.signal });
          document.addEventListener("mouseup", onMouseUp, { signal: mouseUpController.signal });

          function onMouseMove(e: MouseEvent) {
            if (!internalState.isResizing) return;
            if (!draggingElement) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            draggingElement.style.width = `${initialWidth + deltaX}px`;
            draggingElement.style.height = `${initialHeight + deltaY}px`;
            draggingElement.style.zIndex = "calc(infinity)";

            // const nextW = pixelsToGridSize(initialWidth + deltaX, baseSize, gap);
            // const nextH = pixelsToGridSize(initialHeight + deltaY, baseSize, gap);
          }

          function onMouseUp() {
            if (draggingElement) {
              const rect = draggingElement?.getBoundingClientRect();
              const nextGridW = pixelsToGridSize(rect.width, baseSize, gap);
              const nextGridH = pixelsToGridSize(rect.height, baseSize, gap);

              const width = gridToPixels(nextGridW, baseSize, gap);
              const height = gridToPixels(nextGridH, baseSize, gap);

              draggingElement.style.width = `${width}px`;
              draggingElement.style.height = `${height}px`;
              draggingElement.style.zIndex = initialZIndex;

              window.requestAnimationFrame(() => {
                draggingElement.style.width = `${rect.width}px`;
                draggingElement.style.height = `${rect.height}px`;
                draggingElement.style.transition = "";
                window.requestAnimationFrame(() => {
                  draggingElement.style.width = `${width}px`;
                  draggingElement.style.height = `${height}px`;
                  draggingElement.style.transition = "width 0.1s ease-out, height 0.1s ease-out";
                });
              });
              const nextPanels = rearrangePanels({ ...panel, w: nextGridW, h: nextGridH }, state.panels, columnCount);
              setState((current) => {
                return {
                  ...current,
                  panels: nextPanels,
                };
              });
              internalState.isResizing = false;
              internalState.activePanelId = null;
            }

            mouseMoveController.abort();
            mouseUpController.abort();
          }
        },
      },
    };
  });
}
