// Focused test suite for Schema Validation, Malformed Responses, Missing Fields, and Deterministic Rules
import {
  validateBriefAnalysis,
  BriefAnalysisSchema,
} from './src/lib/schemas/brief-analysis-schema.ts';
import { DeterministicEvaluator } from './src/lib/services/deterministic-evaluator.ts';
import { AIAnalyzer } from './src/lib/services/ai-analyzer.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('======================================================');
console.log('RUNNING FOCUSED BRIEFS & DETERMINISTIC RULES TEST SUITE');
console.log('======================================================\n');

// Valid baseline sample
const VALID_SAMPLE = {
  jobType: 'luxury_concept_film',
  conciseSummary: '45-second luxury fragrance teaser featuring volcanic basalt landscapes and liquid glass physics.',
  deliverables: [
    {
      name: 'Hero Narrative Teaser',
      type: 'Hero Video',
      format: 'ProRes 422 HQ',
      aspectRatio: '16:9',
      durationSeconds: 45,
      resolution: '3840x2160',
      exactTextRequirements: ['From the ash of stillness, presence is born.'],
      description: 'Cinematic master video with camera motion.',
    },
  ],
  suppliedAssets: ['Moodboard_Basalt.pdf', 'Bottle_3D_Mock.jpg'],
  missingAssets: [],
  questionsForClient: ['Confirm audio mix stems delivery preference.'],
  brandConstraints: ['No oversaturated colors; maintain cold Nordic palette.'],
  rightsAndConsentFlags: [
    {
      flag: 'Original Synthetic Aesthetic',
      severity: 'low',
      details: 'Fully original generative compositions; no trademarked logos or likeness.',
    },
  ],
  technicalRisks: ['Temporal coherence on fluid reflections.'],
  revisionRisk: 'low',
  confidence: 95,
  decision: 'accept',
  decisionReasons: ['Feasible with Higgsfield DoP camera and cinematic motion models.'],
  proposedWorkflow: [
    {
      stepName: 'Concept Keyframe',
      capabilityNeeded: 'keyframe_generation',
      purpose: 'Generate master still frames.',
    },
    {
      stepName: 'Camera Motion',
      capabilityNeeded: 'camera_motion',
      purpose: 'Execute 360 degree orbital push-in.',
    },
    {
      stepName: 'Video Gen',
      capabilityNeeded: 'video_scene_synthesis',
      purpose: 'Synthesize fluid dynamics.',
    },
  ],
  estimatedAttemptsByStep: {
    'Concept Keyframe': 3,
    'Camera Motion': 2,
    'Video Gen': 4,
  },
  assumptions: ['Client will provide final audio stems or approve synthetic VO.'],
};

// ----------------------------------------------------
// GROUP 1: SCHEMA VALIDATION TESTS
// ----------------------------------------------------
console.log('--- TEST GROUP 1: Schema Validation ---');

// Test 1.1: Valid payload passes
const val1 = validateBriefAnalysis(VALID_SAMPLE);
assert(val1.success === true, 'Valid sample passes schema validation cleanly');

// Test 1.2: Check durationSeconds >= 0 constraint
const negativeDurationSample = JSON.parse(JSON.stringify(VALID_SAMPLE));
negativeDurationSample.deliverables[0].durationSeconds = -5;
const valNegativeDuration = validateBriefAnalysis(negativeDurationSample);
assert(valNegativeDuration.success === false, 'Negative duration is rejected by schema');

// Test 1.3: Check confidence must be between 0 and 100
const invalidConfidenceSample = JSON.parse(JSON.stringify(VALID_SAMPLE));
invalidConfidenceSample.confidence = 150;
const valConfidence = validateBriefAnalysis(invalidConfidenceSample);
assert(valConfidence.success === false, 'Confidence > 100 is rejected by schema');


// ----------------------------------------------------
// GROUP 2: MISSING FIELDS TESTS
// ----------------------------------------------------
console.log('\n--- TEST GROUP 2: Missing Fields Validation ---');

// Test 2.1: Missing top-level required field 'deliverables'
const missingDeliverables = JSON.parse(JSON.stringify(VALID_SAMPLE));
delete missingDeliverables.deliverables;
const valMissingDel = validateBriefAnalysis(missingDeliverables);
assert(valMissingDel.success === false, 'Omission of deliverables array fails validation');
assert(valMissingDel.errors?.some(e => e.includes('deliverables')), 'Error message cites missing deliverables');

// Test 2.2: Missing 'rightsAndConsentFlags'
const missingFlags = JSON.parse(JSON.stringify(VALID_SAMPLE));
delete missingFlags.rightsAndConsentFlags;
const valMissingFlags = validateBriefAnalysis(missingFlags);
assert(valMissingFlags.success === false, 'Omission of rightsAndConsentFlags fails validation');

// Test 2.3: Empty deliverables array (min(1) required)
const emptyDeliverables = JSON.parse(JSON.stringify(VALID_SAMPLE));
emptyDeliverables.deliverables = [];
const valEmptyDel = validateBriefAnalysis(emptyDeliverables);
assert(valEmptyDel.success === false, 'Empty deliverables array fails min(1) constraint');

// Test 2.4: Missing subfield in deliverable item (missing 'resolution')
const missingSubfield = JSON.parse(JSON.stringify(VALID_SAMPLE));
delete missingSubfield.deliverables[0].resolution;
const valMissingSub = validateBriefAnalysis(missingSubfield);
assert(valMissingSub.success === false, 'Missing resolution in deliverable item fails validation');


// ----------------------------------------------------
// GROUP 3: MALFORMED RESPONSES TESTS
// ----------------------------------------------------
console.log('\n--- TEST GROUP 3: Malformed & Invalid Types ---');

// Test 3.1: Null or primitives passed
assert(validateBriefAnalysis(null).success === false, 'Null payload fails validation');
assert(validateBriefAnalysis('invalid string').success === false, 'Plain string fails validation');
assert(validateBriefAnalysis(42).success === false, 'Number payload fails validation');

// Test 3.2: Invalid enum value for revisionRisk (e.g. 'critical')
const invalidRevisionRisk = JSON.parse(JSON.stringify(VALID_SAMPLE));
invalidRevisionRisk.revisionRisk = 'critical';
const valRevRisk = validateBriefAnalysis(invalidRevisionRisk);
assert(valRevRisk.success === false, 'Invalid revisionRisk enum value is rejected');

// Test 3.3: Invalid enum value for decision (e.g. 'maybe')
const invalidDecision = JSON.parse(JSON.stringify(VALID_SAMPLE));
invalidDecision.decision = 'maybe';
const valDecision = validateBriefAnalysis(invalidDecision);
assert(valDecision.success === false, 'Invalid decision enum value is rejected');

// Test 3.4: Invalid severity in rightsAndConsentFlags
const invalidSeverity = JSON.parse(JSON.stringify(VALID_SAMPLE));
invalidSeverity.rightsAndConsentFlags[0].severity = 'fatal';
const valSeverity = validateBriefAnalysis(invalidSeverity);
assert(valSeverity.success === false, 'Invalid flag severity enum is rejected');


// ----------------------------------------------------
// GROUP 4: DETERMINISTIC ACCEPT/REVIEW/REJECT RULES
// ----------------------------------------------------
console.log('\n--- TEST GROUP 4: Deterministic Decision & Pricing Rules ---');

const baseJob = {
  budget: 4000,
  deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
  source: 'Upwork',
  channelFeePct: 10,
  contingencyPct: 15,
  referenceAssets: [{ name: 'moodboard.pdf' }],
  rawBrief: 'Create a 45s luxury concept film.',
};

// Test 4.1: Clean, well-scoped job -> Must accept
const cleanEval = DeterministicEvaluator.evaluate(baseJob, VALID_SAMPLE);
assert(cleanEval.decision === 'accept', 'Clean profitable brief evaluates to "accept"');
assert(cleanEval.expectedMarginPct > 70, `Healthy gross margin calculated (${cleanEval.expectedMarginPct}%)`);
assert(cleanEval.calculatedProductionCost > 0, `Deterministic production cost calculated ($${cleanEval.calculatedProductionCost})`);

// Test 4.2: Deceptive Impersonation -> Must reject
const deceptiveSample = JSON.parse(JSON.stringify(VALID_SAMPLE));
deceptiveSample.rightsAndConsentFlags = [
  {
    flag: 'Deceptive impersonation requested',
    severity: 'high',
    details: 'Client wants deepfake impersonation without consent to promote a crypto scheme.',
  },
];
const deceptiveEval = DeterministicEvaluator.evaluate(baseJob, deceptiveSample);
assert(deceptiveEval.decision === 'reject', 'Deceptive impersonation triggers deterministic "reject"');
assert(deceptiveEval.reasons.some(r => r.includes('impersonation')), 'Rejection reason cites impersonation policy');

// Test 4.3: Budget Deficit (Cost + Contingency > Budget) -> Must reject
const lowBudgetJob = { ...baseJob, budget: 5 }; // $5 budget
const deficitEval = DeterministicEvaluator.evaluate(lowBudgetJob, VALID_SAMPLE);
assert(deficitEval.decision === 'reject', 'Budget deficit triggers deterministic "reject"');
assert(deficitEval.reasons.some(r => r.includes('exceeds the client budget')), 'Rejection reason cites budget deficit');

// Test 4.4: Exact Logos / Packaging Text -> Must trigger Human Review
const logoSample = JSON.parse(JSON.stringify(VALID_SAMPLE));
logoSample.rightsAndConsentFlags = [
  {
    flag: 'Exact logo and packaging text rendering required',
    severity: 'medium',
    details: 'Client provided low-res screenshot of proprietary beverage can packaging.',
  },
];
const logoEval = DeterministicEvaluator.evaluate(baseJob, logoSample);
assert(logoEval.decision === 'human_review', 'Exact logo/packaging text triggers deterministic "human_review"');
assert(logoEval.reasons.some(r => r.includes('Exact brand logos') || r.includes('logos')), 'Review reason cites logo/packaging requirement');

// Test 4.5: Real Person Likeness or Voice Clone -> Must trigger Human Review
const likenessSample = JSON.parse(JSON.stringify(VALID_SAMPLE));
likenessSample.rightsAndConsentFlags = [
  {
    flag: 'Real person likeness requested',
    severity: 'high',
    details: 'Client requested celebrity likeness and voice clone style.',
  },
];
const likenessEval = DeterministicEvaluator.evaluate(baseJob, likenessSample);
assert(likenessEval.decision === 'human_review', 'Real person likeness/voice triggers deterministic "human_review"');

// Test 4.6: Licensed Music / Soundalike -> Must trigger Human Review
const musicSample = JSON.parse(JSON.stringify(VALID_SAMPLE));
musicSample.rightsAndConsentFlags = [
  {
    flag: 'Licensed music sync requested',
    severity: 'high',
    details: 'Client requested Daft Punk soundalike track.',
  },
];
const musicEval = DeterministicEvaluator.evaluate(baseJob, musicSample);
assert(musicEval.decision === 'human_review', 'Licensed/soundalike music triggers deterministic "human_review"');

// Test 4.7: Missing Price Data (Unknown Capability) -> Route to Human Review instead of guessing
const unknownCapSample = JSON.parse(JSON.stringify(VALID_SAMPLE));
unknownCapSample.proposedWorkflow.push({
  stepName: 'Quantum Particle Volumetric Field',
  capabilityNeeded: 'quantum_hologram_render', // Non-existent in catalog
  purpose: 'Simulate holographic field.',
});
const missingPriceEval = DeterministicEvaluator.evaluate(baseJob, unknownCapSample);
assert(missingPriceEval.decision === 'human_review', 'Missing price data routes to "human_review" instead of guessing');
assert(missingPriceEval.missingPriceCapabilities.includes('quantum_hologram_render'), 'Missing capability correctly identified');
assert(missingPriceEval.reasons.some(r => r.includes('Missing catalog pricing')), 'Reason explicitly explains route to human review');


// ----------------------------------------------------
// GROUP 5: AI ANALYZER REALISTIC MOCK & INTEGRATION
// ----------------------------------------------------
console.log('\n--- TEST GROUP 5: AIAnalyzer Pipeline & Mock Fallback ---');

const mockInput = {
  jobId: 'test-job-01',
  rawBrief: 'Need a 45s cinematic teaser for Aethelgard luxury fragrance with volcanic obsidian rock and liquid glass.',
  budget: 4200,
  deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
  source: 'Upwork',
  clientNotes: 'Client wants Denis Villeneuve mood.',
  referenceAssets: [{ name: 'mood.jpg', url: 'https://example.com/mood.jpg', type: 'image' }],
};

const fullAnalysis = await AIAnalyzer.analyze(mockInput);
assert(fullAnalysis.jobType.length > 0, `Produced jobType: ${fullAnalysis.jobType}`);
assert(fullAnalysis.deliverables.length >= 1, `Produced ${fullAnalysis.deliverables.length} deliverables`);
assert(fullAnalysis.proposedWorkflow.length >= 1, `Produced ${fullAnalysis.proposedWorkflow.length} workflow steps`);
assert(typeof fullAnalysis.confidence === 'number', `Confidence score is a number (${fullAnalysis.confidence}%)`);
assert(['accept', 'human_review', 'reject'].includes(fullAnalysis.decision), `Valid decision returned: ${fullAnalysis.decision}`);
assert(fullAnalysis.calculatedProductionCost > 0, `Deterministic production cost calculated: $${fullAnalysis.calculatedProductionCost}`);

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================');

if (failed > 0) {
  process.exit(1);
}
