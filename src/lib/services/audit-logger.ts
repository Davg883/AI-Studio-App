import { AuditLogEntry, AuditEventType } from '@/types/autonomy';
import { getRepository } from '../repository/json-repository';

export class AuditLogger {
  /**
   * Log an event into the central autonomy audit ledger
   */
  static async log(entry: {
    jobId: string;
    jobTitle?: string;
    eventType: AuditEventType;
    actor: 'agent' | 'human_operator' | 'client';
    actorName?: string;
    summary: string;
    details: string;
    spendDeltaUSD?: number;
    cumulativeSpendUSD?: number;
    riskFlag?: string;
    meta?: Record<string, any>;
  }): Promise<AuditLogEntry> {
    const repo = getRepository();

    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      jobId: entry.jobId,
      jobTitle: entry.jobTitle,
      eventType: entry.eventType,
      actor: entry.actor,
      actorName: entry.actorName || (entry.actor === 'agent' ? 'Astra Client Agent' : 'Human Operator'),
      summary: entry.summary,
      details: entry.details,
      spendDeltaUSD: entry.spendDeltaUSD,
      cumulativeSpendUSD: entry.cumulativeSpendUSD,
      riskFlag: entry.riskFlag,
      meta: entry.meta,
    };

    await repo.addAuditLog(newEntry);
    return newEntry;
  }

  static async getLogsForJob(jobId: string): Promise<AuditLogEntry[]> {
    const repo = getRepository();
    const all = await repo.getAllAuditLogs();
    return all.filter(l => l.jobId === jobId);
  }

  static async getAllLogs(): Promise<AuditLogEntry[]> {
    const repo = getRepository();
    return repo.getAllAuditLogs();
  }
}
