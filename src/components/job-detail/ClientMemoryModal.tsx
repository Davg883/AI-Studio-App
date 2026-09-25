'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ClientMemory } from '@/types/autonomy';
import { Shield, Lock, Palette, FileText, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast, responseError } from '@/components/ui/toast';

interface ClientMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function ClientMemoryModal({ isOpen, onClose, clientId }: ClientMemoryModalProps) {
  const [memory, setMemory] = useState<ClientMemory | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && clientId) {
      fetchMemory();
    }
  }, [isOpen, clientId]);

  const fetchMemory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients/${clientId}/memory`);
      if (!res.ok) throw new Error(await responseError(res, 'Could not load client memory'));
      const data = await res.json();
      if (data.memory) setMemory(data.memory);
    } catch (e: any) {
      toast.error(e.message || 'Could not load client memory');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={memory ? `${memory.brandName} — Client Knowledge Vault` : 'Client Memory Vault'}
      description="Account-level brand assets, approved product claims, winning aesthetics, and likeness consent firewall."
      maxWidth="4xl"
    >
      {loading || !memory ? (
        <div className="py-12 text-center text-xs text-zinc-400">
          Loading client memory vault...
        </div>
      ) : (
        <div className="space-y-5 pt-2 text-xs text-zinc-200">
          {/* Hard Consent Firewall Banner */}
          <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-3.5 flex items-start gap-3">
            <Lock className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-300 block uppercase text-xs">Hard Privacy & Rights Firewall</span>
              <p className="text-zinc-300 font-sans text-xs mt-0.5">
                {memory.consentFirewall.consentScopeNotice}
              </p>
              <div className="pt-1.5 flex items-center gap-2">
                <span className="text-zinc-400">Authorized Individuals:</span>
                {memory.consentFirewall.authorizedPersons.map((p, idx) => (
                  <Badge key={idx} variant="outline" className="border-red-800 text-red-300 text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Section 1: Approved Brand Assets (Colors, Fonts, Logos) */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Palette className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-zinc-100">Approved Brand Identity</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Brand Colors */}
              <div className="space-y-2">
                <span className="text-zinc-400 text-xs uppercase block">Brand Color Palette</span>
                <div className="space-y-1.5">
                  {memory.approvedAssets.brandColors.map((color, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-zinc-950 border border-zinc-800">
                      <div className="h-4 w-4 rounded-full border border-zinc-700" style={{ backgroundColor: color.hex }} />
                      <div className="text-xs">
                        <span className="font-semibold text-zinc-200 block">{color.name}</span>
                        <span className="text-zinc-400">{color.hex} ({color.role})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-2">
                <span className="text-zinc-400 text-xs uppercase block">Typography Stack</span>
                <div className="space-y-1.5">
                  {memory.approvedAssets.fonts.map((f, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-zinc-950 border border-zinc-800">
                      <span className="font-semibold text-zinc-200 block text-xs">{f.name}</span>
                      <span className="text-zinc-400 text-xs capitalize">{f.category} Typography</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logos */}
              <div className="space-y-2">
                <span className="text-zinc-400 text-xs uppercase block">Vector Logos & Marks</span>
                <div className="space-y-1.5">
                  {memory.approvedAssets.logos.map((logo, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-zinc-200 block text-xs truncate max-w-[140px]">{logo.name}</span>
                        <span className="text-zinc-400 text-xs">{logo.format}</span>
                      </div>
                      {logo.isPrimary && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Approved Products & Forbidden Claims */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <h4 className="text-xs font-bold text-zinc-100 border-b border-zinc-800 pb-2">
              Approved Products & Regulated Claims
            </h4>

            <div className="space-y-2.5">
              {memory.productDetails.map((prod, idx) => (
                <div key={idx} className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="font-bold text-zinc-100 block text-xs">{prod.name}</span>
                  <p className="text-xs text-zinc-400 font-sans">{prod.description}</p>
                  {prod.forbiddenClaims && prod.forbiddenClaims.length > 0 && (
                    <div className="pt-1 text-xs text-red-300">
                      <span className="font-bold">Forbidden Claims:</span> {prod.forbiddenClaims.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Creative History & Aesthetics */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <h4 className="text-xs font-bold text-zinc-100 border-b border-zinc-800 pb-2">
              Creative History & Styling
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-emerald-400 text-xs font-bold block mb-1">Winning Aesthetics:</span>
                <ul className="list-disc list-inside text-zinc-300 text-xs space-y-0.5">
                  {memory.creativeHistory.winningStyles.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-red-400 text-xs font-bold block mb-1">Rejected Aesthetics:</span>
                <ul className="list-disc list-inside text-zinc-400 text-xs space-y-0.5">
                  {memory.creativeHistory.rejectedStyles.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
