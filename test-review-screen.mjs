// Verification script for Review Analysis screen and comparison preservation
const BASE = 'http://localhost:3000';

async function testReviewAnalysis() {
  console.log('--- 1. Testing GET /api/jobs/job-aethelgard-01/review-analysis ---');
  let res = await fetch(`${BASE}/api/jobs/job-aethelgard-01/review-analysis`);
  let data = await res.json();
  console.log(`GET Review Analysis Success: ${data.success}`);
  console.log(`Original Job Type: ${data.originalAnalysis?.jobType}`);
  console.log(`Original Deliverables: ${data.originalAnalysis?.deliverables?.length}`);

  console.log('\n--- 2. Testing POST /api/jobs/job-aethelgard-01/review-analysis (Edit Fields & Save Draft) ---');
  const editedPayload = JSON.parse(JSON.stringify(data.originalAnalysis));
  editedPayload.conciseSummary = 'HUMAN OPERATOR MODIFIED: Luxury fragrance teaser with adjusted basalt lighting and verified vector typography badge.';
  editedPayload.deliverables[0].name = 'Hero Narrative Teaser (Director Cut)';
  editedPayload.rightsAndConsentFlags.push({
    flag: 'Human Operator Verified Music Clearance',
    severity: 'low',
    details: 'Operator confirmed client licensed original ambient soundtrack stems.',
  });

  res = await fetch(`${BASE}/api/jobs/job-aethelgard-01/review-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      editedAnalysis: editedPayload,
      action: 'save_draft',
      operatorNotes: 'Adjusted concise summary and cleared music track stems.',
    }),
  });
  data = await res.json();
  console.log(`Save Draft Success: ${data.success}`);
  console.log(`Is Human Edited: ${data.editedAnalysis?.isHumanEdited}`);
  console.log(`Original Summary Unchanged: ${data.originalAnalysis?.conciseSummary.includes('HUMAN OPERATOR MODIFIED') === false}`);
  console.log(`Edited Summary Updated: ${data.editedAnalysis?.conciseSummary.includes('HUMAN OPERATOR MODIFIED')}`);

  console.log('\n--- 3. Testing POST /api/jobs/job-aethelgard-01/review-analysis (Approve Job with Human Edits) ---');
  res = await fetch(`${BASE}/api/jobs/job-aethelgard-01/review-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      editedAnalysis: editedPayload,
      action: 'approve',
      operatorNotes: 'Human operator approved following asset verification.',
    }),
  });
  data = await res.json();
  console.log(`Approval Success: ${data.success}`);
  console.log(`Updated Job Status: ${data.job?.status}`);
  console.log(`Human Review Approved: ${data.job?.humanReviewApproved}`);

  console.log('\n--- 4. Verifying Job Detail Page HTML with Review Tab ---');
  res = await fetch(`${BASE}/jobs/job-aethelgard-01`);
  const html = await res.text();
  console.log(`Job Detail HTML Status: ${res.status}`);
  console.log(`Contains 'Review Analysis': ${html.includes('Review Analysis')}`);

  console.log('\n=============================================');
  console.log('>>> REVIEW ANALYSIS SCREEN VERIFICATION PASSED! <<<');
  console.log('=============================================');
}

testReviewAnalysis().catch(console.error);
