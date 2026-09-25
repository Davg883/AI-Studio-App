'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_OPERATOR_NAME } from './operator-config';

/**
 * Operator identity recorded on approvals and sign-offs.
 * Defaults to NEXT_PUBLIC_OPERATOR_NAME; can be overridden per browser from the Studio menu.
 */
export { DEFAULT_OPERATOR_NAME };

const STORAGE_KEY = 'studio.operatorName';
const CHANGE_EVENT = 'studio:operator-name';

function readStoredName(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useOperatorName(): [string, (name: string) => void] {
  const [name, setName] = useState(DEFAULT_OPERATOR_NAME);

  useEffect(() => {
    const sync = () => setName(readStoredName() || DEFAULT_OPERATOR_NAME);
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const update = useCallback((next: string) => {
    const trimmed = next.trim();
    try {
      if (trimmed) window.localStorage.setItem(STORAGE_KEY, trimmed);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode): keep the in-memory value for this session
    }
    setName(trimmed || DEFAULT_OPERATOR_NAME);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [name, update];
}
