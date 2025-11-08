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
  draggableElements: Record<number | string, HTMLElement | null>;
  isResizing: boolean;
  isMoving: boolean;
  animatingPanels: Set<number | string>;
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
    draggableElements: {},
    isResizing: false,
    animatingPanels: new Set(),
  }).current;

  return state.panels.map((panel) => {
    const isAnimating = internalState.animatingPanels.has(panel.id);
    const isActive = internalState.activePanelId === panel.id;

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
          transition:
            isAnimating && !isActive
              ? "top 0.3s ease-out, left 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out"
              : undefined,
        },
        ref: (element: HTMLElement | null) => {
          if (!element) return;

          if (!internalState.draggableElements[panel.id]) {
            internalState.draggableElements[panel.id] = element;
            return;
          }
        },
        onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
          internalState.activePanelId = panel.id;
          const draggingElement = internalState.draggableElements[panel.id];
          if (!draggingElement) return;

          internalState.isDragging = true;
          const initialX = e.clientX;
          const initialY = e.clientY;
          const offsetX = draggingElement.offsetLeft;
          const offsetY = draggingElement.offsetTop;
          const originalTransition = draggingElement.style.transition;

          draggingElement.classList.add("panelist-dragging");
          draggingElement.style.transition = "";

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
            draggingElement.classList.remove("panelist-dragging");

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
            draggingElement.style.transition = originalTransition;

            const nextPanels = rearrangePanels({ ...panel, x: nextGridX, y: nextGridY }, state.panels, columnCount);

            // Detect which panels have been rearranged (excluding the active panel)
            internalState.animatingPanels.clear();
            state.panels.forEach((oldPanel) => {
              const newPanel = nextPanels.find((p) => p.id === oldPanel.id);
              if (newPanel && oldPanel.id !== panel.id) {
                const hasChanged =
                  oldPanel.x !== newPanel.x ||
                  oldPanel.y !== newPanel.y ||
                  oldPanel.w !== newPanel.w ||
                  oldPanel.h !== newPanel.h;
                if (hasChanged) {
                  internalState.animatingPanels.add(oldPanel.id);
                }
              }
            });

            setState((current) => {
              return {
                ...current,
                panels: nextPanels,
              };
            });

            // Clear animating panels after animation completes
            setTimeout(() => {
              internalState.animatingPanels.clear();
            }, 300);

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
          const draggingElement = internalState.draggableElements[panel.id];
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

              draggingElement.style.width = `${rect.width}px`;
              draggingElement.style.height = `${rect.height}px`;
              draggingElement.style.transition = "";

              window.requestAnimationFrame(() => {
                draggingElement.style.width = `${width}px`;
                draggingElement.style.height = `${height}px`;
                draggingElement.style.zIndex = initialZIndex;
                draggingElement.style.transition = "width 0.1s ease-out, height 0.1s ease-out";
              });
              const nextPanels = rearrangePanels({ ...panel, w: nextGridW, h: nextGridH }, state.panels, columnCount);

              // Detect which panels have been rearranged (excluding the active panel)
              internalState.animatingPanels.clear();
              state.panels.forEach((oldPanel) => {
                const newPanel = nextPanels.find((p) => p.id === oldPanel.id);
                if (newPanel && oldPanel.id !== panel.id) {
                  const hasChanged =
                    oldPanel.x !== newPanel.x ||
                    oldPanel.y !== newPanel.y ||
                    oldPanel.w !== newPanel.w ||
                    oldPanel.h !== newPanel.h;
                  if (hasChanged) {
                    internalState.animatingPanels.add(oldPanel.id);
                  }
                }
              });

              setState((current) => {
                return {
                  ...current,
                  panels: nextPanels,
                };
              });

              // Clear animating panels after animation completes
              setTimeout(() => {
                internalState.animatingPanels.clear();
              }, 300);

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
