'use client';

import React, { useState } from 'react';
import { Generation, Job, Workflow } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Film,
  Image as ImageIcon,
  Music,
  ExternalLink,
  Download,
  Clock,
  Sparkles,
  Layers,
  HardDrive,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface OutputsTabProps {
  job: Job;
  generations?: Generation[];
  workflow?: Workflow | null;
  onRefresh: () => void;
}

export function OutputsTab({ job, generations = [], workflow, onRefresh }: OutputsTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image' | 'audio'>('all');

  const filteredGenerations = generations.filter(g => {
    if (filterType === 'all') return true;
    return g.outputType === filterType;
  });

  if (generations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center">
        <Film className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
        <h3 className="text-base font-semibold text-zinc-300">No Rendered Outputs Yet</h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
          Once approved workflow steps are executed, rendered 4K videos, DoP camera moves, concept keyframes, and master voiceover stems will appear here and persist in local storage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold text-zinc-200 uppercase">
            Production Outputs ({generations.length} Generations Recorded)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(['all', 'video', 'image', 'audio'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded capitalize transition-colors ${
                filterType === type
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredGenerations.map(gen => {
          const associatedStep = workflow?.steps.find(s => s.id === gen.stepId);
          const isLocal = gen.outputUrl?.startsWith('/storage/generations/') || !!gen.localAssetPath;

          return (
            <div
              key={gen.id}
              className={`rounded-lg border overflow-hidden flex flex-col justify-between shadow-md transition-all ${
                gen.status === 'Completed'
                  ? 'border-zinc-800 bg-zinc-950/90'
                  : gen.status === 'Canceled'
                  ? 'border-amber-900/60 bg-amber-950/20'
                  : 'border-red-900/60 bg-red-950/20'
              }`}
            >
              {/* Media Preview Box */}
              <div className="relative bg-black flex items-center justify-center min-h-[240px] max-h-[340px] overflow-hidden">
                {gen.status === 'Completed' && gen.outputUrl ? (
                  <>
                    {gen.outputType === 'video' ? (
                      <video
                        src={gen.outputUrl}
                        controls
                        playsInline
                        poster={gen.thumbnailUrl}
                        className="w-full h-full object-contain max-h-[340px]"
                      />
                    ) : gen.outputType === 'image' ? (
                      <img
                        src={gen.outputUrl}
                        alt={associatedStep?.name || 'Output keyframe'}
                        className="w-full h-full object-cover max-h-[340px]"
                      />
                    ) : (
                      <div className="w-full p-8 flex flex-col items-center justify-center space-y-4 bg-zinc-900/60">
                        <Music className="h-10 w-10 text-cyan-400" />
                        <audio src={gen.outputUrl} controls className="w-full max-w-sm" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full p-10 flex flex-col items-center justify-center text-center space-y-2">
                    <AlertTriangle className="h-8 w-8 text-amber-400 mb-1" />
                    <span className="font-mono text-xs font-semibold text-zinc-300">
                      {gen.status === 'Canceled' ? 'Generation Canceled' : 'Generation Failed'}
                    </span>
                    {gen.error && (
                      <p className="text-xs text-zinc-400 max-w-sm">
                        {gen.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Top overlay badge */}
                <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs bg-black/70 backdrop-blur-sm border-zinc-700">
                    {gen.outputType.toUpperCase()}
                  </Badge>
                  {gen.aspectRatio && (
                    <Badge variant="outline" className="text-xs bg-black/70 backdrop-blur-sm text-cyan-300 border-zinc-700">
                      {gen.aspectRatio}
                    </Badge>
                  )}
                  {gen.retryCount && gen.retryCount > 0 ? (
                    <Badge variant="outline" className="text-xs bg-black/70 backdrop-blur-sm text-amber-400 border-amber-800/80">
                      Retry #{gen.retryCount}
                    </Badge>
                  ) : null}
                </div>

                {/* Top right local persistence badge */}
                {isLocal && (
                  <div
                    className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/70 backdrop-blur-sm border border-emerald-900/60 px-2 py-0.5 text-xs text-emerald-400"
                    title="Persisted locally in public/storage/generations/ to prevent 7-day link expiration"
                  >
                    <HardDrive className="h-3 w-3" />
                    <span>Local Storage</span>
                  </div>
                )}
              </div>

              {/* Output Details & Metadata */}
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-zinc-100 text-sm">
                      {associatedStep?.name || gen.model}
                    </h5>
                    <Badge
                      variant={gen.status === 'Completed' ? 'success' : gen.status === 'Canceled' ? 'warning' : 'destructive'}
                      className="text-xs"
                    >
                      {gen.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Model: <strong className="text-zinc-300">{gen.model}</strong>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-800/80 pt-2 text-zinc-400">
                  <div>
                    Request ID: <span className="text-zinc-300 text-xs">{gen.providerRequestId}</span>
                  </div>
                  <div className="text-right">
                    Cost Incurred:{' '}
                    <strong className={gen.actualCost ? 'text-emerald-400' : 'text-zinc-400'}>
                      {formatCurrency(gen.actualCost || 0)}
                    </strong>
                  </div>
                  <div>
                    Rendered: <span className="text-zinc-400">{formatDateTime(gen.completedAt || gen.startedAt)}</span>
                  </div>
                  <div className="text-right">
                    Estimate: <span className="text-cyan-400">{formatCurrency(gen.costEstimate)}</span>
                  </div>
                </div>

                {/* Actions */}
                {gen.outputUrl && gen.status === 'Completed' && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <a
                      href={gen.outputUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Open Master Asset <ExternalLink className="h-3 w-3" />
                    </a>

                    <a
                      href={gen.outputUrl}
                      download
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Download <Download className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
