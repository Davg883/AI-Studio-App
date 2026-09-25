'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cpu, RefreshCw, Zap, Sliders, ScrollText, Settings2, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { ConnectionTestModal } from '../connection-test/ConnectionTestModal';
import { AutonomySettingsModal } from '../autonomy/AutonomySettingsModal';
import { AutonomyAuditLogModal } from '../autonomy/AutonomyAuditLogModal';
import { useOperatorName } from '@/lib/operator';
import { useStudioConfig } from '@/lib/use-studio-config';
import { useToast } from '../ui/toast';

export function Header() {
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAutonomyModal, setShowAutonomyModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [operatorName, setOperatorName] = useOperatorName();
  const [operatorDraft, setOperatorDraft] = useState('');
  const toast = useToast();
  const config = useStudioConfig();

  useEffect(() => {
    if (menuOpen) setOperatorDraft(operatorName);
  }, [menuOpen, operatorName]);

  const saveOperatorName = () => {
    if (operatorDraft.trim() === operatorName) return;
    setOperatorName(operatorDraft);
    toast.success(`Approvals will be recorded as ${operatorDraft.trim() || 'the default operator'}.`);
  };

  // Close the tools menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const openFromMenu = (open: () => void) => {
    setMenuOpen(false);
    open();
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      setResetError('');
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error(`Reset failed (HTTP ${res.status})`);
      // Pages fetch client-side, so do a full reload to pick up the seeded data everywhere
      window.location.href = '/';
    } catch (e: any) {
      setResetError(e.message || 'Reset failed');
      setResetting(false);
    }
  };

  const menuItemClass =
    'flex w-full items-start gap-2.5 rounded px-2.5 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand / Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-100 text-zinc-950 font-black text-xs group-hover:bg-amber-400 transition-colors">
            SO
          </div>
          <span className="whitespace-nowrap text-sm font-semibold tracking-wider text-zinc-100 uppercase">
            Studio Operator
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Status pills: compact, details in tooltips */}
          <div
            className="hidden md:flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 whitespace-nowrap"
            title="Policy: No scraping, bidding, contracting, messaging, or delivering through 3rd-party marketplaces without explicit human sign-off."
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Guardrails on</span>
          </div>
          {config && (
            <div
              className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 whitespace-nowrap"
              title={`Generation (Higgsfield): ${
                config.mockMode ? 'simulated, no real spend' : 'LIVE, generations incur real spend'
              }
Brief analysis (GPT-6 Astra): ${config.analyzerMock ? 'simulated' : 'live'}`}
            >
              <Cpu className={`h-3.5 w-3.5 ${config.mockMode ? 'text-zinc-400' : 'text-amber-400'}`} />
              <span>{config.mockMode ? 'Mock mode' : 'Live mode'}</span>
            </div>
          )}

          {/* Tools menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMenuOpen(o => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="h-8 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-900 whitespace-nowrap"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Studio</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </Button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-72 rounded-lg border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl"
              >
                <div className="px-2.5 pt-1.5 pb-2.5">
                  <label htmlFor="operator-name" className="block text-xs text-zinc-400 mb-1">
                    Operator name (recorded on approvals & sign-offs)
                  </label>
                  <input
                    id="operator-name"
                    value={operatorDraft}
                    onChange={e => setOperatorDraft(e.target.value)}
                    onBlur={saveOperatorName}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        saveOperatorName();
                        setMenuOpen(false);
                      }
                    }}
                    className="w-full rounded bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="mb-1.5 border-t border-zinc-800" />
                <button role="menuitem" className={menuItemClass} onClick={() => openFromMenu(() => setShowAutonomyModal(true))}>
                  <Sliders className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="block font-medium">Autonomy policy</span>
                    <span className="block text-xs text-zinc-400">Spend ceilings, pause conditions, dispatch rules</span>
                  </span>
                </button>
                <button role="menuitem" className={menuItemClass} onClick={() => openFromMenu(() => setShowAuditModal(true))}>
                  <ScrollText className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="block font-medium">Audit ledger</span>
                    <span className="block text-xs text-zinc-400">Decisions, approvals and spend reservations</span>
                  </span>
                </button>
                <button role="menuitem" className={menuItemClass} onClick={() => openFromMenu(() => setShowTestModal(true))}>
                  <Zap className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="block font-medium">Higgsfield connection test</span>
                    <span className="block text-xs text-zinc-400">Check API connectivity and authentication</span>
                  </span>
                </button>

                <div className="my-1.5 border-t border-zinc-800" />
                <div className="px-2.5 pb-1 text-xs uppercase tracking-wider text-zinc-400">Demo data</div>
                <button role="menuitem" className={menuItemClass} onClick={() => openFromMenu(() => setShowResetConfirm(true))}>
                  <RefreshCw className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="block font-medium text-red-300">Reset to seed data…</span>
                    <span className="block text-xs text-zinc-400">Replaces all jobs, generations and workflows</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showResetConfirm}
        onClose={() => !resetting && setShowResetConfirm(false)}
        title="Reset to seed data?"
        description="All jobs, generations, workflows and revisions will be replaced with the original demo seeds. This cannot be undone."
        maxWidth="md"
      >
        {resetError && (
          <div className="mb-3 rounded bg-red-950/40 border border-red-800/50 p-2.5 text-xs text-red-300">{resetError}</div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)} disabled={resetting}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReset} loading={resetting}>
            Reset all data
          </Button>
        </div>
      </Modal>

      <ConnectionTestModal isOpen={showTestModal} onClose={() => setShowTestModal(false)} />
      <AutonomySettingsModal isOpen={showAutonomyModal} onClose={() => setShowAutonomyModal(false)} />
      <AutonomyAuditLogModal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} />
    </header>
  );
}
