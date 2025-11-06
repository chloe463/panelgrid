import { useEffect, useMemo } from "react";
import type { MutableRefObject } from "react";

import { usePanelControls } from "./PanelistProvider";
import type { PanelId } from "./PanelistProvider";
import { pixelsToGridPosition, gridPositionToPixels } from "./helpers";
import { throttleRAF } from "./helpers/throttle";
import { useGridConfig } from "./contexts/GridConfigContext";

interface UseDndOptions<T extends HTMLElement = HTMLDivElement> {
  panelId: PanelId;
  ref: MutableRefObject<T | null>;
}

export function useDnd(options: UseDndOptions) {
  const { panelId: id } = options;
  const ref = options.ref;
  const { baseSize, gap } = useGridConfig();
  const { startMovingPanel, movePanel, movingPanel } = usePanelControls();

  // Throttle movingPanel to reduce re-renders during drag
  const throttledMovingPanel = useMemo(() => throttleRAF(movingPanel), [movingPanel]);

  useEffect(() => {
    if (!ref.current) return;
    const draggable = ref.current;
    let isDragging = false;
    let initialX = 0;
    let initialY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let shadow = "none";
    let zIndex = "0";

    const mouseDownListenerCtrl = new AbortController();

    draggable.addEventListener(
      "mousedown",
      (e) => {
        isDragging = true;
        initialX = e.clientX;
        initialY = e.clientY;
        offsetX = draggable.offsetLeft;
        offsetY = draggable.offsetTop;
        shadow = draggable.style.boxShadow;
        zIndex = draggable.style.zIndex;
        draggable.style.cursor = "grabbing";
        draggable.style.position = "absolute";

        draggable.style.boxShadow = "0px 11px 30px 0px #0000001F";
        draggable.style.zIndex = "calc(infinity)";

        const mouseUpListenerCtrl = new AbortController();
        const mouseMoveListenerCtrl = new AbortController();

        document.addEventListener("mousemove", onMouseMove, {
          signal: mouseMoveListenerCtrl.signal,
        });
        document.addEventListener("mouseup", onMouseUp, {
          signal: mouseUpListenerCtrl.signal,
        });

        startMovingPanel(id);

        function onMouseMove(e: MouseEvent) {
          if (!isDragging) return;

          const currentX = e.clientX;
          const currentY = e.clientY;

          const deltaX = currentX - initialX;
          const deltaY = currentY - initialY;

          draggable.style.left = offsetX + deltaX + "px";
          draggable.style.top = offsetY + deltaY + "px";

          // const nextX = pixelsToGridPosition(offsetX + deltaX, baseSize, gap);
          // const nextY = pixelsToGridPosition(offsetY + deltaY, baseSize, gap);

          e.preventDefault(); // Prevent text selection during drag
          // throttledMovingPanel(id, nextX, nextY);
        }

        function onMouseUp() {
          isDragging = false;
          draggable.style.cursor = "default";
          const target = draggable;
          const droppedLeft = Number(target.style.left.replace("px", ""));
          const droppedTop = Number(target.style.top.replace("px", ""));

          const nextX = pixelsToGridPosition(droppedLeft, baseSize, gap);
          const nextY = pixelsToGridPosition(droppedTop, baseSize, gap);

          const nextLeft = gridPositionToPixels(nextX, baseSize, gap);
          const nextTop = gridPositionToPixels(nextY, baseSize, gap);

          // Animation
          window.requestAnimationFrame(() => {
            const deltaX = droppedLeft - nextLeft;
            const deltaY = droppedTop - nextTop;

            draggable.style.transform = `translate3D(${deltaX}px, ${deltaY}px, 0)`;
            draggable.style.transition = "";

            window.requestAnimationFrame(() => {
              draggable.style.transform = "translate3D(0, 0, 0)";
              draggable.style.transition = "transform 0.1s ease-out";
            });
          });

          draggable.style.left = `${nextLeft}px`;
          draggable.style.top = `${nextTop}px`;
          draggable.style.boxShadow = shadow;
          draggable.style.zIndex = zIndex;

          movePanel(id, nextX, nextY);

          mouseMoveListenerCtrl.abort();
          mouseUpListenerCtrl.abort();
        }
      },
      { signal: mouseDownListenerCtrl.signal }
    );

    return () => {
      mouseDownListenerCtrl.abort();
    };
  }, [movePanel, baseSize, gap, ref, id, throttledMovingPanel, startMovingPanel]);

  return ref;
}
