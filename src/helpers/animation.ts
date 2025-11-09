/**
 * Options for applying snap-back animation
 */
interface ApplySnapAnimationOptions {
  element: HTMLElement;
  droppedLeft: number;
  droppedTop: number;
  nextLeft: number;
  nextTop: number;
  originalTransition: string;
}

/**
 * Applies snap-back animation to element
 * Smoothly animates the element from its dropped position to the snapped grid position
 */
export function applySnapAnimation(options: ApplySnapAnimationOptions): void {
  const { element, droppedLeft, droppedTop, nextLeft, nextTop, originalTransition } = options;

  const deltaX = droppedLeft - nextLeft;
  const deltaY = droppedTop - nextTop;

  element.style.transform = `translate3D(${deltaX}px, ${deltaY}px, 0)`;
  element.style.transition = "";

  window.requestAnimationFrame(() => {
    element.style.transform = "translate3D(0, 0, 0)";
    element.style.transition = "transform 0.1s ease-out";
  });

  element.style.left = `${nextLeft}px`;
  element.style.top = `${nextTop}px`;
  element.style.transition = originalTransition;
}
