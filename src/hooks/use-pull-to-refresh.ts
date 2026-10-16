import { useEffect, useRef, useState } from "react";

/** Deliberate touch overscroll, never simply arriving at the top of a page. */
export const PULL_REFRESH_THRESHOLD_PX = 80;
export function shouldRefreshOnRelease(
  dragDistancePx: number,
  startedAtTop: boolean,
  enabled: boolean,
): boolean {
  return enabled && startedAtTop && dragDistancePx >= PULL_REFRESH_THRESHOLD_PX;
}

/**
 * Mobile dashboard-only pull-to-refresh. Refetches application data through
 * onRefresh; it must never navigate or reload the browser page.
 */
export function usePullToRefresh({
  enabled,
  onRefresh,
}: {
  enabled: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullDistance = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) {
      startY.current = null;
      pullDistance.current = 0;
      setDistance(0);
      return;
    }

    const reset = () => {
      startY.current = null;
      pullDistance.current = 0;
      setDistance(0);
    };
    const touchStart = (event: TouchEvent) => {
      if (refreshingRef.current || event.touches.length !== 1 || window.scrollY > 1) return;
      const target = event.target;
      // Never take over a form field, button, open dialog or editable content.
      if (target instanceof Element &&
          target.closest('input,textarea,select,button,a,[contenteditable],[role="dialog"],[data-no-pull-refresh]')) return;
      startY.current = event.touches[0].clientY;
      pullDistance.current = 0;
    };
    const touchMove = (event: TouchEvent) => {
      if (startY.current === null || event.touches.length !== 1) return;
      if (window.scrollY > 1) {
        reset();
        return;
      }
      const delta = event.touches[0].clientY - startY.current;
      if (delta <= 0) {
        reset();
        return;
      }
      // We consume only positive overscroll; ordinary downward page scrolling
      // and keyboard/mouse navigation retain their native behavior.
      if (event.cancelable) event.preventDefault();
      pullDistance.current = delta;
      setDistance(Math.min(delta, 120));
    };
    const touchEnd = () => {
      const releaseDistance = pullDistance.current;
      const startedAtTop = startY.current !== null;
      reset();
      if (!shouldRefreshOnRelease(releaseDistance, startedAtTop, enabled) || refreshingRef.current) return;
      refreshingRef.current = true;
      setRefreshing(true);
      void (async () => {
        try {
          await onRefreshRef.current();
        } catch (error) {
          console.error("[GridMind] pull-to-refresh failed", error);
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
        }
      })();
    };

    document.addEventListener("touchstart", touchStart, { passive: true });
    document.addEventListener("touchmove", touchMove, { passive: false });
    document.addEventListener("touchend", touchEnd);
    document.addEventListener("touchcancel", reset);
    return () => {
      document.removeEventListener("touchstart", touchStart);
      document.removeEventListener("touchmove", touchMove);
      document.removeEventListener("touchend", touchEnd);
      document.removeEventListener("touchcancel", reset);
    };
  }, [enabled]);

  return { distance, refreshing, threshold: PULL_REFRESH_THRESHOLD_PX };
}
