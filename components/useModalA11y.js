'use client';

import { useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal accessibility behavior: Escape-to-close, body scroll lock,
 * and a focus trap that keeps Tab/Shift+Tab cycling inside the modal and
 * restores focus to whatever was focused before it opened. Extracted so
 * every modal gets the same behavior components/resources/ResourceFileViewer.js
 * and components/infographics/InfographicViewer.js already had (Escape +
 * scroll lock) plus the focus trap neither of them had — rather than each
 * modal re-implementing (or omitting) this by hand.
 */
export function useModalA11y(containerRef, onClose) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;
    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));

    (focusables()[0] || container).focus?.();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- containerRef is a stable ref; re-running only on onClose identity change is intentional
  }, [onClose]);
}
