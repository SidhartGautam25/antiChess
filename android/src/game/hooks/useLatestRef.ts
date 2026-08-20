import { useRef } from 'react';

/** Always holds the latest value, synchronously, so a stable callback
 * (empty deps) can read current data without needing to be recreated. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
