import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
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
import type { PanelCoordinate, PanelId, RearrangementFunction, ResizeHandlePosition } from "./types";

interface PanelGridOptions {
  panels: PanelCoordinate[];
  columnCount: number;
  baseSize: number;
  gap: number;
  resizeHandlePositions: ResizeHandlePosition[];
  rearrangement?: RearrangementFunction;
}

export interface PanelGridState {
  panels: PanelCoordinate[];
}

interface InternalPanelState {
  activePanelId: PanelId | null;
  draggableElements: Record<PanelId, HTMLElement | null>;
  animatingPanels: Set<PanelId>;
}

export type PanelGridAction =
  | { type: "UPDATE_PANELS"; newPanels: PanelCoordinate[] }
  | { type: "ADD_PANEL"; newPanel: Partial<PanelCoordinate>; columnCount: number }
  | { type: "REMOVE_PANEL"; panelId: PanelId }
  | { type: "LOCK_PANEL_SIZE"; panelId: PanelId }
  | { type: "UNLOCK_PANEL_SIZE"; panelId: PanelId }
  | { type: "LOCK_PANEL_POSITION"; panelId: PanelId }
  | { type: "UNLOCK_PANEL_POSITION"; panelId: PanelId };

export function panelGridReducer(state: PanelGridState, action: PanelGridAction): PanelGridState {
  switch (action.type) {
    case "UPDATE_PANELS":
      return {
        ...state,
        panels: action.newPanels,
      };
    case "ADD_PANEL": {
      const { newPanel, columnCount } = action;
      const newPosition = findNewPositionToAddPanel(newPanel, state.panels, columnCount);
      const newPanelCoordinate: PanelCoordinate = {
        id: newPanel.id || Math.random().toString(36).substring(2, 15),
        x: newPosition.x,
        y: newPosition.y,
        w: newPanel.w || 1,
        h: newPanel.h || 1,
      };
      return {
        ...state,
        panels: [...state.panels, newPanelCoordinate],
      };
    }
    case "REMOVE_PANEL":
      return {
        ...state,
        panels: state.panels.filter((panel) => panel.id !== action.panelId),
      };
    case "LOCK_PANEL_SIZE":
      return {
        ...state,
        panels: state.panels.map((panel) => (panel.id === action.panelId ? { ...panel, lockSize: true } : panel)),
      };
    case "UNLOCK_PANEL_SIZE":
      return {
        ...state,
        panels: state.panels.map((panel) => (panel.id === action.panelId ? { ...panel, lockSize: false } : panel)),
      };
    case "LOCK_PANEL_POSITION":
      return {
        ...state,
        panels: state.panels.map((panel) => (panel.id === action.panelId ? { ...panel, lockPosition: true } : panel)),
      };
    case "UNLOCK_PANEL_POSITION":
      return {
        ...state,
        panels: state.panels.map((panel) => (panel.id === action.panelId ? { ...panel, lockPosition: false } : panel)),
      };
    default:
      return state;
  }
}

const ANIMATION_DURATION = 300;
type TimeoutId = ReturnType<typeof setTimeout>;

const RESIZE_CURSOR_MAP: Record<string, string> = {
  nw: "nwse-resize",
  ne: "nesw-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
};

export function usePanelGrid({
  panels,
  columnCount,
  baseSize,
  gap,
  resizeHandlePositions: _resizeHandlePositions,
  rearrangement,
}: PanelGridOptions) {
  const [state, dispatch] = useReducer(panelGridReducer, {
    panels,
  });
  const ghostPanelRef = useRef<HTMLDivElement | null>(null);
  const animationTimeoutsRef = useRef<Set<TimeoutId>>(new Set());

  const panelMap = useMemo(() => {
    const map = new Map<PanelId, PanelCoordinate>();
    state.panels.forEach((panel) => {
      map.set(panel.id, panel);
    });
    return map;
  }, [state.panels]);

  const internalState = useRef<InternalPanelState>({
    activePanelId: null,
    draggableElements: {},
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
  // Returns the rearranged panels so callers can inspect the actual result position
  const updatePanelsWithAnimation = useCallback(
    (updatedPanel: PanelCoordinate, currentPanels: PanelCoordinate[]): PanelCoordinate[] => {
      // Use custom rearrangement function if provided, otherwise use default
      const rearrange = rearrangement || rearrangePanels;
      const nextPanels = rearrange(updatedPanel, currentPanels, columnCount);

      // Detect which panels have been rearranged
      internalState.animatingPanels = detectAnimatingPanels({
        oldPanels: currentPanels,
        newPanels: nextPanels,
        excludePanelId: updatedPanel.id,
      });

      dispatch({ type: "UPDATE_PANELS", newPanels: nextPanels });

      // Clear animating panels after animation completes
      const timeoutId = setTimeout(() => {
        internalState.animatingPanels.clear();
        animationTimeoutsRef.current.delete(timeoutId);
      }, ANIMATION_DURATION);
      animationTimeoutsRef.current.add(timeoutId);

      return nextPanels;
    },
    [columnCount, internalState, rearrangement]
  );

  // Create drag handler for a specific panel
  const createDragHandler = useCallback(
    (panel: PanelCoordinate) => (e: React.MouseEvent<HTMLDivElement>) => {
      if (panel.lockPosition) return;
      internalState.activePanelId = panel.id;
      const draggingElement = internalState.draggableElements[panel.id];
      if (!draggingElement) return;

      let isDragging = true;
      const initialX = e.clientX;
      const initialY = e.clientY;
      const offsetX = draggingElement.offsetLeft;
      const offsetY = draggingElement.offsetTop;
      const originalTransition = draggingElement.style.transition;

      document.body.classList.add("panelgrid-dragging");

      draggingElement.classList.add("panelgrid-panel--dragging");
      draggingElement.style.transition = "";

      showGhostPanel(offsetX, offsetY, draggingElement.offsetWidth, draggingElement.offsetHeight);

      const mouseUpListenerCtrl = new AbortController();
      const mouseMoveListenerCtrl = new AbortController();

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
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
        const nextGridX = pixelsToGridPosition(droppedLeft, baseSize, gap, columnCount, panel.w);
        const nextGridY = pixelsToGridPosition(droppedTop, baseSize, gap);
        const nextLeft = gridPositionToPixels(nextGridX, baseSize, gap);
        const nextTop = gridPositionToPixels(nextGridY, baseSize, gap);

        updateGhostPanelPosition(nextLeft, nextTop);

        e.preventDefault(); // Prevent text selection during drag
      };

      const onMouseUp = () => {
        if (!draggingElement) return;

        isDragging = false;
        draggingElement.classList.remove("panelgrid-panel--dragging");

        hideGhostPanel();

        const droppedLeft = parseFloat(draggingElement.style.left) || 0;
        const droppedTop = parseFloat(draggingElement.style.top) || 0;

        const nextGridX = pixelsToGridPosition(droppedLeft, baseSize, gap, columnCount, panel.w);
        const nextGridY = pixelsToGridPosition(droppedTop, baseSize, gap);

        // Rearrange first so we know the actual result position.
        // On rollback (e.g. collision with a locked panel), the panel ends up at its original
        // position rather than the dropped position. applySnapAnimation must target the actual
        // result — otherwise the DOM is left at the dropped position while React's cached style
        // (same reference, no useMemo invalidation) never corrects it.
        const nextPanels = updatePanelsWithAnimation({ ...panel, x: nextGridX, y: nextGridY }, state.panels);
        const resultPanel = nextPanels.find((p) => p.id === panel.id);
        const actualGridX = resultPanel?.x ?? nextGridX;
        const actualGridY = resultPanel?.y ?? nextGridY;

        const nextLeft = gridPositionToPixels(actualGridX, baseSize, gap);
        const nextTop = gridPositionToPixels(actualGridY, baseSize, gap);

        applySnapAnimation({
          element: draggingElement,
          droppedLeft,
          droppedTop,
          nextLeft,
          nextTop,
          originalTransition,
        });

        document.body.classList.remove("panelgrid-dragging");
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
      columnCount,
    ]
  );

  // Create resize handler for a specific panel
  const createResizeHandler = useCallback(
    (panel: PanelCoordinate) => (e: React.MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation();
      let isResizing = true;
      internalState.activePanelId = panel.id;
      const draggingElement = internalState.draggableElements[panel.id];
      if (!draggingElement) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const initialTop = draggingElement.offsetTop;
      const initialLeft = draggingElement.offsetLeft;
      const initialWidth = draggingElement.offsetWidth;
      const initialHeight = draggingElement.offsetHeight;
      const initialZIndex = draggingElement.style.zIndex;
      const initialCursor = draggingElement.style.cursor;

      const resizeHandle = e.currentTarget;
      const handlePosition = resizeHandle.dataset.pgResizeHandle;

      const northSideResizeEnabled = handlePosition?.includes("n");
      const westSideResizeEnabled = handlePosition?.includes("w");
      const isVerticalResizeOnly = handlePosition === "n" || handlePosition === "s";
      const isHorizontalResizeOnly = handlePosition === "e" || handlePosition === "w";

      document.body.classList.add("panelgrid-resizing");

      draggingElement.style.cursor = RESIZE_CURSOR_MAP[handlePosition || "se"] || "nwse-resize";
      draggingElement.style.transition = "";

      showGhostPanel(draggingElement.offsetLeft, draggingElement.offsetTop, initialWidth, initialHeight);

      const mouseMoveController = new AbortController();
      const mouseUpController = new AbortController();

      const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;
        if (!draggingElement) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Calculate dimensions once, accounting for all resize directions
        const newWidth = westSideResizeEnabled
          ? Math.max(initialWidth - deltaX, 1)
          : isVerticalResizeOnly
            ? initialWidth
            : initialWidth + deltaX;

        const newHeight = northSideResizeEnabled
          ? Math.max(initialHeight - deltaY, 1)
          : isHorizontalResizeOnly
            ? initialHeight
            : initialHeight + deltaY;

        draggingElement.style.width = `${newWidth}px`;
        draggingElement.style.height = `${newHeight}px`;
        draggingElement.style.zIndex = "calc(infinity)";

        // Update position for north/west resizing
        if (northSideResizeEnabled) {
          draggingElement.style.top = `${initialTop + deltaY}px`;
        }
        if (westSideResizeEnabled) {
          draggingElement.style.left = `${initialLeft + deltaX}px`;
        }

        // Calculate current position (needed for grid calculations)
        const currentLeft = westSideResizeEnabled ? initialLeft + deltaX : initialLeft;
        const currentTop = northSideResizeEnabled ? initialTop + deltaY : initialTop;

        // Update ghost panel - calculate grid position BEFORE grid size
        const nextGridX = pixelsToGridPosition(currentLeft, baseSize, gap, columnCount, panel.w);
        const nextGridY = pixelsToGridPosition(currentTop, baseSize, gap);
        const nextGridW = pixelsToGridSize(newWidth, baseSize, gap, columnCount, nextGridX);
        const nextGridH = pixelsToGridSize(newHeight, baseSize, gap, columnCount, nextGridY);

        const snappedWidth = gridToPixels(nextGridW, baseSize, gap);
        const snappedHeight = gridToPixels(nextGridH, baseSize, gap);
        const snappedLeft = gridPositionToPixels(nextGridX, baseSize, gap);
        const snappedTop = gridPositionToPixels(nextGridY, baseSize, gap);

        updateGhostPanelPosition(snappedLeft, snappedTop);
        updateGhostPanelSize(snappedWidth, snappedHeight);
      };

      const onMouseUp = () => {
        if (!draggingElement) return;

        hideGhostPanel();

        const rect = draggingElement.getBoundingClientRect();
        const droppedLeft = parseFloat(draggingElement.style.left) || 0;
        const droppedTop = parseFloat(draggingElement.style.top) || 0;

        const nextGridX = pixelsToGridPosition(droppedLeft, baseSize, gap, columnCount, panel.w);
        const nextGridY = pixelsToGridPosition(droppedTop, baseSize, gap);

        const nextGridW = pixelsToGridSize(rect.width, baseSize, gap, columnCount, nextGridX);
        const nextGridH = pixelsToGridSize(rect.height, baseSize, gap, columnCount, nextGridY);

        // Rearrange first to get the actual result position/size.
        // On rollback the panel may end up at its original position; the RAF must target
        // that actual position so the DOM stays in sync with React state.
        const nextPanels = updatePanelsWithAnimation(
          { ...panel, x: nextGridX, y: nextGridY, w: nextGridW, h: nextGridH },
          state.panels
        );
        const resultPanel = nextPanels.find((p) => p.id === panel.id);
        const actualX = resultPanel?.x ?? nextGridX;
        const actualY = resultPanel?.y ?? nextGridY;
        const actualW = resultPanel?.w ?? nextGridW;
        const actualH = resultPanel?.h ?? nextGridH;

        const left = gridPositionToPixels(actualX, baseSize, gap);
        const top = gridPositionToPixels(actualY, baseSize, gap);
        const width = gridToPixels(actualW, baseSize, gap);
        const height = gridToPixels(actualH, baseSize, gap);

        draggingElement.style.width = `${rect.width}px`;
        draggingElement.style.height = `${rect.height}px`;
        draggingElement.style.cursor = initialCursor;
        draggingElement.style.transition = "";

        window.requestAnimationFrame(() => {
          draggingElement.style.top = `${top}px`;
          draggingElement.style.left = `${left}px`;
          draggingElement.style.width = `${width}px`;
          draggingElement.style.height = `${height}px`;
          draggingElement.style.zIndex = initialZIndex;
          draggingElement.style.transition =
            "width 0.1s ease-out, height 0.1s ease-out, top 0.1s ease-out, left 0.1s ease-out";
        });

        isResizing = false;
        internalState.activePanelId = null;
        document.body.classList.remove("panelgrid-resizing");

        mouseMoveController.abort();
        mouseUpController.abort();
      };

      document.addEventListener("mousemove", onMouseMove, {
        signal: mouseMoveController.signal,
      });
      document.addEventListener("mouseup", onMouseUp, {
        signal: mouseUpController.signal,
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
      updateGhostPanelSize,
      hideGhostPanel,
      columnCount,
    ]
  );

  // Create ref callback for panel elements
  const createRefCallback = useCallback(
    (panelId: PanelId) => (element: HTMLElement | null) => {
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
          lockSize: panel.lockSize,
          lockPosition: panel.lockPosition,
          positionData: {
            x: panel.x,
            y: panel.y,
            w: panel.w,
            h: panel.h,
          },
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
        resizeHandleProps: panel.lockSize
          ? undefined
          : {
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
      dispatch({
        type: "ADD_PANEL",
        newPanel: {
          ...panel,
          id: panel.id || Math.random().toString(36).substring(2, 15),
        },
        columnCount,
      });
    },
    [columnCount]
  );

  const removePanel = useCallback((id: PanelId) => {
    dispatch({ type: "REMOVE_PANEL", panelId: id });
  }, []);

  const lockPanelSize = useCallback((id: PanelId) => {
    dispatch({ type: "LOCK_PANEL_SIZE", panelId: id });
  }, []);

  const unlockPanelSize = useCallback((id: PanelId) => {
    dispatch({ type: "UNLOCK_PANEL_SIZE", panelId: id });
  }, []);

  const lockPanelPosition = useCallback((id: PanelId) => {
    dispatch({ type: "LOCK_PANEL_POSITION", panelId: id });
  }, []);

  const unlockPanelPosition = useCallback((id: PanelId) => {
    dispatch({ type: "UNLOCK_PANEL_POSITION", panelId: id });
  }, []);

  const exportState = useCallback(() => {
    return state.panels;
  }, [state.panels]);

  return {
    panels: panelsWithProps,
    panelMap,
    ghostPanelRef,
    addPanel,
    removePanel,
    lockPanelSize,
    unlockPanelSize,
    lockPanelPosition,
    unlockPanelPosition,
    exportState,
  };
}
