'use client';

import React, { useState } from 'react';
import {
  CAPABILITY_CATALOG,
  ProductionRole,
  ModelCapabilityItem,
  getModelsByRole,
} from '@/lib/models/capability-catalog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Layers,
  Sparkles,
  ShieldAlert,
  Clock,
  Coins,
  CheckCircle2,
  X,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';

interface CapabilityCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel?: (model: ModelCapabilityItem) => void;
  activeRoleFilter?: ProductionRole | 'ALL';
}

const ROLE_INFO: Record<
  ProductionRole,
  { title: string; color: string; bg: string; border: string; desc: string }
> = {
  SEARCH: {
    title: 'SEARCH',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-800/60',
    desc: 'Cheap or fast enough to generate multiple hooks, compositions, and rough concepts before committing budget.',
  },
  CONTROL: {
    title: 'CONTROL',
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/40',
    border: 'border-indigo-800/60',
    desc: 'Best when the workflow must preserve a product, face, character, exact motion, layout, logo, label, or text.',
  },
  SHIP: {
    title: 'SHIP',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-800/60',
    desc: 'Premium models used after the concept is chosen for the final client-facing asset.',
  },
  FINISH: {
    title: 'FINISH',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-950/40',
    border: 'border-fuchsia-800/60',
    desc: 'Upscaling, denoising, lip sync, voice, captions, localization, and export.',
  },
};

export function CapabilityCatalogModal({
  isOpen,
  onClose,
  onSelectModel,
  activeRoleFilter = 'ALL',
}: CapabilityCatalogModalProps) {
  const [selectedRole, setSelectedRole] = useState<ProductionRole | 'ALL'>(activeRoleFilter);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredModels = CAPABILITY_CATALOG.filter(model => {
    const matchesRole = selectedRole === 'ALL' || model.role === selectedRole;
    const matchesSearch =
      searchQuery === '' ||
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.bestUsedFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.capabilities.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRole && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between gap-4 bg-zinc-900/60">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold tracking-tight text-zinc-100">
                Higgsfield Model Capability Catalog
              </h2>
              <Badge variant="outline" className="text-xs text-zinc-400">
                {CAPABILITY_CATALOG.length} Documented Models
              </Badge>
            </div>
            <p className="mt-1 text-xs text-zinc-400 max-w-2xl">
              Configurable model families grouped by production role. Transparent capability definitions, unit costs, latency estimates, and documented failure modes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedRole('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                selectedRole === 'ALL'
                  ? 'bg-zinc-100 text-zinc-950 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              All ({CAPABILITY_CATALOG.length})
            </button>
            {(['SEARCH', 'CONTROL', 'SHIP', 'FINISH'] as ProductionRole[]).map(role => {
              const count = getModelsByRole(role).length;
              const info = ROLE_INFO[role];
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                    selectedRole === role
                      ? `${info.bg} ${info.color} border ${info.border} font-bold`
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span>{role}</span>
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search model, capability, family..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Selected Role Description Bar */}
        {selectedRole !== 'ALL' && (
          <div className={`px-6 py-2.5 border-b text-xs flex items-center gap-2 ${ROLE_INFO[selectedRole].bg} ${ROLE_INFO[selectedRole].border}`}>
            <span className={`font-bold ${ROLE_INFO[selectedRole].color}`}>
              ROLE {selectedRole}:
            </span>
            <span className="text-zinc-300">{ROLE_INFO[selectedRole].desc}</span>
          </div>
        )}

        {/* Model Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModels.map(model => {
              const roleInfo = ROLE_INFO[model.role];

              return (
                <div
                  key={model.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col justify-between hover:border-zinc-700 transition-all hover:bg-zinc-900/90"
                >
                  <div>
                    {/* Top Row: Title, Role Badge, Cost */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-zinc-100">{model.name}</h3>
                          <Badge
                            className={`text-xs px-2 py-0.5 border ${roleInfo.bg} ${roleInfo.color} ${roleInfo.border}`}
                          >
                            {model.role}
                          </Badge>
                          <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {model.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {model.description}
                        </p>
                      </div>
                    </div>

                    {/* Best Used For */}
                    <div className="mt-3 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs space-y-1">
                      <div className="text-xs font-semibold text-cyan-300">
                        Best Application:
                      </div>
                      <p className="text-zinc-300 text-xs leading-relaxed">
                        {model.bestUsedFor}
                      </p>
                    </div>

                    {/* Known Failure Mode & Mitigation */}
                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Known Failure Mode:
                      </div>
                      <p className="text-amber-200/90 text-xs leading-relaxed">
                        {model.knownFailureModes[0]}
                      </p>
                      <div className="text-xs text-zinc-400 pt-1 border-t border-amber-900/30">
                        <strong className="text-zinc-300">Mitigation:</strong> {model.failureMitigation}
                      </div>
                    </div>

                    {/* Capability Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {model.capabilities.map(cap => (
                        <span
                          key={cap}
                          className="text-xs font-mono bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700/50"
                        >
                          #{cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Stats & Action */}
                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Coins className="h-3.5 w-3.5" />
                        ${model.unitCostUSD.toFixed(2)}
                        <span className="text-xs text-zinc-400 font-normal">
                          /{model.costUnit}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400 text-xs">
                        <Clock className="h-3.5 w-3.5" />
                        ~{model.typicalQueueTimeSeconds}s queue
                      </span>
                    </div>

                    {onSelectModel && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          onSelectModel(model);
                          onClose();
                        }}
                        className="text-xs font-mono h-7"
                      >
                        Select Model
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Higgsfield API & Partner Catalog • Showing {filteredModels.length} of {CAPABILITY_CATALOG.length} models
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Catalog
          </Button>
        </div>
      </div>
    </div>
  );
}
