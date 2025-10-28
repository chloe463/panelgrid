import { useEffect } from "react";
import type { MutableRefObject } from "react";
import {
  usePanelState,
  usePanelContrls,
  type PanelId,
} from "./PanelistProvider";

interface UseResizeOptions<T extends HTMLElement = HTMLDivElement> {
  panelId: PanelId;
  el: MutableRefObject<T | null>;
}

export function useResize<E extends HTMLElement = HTMLElement>(
  options: UseResizeOptions<E>
) {
  const ref = options.el;
  const id = options.panelId;
  const { baseSize, gap } = usePanelState();
  const { resizePanel, resizingPanel } = usePanelContrls();

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

            const nextW = Math.ceil((initialWidth + deltaX) / (baseSize + gap));
            const nextH = Math.ceil(
              (initialHeight + deltaY) / (baseSize + gap)
            );

            resizingPanel(id, nextW, nextH);
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
              const nextW = Math.ceil(rect.width / (baseSize + gap));
              const nextH = Math.ceil(rect.height / (baseSize + gap));

              const width = nextW * baseSize + Math.max(0, nextW - 1) * gap;
              const height = nextH * baseSize + Math.max(0, nextH - 1) * gap;

              ref.current.style.width = `${width}px`;
              ref.current.style.height = `${height}px`;
              ref.current.style.zIndex = initialZIndex;

              window.requestAnimationFrame(() => {
                panel.style.width = `${rect.width}px`;
                panel.style.height = `${rect.height}px`;
                window.requestAnimationFrame(() => {
                  panel.style.width = `${width}px`;
                  panel.style.height = `${height}px`;
                  panel.style.transition = `all 100ms ease-in`;
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
  }, [id, baseSize, gap, resizePanel, ref, resizingPanel]);

  return ref;
}
