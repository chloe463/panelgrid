import { useEffect, useMemo } from "react";
import type { MutableRefObject } from "react";
import { usePanelControls, type PanelId } from "./PanelistProvider";
import { pixelsToGridSize, gridToPixels } from "./helpers";
import { throttleRAF } from "./helpers/throttle";
import { useGridConfig } from "./contexts/GridConfigContext";

interface UseResizeOptions<T extends HTMLElement = HTMLDivElement> {
  panelId: PanelId;
  ref: MutableRefObject<T | null>;
}

export function useResize<E extends HTMLElement = HTMLElement>(options: UseResizeOptions<E>) {
  const ref = options.ref;
  const id = options.panelId;
  const { baseSize, gap } = useGridConfig();
  const { startResizingPanel, resizePanel, resizingPanel } = usePanelControls();

  // Throttle resizingPanel to reduce re-renders during resize
  const throttledResizingPanel = useMemo(() => throttleRAF(resizingPanel), [resizingPanel]);

  useEffect(() => {
    if (!ref.current) return;

    const handle = ref.current.querySelector(".resize-handle");
    if (!handle) throw new Error("No handle found!");

    const mouseDownController = new AbortController();
    handle.addEventListener(
      "mousedown",
      (e) => {
        e.stopPropagation();
        let isResizing = true;
        if (!ref.current) return;
        const startX = (e as MouseEvent).clientX;
        const startY = (e as MouseEvent).clientY;
        const initialWidth = ref.current.offsetWidth;
        const initialHeight = ref.current.offsetHeight;
        const initialZIndex = ref.current.style.zIndex;

        const mouseMoveController = new AbortController();
        const mouseUpController = new AbortController();

        startResizingPanel(id);

        document.addEventListener(
          "mousemove",
          (e) => {
            if (!isResizing) return;
            if (!ref.current) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            ref.current.style.width = `${initialWidth + deltaX}px`;
            ref.current.style.height = `${initialHeight + deltaY}px`;
            ref.current.style.zIndex = "calc(infinity)";

            const nextW = pixelsToGridSize(initialWidth + deltaX, baseSize, gap);
            const nextH = pixelsToGridSize(initialHeight + deltaY, baseSize, gap);

            throttledResizingPanel(id, nextW, nextH);
          },
          {
            signal: mouseMoveController.signal,
          }
        );

        document.addEventListener(
          "mouseup",
          () => {
            if (ref.current) {
              const panel = ref.current;
              const rect = ref.current?.getBoundingClientRect();
              const nextW = pixelsToGridSize(rect.width, baseSize, gap);
              const nextH = pixelsToGridSize(rect.height, baseSize, gap);

              const width = gridToPixels(nextW, baseSize, gap);
              const height = gridToPixels(nextH, baseSize, gap);

              ref.current.style.width = `${width}px`;
              ref.current.style.height = `${height}px`;
              ref.current.style.zIndex = initialZIndex;

              window.requestAnimationFrame(() => {
                panel.style.width = `${rect.width}px`;
                panel.style.height = `${rect.height}px`;
                panel.style.transition = "";
                window.requestAnimationFrame(() => {
                  panel.style.width = `${width}px`;
                  panel.style.height = `${height}px`;
                  panel.style.transition = "width 0.1s ease-out, height 0.1s ease-out";
                  window.requestAnimationFrame(() => {
                    panel.style.transition = "";
                  });
                });
              });
              resizePanel(id, nextW, nextH);
            }
            isResizing = false;
            mouseMoveController.abort();
            mouseUpController.abort();
          },
          { signal: mouseUpController.signal }
        );
      },
      {
        signal: mouseDownController.signal,
      }
    );

    return () => mouseDownController.abort();
  }, [id, baseSize, gap, resizePanel, ref, throttledResizingPanel]);

  return ref;
}
