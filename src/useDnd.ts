import { useEffect } from "react";
import type { MutableRefObject } from "react";

import { usePanelState, usePanelContrls } from "./PanelistProvider";
import type { PanelId } from "./PanelistProvider";

interface UseDndOptions<T extends HTMLElement = HTMLDivElement> {
  panelId: PanelId;
  el: MutableRefObject<T | null>;
}

export function useDnd(options: UseDndOptions) {
  const { panelId: id } = options;
  const ref = options.el;
  const { baseSize, gap } = usePanelState();
  const { movePanel } = usePanelContrls();

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

        function onMouseMove(e: MouseEvent) {
          if (!isDragging) return;

          const currentX = e.clientX;
          const currentY = e.clientY;

          const deltaX = currentX - initialX;
          const deltaY = currentY - initialY;

          draggable.style.left = offsetX + deltaX + "px";
          draggable.style.top = offsetY + deltaY + "px";

          e.preventDefault(); // Prevent text selection during drag
        }

        function onMouseUp() {
          isDragging = false;
          draggable.style.cursor = "default";
          const target = draggable;
          const droppedLeft = Number(target.style.left.replace("px", ""));
          const droppedTop = Number(target.style.top.replace("px", ""));

          const nextX = Math.max(0, Math.floor(droppedLeft / (baseSize + gap)));
          const nextY = Math.max(0, Math.floor(droppedTop / (baseSize + gap)));

          const nextLeft = Math.max(0, nextX * (baseSize + gap));
          const nextTop = Math.max(0, nextY * (baseSize + gap));

          // Animation
          window.requestAnimationFrame(() => {
            const deltaX = droppedLeft - nextLeft;
            const deltaY = droppedTop - nextTop;

            draggable.style.transform = `translate3D(${deltaX}px, ${deltaY}px, 0)`;
            draggable.style.transition = "transform 0s";

            window.requestAnimationFrame(() => {
              draggable.style.transform = "translate3D(0, 0, 0)";
              draggable.style.transitionProperty = "transform";
              draggable.style.transitionDuration = "100ms";
              draggable.style.transitionTimingFunction = "ease-in";
            });
          });

          draggable.style.left = `${nextLeft}px`;
          draggable.style.top = `${nextTop}px`;
          draggable.style.boxShadow = shadow;
          draggable.style.zIndex = zIndex;
          // console.log({
          //   baseSize,
          //   gap,
          //   droppedTop,
          //   droppedLeft,
          //   nextY,
          //   nextX,
          //   nextTop,
          //   nextLeft,
          // });

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
  }, [movePanel, baseSize, gap]);

  return ref;
}
