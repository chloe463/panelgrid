/* eslint-disable @typescript-eslint/no-explicit-any */
export function throttle(fn: (...args: any[]) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: any[]) {
    if (timer) return;
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * Throttles a function using requestAnimationFrame
 * Ensures the function is called at most once per animation frame (60fps)
 * and always calls with the latest arguments after the last invocation
 *
 * requestAnimationFrame を使用して関数をスロットルします。
 * アニメーションフレームごとに最大1回（60fps）呼び出され、
 * 最後の呼び出し後は必ず最新の引数で実行されます。
 */
export function throttleRAF<T extends (...args: any[]) => void>(fn: T): T {
  let rafId: number | null = null;
  let lastArgs: any[] | null = null;

  const throttled = function (...args: any[]) {
    lastArgs = args;

    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      if (lastArgs !== null) {
        fn(...lastArgs);
        lastArgs = null;
      }
      rafId = null;
    });
  };

  return throttled as T;
}
