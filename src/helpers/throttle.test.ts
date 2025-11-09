import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { throttle, throttleRAF } from "./throttle";

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call function immediately on first invocation", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled("arg1", "arg2");
    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("should throttle subsequent calls within delay period", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled("call1");
    throttled("call2");
    throttled("call3");

    vi.advanceTimersByTime(1000);

    // Only the first call should execute
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("call1");
  });

  it("should allow function to be called again after delay", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled("call1");
    vi.advanceTimersByTime(1000);

    throttled("call2");
    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, "call1");
    expect(fn).toHaveBeenNthCalledWith(2, "call2");
  });

  it("should handle multiple arguments", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled(1, "test", { key: "value" }, [1, 2, 3]);
    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledWith(1, "test", { key: "value" }, [1, 2, 3]);
  });

  it("should not execute function if not enough time has passed", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled("call1");
    vi.advanceTimersByTime(500);
    throttled("call2");
    vi.advanceTimersByTime(500);

    // Only first call should execute
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should work with different delay values", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);

    throttled("call1");
    vi.advanceTimersByTime(500);
    throttled("call2");
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("throttleRAF", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call function with latest arguments after animation frame", () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    throttled("arg1");
    throttled("arg2");
    throttled("arg3");

    expect(fn).not.toHaveBeenCalled();

    // Trigger animation frame
    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg3"); // Latest arguments
  });

  it("should throttle multiple calls to single animation frame", () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    for (let i = 0; i < 10; i++) {
      throttled(`call${i}`);
    }

    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("call9"); // Latest call
  });

  it("should allow function to be called in next animation frame", () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    throttled("first");
    vi.runAllTimers();

    throttled("second");
    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, "first");
    expect(fn).toHaveBeenNthCalledWith(2, "second");
  });

  it("should handle multiple arguments", () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    throttled(1, "test", { key: "value" });
    vi.runAllTimers();

    expect(fn).toHaveBeenCalledWith(1, "test", { key: "value" });
  });

  it("should preserve the latest arguments when called multiple times", () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    throttled({ id: 1 });
    throttled({ id: 2 });
    throttled({ id: 3 });

    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ id: 3 });
  });

  it("should work correctly with typed function", () => {
    const fn = vi.fn((a: number, b: string) => `${a}-${b}`);
    const throttled = throttleRAF(fn);

    throttled(42, "test");
    vi.runAllTimers();

    expect(fn).toHaveBeenCalledWith(42, "test");
  });

  it("should handle rapid successive calls", () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    // Simulate rapid calls
    throttled("a");
    throttled("b");
    throttled("c");

    expect(fn).not.toHaveBeenCalled();

    vi.runAllTimers();

    // Should only call once with the latest argument
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");

    // Next frame should allow another call
    throttled("d");
    vi.runAllTimers();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith("d");
  });
});
