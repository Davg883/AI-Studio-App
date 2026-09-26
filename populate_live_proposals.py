import json
import os
from datetime import datetime

store_path = os.path.join('.data', 'studio_store.json')
if not os.path.exists(store_path):
    print("Store not found at", store_path)
    exit(1)

with open(store_path, 'r', encoding='utf-8') as f:
    store = json.load(f)

# Ensure jobs, analyses, workflows exist
if 'jobs' not in store:
    store['jobs'] = []
if 'analyses' not in store:
    store['analyses'] = {}
if 'workflows' not in store:
    store['workflows'] = {}

# Filter out if any of these job IDs already exist
existing_ids = {j['id'] for j in store['jobs']}

now_iso = datetime.utcnow().isoformat() + 'Z'

# Lead 1: Appley Cafe
cafe_id = 'job-appley-cafe-pilot'
if cafe_id not in existing_ids:
    cafe_job = {
        "id": cafe_id,
        "isDemo": True,
        "currency": "GBP",
        "title": "Appley Café: Breakfast by the Sea (Chef-Led Pilot)",
        "clientName": "Appley Café & Chef Joe (Ryde, Isle of Wight)",
        "source": "Direct Lead",
        "rawBrief": (
            "Proposal v2.0 for the Owner of Appley Café:\n"
            "A chef-led breakfast and brunch pilot built around Joe's menu, with the launch run for you, "
            "so the café can grow without adding to your workload.\n\n"
            "Objectives:\n"
            "- Launch a compact menu of 11 core dishes built on shared ingredients (Full English, Bacon Benedict, House Hash, Breakfast rolls).\n"
            "- Run an end-to-end launch: costings, supplier price checks, staff briefing cards, photography, posts, mobile campaign page, QR table cards, weekly results summary.\n"
            "- Establish morning trade, test dish costings/margins (25-30% food cost target), and drive walker/cyclist footfall without owner burden.\n\n"
            "Pricing & Tiers:\n"
            "- Breakfast by the Sea Pilot: £950 (Discovery, menu sign-off, photo/video shoot, hero reel + 2 cut-downs, 4 posts, mobile campaign page, QR table cards, 2 review rounds, end-of-pilot review).\n"
            "- Launch Support Add-on: £450 (Costing record, supplier price sheet with alerts, prep sheets, order tally/waste record, weekly summary, outside-space stage plan).\n"
            "- Optional Continuation Retainer: £750/month for initial 3 months (£2,250 total) for monthly capture, 8 posts, menu updates, price monitoring, monthly reviews."
        ),
        "budget": 1400,
        "deadline": "2026-11-05T18:00:00.000Z",
        "status": "New",
        "clientNotes": "Presented Sept 24, 2026. 50% upfront (£475/£700), 50% on completion. Owner time required: ~3.5 hours total across pilot. High probability of £750/mo continuation retainer.",
        "referenceAssets": [
            {
                "id": "ref-ac-1",
                "name": "Appley_Breakfast_by_the_Sea_v2.pdf",
                "url": "/Proposals/Appley_Breakfast_by_the_Sea_v2.pdf",
                "type": "pdf",
                "notes": "Full 16-page v2.0 proposal with unit economics, recipe costings, competitor benchmarks, and outside space investment stages."
            }
        ],
        "channelFeePct": 0,
        "contingencyPct": 10,
        "maxApprovedBudget": 50,
        "approvalCheckpoints": {
            "workflowApproved": False,
            "maxBudgetApproved": False,
            "rightsCleared": True,
            "finalDeliveryApproved": False
        },
        "createdAt": now_iso,
        "updatedAt": now_iso,
        "originalAnalysis": {
            "id": f"analysis-{cafe_id}",
            "jobId": cafe_id,
            "jobType": "hospitality_launch_campaign",
            "conciseSummary": "Chef-led breakfast and brunch pilot for seafront café featuring 11-dish margin-optimized menu, hero video reel, social cut-downs, QR table talkers, mobile campaign page, and launch costing support.",
            "deliverables": [
                {
                    "name": "Hero Launch Reel",
                    "type": "Hero Video",
                    "format": "MP4 / ProRes 422",
                    "aspectRatio": "9:16",
                    "durationSeconds": 45,
                    "resolution": "1080x1920 (FHD)",
                    "exactTextRequirements": ["Breakfast by the Sea", "Appley Café, Ryde"],
                    "description": "High-craft hero food reel showcasing Chef Joe preparing signature dishes against coastal morning backdrop."
                },
                {
                    "name": "2x Social Cut-downs",
                    "type": "Social Reel",
                    "format": "MP4",
                    "aspectRatio": "9:16",
                    "durationSeconds": 15,
                    "resolution": "1080x1920 (FHD)",
                    "exactTextRequirements": ["Joe's House Hash", "Bacon Benedict by the Beach"],
                    "description": "Short snappy food reels tailored for Instagram Reels and TikTok engagement."
                },
                {
                    "name": "4x Ready-to-Publish Posts",
                    "type": "Social Asset Pack",
                    "format": "JPG / PNG + Copywriting",
                    "aspectRatio": "4:5 / 1:1",
                    "resolution": "2160x2160",
                    "exactTextRequirements": [],
                    "description": "4 high-resolution food photography posts with crafted hooks, captions, and local hashtags."
                },
                {
                    "name": "Mobile Campaign Page",
                    "type": "Web Asset",
                    "format": "Responsive Web Page",
                    "aspectRatio": "Mobile Responsive",
                    "resolution": "Responsive",
                    "exactTextRequirements": ["Appley Café Breakfast Menu", "Directions & Hours"],
                    "description": "Fast-loading mobile menu landing page with direct Google Maps directions and action prompt."
                },
                {
                    "name": "Print-Ready QR Table Talkers",
                    "type": "Print Deliverable",
                    "format": "PDF / CMYK 300 DPI",
                    "aspectRatio": "A6 Table Talker",
                    "resolution": "300 DPI",
                    "exactTextRequirements": ["Scan for today's breakfast specials"],
                    "description": "Durable table-top QR cards connecting diners directly to the digital menu and review prompts."
                }
            ],
            "suppliedAssets": [
                "Full dish costings and ingredient specs (Appley_Breakfast_by_the_Sea_v2.pdf)",
                "Local competitor price benchmarks",
                "Baseline kitchen workflow specifications"
            ],
            "missingAssets": [
                "Final confirmed date for 90-minute kick-off and food capture shoot with Chef Joe",
                "Final high-res logo vector if available"
            ],
            "questionsForClient": [
                "Confirm preferred dates for Chef Joe's food preparation shoot.",
                "Confirm whether £450 Launch Support package is bundled with the £950 pilot (£1,400 total)."
            ],
            "brandConstraints": [
                "All concept AI images must be replaced with Joe's real food before any public launch.",
                "Maintain warm, authentic, welcoming community seaside tone; avoid generic stock imagery."
            ],
            "rightsAndConsentFlags": [
                {
                    "flag": "Authentic Food Truthfulness",
                    "severity": "low",
                    "details": "Only actual dishes prepared by Chef Joe will appear in public promotional campaigns."
                }
            ],
            "technicalRisks": [
                "Weather dependence for outdoor coastal terrace video shoot."
            ],
            "revisionRisk": "low",
            "confidence": 96,
            "decision": "accept",
            "decisionReasons": [
                "Direct lead with ready-to-sign proposal v2.0.",
                "Extremely well-defined scope, deliverables, and unit economics.",
                "Natural upsell into £750/mo monthly retainer (£2,250 over 3 months)."
            ],
            "proposedWorkflow": [
                {
                    "stepName": "Creative Direction & Storyboard",
                    "capabilityNeeded": "concept_generation",
                    "purpose": "Finalize hero reel shot list and aesthetic grading based on prompt pack."
                },
                {
                    "stepName": "B-Roll Motion & Plate Dynamics",
                    "capabilityNeeded": "video_scene_synthesis",
                    "purpose": "Generate atmospheric coastal transitions and steam/macro seasoning effects."
                },
                {
                    "stepName": "Finishing & Color Grade",
                    "capabilityNeeded": "video_upscaling",
                    "purpose": "Export 4K master reel and 9:16 vertical cutdowns."
                }
            ],
            "estimatedAttemptsByStep": {
                "Creative Direction & Storyboard": 2,
                "B-Roll Motion & Plate Dynamics": 3,
                "Finishing & Color Grade": 1
            },
            "assumptions": [
                "Client approves pilot kick-off in October 2026.",
                "Food shoot takes place at Appley Café kitchen."
            ],
            "deterministicDecision": "accept",
            "deterministicReasons": [
                "Healthy gross margin (>90% on digital assets).",
                "Low technical generation risk; highly defined deliverables."
            ],
            "calculatedProductionCost": 35.00,
            "calculatedGrossMargin": 1365.00,
            "calculatedMarginPct": 97.5,
            "modelUsed": "gpt-6-astra (Internal Analysis)",
            "analyzedAt": now_iso
        }
    }
    store['jobs'].insert(0, cafe_job)
    store['analyses'][cafe_id] = cafe_job['originalAnalysis']

# Lead 2: Appley Manor
manor_id = 'job-appley-manor-sprint'
if manor_id not in existing_ids:
    manor_job = {
        "id": manor_id,
        "isDemo": True,
        "currency": "GBP",
        "title": "Appley Manor: 30-Day Digital Sprint (\"Same Manor Heart. New Chapter.\")",
        "clientName": "Appley Manor Hotel & Restaurant (Ryde, Isle of Wight)",
        "source": "Direct Lead",
        "rawBrief": (
            "Appley Manor 30-Day Digital Sprint:\n"
            "A founder-partner pilot to turn renewed investment into visible demand, direct enquiries, "
            "and measurable local profile growth.\n\n"
            "Core Campaign Theme: 'Same Manor Heart. New Chapter.'\n\n"
            "Campaign Pillars:\n"
            "1. Same Heart, New Chapter (Continuity of trusted hospitality with renewed investment)\n"
            "2. Dog-Friendly Appley (Appley Park walks, coastal visits, and indoor dog-friendly dining)\n"
            "3. Timeless Celebrations (Weddings, marquee, functions, and outdoor ceremony potential)\n"
            "4. The Enchanted Estate (Historic grounds, secret coastal path, outdoor cinema, park connection)\n\n"
            "Pricing & Tiers:\n"
            "- Founder-Partner 30-Day Digital Sprint: £950 (Strategy & campaign pillar map, 8-12 post/reel concepts with captions & hooks, 2-3 AI-enhanced creative demo assets e.g. time-slip heritage, QR visitor journey demo, landing page & enquiry pathway recommendations, 30-day reporting template).\n"
            "- Founder-Partner Retainer: £750/month for 3 months (£2,250 total) for ongoing campaign planning, content support, QR/landing updates, reporting.\n"
            "- Future Standard Growth Rate: £1,250+/month once value is established."
        ),
        "budget": 950,
        "deadline": "2026-10-31T18:00:00.000Z",
        "status": "New",
        "clientNotes": "Founder-partner introductory rate of £950. Agreement includes portfolio case study permissions and review meeting at day 30 to transition into £750/mo retainer.",
        "referenceAssets": [
            {
                "id": "ref-am-1",
                "name": "Appley_Manor_30_Day_Digital_Sprint.pdf",
                "url": "/Proposals/Appley_Manor_30_Day_Digital_Sprint.pdf",
                "type": "pdf",
                "notes": "8-page proposal covering sprint pillars, week-by-week timetable, pricing, and algorithmic engagement strategy."
            }
        ],
        "channelFeePct": 0,
        "contingencyPct": 10,
        "maxApprovedBudget": 45,
        "approvalCheckpoints": {
            "workflowApproved": False,
            "maxBudgetApproved": False,
            "rightsCleared": True,
            "finalDeliveryApproved": False
        },
        "createdAt": now_iso,
        "updatedAt": now_iso,
        "originalAnalysis": {
            "id": f"analysis-{manor_id}",
            "jobId": manor_id,
            "jobType": "hospitality_rebrand_sprint",
            "conciseSummary": "30-day digital sprint for historic manor hotel turning venue refurbishments into direct wedding, dining, and stay enquiries via 4 narrative pillars, heritage time-slip AI motion assets, and QR conversion journeys.",
            "deliverables": [
                {
                    "name": "4-Pillar Campaign Strategy & Blueprint",
                    "type": "Strategy Document",
                    "format": "PDF / Notion Document",
                    "aspectRatio": "A4 / 16:9",
                    "resolution": "Vector PDF",
                    "exactTextRequirements": ["Same Manor Heart. New Chapter."],
                    "description": "Detailed strategic messaging map across Weddings, Dog-Friendly Dining, Heritage Stays, and Estate Events."
                },
                {
                    "name": "8-12 Premium Social Post & Reel Concepts",
                    "type": "Social Content Pack",
                    "format": "MP4 / JPG + Caption Bank",
                    "aspectRatio": "9:16 and 4:5",
                    "durationSeconds": 15,
                    "resolution": "1080x1920",
                    "exactTextRequirements": ["Walk Appley Park, then dine indoors with your dog beside you", "Historic Manor setting. Coastal surroundings."],
                    "description": "Ready-to-post hooks, captions, and formats engineered for high algorithm retention (saves, shares, watch time)."
                },
                {
                    "name": "2-3 AI-Enhanced Creative Demo Assets (Heritage Time-Slip)",
                    "type": "Hero Video / Motion Art",
                    "format": "MP4 H.265 / ProRes",
                    "aspectRatio": "9:16 and 16:9",
                    "durationSeconds": 20,
                    "resolution": "3840x2160",
                    "exactTextRequirements": ["Appley Manor: Past & Present"],
                    "description": "Photorealistic historical-to-modern time-slip transition highlighting manor grounds, architectural heritage, and new guest spaces."
                },
                {
                    "name": "Prototype QR Visitor Journey Demo",
                    "type": "Interactive Prototype",
                    "format": "Mobile Web QR Demo",
                    "aspectRatio": "Mobile Responsive",
                    "resolution": "Mobile",
                    "exactTextRequirements": ["Welcome to Appley Manor", "Explore the Estate"],
                    "description": "Physical-to-digital QR touchpoint linking venue tables and park walkers to menu, history, and booking prompts."
                },
                {
                    "name": "30-Day Measurement & Reporting Framework",
                    "type": "Analytics Report",
                    "format": "Executive PDF Dashboard",
                    "aspectRatio": "16:9",
                    "resolution": "Vector PDF",
                    "exactTextRequirements": [],
                    "description": "Reporting template tracking views, completion rates, QR scans, saves/shares, and direct enquiry conversion."
                }
            ],
            "suppliedAssets": [
                "Appley_Manor_30_Day_Digital_Sprint.pdf proposal",
                "Historical manor context and estate photos"
            ],
            "missingAssets": [
                "Brand guidelines, fonts, and current photography asset folder",
                "GM / Marketing Manager contact details for Week 1 strategy workshop"
            ],
            "questionsForClient": [
                "Confirm date for on-site discovery session with the GM/Owner in Ryde.",
                "Clarify top commercial priority: Weddings/Private Functions vs. Everyday Restaurant/Dog-friendly Dining."
            ],
            "brandConstraints": [
                "Preserve local trust and heritage feel; avoid flashy, modern nightclub aesthetics.",
                "Ensure dog-friendly messaging clearly emphasizes indoor comfort as well as grounds."
            ],
            "rightsAndConsentFlags": [
                {
                    "flag": "Historic Imagery Usage",
                    "severity": "low",
                    "details": "Public domain Victorian/Edwardian archive imagery synthesized for time-slip motion."
                }
            ],
            "technicalRisks": [
                "Achieving seamless temporal transitions in the historical time-slip generation."
            ],
            "revisionRisk": "low",
            "confidence": 95,
            "decision": "accept",
            "decisionReasons": [
                "Clearly scoped 30-day sprint with strong client alignment.",
                "Clear path to recurring retainer at £750/mo (£2,250 over 3 months) or £1,250/mo standard rate.",
                "Exceptional local showcase value for Vectis AI / IsleConnect portfolio."
            ],
            "proposedWorkflow": [
                {
                    "stepName": "Historical Keyframe Reconstruction",
                    "capabilityNeeded": "keyframe_generation",
                    "purpose": "Generate archival Victorian aesthetic match of Appley Manor estate."
                },
                {
                    "stepName": "Time-Slip Camera Morph Transition",
                    "capabilityNeeded": "camera_motion",
                    "purpose": "Seamless camera push-in morphing historical grounds into contemporary renovated luxury."
                },
                {
                    "stepName": "Social Finishing & Vertical Packaging",
                    "capabilityNeeded": "video_upscaling",
                    "purpose": "Master 9:16 vertical reels with audio mix."
                }
            ],
            "estimatedAttemptsByStep": {
                "Historical Keyframe Reconstruction": 2,
                "Time-Slip Camera Morph Transition": 3,
                "Social Finishing & Vertical Packaging": 1
            },
            "assumptions": [
                "Appley Manor team can provide existing photo library during discovery.",
                "Sprint initiates upon client sign-off."
            ],
            "deterministicDecision": "accept",
            "deterministicReasons": [
                "Low direct production cost (~£30-40) against £950 fee (96% gross margin).",
                "No physical hardware dependencies."
            ],
            "calculatedProductionCost": 32.50,
            "calculatedGrossMargin": 917.50,
            "calculatedMarginPct": 96.6,
            "modelUsed": "gpt-6-astra (Internal Analysis)",
            "analyzedAt": now_iso
        }
    }
    store['jobs'].insert(0, manor_job)
    store['analyses'][manor_id] = manor_job['originalAnalysis']

# Lead 3: Garlic Farm
garlic_id = 'job-garlic-farm-trail'
if garlic_id not in existing_ids:
    garlic_job = {
        "id": garlic_id,
        "isDemo": True,
        "currency": "GBP",
        "title": "The Garlic Farm: \"Shrouded in Garlic\" (The Darker Side of Wight)",
        "clientName": "The Garlic Farm × Peter J Murray × Medina Publishing",
        "source": "Direct Lead",
        "rawBrief": (
            "Proposal presented by Simon Harrop (Medina Publishing), author Peter J Murray, and IsleConnect (David Grannum):\n"
            "'Step into the story at the place that inspired it.'\n\n"
            "Concept:\n"
            "A story-led visitor experience and trail linking Peter J Murray's 'The Darker Side of Wight' "
            "with The Garlic Farm. Visitors scan small QR cards at 3 spots on existing farm routes. "
            "Follows fictional young protagonist 'Matty', blending real agricultural/culinary farm facts with atmospheric mystery. "
            "Drives footfall directly into the farm shop, restaurant covers, tasting experiences, and book sales.\n\n"
            "Tiers & Packages Offered:\n"
            "- Tier 1: Story Test (Recommended Start): £1,450 (3 stops, hero film 48-60s + 3 posts, 4-week trial, end-of-trial summary).\n"
            "- Tier 2: Venue Campaign: £3,250 (3 stops + family challenge, hero film, short edits, 8-week content sequence, 1 filming session with real people, 8-week campaign, monthly review; optional support £450/mo after).\n"
            "- Tier 3: Island Anchor: £5,950 (Up to 6 touchpoints + partner route, expanded media asset bank, silent screen edit, 12-week sequence, book launch/venue filming, 12-week campaign, monthly report; optional support £750/mo after)."
        ),
        "budget": 1450,
        "deadline": "2026-11-06T18:00:00.000Z",
        "status": "New",
        "clientNotes": "Presented Sept 24, 2026. Target launch in early November ready for darker evenings and Christmas gifting, with possible half-term teaser. Introductory pricing reflects reuse of 48-second concept film and case study rights.",
        "referenceAssets": [
            {
                "id": "ref-gf-1",
                "name": "Shrouded_in_Garlic_Garlic_Farm_Proposal.pptx",
                "url": "/Proposals/Shrouded_in_Garlic_Garlic_Farm_Proposal.pptx",
                "type": "pdf",
                "notes": "15-slide master presentation covering visitor journey, Matty character art, 3 farm stops, asset sharing model, and 3 pricing tiers."
            }
        ],
        "channelFeePct": 0,
        "contingencyPct": 15,
        "maxApprovedBudget": 60,
        "approvalCheckpoints": {
            "workflowApproved": False,
            "maxBudgetApproved": False,
            "rightsCleared": True,
            "finalDeliveryApproved": False
        },
        "createdAt": now_iso,
        "updatedAt": now_iso,
        "originalAnalysis": {
            "id": f"analysis-{garlic_id}",
            "jobId": garlic_id,
            "jobType": "narrative_tourism_experience",
            "conciseSummary": "Story-led narrative visitor trail and multimedia campaign linking Peter J Murray's folklore world with The Garlic Farm through 3 on-farm QR stops, hero cinematic film, and family interactive challenge driving shop, restaurant, and book conversions.",
            "deliverables": [
                {
                    "name": "Hero Narrative Film (48-60 seconds)",
                    "type": "Hero Video",
                    "format": "ProRes 422 / MP4 4K",
                    "aspectRatio": "16:9 & 9:16",
                    "durationSeconds": 55,
                    "resolution": "3840x2160",
                    "exactTextRequirements": ["The Darker Side of Wight", "The Garlic Farm"],
                    "description": "Atmospheric cinematic teaser showing Matty uncovering the mystery across garlic fields, drying barns, and farm heritage."
                },
                {
                    "name": "3-Stop QR Mobile Story Experience",
                    "type": "Interactive Web App",
                    "format": "Mobile Web (No Download)",
                    "aspectRatio": "Mobile Responsive",
                    "resolution": "Responsive",
                    "exactTextRequirements": ["Stop 1: The Land", "Stop 2: From Bulb to Product", "Stop 3: Taste and Discovery"],
                    "description": "Zero-friction browser experience integrating audio narration, story clues, real farm facts, and final CTA."
                },
                {
                    "name": "Social Video Cut-Downs & Caption Bank",
                    "type": "Social Asset Pack",
                    "format": "MP4 + Copywriting",
                    "aspectRatio": "9:16",
                    "durationSeconds": 15,
                    "resolution": "1080x1920",
                    "exactTextRequirements": ["Step into the story at the place that inspired it"],
                    "description": "Snappy vertical reels for farm social channels, Medina Publishing, and author fan community."
                },
                {
                    "name": "On-Site Physical QR Cards & Staff Briefing",
                    "type": "Print & Collateral",
                    "format": "PDF / CMYK 300 DPI",
                    "aspectRatio": "A6 Weatherproof",
                    "resolution": "300 DPI",
                    "exactTextRequirements": ["Scan to uncover the story"],
                    "description": "Weatherproof QR cards placed seamlessly along existing customer routes."
                },
                {
                    "name": "Anonymous Conversion & Scan Analytics",
                    "type": "Analytics System",
                    "format": "Web Dashboard / PDF",
                    "aspectRatio": "16:9",
                    "resolution": "Digital",
                    "exactTextRequirements": [],
                    "description": "Privacy-first tracking measuring story starts, drop-offs, and conversions to shop/restaurant/book purchases."
                }
            ],
            "suppliedAssets": [
                "Shrouded_in_Garlic_Garlic_Farm_Proposal.pptx",
                "Existing 48-second concept film frames and character bible for Matty",
                "The Darker Side of Wight book lore by Peter J Murray"
            ],
            "missingAssets": [
                "Site walk date confirmation with The Garlic Farm team to finalize exact physical stop coordinates",
                "Farm shop & restaurant featured promo item selection (e.g. black garlic tasting, recipe bundle)"
            ],
            "questionsForClient": [
                "Which tier does The Garlic Farm prefer to begin with: Tier 1 Story Test (£1,450), Tier 2 Venue Campaign (£3,250), or Tier 3 Island Anchor (£5,950)?",
                "Confirm if an early half-term teaser in late October is desired prior to full November launch."
            ],
            "brandConstraints": [
                "Story must remain family-friendly and atmospheric rather than horror/frightening.",
                "Ensure Matty remains a fictional AI-generated character with full likeness consistency."
            ],
            "rightsAndConsentFlags": [
                {
                    "flag": "Three-way Rights Agreement",
                    "severity": "low",
                    "details": "Joint agreement between Medina Publishing, author Peter J Murray, and IsleConnect regarding book IP and character promotion."
                }
            ],
            "technicalRisks": [
                "Mobile cell reception across rural garlic fields (ensure lightweight assets and aggressive offline caching)."
            ],
            "revisionRisk": "low",
            "confidence": 98,
            "decision": "accept",
            "decisionReasons": [
                "Exceptional multi-stakeholder commercial partnership with proven IP.",
                "Tier 1 at £1,450, Tier 2 at £3,250, Tier 3 at £5,950 offers significant upsell upside.",
                "Reuses existing 48s concept footage, dramatically lowering new production overhead."
            ],
            "proposedWorkflow": [
                {
                    "stepName": "Character Coherence & Matty Keyframes",
                    "capabilityNeeded": "character_consistency",
                    "purpose": "Maintain Matty's distinct look (hoodie, hair, pendant) across farm settings."
                },
                {
                    "stepName": "Atmospheric Scene Generation & Night Grading",
                    "capabilityNeeded": "video_scene_synthesis",
                    "purpose": "Generate twilight lighting, field reflections, and garlic barn atmospheres."
                },
                {
                    "stepName": "Audio Mixing & Voiceover",
                    "capabilityNeeded": "voice_synthesis_audio",
                    "purpose": "Combine author Peter J Murray's narration with ambient soundscape."
                }
            ],
            "estimatedAttemptsByStep": {
                "Character Coherence & Matty Keyframes": 2,
                "Atmospheric Scene Generation & Night Grading": 3,
                "Audio Mixing & Voiceover": 1
            },
            "assumptions": [
                "The Garlic Farm hosts the physical QR markers on existing public trails.",
                "Medina Publishing and Pete Murray co-promote on their channels."
            ],
            "deterministicDecision": "accept",
            "deterministicReasons": [
                "High revenue ceiling (£1,450 to £5,950) with low production costs (~£45).",
                "Strong commercial and tourist traction on Isle of Wight."
            ],
            "calculatedProductionCost": 48.00,
            "calculatedGrossMargin": 1402.00,
            "calculatedMarginPct": 96.7,
            "modelUsed": "gpt-6-astra (Internal Analysis)",
            "analyzedAt": now_iso
        }
    }
    store['jobs'].insert(0, garlic_job)
    store['analyses'][garlic_id] = garlic_job['originalAnalysis']

# Save back to file
with open(store_path, 'w', encoding='utf-8') as f:
    json.dump(store, f, indent=2)

print("Successfully injected live proposal leads into studio_store.json!")
print("Total jobs in store:", len(store['jobs']))
