'use client';

import { RefObject, useEffect } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside `ref` while `active`: moves focus in on open,
 * cycles Tab / Shift+Tab, and restores focus to the previously focused element on close.
 */
export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Defer so portalled content is in the DOM (setTimeout, not rAF: rAF stalls in background tabs)
    const timer = window.setTimeout(() => {
      const container = ref.current;
      if (!container || container.contains(document.activeElement)) return;
      // Prefer the first form field over the header's close button
      const first =
        container.querySelector<HTMLElement>('[data-autofocus], input:not([disabled]):not([type="hidden"]), select, textarea') ??
        container.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? container).focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      const container = ref.current;
      if (e.key !== 'Tab' || !container) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => el.offsetParent !== null
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [ref, active]);
}
