import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applySnapAnimation,
  detectAnimatingPanels,
  gridPositionToPixels,
  gridToPixels,
  pixelsToGridPosition,
  pixelsToGridSize,
  rearrangePanels,
} from "./helpers";
import { findNewPositionToAddPanel } from "./helpers/rearrangement";
import type { PanelCoordinate, RearrangementFunction } from "./types";

interface PanelistOptions {
  panels: PanelCoordinate[];
  columnCount: number;
  baseSize: number;
  gap: number;
  rearrangement?: RearrangementFunction;
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

const ANIMATION_DURATION = 300;
type TimeoutId = ReturnType<typeof setTimeout>;

export function usePanelist({ panels, columnCount, baseSize, gap, rearrangement }: PanelistOptions) {
  const [state, setState] = useState<PanelistState>({
    panels,
  });
  const ghostPanelRef = useRef<HTMLDivElement | null>(null);
  const animationTimeoutsRef = useRef<Set<TimeoutId>>(new Set());

  const internalState = useRef<InternalPanelState>({
    panels,
    activePanelId: null,
    isDragging: false,
    isMoving: false,
    draggableElements: {},
    isResizing: false,
    animatingPanels: new Set(),
  }).current;

  // Cleanup animation timeouts on unmount
  useEffect(() => {
    return () => {
      animationTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      animationTimeoutsRef.current.clear();
    };
  }, []);

  // Ghost panel helper functions
  // Direct DOM manipulation is intentionally used here for performance.
  // This avoids React re-renders during high-frequency mousemove events.
  const showGhostPanel = useCallback((left: number, top: number, width: number, height: number) => {
    if (!ghostPanelRef.current) return;
    ghostPanelRef.current.style.display = "block";
    ghostPanelRef.current.style.left = `${left}px`;
    ghostPanelRef.current.style.top = `${top}px`;
    ghostPanelRef.current.style.width = `${width}px`;
    ghostPanelRef.current.style.height = `${height}px`;
    ghostPanelRef.current.style.outline = "1px dashed rgba(0, 0, 0, 0.2)";
  }, []);

  const updateGhostPanelPosition = useCallback((left: number, top: number) => {
    if (!ghostPanelRef.current) return;
    ghostPanelRef.current.style.left = `${left}px`;
    ghostPanelRef.current.style.top = `${top}px`;
  }, []);

  const updateGhostPanelSize = useCallback((width: number, height: number) => {
    if (!ghostPanelRef.current) return;
    ghostPanelRef.current.style.width = `${width}px`;
    ghostPanelRef.current.style.height = `${height}px`;
  }, []);

  const hideGhostPanel = useCallback(() => {
    if (!ghostPanelRef.current) return;
    ghostPanelRef.current.style.display = "none";
  }, []);

  // Callback to update panels and trigger animations
  const updatePanelsWithAnimation = useCallback(
    (updatedPanel: PanelCoordinate, currentPanels: PanelCoordinate[]) => {
      // Use custom rearrangement function if provided, otherwise use default
      const rearrange = rearrangement || rearrangePanels;
      const nextPanels = rearrange(updatedPanel, currentPanels, columnCount);

      // Detect which panels have been rearranged
      internalState.animatingPanels = detectAnimatingPanels({
        oldPanels: currentPanels,
        newPanels: nextPanels,
        excludePanelId: updatedPanel.id,
      });

      setState((current) => ({
        ...current,
        panels: nextPanels,
      }));

      // Clear animating panels after animation completes
      const timeoutId = setTimeout(() => {
        internalState.animatingPanels.clear();
        animationTimeoutsRef.current.delete(timeoutId);
      }, ANIMATION_DURATION);
      animationTimeoutsRef.current.add(timeoutId);
    },
    [columnCount, internalState, rearrangement]
  );

  // Create drag handler for a specific panel
  const createDragHandler = useCallback(
    (panel: PanelCoordinate) => (e: React.MouseEvent<HTMLDivElement>) => {
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

      showGhostPanel(offsetX, offsetY, draggingElement.offsetWidth, draggingElement.offsetHeight);

      const mouseUpListenerCtrl = new AbortController();
      const mouseMoveListenerCtrl = new AbortController();

      const onMouseMove = (e: MouseEvent) => {
        if (!internalState.isDragging) return;
        if (!draggingElement) return;

        const currentX = e.clientX;
        const currentY = e.clientY;
        const deltaX = currentX - initialX;
        const deltaY = currentY - initialY;

        draggingElement.style.left = offsetX + deltaX + "px";
        draggingElement.style.top = offsetY + deltaY + "px";

        // Update ghost panel position to snap to grid
        const droppedLeft = offsetX + deltaX;
        const droppedTop = offsetY + deltaY;
        const nextGridX = pixelsToGridPosition(droppedLeft, baseSize, gap);
        const nextGridY = pixelsToGridPosition(droppedTop, baseSize, gap);
        const nextLeft = gridPositionToPixels(nextGridX, baseSize, gap);
        const nextTop = gridPositionToPixels(nextGridY, baseSize, gap);

        updateGhostPanelPosition(nextLeft, nextTop);

        e.preventDefault(); // Prevent text selection during drag
      };

      const onMouseUp = () => {
        if (!draggingElement) return;

        internalState.isDragging = false;
        draggingElement.classList.remove("panelist-dragging");

        hideGhostPanel();

        const droppedLeft = parseFloat(draggingElement.style.left) || 0;
        const droppedTop = parseFloat(draggingElement.style.top) || 0;

        const nextGridX = pixelsToGridPosition(droppedLeft, baseSize, gap);
        const nextGridY = pixelsToGridPosition(droppedTop, baseSize, gap);

        const nextLeft = gridPositionToPixels(nextGridX, baseSize, gap);
        const nextTop = gridPositionToPixels(nextGridY, baseSize, gap);

        // Apply snap-back animation
        applySnapAnimation({
          element: draggingElement,
          droppedLeft,
          droppedTop,
          nextLeft,
          nextTop,
          originalTransition,
        });

        updatePanelsWithAnimation({ ...panel, x: nextGridX, y: nextGridY }, state.panels);

        internalState.activePanelId = null;

        mouseMoveListenerCtrl.abort();
        mouseUpListenerCtrl.abort();
      };

      document.addEventListener("mousemove", onMouseMove, {
        signal: mouseMoveListenerCtrl.signal,
      });
      document.addEventListener("mouseup", onMouseUp, {
        signal: mouseUpListenerCtrl.signal,
      });
    },
    [
      baseSize,
      gap,
      internalState,
      state.panels,
      updatePanelsWithAnimation,
      showGhostPanel,
      updateGhostPanelPosition,
      hideGhostPanel,
    ]
  );

  // Create resize handler for a specific panel
  const createResizeHandler = useCallback(
    (panel: PanelCoordinate) => (e: React.MouseEvent<HTMLSpanElement>) => {
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

      draggingElement.style.cursor = "nwse-resize";
      draggingElement.style.transition = "";

      showGhostPanel(draggingElement.offsetLeft, draggingElement.offsetTop, initialWidth, initialHeight);

      const mouseMoveController = new AbortController();
      const mouseUpController = new AbortController();

      const onMouseMove = (e: MouseEvent) => {
        if (!internalState.isResizing) return;
        if (!draggingElement) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        draggingElement.style.width = `${initialWidth + deltaX}px`;
        draggingElement.style.height = `${initialHeight + deltaY}px`;
        draggingElement.style.zIndex = "calc(infinity)";

        // Update ghost panel size to snap to grid
        const newWidth = initialWidth + deltaX;
        const newHeight = initialHeight + deltaY;
        const nextGridW = pixelsToGridSize(newWidth, baseSize, gap);
        const nextGridH = pixelsToGridSize(newHeight, baseSize, gap);
        const snappedWidth = gridToPixels(nextGridW, baseSize, gap);
        const snappedHeight = gridToPixels(nextGridH, baseSize, gap);

        updateGhostPanelSize(snappedWidth, snappedHeight);
      };

      const onMouseUp = () => {
        if (!draggingElement) return;

        hideGhostPanel();

        const rect = draggingElement.getBoundingClientRect();
        const nextGridW = pixelsToGridSize(rect.width, baseSize, gap);
        const nextGridH = pixelsToGridSize(rect.height, baseSize, gap);

        const width = gridToPixels(nextGridW, baseSize, gap);
        const height = gridToPixels(nextGridH, baseSize, gap);

        draggingElement.style.width = `${rect.width}px`;
        draggingElement.style.height = `${rect.height}px`;
        draggingElement.style.cursor = "default";
        draggingElement.style.transition = "";

        window.requestAnimationFrame(() => {
          draggingElement.style.width = `${width}px`;
          draggingElement.style.height = `${height}px`;
          draggingElement.style.zIndex = initialZIndex;
          draggingElement.style.transition = "width 0.1s ease-out, height 0.1s ease-out";
        });

        updatePanelsWithAnimation({ ...panel, w: nextGridW, h: nextGridH }, state.panels);

        internalState.isResizing = false;
        internalState.activePanelId = null;

        mouseMoveController.abort();
        mouseUpController.abort();
      };

      document.addEventListener("mousemove", onMouseMove, { signal: mouseMoveController.signal });
      document.addEventListener("mouseup", onMouseUp, { signal: mouseUpController.signal });
    },
    [
      baseSize,
      gap,
      internalState,
      state.panels,
      updatePanelsWithAnimation,
      showGhostPanel,
      updateGhostPanelSize,
      hideGhostPanel,
    ]
  );

  // Create ref callback for panel elements
  const createRefCallback = useCallback(
    (panelId: number | string) => (element: HTMLElement | null) => {
      if (!element) return;
      if (!internalState.draggableElements[panelId]) {
        internalState.draggableElements[panelId] = element;
      }
    },
    [internalState]
  );

  // Memoize panel props to avoid recreating on every render
  const panelsWithProps = useMemo(() => {
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
          ref: createRefCallback(panel.id),
          onMouseDown: createDragHandler(panel),
        },
        resizeHandleProps: {
          onMouseDown: createResizeHandler(panel),
        },
      };
    });
  }, [
    state.panels,
    baseSize,
    gap,
    internalState.animatingPanels,
    internalState.activePanelId,
    createRefCallback,
    createDragHandler,
    createResizeHandler,
  ]);

  const addPanel = useCallback(
    (panel: Partial<PanelCoordinate>) => {
      setState((current) => {
        const newPosition = findNewPositionToAddPanel(panel, current.panels, columnCount);
        const newPanel: PanelCoordinate = {
          id: panel.id || Math.random().toString(36).substring(2, 15),
          x: newPosition.x,
          y: newPosition.y,
          w: panel.w || 1,
          h: panel.h || 1,
        };
        return {
          ...current,
          panels: [...current.panels, newPanel],
        };
      });
    },
    [columnCount]
  );

  const removePanel = useCallback((id: number | string) => {
    setState((current) => ({
      ...current,
      panels: current.panels.filter((panel) => panel.id !== id),
    }));
  }, []);

  const exportState = useCallback(() => {
    return state.panels;
  }, [state.panels]);

  return {
    panels: panelsWithProps,
    ghostPanelRef,
    addPanel,
    removePanel,
    exportState,
  };
}
