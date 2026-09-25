'use client';

import { useEffect, useState } from 'react';

export interface StudioConfig {
  /** Generation (Higgsfield) is simulated: no real spend */
  mockMode: boolean;
  /** Brief analysis (GPT-6 Astra) is simulated */
  analyzerMock: boolean;
}

let cached: Promise<StudioConfig> | null = null;

function loadConfig(): Promise<StudioConfig> {
  if (!cached) {
    cached = fetch('/api/config')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(data => ({ mockMode: !!data.mockMode, analyzerMock: !!data.analyzerMock }))
      .catch(() => {
        cached = null; // allow a retry on the next mount
        return { mockMode: false, analyzerMock: false };
      });
  }
  return cached;
}

/** Runtime flags from the server; null until loaded. */
export function useStudioConfig(): StudioConfig | null {
  const [config, setConfig] = useState<StudioConfig | null>(null);
  useEffect(() => {
    let alive = true;
    loadConfig().then(c => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}
