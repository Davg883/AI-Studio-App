'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Zap,
  Lock,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ConnectionTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionTestModal({ isOpen, onClose }: ConnectionTestModalProps) {
  const [config, setConfig] = useState<{
    configured: boolean;
    keyIdMasked?: string;
    mode: 'live' | 'mock';
  } | null>(null);

  const [confirmed, setConfirmed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    mode: 'live' | 'mock';
    details: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      setConfirmed(false);
      fetch('/api/higgsfield/test-connection')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setConfig({
              configured: data.configured,
              keyIdMasked: data.keyIdMasked,
              mode: data.mode,
            });
          }
        })
        .catch(err => console.error('Failed to load Higgsfield status:', err));
    }
  }, [isOpen]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    if (!confirmed) return;
    try {
      setTesting(true);
      setTestResult(null);

      const res = await fetch('/api/higgsfield/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      });

      const data = await res.json();
      setTestResult({
        connected: !!data.connected,
        mode: data.mode || 'mock',
        details: data.details || data.error || 'Test completed',
        latencyMs: data.latencyMs,
        error: data.error,
      });
    } catch (err: any) {
      setTestResult({
        connected: false,
        mode: 'live',
        details: err?.message || 'Network error executing probe',
        error: err?.message,
      });
    } finally {
      setTesting(false);
    }
  };

  // Portal to <body>: this modal is mounted inside the sticky header, whose backdrop-filter would trap a fixed overlay
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Higgsfield API connection diagnostic"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      <div ref={dialogRef} tabIndex={-1} className="w-full max-w-xl rounded-xl focus:outline-none border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              Higgsfield API Connection Diagnostic
              <Badge
                variant={config?.mode === 'live' ? 'success' : 'secondary'}
                className="text-xs"
              >
                {config?.mode === 'live' ? 'LIVE MODE' : 'MOCK MODE'}
              </Badge>
            </h3>
            <p className="text-xs text-zinc-400">
              Server-to-server connectivity and official credential verification
            </p>
          </div>
        </div>

        {/* Credentials & Security Box */}
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">API Gateway Endpoint:</span>
            <span className="text-zinc-200">https://api.higgsfield.ai</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">HF_API_KEY_ID:</span>
            <span className="text-cyan-300 font-bold">
              {config?.configured ? config.keyIdMasked : 'Not Configured (Using Mock Simulation)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">HF_API_KEY_SECRET:</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Lock className="h-3 w-3" />
              {config?.configured ? 'Stored Server-Side (Hidden)' : 'Not Set'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-400">
            <span>Auth Scheme:</span>
            <span className="text-zinc-300">Authorization: Key KEY_ID:KEY_SECRET</span>
          </div>
        </div>

        {/* Safety Warning & Confirmation */}
        <div className="my-5 p-4 rounded-lg border border-amber-900/50 bg-amber-950/20 text-xs space-y-3">
          <div className="flex items-start gap-2.5 text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-1">
              <span className="font-semibold">Operator Safety Gate:</span>
              <p className="text-zinc-400 text-xs leading-relaxed">
                This diagnostic performs the smallest inexpensive documented request (<code className="text-cyan-300">POST /estimate/higgsfield-ai/soul/v2/standard</code>) to verify authentication headers and pricing availability without triggering paid renders.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-2 border-t border-amber-900/40 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-xs text-zinc-200 select-none">
              I authorize running this diagnostic probe against the configured Higgsfield API environment.
            </span>
          </label>
        </div>

        {/* Probe Execution Result */}
        {testResult && (
          <div
            className={`mb-5 p-4 rounded-lg border text-xs space-y-2 ${
              testResult.connected
                ? 'border-emerald-800/80 bg-emerald-950/30 text-emerald-200'
                : 'border-red-800/80 bg-red-950/30 text-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                {testResult.connected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <span>
                  {testResult.connected ? 'Higgsfield Connectivity Verified' : 'Connection Failed'}
                </span>
              </div>
              {testResult.latencyMs !== undefined && (
                <span className="text-xs text-zinc-400">
                  Latency: {testResult.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {testResult.details}
            </p>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2">
          <a
            href="https://console.higgsfield.ai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 font-mono transition-colors"
          >
            Higgsfield Console <ExternalLink className="h-3 w-3" />
          </a>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunTest}
              loading={testing}
              disabled={!confirmed}
              className="text-xs"
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              Execute Probe
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
