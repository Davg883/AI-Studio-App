import React from 'react';
import { cn } from '@/lib/utils';

/** Placeholder block shown while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-zinc-800/60', className)} />;
}
