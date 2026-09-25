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
} from '@/types';

export interface IJobRepository {
  getAllJobs(): Promise<Job[]>;
  getJobById(id: string): Promise<Job | null>;
  createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'approvalCheckpoints'> & { approvalCheckpoints?: Partial<HumanApprovalCheckpoints> }): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | null>;
  deleteJob(id: string): Promise<boolean>;

  getBriefAnalysis(jobId: string): Promise<BriefAnalysis | null>;
  saveBriefAnalysis(analysis: BriefAnalysis): Promise<BriefAnalysis>;

  getWorkflow(jobId: string): Promise<Workflow | null>;
  saveWorkflow(workflow: Workflow): Promise<Workflow>;
  updateWorkflowStep(jobId: string, stepId: string, updates: Partial<WorkflowStep>): Promise<Workflow | null>;

  getGenerations(jobId: string): Promise<Generation[]>;
  addGeneration(generation: Generation): Promise<Generation>;
  updateGeneration(id: string, updates: Partial<Generation>): Promise<Generation | null>;

  getRevisions(jobId: string): Promise<Revision[]>;
  addRevision(revision: Revision): Promise<Revision>;
  updateRevision(id: string, updates: Partial<Revision>): Promise<Revision | null>;

  // Autonomy & Client Agent Methods
  getAutonomySettings(): Promise<AutonomySettings | null>;
  saveAutonomySettings(settings: AutonomySettings): Promise<AutonomySettings>;

  getClientMemory(clientId: string): Promise<ClientMemory | null>;
  findClientMemoryIdByName(clientName: string): Promise<string | null>;
  saveClientMemory(memory: ClientMemory): Promise<ClientMemory>;

  getClientMessages(jobId: string): Promise<ClientMessage[]>;
  saveClientMessage(message: ClientMessage): Promise<ClientMessage>;

  getRepairRuns(jobId: string): Promise<RepairRun[]>;
  saveRepairRun(run: RepairRun): Promise<RepairRun>;

  getAllAuditLogs(): Promise<AuditLogEntry[]>;
  addAuditLog(entry: AuditLogEntry): Promise<AuditLogEntry>;

  getChangeOrders(jobId: string): Promise<ChangeOrder[]>;
  saveChangeOrder(order: ChangeOrder): Promise<ChangeOrder>;

  getScopeProposal(jobId: string): Promise<ScopeProposal | null>;
  saveScopeProposal(proposal: ScopeProposal): Promise<ScopeProposal>;

  // Atomic Budget Reservation & Spend Management
  reserveSpend(jobId: string, amountUSD: number, purpose: string, stepId?: string): Promise<import('@/types').AtomicSpendResult>;
  commitSpend(reservationId: string, actualAmountUSD: number): Promise<boolean>;
  releaseSpend(reservationId: string): Promise<boolean>;
  getActiveReservations(jobId?: string): Promise<import('@/types').SpendReservation[]>;

  // Message 3-Phase Lifecycle & Sealing
  authoriseMessage(messageId: string, operatorName: string): Promise<ClientMessage>;
  dispatchMessage(messageId: string): Promise<ClientMessage>;

  // Server-Enforced Final Delivery Sign-off
  recordFinalDelivery(
    jobId: string,
    operatorSignOff: { operatorName: string; signatureToken: string; notes?: string }
  ): Promise<Job>;

  // Client Tenant Isolation Check
  validateClientAccess(jobId: string, clientId: string): Promise<boolean>;

  resetToSeeds(): Promise<void>;
}

