import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Job,
  BriefAnalysis,
  Workflow,
  WorkflowStep,
  Generation,
  Revision,
  HumanApprovalCheckpoints,
  AutonomySettings,
  ClientMemory,
  ClientMessage,
  RepairRun,
  AuditLogEntry,
  ChangeOrder,
  ScopeProposal,
  SpendReservation,
  AtomicSpendResult,
} from '@/types';
import { IJobRepository } from './interfaces';
import { SEED_JOBS, SEED_ANALYSES, SEED_WORKFLOWS, SEED_GENERATIONS, SEED_REVISIONS } from './seeds';

interface StoreData {
  jobs: Job[];
  analyses: Record<string, BriefAnalysis>;
  workflows: Record<string, Workflow>;
  generations: Record<string, Generation[]>;
  revisions: Record<string, Revision[]>;
  autonomySettings?: AutonomySettings;
  clientMemory?: Record<string, ClientMemory>;
  clientMessages?: Record<string, ClientMessage[]>;
  repairRuns?: Record<string, RepairRun[]>;
  auditLogs?: AuditLogEntry[];
  changeOrders?: Record<string, ChangeOrder[]>;
  scopeProposals?: Record<string, ScopeProposal>;
  spendReservations?: Record<string, SpendReservation[]>;
}


export class JsonJobRepository implements IJobRepository {
  private filePath: string;
  private memoryStore: StoreData | null = null;
  private lastMtime: number = 0;

  constructor() {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        // Fallback or ignore in readonly environments
      }
    }
    this.filePath = path.join(dataDir, 'studio_store.json');
  }

  private loadStore(): StoreData {
    try {
      if (fs.existsSync(this.filePath)) {
        const stats = fs.statSync(this.filePath);
        if (this.memoryStore && stats.mtimeMs === this.lastMtime) {
          return this.memoryStore;
        }
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.memoryStore = JSON.parse(fileContent);
        this.lastMtime = stats.mtimeMs;
        return this.memoryStore!;
      }
    } catch (err) {
      console.warn('Error reading store file, initializing with seeds:', err);
    }

    // Default to seeds
    const defaultData: StoreData = {
      jobs: JSON.parse(JSON.stringify(SEED_JOBS)),
      analyses: JSON.parse(JSON.stringify(SEED_ANALYSES)),
      workflows: JSON.parse(JSON.stringify(SEED_WORKFLOWS)),
      generations: JSON.parse(JSON.stringify(SEED_GENERATIONS)),
      revisions: JSON.parse(JSON.stringify(SEED_REVISIONS)),
    };

    this.memoryStore = defaultData;
    this.saveStore();
    return defaultData;
  }

  private saveStore(): void {
    if (!this.memoryStore) return;
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const tempPath = `${this.filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.memoryStore, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
      try {
        this.lastMtime = fs.statSync(this.filePath).mtimeMs;
      } catch (e) {}
    } catch (err) {
      console.warn('Could not write store to file atomically, persisting in-memory:', err);
    }
  }

  async getAllJobs(): Promise<Job[]> {
    const store = this.loadStore();
    return store.jobs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getJobById(id: string): Promise<Job | null> {
    const store = this.loadStore();
    return store.jobs.find(j => j.id === id) || null;
  }

  async createJob(
    input: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'approvalCheckpoints'> & {
      approvalCheckpoints?: Partial<HumanApprovalCheckpoints>;
    }
  ): Promise<Job> {
    const store = this.loadStore();
    const now = new Date().toISOString();
    const id = `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newJob: Job = {
      ...input,
      id,
      approvalCheckpoints: {
        workflowApproved: false,
        maxBudgetApproved: false,
        rightsCleared: false,
        finalDeliveryApproved: false,
        ...input.approvalCheckpoints,
      },
      createdAt: now,
      updatedAt: now,
    };

    store.jobs.unshift(newJob);
    this.saveStore();
    return newJob;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
    const store = this.loadStore();
    const index = store.jobs.findIndex(j => j.id === id);
    if (index === -1) return null;

    const existing = store.jobs[index];
    const updated: Job = {
      ...existing,
      ...updates,
      approvalCheckpoints: {
        ...existing.approvalCheckpoints,
        ...(updates.approvalCheckpoints || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    store.jobs[index] = updated;
    this.saveStore();
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    const store = this.loadStore();
    const initialLen = store.jobs.length;
    store.jobs = store.jobs.filter(j => j.id !== id);
    delete store.analyses[id];
    delete store.workflows[id];
    delete store.generations[id];
    delete store.revisions[id];
    this.saveStore();
    return store.jobs.length < initialLen;
  }

  async getBriefAnalysis(jobId: string): Promise<BriefAnalysis | null> {
    const store = this.loadStore();
    return store.analyses[jobId] || null;
  }

  async saveBriefAnalysis(analysis: BriefAnalysis): Promise<BriefAnalysis> {
    const store = this.loadStore();
    store.analyses[analysis.jobId] = analysis;
    this.saveStore();
    return analysis;
  }

  async getWorkflow(jobId: string): Promise<Workflow | null> {
    const store = this.loadStore();
    return store.workflows[jobId] || null;
  }

  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    const store = this.loadStore();
    store.workflows[workflow.jobId] = workflow;
    this.saveStore();
    return workflow;
  }

  async updateWorkflowStep(
    jobId: string,
    stepId: string,
    updates: Partial<WorkflowStep>
  ): Promise<Workflow | null> {
    const store = this.loadStore();
    const wf = store.workflows[jobId];
    if (!wf) return null;

    const stepIndex = wf.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return null;

    wf.steps[stepIndex] = {
      ...wf.steps[stepIndex],
      ...updates,
    };

    // Recompute total estimated cost
    wf.totalEstimatedCost = Number(
      wf.steps.reduce((sum, s) => sum + s.estimatedTotalCost, 0).toFixed(2)
    );

    this.saveStore();
    return wf;
  }

  async getGenerations(jobId: string): Promise<Generation[]> {
    const store = this.loadStore();
    return store.generations[jobId] || [];
  }

  async addGeneration(generation: Generation): Promise<Generation> {
    const store = this.loadStore();
    if (!store.generations[generation.jobId]) {
      store.generations[generation.jobId] = [];
    }
    store.generations[generation.jobId].push(generation);
    this.saveStore();
    return generation;
  }

  async updateGeneration(id: string, updates: Partial<Generation>): Promise<Generation | null> {
    const store = this.loadStore();
    for (const jobId of Object.keys(store.generations)) {
      const list = store.generations[jobId];
      const idx = list.findIndex(g => g.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.saveStore();
        return list[idx];
      }
    }
    return null;
  }

  async getRevisions(jobId: string): Promise<Revision[]> {
    const store = this.loadStore();
    return store.revisions[jobId] || [];
  }

  async addRevision(revision: Revision): Promise<Revision> {
    const store = this.loadStore();
    if (!store.revisions[revision.jobId]) {
      store.revisions[revision.jobId] = [];
    }
    store.revisions[revision.jobId].unshift(revision);
    this.saveStore();
    return revision;
  }

  async updateRevision(id: string, updates: Partial<Revision>): Promise<Revision | null> {
    const store = this.loadStore();
    for (const jobId of Object.keys(store.revisions)) {
      const list = store.revisions[jobId];
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.saveStore();
        return list[idx];
      }
    }
    return null;
  }

  // --- Autonomy & Client Agent Methods ---

  async getAutonomySettings(): Promise<AutonomySettings | null> {
    const store = this.loadStore();
    return store.autonomySettings || null;
  }

  async saveAutonomySettings(settings: AutonomySettings): Promise<AutonomySettings> {
    const store = this.loadStore();
    store.autonomySettings = settings;
    this.saveStore();
    return settings;
  }

  async getClientMemory(clientId: string): Promise<ClientMemory | null> {
    const store = this.loadStore();
    if (!store.clientMemory) return null;
    return store.clientMemory[clientId] || null;
  }

  async findClientMemoryIdByName(clientName: string): Promise<string | null> {
    const store = this.loadStore();
    const target = (clientName || '').trim().toLowerCase();
    if (!target || !store.clientMemory) return null;
    // Job client names often carry a contact suffix, e.g. "Luminary Botanicals (Evelyn Thorne)"
    const match = Object.values(store.clientMemory).find(m => {
      const name = (m.clientName || '').trim().toLowerCase();
      return name.length > 0 && (target === name || target.startsWith(name));
    });
    return match?.clientId ?? null;
  }

  async saveClientMemory(memory: ClientMemory): Promise<ClientMemory> {
    const store = this.loadStore();
    if (!store.clientMemory) store.clientMemory = {};
    store.clientMemory[memory.clientId] = memory;
    this.saveStore();
    return memory;
  }

  async getClientMessages(jobId: string): Promise<ClientMessage[]> {
    const store = this.loadStore();
    if (!store.clientMessages) return [];
    return store.clientMessages[jobId] || [];
  }

  async saveClientMessage(message: ClientMessage): Promise<ClientMessage> {
    const store = this.loadStore();
    if (!store.clientMessages) store.clientMessages = {};
    if (!store.clientMessages[message.jobId]) store.clientMessages[message.jobId] = [];

    const existingIdx = store.clientMessages[message.jobId].findIndex(m => m.id === message.id);
    if (existingIdx !== -1) {
      store.clientMessages[message.jobId][existingIdx] = message;
    } else {
      store.clientMessages[message.jobId].unshift(message);
    }
    this.saveStore();
    return message;
  }

  async getRepairRuns(jobId: string): Promise<RepairRun[]> {
    const store = this.loadStore();
    if (!store.repairRuns) return [];
    return store.repairRuns[jobId] || [];
  }

  async saveRepairRun(run: RepairRun): Promise<RepairRun> {
    const store = this.loadStore();
    if (!store.repairRuns) store.repairRuns = {};
    if (!store.repairRuns[run.jobId]) store.repairRuns[run.jobId] = [];

    const existingIdx = store.repairRuns[run.jobId].findIndex(r => r.id === run.id);
    if (existingIdx !== -1) {
      store.repairRuns[run.jobId][existingIdx] = run;
    } else {
      store.repairRuns[run.jobId].unshift(run);
    }
    this.saveStore();
    return run;
  }

  async getAllAuditLogs(): Promise<AuditLogEntry[]> {
    const store = this.loadStore();
    return store.auditLogs || [];
  }

  async addAuditLog(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const store = this.loadStore();
    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift(entry);
    this.saveStore();
    return entry;
  }

  async getChangeOrders(jobId: string): Promise<ChangeOrder[]> {
    const store = this.loadStore();
    if (!store.changeOrders) return [];
    return store.changeOrders[jobId] || [];
  }

  async saveChangeOrder(order: ChangeOrder): Promise<ChangeOrder> {
    const store = this.loadStore();
    if (!store.changeOrders) store.changeOrders = {};
    if (!store.changeOrders[order.jobId]) store.changeOrders[order.jobId] = [];

    const existingIdx = store.changeOrders[order.jobId].findIndex(c => c.id === order.id);
    if (existingIdx !== -1) {
      store.changeOrders[order.jobId][existingIdx] = order;
    } else {
      store.changeOrders[order.jobId].unshift(order);
    }
    this.saveStore();
    return order;
  }

  async getScopeProposal(jobId: string): Promise<ScopeProposal | null> {
    const store = this.loadStore();
    if (!store.scopeProposals) return null;
    return store.scopeProposals[jobId] || null;
  }

  async saveScopeProposal(proposal: ScopeProposal): Promise<ScopeProposal> {
    const store = this.loadStore();
    if (!store.scopeProposals) store.scopeProposals = {};
    store.scopeProposals[proposal.jobId] = proposal;
    this.saveStore();
    return proposal;
  }

  // ---------------------------------------------------------------------------
  // Atomic Budget Reservation & Spend Management
  // ---------------------------------------------------------------------------
  async reserveSpend(
    jobId: string,
    amountUSD: number,
    purpose: string,
    stepId?: string
  ): Promise<AtomicSpendResult> {
    const store = this.loadStore();
    const job = store.jobs.find(j => j.id === jobId);
    if (!job) {
      return {
        success: false,
        currentSpendUSD: 0,
        reservedSpendUSD: 0,
        remainingBudgetUSD: 0,
        error: `Job ${jobId} not found.`,
      };
    }

    const generations = store.generations[jobId] || [];
    const currentActualSpend = generations.reduce(
      (acc, g) => acc + (g.actualCost || g.costEstimate || 0),
      0
    );

    const now = new Date().getTime();
    if (!store.spendReservations) store.spendReservations = {};
    if (!store.spendReservations[jobId]) store.spendReservations[jobId] = [];

    // Filter active (unexpired, status === 'reserved') reservations
    const activeJobReservations = store.spendReservations[jobId].filter(
      r => r.status === 'reserved' && new Date(r.expiresAt).getTime() > now
    );
    const currentReservedSpend = activeJobReservations.reduce((acc, r) => acc + r.amountUSD, 0);

    const maxBudget = job.maxApprovedBudget || job.budget || 50.0;
    const remainingBudget = Math.max(
      0,
      Number((maxBudget - (currentActualSpend + currentReservedSpend)).toFixed(2))
    );

    if (amountUSD > remainingBudget) {
      return {
        success: false,
        currentSpendUSD: currentActualSpend,
        reservedSpendUSD: currentReservedSpend,
        remainingBudgetUSD: remainingBudget,
        error: `Atomic budget check failed: Requested quote ($${amountUSD.toFixed(2)}) exceeds remaining unreserved budget ($${remainingBudget.toFixed(2)}).`,
      };
    }

    // Account-wide limit check
    const accountLimit = store.autonomySettings?.totalAccountSpendLimitUSD || 1000.0;
    let totalAccountSpend = 0;
    Object.values(store.generations).forEach(gens => {
      totalAccountSpend += gens.reduce((sum, g) => sum + (g.actualCost || g.costEstimate || 0), 0);
    });
    let totalAccountReserved = 0;
    Object.values(store.spendReservations).forEach(resList => {
      totalAccountReserved += resList
        .filter(r => r.status === 'reserved' && new Date(r.expiresAt).getTime() > now)
        .reduce((sum, r) => sum + r.amountUSD, 0);
    });

    if (totalAccountSpend + totalAccountReserved + amountUSD > accountLimit) {
      return {
        success: false,
        currentSpendUSD: currentActualSpend,
        reservedSpendUSD: currentReservedSpend,
        remainingBudgetUSD: remainingBudget,
        error: `Atomic account limit check failed: Total studio spend + reservations ($${(totalAccountSpend + totalAccountReserved + amountUSD).toFixed(2)}) exceeds account ceiling ($${accountLimit.toFixed(2)}).`,
      };
    }

    const reservationId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();
    const newReservation: SpendReservation = {
      id: reservationId,
      jobId,
      amountUSD,
      purpose,
      stepId,
      status: 'reserved',
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    store.spendReservations[jobId].push(newReservation);
    const updatedReserved = currentReservedSpend + amountUSD;
    job.reservedSpend = updatedReserved;

    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      jobId,
      jobTitle: job.title,
      eventType: 'cost_reserved',
      actor: 'agent',
      actorName: 'Atomic Spend Manager',
      summary: `Budget Reserved: $${amountUSD.toFixed(2)} for ${purpose}`,
      details: `Reservation #${reservationId}. Remaining budget: $${(remainingBudget - amountUSD).toFixed(2)}. Expires at: ${expiresAt}.`,
      spendDeltaUSD: amountUSD,
      cumulativeSpendUSD: currentActualSpend + updatedReserved,
    });

    this.saveStore();

    return {
      success: true,
      reservationId,
      currentSpendUSD: currentActualSpend,
      reservedSpendUSD: updatedReserved,
      remainingBudgetUSD: Number((remainingBudget - amountUSD).toFixed(2)),
    };
  }

  async commitSpend(reservationId: string, actualAmountUSD: number): Promise<boolean> {
    const store = this.loadStore();
    let found: SpendReservation | null = null;
    let targetJobId = '';
    for (const [jId, list] of Object.entries(store.spendReservations || {})) {
      const match = list.find(r => r.id === reservationId);
      if (match) {
        found = match;
        targetJobId = jId;
        break;
      }
    }
    if (!found || found.status !== 'reserved') return false;
    found.status = 'committed';

    const job = store.jobs.find(j => j.id === targetJobId);
    if (job) {
      const now = new Date().getTime();
      job.reservedSpend = (store.spendReservations?.[targetJobId] || [])
        .filter(r => r.status === 'reserved' && new Date(r.expiresAt).getTime() > now)
        .reduce((sum, r) => sum + r.amountUSD, 0);
    }

    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      jobId: targetJobId,
      eventType: 'cost_committed',
      actor: 'agent',
      actorName: 'Atomic Spend Manager',
      summary: `Spend Committed: $${actualAmountUSD.toFixed(2)}`,
      details: `Committed against reservation #${reservationId}.`,
      spendDeltaUSD: actualAmountUSD,
    });

    this.saveStore();
    return true;
  }

  async releaseSpend(reservationId: string): Promise<boolean> {
    const store = this.loadStore();
    let found: SpendReservation | null = null;
    let targetJobId = '';
    for (const [jId, list] of Object.entries(store.spendReservations || {})) {
      const match = list.find(r => r.id === reservationId);
      if (match) {
        found = match;
        targetJobId = jId;
        break;
      }
    }
    if (!found || found.status !== 'reserved') return false;
    found.status = 'released';

    const job = store.jobs.find(j => j.id === targetJobId);
    if (job) {
      const now = new Date().getTime();
      job.reservedSpend = (store.spendReservations?.[targetJobId] || [])
        .filter(r => r.status === 'reserved' && new Date(r.expiresAt).getTime() > now)
        .reduce((sum, r) => sum + r.amountUSD, 0);
    }

    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      jobId: targetJobId,
      eventType: 'cost_released',
      actor: 'agent',
      actorName: 'Atomic Spend Manager',
      summary: `Spend Released: $${found.amountUSD.toFixed(2)}`,
      details: `Released unused reservation #${reservationId}.`,
    });

    this.saveStore();
    return true;
  }

  async getActiveReservations(jobId?: string): Promise<SpendReservation[]> {
    const store = this.loadStore();
    const now = new Date().getTime();
    if (!store.spendReservations) return [];
    if (jobId) {
      return (store.spendReservations[jobId] || []).filter(
        r => r.status === 'reserved' && new Date(r.expiresAt).getTime() > now
      );
    }
    const all: SpendReservation[] = [];
    Object.values(store.spendReservations).forEach(list => {
      all.push(...list.filter(r => r.status === 'reserved' && new Date(r.expiresAt).getTime() > now));
    });
    return all;
  }

  // ---------------------------------------------------------------------------
  // Message 3-Phase Lifecycle & Sealing
  // ---------------------------------------------------------------------------
  async authoriseMessage(messageId: string, operatorName: string): Promise<ClientMessage> {
    const store = this.loadStore();
    let target: ClientMessage | null = null;
    for (const list of Object.values(store.clientMessages || {})) {
      const match = list.find(m => m.id === messageId);
      if (match) {
        target = match;
        break;
      }
    }
    if (!target) {
      throw new Error(`Message ${messageId} not found.`);
    }

    const contentToSeal = `${target.subject.trim()}\n---\n${target.body.trim()}`;
    const contentHash = crypto.createHash('sha256').update(contentToSeal, 'utf-8').digest('hex');

    target.status = 'operator_authorised';
    target.contentHash = contentHash;
    target.authorizedBy = operatorName;
    target.authorizedAt = new Date().toISOString();

    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      jobId: target.jobId,
      eventType: 'message_authorised',
      actor: 'human_operator',
      actorName: operatorName,
      summary: `Message Authorised: "${target.subject}"`,
      details: `Sealed with SHA-256 ${contentHash.substring(0, 12)}... Channel: ${target.channel}.`,
    });

    this.saveStore();
    return target;
  }

  async dispatchMessage(messageId: string): Promise<ClientMessage> {
    const store = this.loadStore();
    let target: ClientMessage | null = null;
    for (const list of Object.values(store.clientMessages || {})) {
      const match = list.find(m => m.id === messageId);
      if (match) {
        target = match;
        break;
      }
    }
    if (!target) {
      throw new Error(`Message ${messageId} not found.`);
    }

    if (target.status !== 'operator_authorised') {
      throw new Error(
        `Cannot dispatch message: Status is "${target.status}". Only operator_authorised messages may be dispatched.`
      );
    }

    // Tamper detection: verify content hash has not mutated since authorisation
    const currentContent = `${target.subject.trim()}\n---\n${target.body.trim()}`;
    const currentHash = crypto.createHash('sha256').update(currentContent, 'utf-8').digest('hex');

    if (currentHash !== target.contentHash) {
      target.status = 'drafted';
      target.authorizedBy = undefined;
      target.authorizedAt = undefined;
      this.saveStore();
      throw new Error(
        'Security Invariant Violated: Message content was modified after operator authorisation. The prior approval has been invalidated and the message reverted to draft.'
      );
    }

    target.status = 'dispatched';
    target.dispatchedAt = new Date().toISOString();

    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      jobId: target.jobId,
      eventType: 'message_dispatched',
      actor: 'agent',
      actorName: 'Client Agent Dispatcher',
      summary: `Message Dispatched: "${target.subject}"`,
      details: `Dispatched to ${target.channel} with verified seal ${target.contentHash?.substring(0, 12)}...`,
    });

    this.saveStore();
    return target;
  }

  // ---------------------------------------------------------------------------
  // Server-Enforced Final Delivery Sign-off
  // ---------------------------------------------------------------------------
  async recordFinalDelivery(
    jobId: string,
    operatorSignOff: { operatorName: string; signatureToken: string; notes?: string }
  ): Promise<Job> {
    const store = this.loadStore();
    const job = store.jobs.find(j => j.id === jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found.`);
    }

    if (!operatorSignOff || !operatorSignOff.operatorName || !operatorSignOff.signatureToken) {
      throw new Error(
        'Server-Enforced Invariant: Final delivery strictly requires human operator signatureToken and operatorName.'
      );
    }

    const repairs = store.repairRuns?.[jobId] || [];
    const unverifiedCriticalDefect = repairs.find(
      r => r.status === 'failed' || (r.status === 'escalated' && !r.operatorApproved)
    );
    if (unverifiedCriticalDefect) {
      throw new Error(
        `Cannot deliver job: Critical QA defect in ${unverifiedCriticalDefect.stepId} remains unresolved.`
      );
    }

    job.status = 'Delivered';
    job.approvalCheckpoints.finalDeliveryApproved = true;
    job.approvalCheckpoints.finalDeliveryApprovedBy = operatorSignOff.operatorName;
    job.approvalCheckpoints.finalDeliveryApprovedAt = new Date().toISOString();
    job.activeStage = 'deliver';
    job.nextAction = 'Delivery verified and archived. Initiate post-delivery retention proposal.';
    job.activeBlocker = undefined;

    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      jobId: job.id,
      jobTitle: job.title,
      eventType: 'delivery_signed_off',
      actor: 'human_operator',
      actorName: operatorSignOff.operatorName,
      summary: `Final Delivery Authorised & Signed Off for ${job.title}`,
      details: `Signed by operator ${operatorSignOff.operatorName} (token: ${operatorSignOff.signatureToken.substring(0, 8)}...). Final deliverables released.`,
    });

    this.saveStore();
    return job;
  }

  // ---------------------------------------------------------------------------
  // Client Tenant Isolation Check
  // ---------------------------------------------------------------------------
  async validateClientAccess(jobId: string, clientId: string): Promise<boolean> {
    const store = this.loadStore();
    const job = store.jobs.find(j => j.id === jobId);
    if (!job) return false;
    const clientMem = store.clientMemory?.[clientId];
    if (!clientMem) return true;

    const jobClientNameNormalized = job.clientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const memClientNameNormalized = clientMem.clientName.toLowerCase().replace(/[^a-z0-9]/g, '');

    return (
      jobClientNameNormalized.includes(memClientNameNormalized) ||
      memClientNameNormalized.includes(jobClientNameNormalized)
    );
  }

  async resetToSeeds(): Promise<void> {
    this.memoryStore = {
      jobs: JSON.parse(JSON.stringify(SEED_JOBS)),
      analyses: JSON.parse(JSON.stringify(SEED_ANALYSES)),
      workflows: JSON.parse(JSON.stringify(SEED_WORKFLOWS)),
      generations: JSON.parse(JSON.stringify(SEED_GENERATIONS)),
      revisions: JSON.parse(JSON.stringify(SEED_REVISIONS)),
    };
    this.saveStore();

  }
}

// Global Singleton Instance
declare global {
  var __studioRepository: IJobRepository | undefined;
}

export function getRepository(): IJobRepository {
  // instanceof check: after a dev hot-reload the cached instance belongs to the old class and lacks new methods
  if (!(global.__studioRepository instanceof JsonJobRepository)) {
    global.__studioRepository = new JsonJobRepository();
  }
  return global.__studioRepository;
}
