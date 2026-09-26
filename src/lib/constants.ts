// Production model catalogue and pricing live in src/lib/models/capability-catalog.ts

export const SOURCE_DEFAULT_FEES: Record<string, number> = {
  Upwork: 10,
  Fiverr: 20,
  Contra: 0,
  Email: 0,
  'Direct Lead': 0,
};

export const OPERATOR_GUARDRAILS = {
  DISALLOWED_AUTONOMOUS_ACTIONS: [
    'Scraping marketplace listings or profiles',
    'Auto-submitting proposals or bids to Upwork/Fiverr/Contra',
    'Auto-accepting client offers or contracts',
    'Auto-messaging clients via 3rd party marketplace APIs',
    'Auto-delivering files through marketplace deliverables interface without operator sign-off',
  ],
  MANDATORY_HUMAN_APPROVAL_POINTS: [
    'Initial workflow generation plan approval',
    'Maximum production budget ceiling',
    'Any budget overrun or incremental cost increase (> $0)',
    'Material changes to workflow steps or creative prompt intent',
    'Rights / trademark / soundalike likeness issues',
    'Final client deliverables export and sign-off',
  ],
};
