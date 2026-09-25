import React from 'react';
import Link from 'next/link';
import { Job } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { ArrowLeft, Clock, DollarSign, ExternalLink, Calendar, Building, Globe } from 'lucide-react';

interface JobHeaderProps {
  job: Job;
}

export function JobHeader({ job }: JobHeaderProps) {
  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'New':
        return <Badge variant="secondary">New Intake</Badge>;
      case 'Needs Review':
        return <Badge variant="warning">Needs Review</Badge>;
      case 'Approved':
        return <Badge variant="success">Approved & Locked</Badge>;
      case 'Generating':
        return <Badge variant="purple">Generating Models</Badge>;
      case 'QA':
        return <Badge variant="warning">QA Sign-off Pending</Badge>;
      case 'Delivered':
        return <Badge variant="outline">Delivered</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/60 pb-4 pt-2">
      {/* Top back button row */}
      <div className="flex items-center justify-between mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to pipeline</span>
        </Link>

        <div className="flex items-center gap-2">
          {getStatusBadge(job.status)}
          <Badge variant="outline" className="text-zinc-400">
            ID: {job.id}
          </Badge>
        </div>
      </div>

      {/* Main Title & Key Specs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            {job.title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1 text-zinc-300">
              <Building className="h-3.5 w-3.5 text-zinc-400" />
              {job.clientName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-zinc-400" />
              Source: <strong className="text-zinc-200">{job.source}</strong> ({job.channelFeePct}% fee)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              Due: <strong className="text-zinc-200">{formatDate(job.deadline)}</strong>
            </span>
          </div>
        </div>

        {/* Client Budget Pill */}
        <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2 self-start lg:self-auto">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Client Fixed Price
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {formatCurrency(job.budget)}
            </div>
          </div>
          {job.maxApprovedBudget && (
            <div className="pl-3 border-l border-zinc-800">
              <div className="text-xs uppercase tracking-wider text-zinc-400">
                Max Spend Approved
              </div>
              <div className="text-sm font-bold text-amber-300">
                {formatCurrency(job.maxApprovedBudget)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
