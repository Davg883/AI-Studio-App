import { ClientMemory } from '@/types/autonomy';
import { getRepository } from '../repository/json-repository';
import { AuditLogger } from './audit-logger';

export class ClientMemoryService {
  /**
   * Retrieves account-level memory for a client
   */
  static async getClientMemory(clientId: string): Promise<ClientMemory | null> {
    const repo = getRepository();
    return repo.getClientMemory(clientId);
  }

  /**
   * Persists or updates client memory
   */
  static async saveClientMemory(memory: ClientMemory): Promise<void> {
    const repo = getRepository();
    await repo.saveClientMemory(memory);

    await AuditLogger.log({
      jobId: 'account-memory',
      eventType: 'model_decision',
      actor: 'agent',
      summary: `Client Memory Updated: ${memory.brandName}`,
      details: `Updated brand guidelines, winning styles, and delivery preferences for account ${memory.clientId}.`,
    });
  }

  /**
   * Hard Privacy & Likeness Invariant:
   * "Never treat an earlier approval as consent for a new person's likeness, voice, or a materially different use."
   */
  static validateConsentReuse(
    memory: ClientMemory | null,
    personOrUse: string
  ): { allowed: boolean; notice: string } {
    if (!memory) {
      return {
        allowed: false,
        notice: 'No client memory on record. Written consent required for any person likeness or voiceover.',
      };
    }

    const authorized = memory.consentFirewall.authorizedPersons.map(p => p.toLowerCase());
    const target = personOrUse.toLowerCase();

    if (authorized.includes(target)) {
      return {
        allowed: true,
        notice: `Consent verified on record for ${personOrUse}. (Note: Consent valid only for agreed campaign scope).`,
      };
    }

    return {
      allowed: false,
      notice: `PRIVACY FIREWALL: Earlier brand approvals do NOT grant consent for new person "${personOrUse}". Separate likeness/voice release required from client.`,
    };
  }
}
