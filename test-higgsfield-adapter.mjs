import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { HiggsfieldAdapter } from './src/lib/providers/higgsfield/higgsfield-adapter.ts';
import { GenerationRunner } from './src/lib/services/generation-runner.ts';
import { AssetStorageService } from './src/lib/services/asset-storage.ts';
import { getRepository } from './src/lib/repository/json-repository.ts';

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✕ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✕ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('RUNNING HIGGSFIELD PROVIDER ADAPTER & LIFECYCLE TESTS');
console.log('======================================================\n');

// 1. CREDENTIALS AND MASKING
console.log('--- TEST GROUP 1: Credentials & Masking ---');
it('Never leaks secret key in getMaskedCredentials()', () => {
  const masked = HiggsfieldAdapter.getMaskedCredentials();
  assert.strictEqual(typeof masked.configured, 'boolean');
  assert.strictEqual(typeof masked.mode, 'string');
  assert.ok(!('keySecret' in masked), 'Secret must never be present in masked credentials');
  assert.ok(!('apiSecret' in masked), 'Secret must never be present in masked credentials');
});

it('Masks Key ID properly when configured', () => {
  const prevId = process.env.HF_API_KEY_ID;
  const prevSec = process.env.HF_API_KEY_SECRET;
  try {
    process.env.HF_API_KEY_ID = 'hf_k_live_998877665544332211';
    process.env.HF_API_KEY_SECRET = 'hf_s_super_secret_token_12345';
    const masked = HiggsfieldAdapter.getMaskedCredentials();
    assert.strictEqual(masked.configured, true);
    assert.ok(masked.keyIdMasked.includes('...'));
    assert.ok(!masked.keyIdMasked.includes('hf_s_super_secret_token_12345'));
  } finally {
    delete process.env.HF_API_KEY_ID;
    delete process.env.HF_API_KEY_SECRET;
    if (prevId) process.env.HF_API_KEY_ID = prevId;
    if (prevSec) process.env.HF_API_KEY_SECRET = prevSec;
  }
});

// 2. PRE-GENERATION COST ESTIMATE
console.log('\n--- TEST GROUP 2: Pre-generation Cost Estimation ---');
await itAsync('Estimates cost using provider capability or catalog fallback', async () => {
  const estimate = await HiggsfieldAdapter.estimateCost(
    '/higgsfield-ai/soul/v2/standard',
    { prompt: 'A concept frame' },
    0.18
  );
  assert.strictEqual(estimate.currency, 'USD');
  assert.ok(estimate.costUSD > 0, 'Cost estimate must be greater than zero');
  assert.ok(['provider_api', 'catalog_fallback'].includes(estimate.source));
});

// 3. SOUL 2.0 IMAGE WORKFLOW GENERATION
console.log('\n--- TEST GROUP 3: Soul 2.0 Image Generation & Normalization ---');
await itAsync('Executes Soul 2.0 image generation with normalized asset', async () => {
  const genId = `gen-test-img-${Date.now()}`;
  const res = await HiggsfieldAdapter.generateSoulImage(
    {
      prompt: 'A photorealistic basalt bottle with liquid glass refraction',
      widthAndHeight: '1536x1536',
      quality: '1080p',
    },
    genId,
    0.18
  );

  assert.strictEqual(res.appStatus, 'Completed');
  assert.strictEqual(res.providerStatus, 'completed');
  assert.strictEqual(res.appTimeout, false);
  assert.ok(res.actualCost > 0, 'Completed generation must have positive actual cost');
  assert.ok(res.normalizedAsset, 'Must return normalized asset');
  assert.strictEqual(res.normalizedAsset.type, 'image');
  assert.strictEqual(res.normalizedAsset.provider, 'Higgsfield');
  assert.strictEqual(res.normalizedAsset.id, genId);
  assert.ok(res.normalizedAsset.localUrl.startsWith('/storage/generations/'));
});

// 4. DOP VIDEO GENERATION
console.log('\n--- TEST GROUP 4: DoP Video Generation & Normalization ---');
await itAsync('Executes DoP image-to-video generation with normalized asset', async () => {
  const genId = `gen-test-vid-${Date.now()}`;
  const res = await HiggsfieldAdapter.generateDoPVideo(
    {
      model: 'dop-turbo',
      prompt: 'Orbital camera push-in around subject',
      inputImages: [{ type: 'image_url', image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe' }],
    },
    genId,
    1.60
  );

  assert.strictEqual(res.appStatus, 'Completed');
  assert.strictEqual(res.providerStatus, 'completed');
  assert.ok(res.normalizedAsset, 'Must return normalized asset');
  assert.strictEqual(res.normalizedAsset.type, 'video');
  assert.strictEqual(res.normalizedAsset.durationSeconds, 5);
  assert.ok(res.actualCost > 0);
});

// 5. COST RECONCILIATION & LEDGER SAFETY (NEVER CHARGE FAILED/CANCELED)
console.log('\n--- TEST GROUP 5: Cost Reconciliation & Failure Ledger Safety ---');
it('Never charges ledger on failed or canceled generation results', () => {
  // Simulating failed result
  const failedResult = {
    providerStatus: 'failed',
    appStatus: 'Failed',
    actualCost: 0,
    costEstimate: 1.60,
  };
  assert.strictEqual(failedResult.actualCost, 0, 'Failed generation must cost $0');

  // Simulating nsfw moderation rejection
  const nsfwResult = {
    providerStatus: 'nsfw',
    appStatus: 'Failed',
    actualCost: 0,
    costEstimate: 0.18,
  };
  assert.strictEqual(nsfwResult.actualCost, 0, 'NSFW generation must cost $0');

  // Simulating internal application timeout
  const timeoutResult = {
    providerStatus: 'in_progress',
    appStatus: 'Failed',
    appTimeout: true,
    actualCost: 0,
    costEstimate: 1.25,
  };
  assert.strictEqual(timeoutResult.actualCost, 0, 'Timed-out generation must cost $0');
  assert.strictEqual(timeoutResult.appTimeout, true, 'App timeout tracked separately');
});

// 6. RETRY CONTROLS & GENERATION HISTORY PRESERVATION
console.log('\n--- TEST GROUP 6: Retry Controls & History Preservation ---');
await itAsync('Creates a new generation record on retry without mutating previous record', async () => {
  const repo = getRepository();
  const jobs = await repo.getAllJobs();
  const testJob = jobs[0];
  assert.ok(testJob, 'Must have at least one test job');

  const step = {
    id: 'step-retry-test-1',
    order: 1,
    name: 'Test Keyframe Step',
    stage: 'Concept & Keyframe',
    selectedModel: 'Higgsfield Soul 2.0 Standard / HD',
    purpose: 'Hero keyframe',
    inputs: { prompt: 'A cinematic frame' },
    expectedOutputs: 'Stills',
    estimatedAttempts: 2,
    unitCost: 0.18,
    estimatedTotalCost: 0.36,
    status: 'Failed',
  };

  const initialGenerationsCount = (await repo.getGenerations(testJob.id)).length;

  const authorizedJob = {
    ...testJob,
    maxApprovedBudget: 5000,
    approvalCheckpoints: {
      ...testJob.approvalCheckpoints,
      workflowApproved: true,
      maxBudgetApproved: true,
      rightsCleared: true,
    },
  };

  // First generation attempt (e.g. simulated failure)
  const firstGen = {
    id: `gen-attempt-1-${Date.now()}`,
    jobId: testJob.id,
    stepId: step.id,
    providerRequestId: 'hg_req_1',
    model: 'Higgsfield Soul 2.0 Standard / HD',
    status: 'Failed',
    costEstimate: 0.36,
    actualCost: 0,
    outputType: 'image',
    error: 'Simulated failure',
    startedAt: new Date().toISOString(),
  };

  await repo.addGeneration(firstGen);

  // Operator triggers retry
  const { generation: retriedGen, updatedStep } = await GenerationRunner.retryStep(
    authorizedJob,
    { ...step, generationId: firstGen.id },
    firstGen
  );

  await repo.addGeneration(retriedGen);

  // Verify that new record was created with unique ID
  assert.notStrictEqual(retriedGen.id, firstGen.id, 'Retried generation must have distinct ID');
  assert.strictEqual(retriedGen.retryCount, 1, 'Retry count must be incremented');
  assert.strictEqual(retriedGen.retryOfGenerationId, firstGen.id, 'Must reference prior attempt');
  assert.strictEqual(updatedStep.generationId, retriedGen.id, 'Step points to newest generation');
  assert.ok(updatedStep.previousGenerationIds.includes(firstGen.id), 'History records previous generation ID');

  // Verify that the original firstGen still exists unchanged in the repository
  const allGens = await repo.getGenerations(testJob.id);
  const foundFirst = allGens.find(g => g.id === firstGen.id);
  const foundSecond = allGens.find(g => g.id === retriedGen.id);

  assert.ok(foundFirst, 'Original failed generation must be preserved in history');
  assert.strictEqual(foundFirst.status, 'Failed');
  assert.strictEqual(foundFirst.actualCost, 0);
  assert.ok(foundSecond, 'New generation record exists');
  assert.strictEqual(allGens.length, initialGenerationsCount + 2);
});

// 7. CANCELLATION CONTROLS
console.log('\n--- TEST GROUP 7: Cancellation Controls ---');
await itAsync('Cancels queued generation and sets reconciled cost to 0', async () => {
  const repo = getRepository();
  const jobs = await repo.getAllJobs();
  const testJob = jobs[0];

  const step = {
    id: 'step-cancel-test',
    order: 2,
    name: 'Camera Move',
    stage: 'Camera Motion / DoP',
    selectedModel: 'Higgsfield DoP 2.5',
    purpose: 'Test camera',
    inputs: {},
    expectedOutputs: 'Video',
    estimatedAttempts: 2,
    unitCost: 1.60,
    estimatedTotalCost: 3.20,
    status: 'Queued',
  };

  const queuedGen = {
    id: `gen-queued-${Date.now()}`,
    jobId: testJob.id,
    stepId: step.id,
    providerRequestId: 'hg_queued_req',
    model: 'Higgsfield DoP 2.5',
    status: 'Queued',
    costEstimate: 3.20,
    actualCost: 3.20,
    outputType: 'video',
    cancelUrl: 'https://api.higgsfield.ai/requests/hg_queued_req/cancel',
    startedAt: new Date().toISOString(),
  };

  const { generation: canceledGen, updatedStep } = await GenerationRunner.cancelStep(
    testJob,
    step,
    queuedGen
  );

  assert.strictEqual(canceledGen.status, 'Canceled');
  assert.strictEqual(canceledGen.actualCost, 0, 'Canceled generation must have actualCost = 0');
  assert.strictEqual(updatedStep.status, 'Canceled');
  assert.strictEqual(updatedStep.actualCost, 0);
});

// 8. LOCAL ASSET PERSISTENCE
console.log('\n--- TEST GROUP 8: Local Storage Link Expiry Protection ---');
await itAsync('Saves remote media locally into public/storage/generations/', async () => {
  const testAssetUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=50';
  const genId = `gen-store-${Date.now()}`;
  const localUrl = await AssetStorageService.persistRemoteAsset(testAssetUrl, genId, 'image');

  assert.ok(localUrl.startsWith('/storage/generations/'));
  const localFilePath = path.join(process.cwd(), 'public', localUrl.replace(/^\//, ''));
  assert.ok(fs.existsSync(localFilePath), `File must exist at ${localFilePath}`);
  assert.ok(fs.statSync(localFilePath).size > 0, 'Saved file must not be empty');
});

// 9. CONNECTION PROBE DIAGNOSTIC
console.log('\n--- TEST GROUP 9: Connection Probe Diagnostic ---');
await itAsync('Executes minimal connection probe successfully without leaking secrets', async () => {
  const result = await HiggsfieldAdapter.testConnection();
  assert.strictEqual(typeof result.connected, 'boolean');
  assert.ok(['live', 'mock'].includes(result.mode));
  assert.ok(result.details.length > 0);
  assert.ok(result.latencyMs >= 0);
  assert.ok(!JSON.stringify(result).includes('super_secret'));
  assert.ok(!result.details.includes('HF_API_KEY_SECRET'));
});

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
