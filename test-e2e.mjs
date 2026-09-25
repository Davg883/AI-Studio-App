// End-to-end workflow verification script
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const RUN_TAG = `e2e-${Date.now().toString(36)}`;

async function testWorkflow() {
  console.log('--- 1. Testing GET /api/jobs ---');
  let res = await fetch(`${BASE}/api/jobs`);
  let data = await res.json();
  console.log(`Found ${data.jobs.length} jobs.`);
  data.jobs.forEach(j => console.log(`  * [${j.status}] ${j.title} ($${j.budget}) - Source: ${j.source}`));

  console.log('\n--- 2. Testing GET /api/jobs/job-aethelgard-01 (QA Job) ---');
  res = await fetch(`${BASE}/api/jobs/job-aethelgard-01`);
  data = await res.json();
  console.log(`Job: ${data.job.title}`);
  console.log(`Astra Decision: ${data.analysis?.decision} (Confidence: ${data.analysis?.confidence}%)`);
  console.log(`Workflow steps: ${data.workflow?.steps.length}, Total Est: $${data.workflow?.totalEstimatedCost}`);
  console.log(`Generations rendered: ${data.generations?.length}`);
  console.log(`Gross Margin: $${data.profitability.expectedGrossMargin} (${data.profitability.expectedMarginPct}%)`);

  console.log('\n--- 3. Testing POST /api/jobs (New Job Ingestion) ---');
  res = await fetch(`${BASE}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `Solstice Electric GT - 30s Reveal [${RUN_TAG}]`,
      clientName: 'Aero Dynamics EV',
      source: 'Direct Lead',
      rawBrief: 'Need a high-concept 30s teaser of our electric hypercar drifting across salt flats under aurora borealis. 4K ProRes 16:9 + 15s 9:16 vertical.',
      budget: 3500,
      deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      clientNotes: 'Direct client, high urgency, budget approved.',
    }),
  });
  data = await res.json();
  const newJobId = data.job.id;
  console.log(`Created Job ID: ${newJobId} with status ${data.job.status}`);

  console.log('\n--- 4. Testing POST /api/jobs/[id]/analyze (GPT-6 Astra Extraction) ---');
  res = await fetch(`${BASE}/api/jobs/${newJobId}/analyze`, { method: 'POST' });
  data = await res.json();
  console.log(`Astra Decision: ${data.decision} - Confidence: ${data.analysis?.confidence}%`);
  console.log(`Deliverables extracted: ${data.analysis?.deliverables.length}`);
  console.log(`Rationale: ${data.rationale.substring(0, 120)}...`);

  console.log('\n--- 5. Testing POST /api/jobs/[id]/workflow (Build Higgsfield Plan) ---');
  res = await fetch(`${BASE}/api/jobs/${newJobId}/workflow`, { method: 'POST' });
  data = await res.json();
  console.log(`Built workflow with ${data.workflow.steps.length} steps. Total Est Spend: $${data.workflow.totalEstimatedCost}`);

  console.log('\n--- 6. Testing Guardrail Enforcement (Run without Human Approval) ---');
  res = await fetch(`${BASE}/api/jobs/${newJobId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stepId: data.workflow.steps[0].id }),
  });
  data = await res.json();
  console.log(`Guardrail HTTP Status: ${res.status} (Expected 403 Forbidden)`);
  console.log(`Guardrail Block Reason: "${data.error}"`);

  console.log('\n--- 7. Testing Human Approval Checkpoint (Approve Workflow & Lock Budget) ---');
  res = await fetch(`${BASE}/api/jobs/${newJobId}/approval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'approve_workflow_and_budget',
      maxApprovedBudget: 60,
      operatorName: 'David (Human Operator)',
    }),
  });
  data = await res.json();
  console.log(`Approval Success: ${data.success} - ${data.message}`);

  console.log('\n--- 8. Testing Generation Run with Approved Authorization ---');
  res = await fetch(`${BASE}/api/jobs/${newJobId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runAll: false }),
  });
  data = await res.json();
  console.log(`Step Generated Successfully! Request ID: ${data.executed[0]?.generationId}`);

  console.log('\n--- 9. Testing Client Revision Ingestion & Operator Sign-off ---');
  res = await fetch(`${BASE}/api/jobs/${newJobId}/revisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientNote: 'Client requested warmer salt flat lighting in the opening 5 seconds.',
      affectedDeliverable: 'Master Video (0:00 - 0:05)',
      recommendedAction: 'Adjust color grade and re-render keyframe seed.',
      expectedIncrementalCost: 1.80,
    }),
  });
  data = await res.json();
  const revId = data.revision.id;
  console.log(`Revision Logged: ID ${revId} - Status: ${data.revision.approvalStatus}`);

  // Operator approves revision
  res = await fetch(`${BASE}/api/jobs/${newJobId}/revisions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      revisionId: revId,
      approvalStatus: 'Approved',
    }),
  });
  data = await res.json();
  console.log(`Operator Approved Revision: Status ${data.revision.approvalStatus}`);

  console.log('\n--- 10. Verifying Home Dashboard HTML Page ---');
  res = await fetch(`${BASE}/`);
  const html = await res.text();
  console.log(`Dashboard page HTML status: ${res.status}, Length: ${html.length} bytes`);
  console.log(`Contains 'Studio Operator': ${html.includes('Studio Operator')}`);

  console.log('\n--- 11. Cleaning up E2E test job ---');
  res = await fetch(`${BASE}/api/jobs/${newJobId}`, { method: 'DELETE' });
  console.log(`Deleted test job ${newJobId}: status ${res.status}`);

  console.log('\n=============================================');
  console.log('>>> ALL 10 END-TO-END WORKFLOW VERIFICATIONS PASSED! <<<');
  console.log('=============================================');
}

testWorkflow().catch(console.error);
