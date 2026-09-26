import json
import os
from datetime import datetime

store_path = os.path.join('.data', 'studio_store.json')
if not os.path.exists(store_path):
    print("Store not found at", store_path)
    exit(1)

with open(store_path, 'r', encoding='utf-8') as f:
    store = json.load(f)

now_iso = datetime.utcnow().isoformat() + 'Z'

# 1. Autonomy Settings
store['autonomySettings'] = {
    "maxAutoSpendPerJob": 45.0,
    "maxAutoSpendPerRepair": 15.0,
    "maxGenerationAttemptsPerStep": 3,
    "allowedModelFamilies": [
        "Seedream", "Seedance", "Soul", "Qwen", "Wan", "Topaz", "ElevenLabs",
        "Marketing Studio", "Ideogram", "Recraft", "MiniMax", "Kling", "Veo",
        "PixVerse", "LTX Video", "SubCaption", "Higgsfield Speak", "ByteDance"
    ],
    "autoShareConcepts": False,
    "finalDeliveryAlwaysRequiresApproval": True,
    "dispatchPolicy": {
        "intake_question": "draft_for_approval",
        "asset_request": "draft_for_approval",
        "scope_proposal": "draft_for_approval",
        "milestone_update": "auto_send",
        "concept_presentation": "draft_for_approval",
        "revision_interpretation": "draft_for_approval",
        "change_order": "draft_for_approval",
        "final_delivery": "draft_for_approval",
        "retention_followup": "draft_for_approval"
    },
    "mandatoryPauseConditions": {
        "likenessOrVoice": True,
        "unclearAssetOwnership": True,
        "factualAdvertisingClaims": True,
        "exactPackagingRegulatedCopy": True,
        "negativeExpectedMargin": True,
        "missedDeadlineRisk": True,
        "clientDispute": True
    },
    "updatedAt": now_iso,
    "updatedBy": "Demo seed"
}

# 2. Client Memory
if 'clientMemory' not in store:
    store['clientMemory'] = {}

store['clientMemory']['client-luminary-botanicals'] = {
    "clientId": "client-luminary-botanicals",
    "clientName": "Luminary Botanicals",
    "brandName": "Aura Hydrate",
    "accountType": "direct_client",
    "approvedAssets": {
        "logos": [
            {
                "name": "Luminary_Logo_Vector_Transparent.svg",
                "url": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80",
                "format": "SVG",
                "isPrimary": True
            }
        ],
        "brandColors": [
            {"name": "Deep Basalt", "hex": "#1A1B20", "role": "primary"},
            {"name": "Cold Frost White", "hex": "#F4F7F6", "role": "secondary"},
            {"name": "Nordic Mist Blue", "hex": "#8BA4B2", "role": "accent"},
            {"name": "Sunrise Amber", "hex": "#E8A87C", "role": "accent"}
        ],
        "fonts": [
            {"name": "Cinzel Decorative", "category": "headline"},
            {"name": "Inter", "category": "body"}
        ],
        "guidelineDocuments": [
            {"name": "Luminary_Brand_Book_2026.pdf", "url": "/assets/docs/Luminary_Brand_Book_2026.pdf"}
        ]
    },
    "productDetails": [
        {
            "name": "Aura Hydrate Volcanic Mineral Mist",
            "description": "Restorative facial mist infused with Icelandic glacial basalt minerals.",
            "keyIngredientsOrFeatures": ["Glacial Mineral Water", "Basalt Bio-Ferment", "Hyaluronic Acid 2%"],
            "packagingSpecs": "Monolithic frosted glass cylindrical flacon with tactile matte black cap.",
            "forbiddenClaims": ["Instant permanent wrinkle cure", "100% UV replacement"]
        }
    ],
    "toneOfVoice": {
        "personality": ["Quiet luxury", "Grounded", "Sensory", "Clinical elegance"],
        "bannedWords": ["Miracle", "Crazy cheap", "Viral hack", "Anti-aging magic"],
        "samplePhrases": [
            "From the ash of stillness, presence is born.",
            "Crafted by nature. Perfected by science."
        ]
    },
    "creativeHistory": {
        "winningStyles": ["Macro water droplet physics", "Slow 360 orbital camera push-in", "Moody chiaroscuro lighting"],
        "rejectedStyles": ["High-contrast neon saturation", "Fast TikTok jump-cuts", "Over-smoothed CGI look"],
        "preferredPacing": "Deliberate, atmospheric, contemplative, unhurried"
    },
    "deliveryPreferences": {
        "primaryFormat": "Apple ProRes 422 HQ (16:9) + MP4 H.265 (9:16)",
        "aspectRatios": ["16:9", "9:16", "1:1"],
        "cloudFolderUrl": "https://drive.google.com/luminary-deliveries"
    },
    "communicationPreferences": {
        "updateFrequency": "milestones_only",
        "timezone": "Europe/London (GMT)",
        "clientContactPerson": "Evelyn Thorne (Creative Director)",
        "clientEmail": "evelyn@luminarybotanicals.com"
    },
    "consentFirewall": {
        "hasStoredLikenessConsent": True,
        "authorizedPersons": ["Dr. Elena Vance (Scientific Founder)"],
        "consentScopeNotice": "Never treat an earlier approval as consent for a new person's likeness, voice, or a materially different use."
    },
    "updatedAt": now_iso
}

store['clientMemory']['client-cider-stone'] = {
    "clientId": "client-cider-stone",
    "clientName": "Cider & Stone Heritage Estate",
    "brandName": "Night Orchard Ice Cider",
    "accountType": "direct_client",
    "approvedAssets": {
        "logos": [
            {"name": "Cider_Stone_Crest.svg", "url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80", "format": "SVG", "isPrimary": True}
        ],
        "brandColors": [
            {"name": "Midnight Moss", "hex": "#1E261D", "role": "primary"},
            {"name": "Pale Moon Gold", "hex": "#D4AF37", "role": "accent"}
        ],
        "fonts": [{"name": "Playfair Display", "category": "headline"}],
        "guidelineDocuments": []
    },
    "productDetails": [
        {"name": "Night Orchard Single-Vintage Ice Cider", "description": "Harvested in sub-zero orchard temperatures; aged in French oak.", "keyIngredientsOrFeatures": ["Late-frost russet apples"], "packagingSpecs": "Slim amber glass bottle with wax dip seal.", "forbiddenClaims": []}
    ],
    "toneOfVoice": {
        "personality": ["Heritage", "Warming", "Atmospheric", "Artisanal"],
        "bannedWords": ["Sweet sugary", "Party drink"],
        "samplePhrases": ["Harvested by moonlight. Aged by winter."]
    },
    "creativeHistory": {
        "winningStyles": ["Low-light candle/moonlit ambiance", "Smooth crane tracking", "Deep forest greens"],
        "rejectedStyles": ["Bright daylight", "Fast pop music"],
        "preferredPacing": "Slow, cinematic, atmospheric"
    },
    "deliveryPreferences": {
        "primaryFormat": "4K ProRes 422 (16:9)",
        "aspectRatios": ["16:9"],
        "cloudFolderUrl": "https://drive.google.com/cider-stone"
    },
    "communicationPreferences": {
        "updateFrequency": "milestones_only",
        "timezone": "Europe/London (GMT)",
        "clientContactPerson": "Arthur Pendelton",
        "clientEmail": "arthur@ciderandstone.co.uk"
    },
    "consentFirewall": {
        "hasStoredLikenessConsent": False,
        "authorizedPersons": [],
        "consentScopeNotice": "Never treat an earlier approval as consent for a new person's likeness, voice, or a materially different use."
    },
    "updatedAt": now_iso
}

# 3. Demonstration Job 1: After the Rain
rain_id = 'job-after-the-rain'
existing_job_idx = next((i for i, j in enumerate(store['jobs']) if j['id'] == rain_id), None)

rain_job = {
    "id": rain_id,
    "isDemo": True,
    "title": "After the Rain: 15s Luxury Commercial Reveal",
    "clientName": "Luminary Botanicals (Evelyn Thorne)",
    "source": "Direct Lead",
    "rawBrief": (
        "Client Brief from Luminary Botanicals:\n"
        "Create a 15-second cinematic product reveal for our Aura Hydrate Volcanic Mineral Mist.\n"
        "Visual direction: Monolithic frosted glass flacon resting on wet volcanic basalt after a heavy rain shower. "
        "Macro water droplets, liquid surface puddle reflections, and cold morning atmosphere transitioning into a subtle hopeful morning sunrise.\n"
        "Audio: Deep ambient coastal rain fading into tactile droplet audio, with warm narrative British voiceover.\n"
        "Deliverables: 16:9 4K ProRes + 9:16 vertical cut for Reels. Budget: $2,400. 72-hour turnaround."
    ),
    "budget": 2400,
    "deadline": "2026-10-02T18:00:00.000Z",
    "status": "Approved",
    "clientNotes": "Direct VIP client. Account memory loaded. Launch Video productized template applied.",
    "referenceAssets": [
        {
            "id": "ref-rain-1",
            "name": "Aura_Hydrate_Bottle_3D_Master.png",
            "url": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=80",
            "type": "image",
            "notes": "Exact monolithic frosted glass flacon silhouette and matte cap."
        },
        {
            "id": "ref-rain-2",
            "name": "Icelandic_Basalt_Rain_Moodboard.pdf",
            "url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
            "type": "pdf",
            "notes": "Cold basalt textures, shallow water puddles, sharp specular highlights."
        }
    ],
    "channelFeePct": 0,
    "contingencyPct": 10,
    "maxApprovedBudget": 45.0,
    "approvalCheckpoints": {
        "workflowApproved": True,
        "workflowApprovedAt": now_iso,
        "workflowApprovedBy": "Demo seed",
        "maxBudgetApproved": True,
        "maxBudgetAmount": 45.0,
        "rightsCleared": True,
        "rightsApprovedAt": now_iso,
        "rightsApprovedBy": "Demo seed",
        "finalDeliveryApproved": False  # Crucial guardrail test: pauses before final release!
    },
    "createdAt": now_iso,
    "updatedAt": now_iso
}

if existing_job_idx is not None:
    store['jobs'][existing_job_idx] = rain_job
else:
    store['jobs'].insert(0, rain_job)

# Add Messages for After the Rain demonstrating full client lifecycle
if 'clientMessages' not in store:
    store['clientMessages'] = {}

store['clientMessages'][rain_id] = [
    {
        "id": "msg-rain-intake",
        "jobId": rain_id,
        "type": "intake_question",
        "direction": "outbound",
        "subject": "Quick clarification on wet surface reflections for After the Rain",
        "body": "Hi Evelyn,\n\nWe love the volcanic basalt concept for Aura Hydrate! To ensure the lighting model renders your bottle with 100% accuracy, could you confirm whether you prefer high-contrast specular reflections on the puddle surface, or a softer matte refraction?\n\nLooking forward to locking this with you!",
        "status": "sent",
        "channel": "email",
        "isMarketplaceSafeDraft": False,
        "requiresHumanApproval": False,
        "sentAt": now_iso,
        "createdAt": now_iso
    },
    {
        "id": "msg-rain-client-reply",
        "jobId": rain_id,
        "type": "intake_question",
        "direction": "inbound",
        "subject": "Re: Quick clarification on wet surface reflections for After the Rain",
        "body": "Hi David,\n\nDefinitely high-contrast specular reflections! We want the light cutting across the dark basalt stone to look crisp and photorealistic.\n\nBest,\nEvelyn",
        "status": "received",
        "channel": "email",
        "isMarketplaceSafeDraft": False,
        "requiresHumanApproval": False,
        "createdAt": now_iso
    },
    {
        "id": "msg-rain-milestone-update",
        "jobId": rain_id,
        "type": "milestone_update",
        "direction": "outbound",
        "subject": "Milestone Reached: Master Keyframes locked for After the Rain",
        "body": "Hi Evelyn,\n\nGreat news: the master keyframe compositions and lighting profiles have been locked. The specular puddle reflections on the basalt stone match your reference board beautifully.\n\nWe are now advancing to high-coherence video motion synthesis.\n\nNext update: Initial motion cut preview tomorrow morning.",
        "status": "sent",
        "channel": "email",
        "isMarketplaceSafeDraft": False,
        "requiresHumanApproval": False,
        "sentAt": now_iso,
        "createdAt": now_iso
    },
    {
        "id": "msg-rain-client-rev",
        "jobId": rain_id,
        "type": "revision_interpretation",
        "direction": "inbound",
        "subject": "Review of initial reveal cut",
        "body": "Hi team,\n\nThe motion tracking and water droplets look incredible! One creative adjustment for the final 4 seconds: could you make the final reveal warmer and more hopeful? Right now the cold blue tone lingers a bit too long at the end.",
        "status": "received",
        "channel": "email",
        "isMarketplaceSafeDraft": False,
        "requiresHumanApproval": False,
        "createdAt": now_iso
    },
    {
        "id": "msg-rain-rev-response",
        "jobId": rain_id,
        "type": "revision_interpretation",
        "direction": "outbound",
        "subject": "Revision Accepted: Warming final reveal highlight",
        "body": "Hi Evelyn,\n\nUnderstood perfectly! We have adjusted the Finishing color temperature curve to introduce a gentle 3800K golden sunrise glow across the bottle cap during the final 4 seconds. This is covered under your included Revision Round 1.\n\nRendering the updated 4K master now!",
        "status": "sent",
        "channel": "email",
        "isMarketplaceSafeDraft": False,
        "requiresHumanApproval": False,
        "sentAt": now_iso,
        "createdAt": now_iso
    },
    {
        "id": "msg-rain-final-delivery",
        "jobId": rain_id,
        "type": "final_delivery",
        "direction": "outbound",
        "subject": "Final Delivery Package: After the Rain (Aura Hydrate)",
        "body": (
            "Hi Evelyn,\n\nWe are thrilled to present the completed creative package for After the Rain!\n\n"
            "**Delivered Files:**\n"
            "1. **After_The_Rain_Master_4K.mov** (ProRes 422 HQ, 16:9, 3840x2160)\n"
            "2. **After_The_Rain_Vertical_Social.mp4** (9:16, 1080x1920 with safe-zone captions)\n"
            "3. **Keyframe_Still_Basalt_Sunrise_4K.jpg** (3840x2160 Key Art)\n"
            "4. **Aura_Hydrate_Voiceover_Master.wav** (24-bit 48kHz isolated vocal stem)\n\n"
            "**Usage Notes:** Full global broadcast and digital usage rights granted in perpetuity.\n\n"
            "*(Pending Operator Final Review & Approval before releasing download keys)*"
        ),
        "status": "draft",
        "channel": "email",
        "isMarketplaceSafeDraft": False,
        "requiresHumanApproval": True,  # PAUSED FOR OPERATOR APPROVAL
        "createdAt": now_iso
    }
]

# Add Self-Repair Run for After the Rain
if 'repairRuns' not in store:
    store['repairRuns'] = {}

store['repairRuns'][rain_id] = [
    {
        "id": "repair-rain-01",
        "jobId": rain_id,
        "stepId": "step-4",
        "generationId": "gen-rain-motion-01",
        "qaResult": {
            "stepId": "step-4",
            "generationId": "gen-rain-motion-01",
            "passed": False,
            "confidenceScore": 76,
            "defectsDetected": [
                {
                    "type": "geometry_reflection_failure",
                    "severity": "minor",
                    "component": "Bottle puddle reflection vector & contact shadow",
                    "description": "Surface reflection angle on wet basalt exhibited 4-pixel lateral smear during camera pan.",
                    "referenceDiscrepancy": "Reference asset shows sharp optical reflection on standing water; plate had subtle edge blur."
                }
            ]
        },
        "selectedAction": "targeted_edit",
        "targetModel": "qwen-image-edit-v2",
        "actionDetails": "Applied surgical inpaint mask over bottle contact shadow and wet basalt reflection. Aligned reflection vectors to 35mm optical ray tracing without re-running expensive 5-second video synthesis pass.",
        "estimatedCostUSD": 0.15,
        "remainingProductionBudgetUSD": 31.85,
        "executedAutonomously": True,
        "escalatedToOperator": False,
        "status": "repaired",
        "repairedAssetUrl": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=80&repaired=true",
        "createdAt": now_iso,
        "completedAt": now_iso
    }
]

# Add Audit Logs for After the Rain
if 'auditLogs' not in store:
    store['auditLogs'] = []

store['auditLogs'].extend([
    {
        "id": "audit-rain-1",
        "timestamp": now_iso,
        "jobId": rain_id,
        "jobTitle": "After the Rain: 15s Luxury Commercial Reveal",
        "eventType": "model_decision",
        "actor": "agent",
        "actorName": "Astra Client Agent",
        "summary": "Productized Template Applied: Launch Video",
        "details": "Client brief matched Launch Video template ($2,400 price, 72h turnaround, $45 production ceiling).",
    },
    {
        "id": "audit-rain-2",
        "timestamp": now_iso,
        "jobId": rain_id,
        "jobTitle": "After the Rain: 15s Luxury Commercial Reveal",
        "eventType": "message_sent",
        "actor": "agent",
        "actorName": "Astra Client Agent",
        "summary": "Auto-Dispatched Intake Clarification Question",
        "details": "Sent clarification regarding specular vs matte reflections on basalt stone.",
    },
    {
        "id": "audit-rain-3",
        "timestamp": now_iso,
        "jobId": rain_id,
        "jobTitle": "After the Rain: 15s Luxury Commercial Reveal",
        "eventType": "self_repair_triggered",
        "actor": "agent",
        "actorName": "Self-Repair Engine",
        "summary": "Defect Detected: Geometry Reflection Anomaly",
        "details": "QA check detected 4-pixel lateral smear on bottle puddle reflection against reference asset.",
    },
    {
        "id": "audit-rain-4",
        "timestamp": now_iso,
        "jobId": rain_id,
        "jobTitle": "After the Rain: 15s Luxury Commercial Reveal",
        "eventType": "self_repair_completed",
        "actor": "agent",
        "actorName": "Self-Repair Engine",
        "summary": "Autonomous Targeted Repair Executed (Qwen Inpaint)",
        "details": "Applied surgical inpaint mask. Cost: $0.15. Remaining budget: $31.85. Within $15.00 auto-repair limit.",
        "spendDeltaUSD": 0.15,
        "cumulativeSpendUSD": 13.15
    },
    {
        "id": "audit-rain-5",
        "timestamp": now_iso,
        "jobId": rain_id,
        "jobTitle": "After the Rain: 15s Luxury Commercial Reveal",
        "eventType": "model_decision",
        "actor": "agent",
        "actorName": "Astra Client Agent",
        "summary": "Revision Interpreted: Warmer Final Reveal",
        "details": "Client requested warmer tone. Classified as included Revision Round 1 ($0 fee). LUT curve set to 3800K.",
    },
    {
        "id": "audit-rain-6",
        "timestamp": now_iso,
        "jobId": rain_id,
        "jobTitle": "After the Rain: 15s Luxury Commercial Reveal",
        "eventType": "pause_escalation",
        "actor": "agent",
        "actorName": "Governance Safeguard",
        "summary": "Workflow Paused: Final Delivery Sign-off Required",
        "details": "Final delivery package drafted. Autonomous release blocked until human operator approves.",
        "riskFlag": "Human Delivery Sign-Off Required"
    }
])

# 4. Demonstration Job 2: Night Orchard (Route Comparison)
orchard_id = 'job-night-orchard'
existing_orchard_idx = next((i for i, j in enumerate(store['jobs']) if j['id'] == orchard_id), None)

orchard_job = {
    "id": orchard_id,
    "isDemo": True,
    "title": "Night Orchard: Twilight Canopy Reveal",
    "clientName": "Cider & Stone Heritage Estate (Arthur Pendelton)",
    "source": "Direct Lead",
    "rawBrief": (
        "Client Brief from Cider & Stone Heritage Estate:\n"
        "A slow, continuous 8-second night shot gliding through mist-covered heritage apple trees under starlight, "
        "revealing a bottle of our single-vintage ice cider glowing softly on a weathered stone ledge.\n"
        "Low-light detail, deep shadows without digital noise, and ultra-smooth camera motion are critical.\n"
        "Budget: $2,200. Need route comparison to evaluate low-light motion physics and queue latency."
    ),
    "budget": 2200,
    "deadline": "2026-10-06T18:00:00.000Z",
    "status": "New",
    "clientNotes": "Requires comparative evaluation of low-light video models (Seedance 2.5 vs Kling 1.5 Pro vs Google Veo 2).",
    "referenceAssets": [
        {
            "id": "ref-orchard-1",
            "name": "Night_Orchard_Bottle_Wax_Seal.jpg",
            "url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
            "type": "image",
            "notes": "Amber glass bottle with gold wax seal on weathered mossy stone."
        }
    ],
    "channelFeePct": 0,
    "contingencyPct": 15,
    "maxApprovedBudget": 50.0,
    "approvalCheckpoints": {
        "workflowApproved": False,
        "maxBudgetApproved": False,
        "rightsCleared": True,
        "finalDeliveryApproved": False
    },
    "createdAt": now_iso,
    "updatedAt": now_iso
}

if existing_orchard_idx is not None:
    store['jobs'][existing_orchard_idx] = orchard_job
else:
    store['jobs'].insert(1, orchard_job)

# Save back to disk
with open(store_path, 'w', encoding='utf-8') as f:
    json.dump(store, f, indent=2)

print("Successfully seeded autonomous agency demonstration data into studio_store.json!")
print("Seeded jobs: After the Rain & Night Orchard.")
