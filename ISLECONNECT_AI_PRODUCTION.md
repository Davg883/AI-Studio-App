# IsleConnect AI Production Routing — App Playbook

Version 1.0 · 24 September 2026

## How to use this file

Save this file as `ISLECONNECT_AI_PRODUCTION.md` in your app project root. Ask your coding assistant to read it explicitly. Merely placing a Markdown file in a folder does not guarantee it is loaded, connect Higgsfield, install a plugin, or enforce any runtime controls.

Example instruction:

> Read ISLECONNECT_AI_PRODUCTION.md. Inspect the existing app and its instructions first. Map the model-routing workflow onto the current architecture, identify what already exists, and implement the smallest useful version using mock provider responses initially. Include a client brief, verified model registry, production plan, budget limits and human approval. Do not make paid generation calls or publish anything during implementation.

If your project already uses AGENTS.md or another assistant instruction file, add this reference to the existing file without replacing its contents:

> For AI image/video production and Higgsfield integration, read ISLECONNECT_AI_PRODUCTION.md before choosing models or changing production workflows. Follow existing project conventions and higher-priority instructions.

This is a portable project playbook based on the IsleConnect Model Router skill. It is not an installed IDE skill or a working integration. The installed ChatGPT skill and your app copy are separate; updates to one do not automatically update the other.

## App implementation brief

Inspect the existing stack before proposing dependencies. Reuse its authentication, storage, database and job processing. Do not rebuild the app solely to match this document.

Implement in this order:

1. **Client brief:** objective, outputs, audience, source assets, approved copy, rights, approver and budget.
2. **Model registry:** route (connector/API), exact operation ID, input constraints, settings, capability evidence, checked date and availability. Keep recommendations separate from verified capabilities.
3. **Production plan:** primary model, fallback, reasons, inputs, layout/finishing method, estimated attempts and quote status. Allow a human override that still passes compatibility and budget checks.
4. **Job controls:** store approval, request IDs, status, reserved/actual cost and maximum attempts. Enforce limits server-side and atomically reserve budget before concurrent requests.
5. **Review and delivery:** preserve originals and versions; collect QA results and approval. Keep completed generation separate from approved delivery and published status.
6. **Learning record:** record accepted/rejected attempts, defect categories, labour time and cost per accepted deliverable. Do not automatically share confidential client data across jobs.

Suggested lifecycle: draft → planned → authorised → queued → running → review → approved → delivered. Include failed, cancelled and needs-revision states. Publication is a separately authorised action.

Keep API keys in server-side secrets, never frontend code, prompts or logs. Use the exact current official API schema. Validate uploaded media, isolate client access, preserve job IDs and reconcile timed-out requests before resubmitting. Do not assume the current ChatGPT connector is available to the app.

A minimal provider adapter should support capability discovery, configuration validation, cost estimation (or an explicitly unverified estimate), submission, status checks and result retrieval. Implement cancellation only if the provider supports it. Store durable output files under the project's agreed retention rules.

### Acceptance checks before live generation

- An unsupported model/input combination cannot be submitted.
- Missing or stale price information is clearly labelled and resolved before paid execution.
- Concurrent submissions cannot exceed the authorised budget.
- Polling/retrying a timeout cannot silently duplicate a paid job.
- Wrong prices, illegible QR codes or unapproved factual claims fail review.
- A generated result cannot become approved or published merely because the provider returned success.
- Mock mode makes no paid calls and is visibly distinguishable from real results.

The following production rules and research support that implementation.

---

# IsleConnect Model Router

Build the workflow around the client's deliverable and evidence, then select a model. Treat provider descriptions as capability claims, not comparative quality tests.

## Establish the job

Extract deliverable, audience, channel, dimensions, duration, source assets, immutable facts, rights, named approver, deadline and existing budget authorisation. Continue useful planning with missing details explicitly marked. Ask only about gaps that block execution. Keep business operations (recipes, prices, stock) separate from creative generation.

Use the model matrix and production record sections included below. This document is self-contained.

## Verify the access route

1. Identify website, connected Higgsfield tools, or standalone developer API. Never interchange their IDs, billing or entitlements.
2. For connected tools, discover model list/search/get and cost-estimation tools. Page through results when necessary. Get the chosen model's current schema, reference roles, limits and parameters before execution. An ID in the reference file is a discovery hint, not permission to skip verification.
3. For API development, read the exact operation's official API reference and current pricing. Keep credentials server-side. Do not assume an API account, balance or integration exists because the connector works.
4. If unavailable, label the option unavailable on this route and propose an available alternative. Never fabricate an endpoint or silently change provider or billing route.
5. Refresh before paid execution and whenever documentation conflicts. Record date, route, exact model/operation/version, source and configuration. Keep conflicting pricing unresolved until an exact quote is obtained.

## Route by constraints

Filter for supported input/output, rights, reference needs, duration and budget first. Offer one primary candidate and one meaningful fallback. Explain selection in terms of the brief; do not promise the newest model is best or that a named family is always cheaper.

Use deterministic layout/code for final prices, dates, menus, logos, QR codes and exact typography. Use approved real photography where actual dishes, buildings or products must be represented accurately. Generate conceptual imagery only with clear labelling. Never infer historical truth from a generated scene.

Respect active image-generation tool rules. This skill does not override a requirement to use the built-in image tool. For explicitly requested Higgsfield generation, use supported Higgsfield tools. Delegate named presets, complete faceless/UGC productions, subtitles and native video editing to their applicable specialised skills only when their triggers match. Do not convert ordinary model research into a production workflow.

## Control cost and execution

Research consumes no generation credits. For authorised production, estimate the exact settings on the actual route; distinguish credits from dollars and document any currency conversion basis. Include draft attempts, repairs, final render, finishing and human time. Use existing authorised limits; do not request approval again unnecessarily. Without an authorised spending envelope, finish a reviewable plan before seeking it.

For automation, enforce allowed models, maximum attempts, per-job and total budget caps in application code; prompts alone cannot enforce them. Reserve expected spend before concurrent jobs, reconcile actual charges, and stop when a cap is reached. Poll an existing request rather than submitting again after a timeout. Do not enable auto top-up or external publication implicitly.

Approve the concept before expensive finals. Repair a local defect only when fidelity can be preserved; otherwise regenerate within the agreed cap or return to human editing. Retain originals. Human review must gate final client/public delivery; technical completion is not approval.

## Return and learn

Return a compact table: deliverable | model + route | why | required inputs | exact-text method | estimate/status | QA gate. State what remains unverified and whether any generation happened.

Record accepted and rejected attempts, defects, repair time, actual spend and human review time. Rank models using cost per accepted deliverable and pass rate on comparable briefs. Keep client facts and permissions separate from model preferences. Do not describe saved job records as model training or guaranteed learning.

---

# Model routing evidence — checked 24 September 2026

This is a dated starting shortlist, not a benchmark. Connector availability was read from the live Higgsfield models_list catalogue. API capabilities below are supported by official sources. Suggested use cases remain hypotheses until tested on IsleConnect work.

| Transcript family | Suggested job | Evidence / access observed | Review risk |
|---|---|---|---|
| Soul (transcribed Sol) | Fictional guides, editorial people, campaign stills | Connector soul_2, soul_cinematic; Soul API documentation [1] | Identity drift; synthetic person must not imply a real testimonial |
| Seedream / FLUX | Product/venue reference concepts and controlled variations | Connector seedream_v4_5, seedream_v5_lite, flux_2; current schema allows image references | Packaging, dish ingredients and building geometry may change |
| Ideogram / Recraft | Poster concepts and graphic exploration | API Ideogram 4.0 and Recraft V4.1 [2]; connector recraft_v4_1 with standard/vector/utility/utility_vector options | Render exact copy separately; inspect actual export format before promising SVG |
| Qwen (Quinn/Quen) | Instruction-led image repairs | API Qwen Image 3 edit [3]; no Qwen IMAGE model in retrieved connector catalogue (audio is different) | Edits can affect untouched regions; compare against original |
| Z-Image / Marketing Studio Image | Explore still directions | Connector z_image (no reference media declared), marketing_studio_image | No measured evidence that these are cheapest; Marketing Studio is a workflow/product label too |
| PixVerse / Wan / lower-tier Kling | Compare draft motion candidates | PixVerse V6 API [4]; connector Wan and Kling families | Cost depends on exact version/configuration, not family name |
| Seedance | Reference-led scenes, multi-input motion, optional native audio | Connector seedance_2_0, seedance_2_0_mini, seedance_2_5; API 2.0 reference operation [5] | Identity, sequence and audio need review; versions/operations have different limits |
| Kling | Cinematic hero shots, camera movement | Connector kling3_0, kling3_0_turbo and other variants | Camera movement can invent unseen architecture |
| Wan / MiniMax | Audio/reference-led scene candidates | Connector wan2_7, wan3_0, minimax_h3; API references [6] | Do not assume every version generates speech; inspect native audio vs supplied audio support |
| Kling Motion Control | Transfer a supplied performance | Explicit API motion-control endpoint with image and video inputs [7] | Ordinary Kling generation is not automatically motion control; verify callable route and consent |
| Topaz / lip sync / captions | Finish already approved media | Connector topaz_image, topaz_image_generative, topaz_video, sync_so; inspect relevant tool schema | Upscaling can invent detail; subtitles and editing are separate workflows |
| Nano Banana (presenter says absent from API) | Reference image creation/editing where available | Connector nano_banana_pro, nano_banana_2, nano_banana_2_lite; website documented [8] | Standalone API availability not established by this research; do not confuse website/connector access with API access |

## Corrections to the transcript

- Correct names: Soul, Seedream, Qwen, Seedance, Kling, PixVerse, MiniMax, Recraft, Ideogram, Wan, Z-Image.
- Website subscription and connected tools are distinct from the standalone developer API. Higgsfield documents separate API dollar billing and connector plan credits [9].
- Research did not independently benchmark quality, speed, margins or cost per usable output. Sponsored rankings and claims of 60% net margins are not evidence of IsleConnect profitability.
- Pricing is not safely copied from a presentation. The API overview lists a Seedance 2.0 starting rate of $0.9332/s, while the reference operation showed $0.1182/s and the pricing page showed other starting figures [5,9,10]. These may reflect configurations/promotions; do not treat them as equivalent quotes. Fetch the exact configuration estimate at execution.
- MiniMax Hailuo, MiniMax H3, Wan versions and Kling variants are different products. Do not inherit capabilities across a family.

## Official source register

1. Soul API: https://open.higgsfield.ai/models/higgsfield-ai/soul/standard/api-reference
2. Image catalogue: https://open.higgsfield.ai/explore/image ; Ideogram: https://open.higgsfield.ai/models/ideogram/v4.0/playground ; Recraft: https://open.higgsfield.ai/models/recraft%2Fv4.1%2Ftext-to-image/api-reference
3. Qwen edit: https://open.higgsfield.ai/models/alibaba/qwen-image-3/edit/api-reference
4. PixVerse: https://open.higgsfield.ai/models/pixverse/v6/image-to-video/api-reference
5. Seedance: https://open.higgsfield.ai/models/bytedance/seedance-2.0/reference-to-video/api-reference
6. Wan: https://open.higgsfield.ai/models/wan/v2.7/text-to-video/api-reference ; MiniMax: https://open.higgsfield.ai/models/minimax/h3/reference-to-video/api-reference
7. Motion: https://open.higgsfield.ai/models/kling-video/v3/motion-control/std/api-reference
8. Nano Banana: https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-nano-banana
9. API/billing: https://higgsfield.ai/blog/higgsfield-api
10. Current pricing: https://open.higgsfield.ai/pricing

Treat all marketing adjectives as provider claims. Recheck these sources when making a production decision; source dates do not establish account entitlements.


---

# Production record and acceptance

Keep one record per job:
- Client, business objective, audience, deliverables, deadline and approver.
- Approved source assets; permissions; exact copy and facts; disclosure wording.
- Access route, discovered model ID/operation, schema checked date, settings and rationale.
- Authorised cap and unit (credits/USD/GBP), estimated calls, maximum attempts, repair allowance, human time allowance.
- Request IDs, input/output versions, actual charges, failures, retries, QA decisions and approval.
- Final files, delivery state and agreed retention location. Do not treat temporary provider URLs as durable storage.

## Acceptance gates

1. Facts and rights: claims match approved sources; people/assets have appropriate permission.
2. Fidelity: compare product shape, portions, venue layout, costume/identity and unchanged regions to reference.
3. Exact information: manually verify names, dates, prices and spelling; scan the real QR at intended size; never generate the QR as artwork.
4. Motion/audio: inspect first/last frames and transitions, hands/faces, lip sync and pronunciation; listen through the finished sound mix.
5. Delivery: verify aspect ratio, readable safe areas, captions where required, export, disclosure and client approval.

Use pass/fail for hard requirements. Aesthetic quality cannot compensate for wrong prices or fabricated historical facts.

## Appley example

Use Joe's approved dish specifications and real plated-food photos as the source. Test a reference-preserving scene only for concepts; label generated food/terrace images as illustrations. Assemble final menu text and prices using deterministic layout. Use real chef footage where available; select a video model only for a specified missing shot. Owner/Joe approve food and offers before public release. Track preparation of assets, production, review and revisions separately from restaurant operations.

## Heritage / Garlic Farm example

Separate documented history, creative interpretation and fictional story. Approve the script and references before animation. Select Seedance/Kling candidates by reference needs, shot duration and quote. Keep the original building geometry visible in review; don't present invented camera reveals as evidence. Publish only approved campaign assets; record scans, redemptions or enquiries separately from views.

## Learning record

For each comparable brief log model/configuration, attempts, acceptance failures, generation cost, review minutes and edit minutes. Calculate cost per accepted deliverable including rejected generations and labour. Retain client-approved factual corrections in the client's source record, and routing observations in a separate production record. Do not export client data into a shared model playbook.
