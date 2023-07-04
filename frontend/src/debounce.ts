import { EffectCallback, Inputs, useEffect, useRef } from 'preact/hooks';

export function useDebounce(
  effect: EffectCallback,
  delay: number,
  inputs?: Inputs,
) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    // Clear previous timeout on re-render
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create a new timeout
    timeoutRef.current = setTimeout(() => {
      effect();
    }, delay);

    // Clear timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, inputs);
}

export function debounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
) {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
