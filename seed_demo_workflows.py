import json
import os
from datetime import datetime

store_path = os.path.join('.data', 'studio_store.json')
with open(store_path, 'r', encoding='utf-8') as f:
    store = json.load(f)

now_iso = datetime.utcnow().isoformat() + 'Z'

# Analysis for After the Rain
rain_analysis = {
    "id": "analysis-after-the-rain",
    "jobId": "job-after-the-rain",
    "jobType": "luxury_commercial_reveal",
    "conciseSummary": "15-second cinematic product reveal for Aura Hydrate Volcanic Mineral Mist resting on wet basalt stone after a rain shower, with specular reflections and sunrise warm finish.",
    "deliverables": [
        {
            "name": "15s Master Hero Commercial",
            "type": "Hero Video",
            "format": "ProRes 422 HQ",
            "aspectRatio": "16:9",
            "durationSeconds": 15,
            "resolution": "3840x2160",
            "exactTextRequirements": ["Aura Hydrate", "Luminary Botanicals"],
            "description": "4K master commercial video with camera dolly and atmospheric mist."
        },
        {
            "name": "15s Vertical Social Cutdown",
            "type": "Social Cutdown",
            "format": "MP4 H.265",
            "aspectRatio": "9:16",
            "durationSeconds": 15,
            "resolution": "1080x1920",
            "exactTextRequirements": ["Aura Hydrate", "Luminary Botanicals"],
            "description": "Vertical video with safe-zone kinetic captions."
        }
    ],
    "suppliedAssets": [
        "Aura_Hydrate_Bottle_3D_Master.png",
        "Icelandic_Basalt_Rain_Moodboard.pdf"
    ],
    "missingAssets": [],
    "questionsForClient": [
        "Confirm specular reflection sharpness preference on wet basalt stone."
    ],
    "brandConstraints": [
        "Preserve exact frosted glass flacon geometry and matte black cap silhouette.",
        "Maintain quiet luxury, grounded clinical aesthetic; avoid cartoonish saturated splashes."
    ],
    "rightsAndConsentFlags": [
        {
            "flag": "Original Botanical Formulation",
            "severity": "low",
            "details": "Original cosmetic product visual; no competitor trademark conflicts."
        }
    ],
    "technicalRisks": [
        "Temporal coherence on fluid reflections across puddle surface."
    ],
    "revisionRisk": "low",
    "confidence": 98,
    "decision": "accept",
    "decisionReasons": [
        "Matches Launch Video productized template specifications perfectly.",
        "Reference asset supplied provides pristine 3D bottle geometry."
    ],
    "proposedWorkflow": [
        {"stepName": "Rapid Motion Search (8 Hooks)", "capabilityNeeded": "concept_generation", "purpose": "8 concept hooks"},
        {"stepName": "Controlled Keyframes (Seedream 2.0)", "capabilityNeeded": "reference_control", "purpose": "Product geometry lock"},
        {"stepName": "Deterministic Camera Trajectory (DoP 2.5)", "capabilityNeeded": "camera_motion", "purpose": "Orbital dolly push-in"},
        {"stepName": "Final Cinematic Motion (Seedance 2.5 Master)", "capabilityNeeded": "video_scene_synthesis", "purpose": "Cinematic fluid dynamics"},
        {"stepName": "Continuity Repair (Qwen Inpaint)", "capabilityNeeded": "surgical_inpaint", "purpose": "Reflection vector alignment"},
        {"stepName": "Broadcast Voiceover (ElevenLabs Ultra)", "capabilityNeeded": "voiceover_synthesis", "purpose": "Vocal narration track"},
        {"stepName": "Neural 4K Master Upscale (Topaz Video AI)", "capabilityNeeded": "neural_upscale", "purpose": "4K UHD super-resolution & warm LUT"},
        {"stepName": "Kinetic Social Captions (SubCaption Studio)", "capabilityNeeded": "caption_synthesis", "purpose": "9:16 safe-zone framing"}
    ],
    "estimatedAttemptsByStep": {
        "Rapid Motion Search (8 Hooks)": 8,
        "Controlled Keyframes (Seedream 2.0)": 3,
        "Deterministic Camera Trajectory (DoP 2.5)": 2,
        "Final Cinematic Motion (Seedance 2.5 Master)": 3,
        "Continuity Repair (Qwen Inpaint)": 1,
        "Broadcast Voiceover (ElevenLabs Ultra)": 2,
        "Neural 4K Master Upscale (Topaz Video AI)": 1,
        "Kinetic Social Captions (SubCaption Studio)": 1
    },
    "assumptions": ["Client approves 72h turnaround timeline."],
    "deterministicDecision": "accept",
    "deterministicReasons": ["Target margin 98.6% easily satisfies studio thresholds."],
    "calculatedProductionCost": 13.80,
    "calculatedGrossMargin": 2386.20,
    "calculatedMarginPct": 99.4,
    "modelUsed": "gpt-6-astra (Internal Analysis)",
    "analyzedAt": now_iso
}

store['analyses']['job-after-the-rain'] = rain_analysis
for j in store['jobs']:
    if j['id'] == 'job-after-the-rain':
        j['originalAnalysis'] = rain_analysis

# Workflow for After the Rain
rain_wf = {
    "id": "wf-after-the-rain",
    "jobId": "job-after-the-rain",
    "steps": [
        {
            "id": "step-1",
            "order": 1,
            "name": "Rapid Motion Search: 8 Hook Concepts (Operator Chooses 2)",
            "stage": "Concept & Keyframe",
            "role": "SEARCH",
            "selectedModel": "Wan 2.1 Fast / Lite (Motion Search)",
            "selectedModelId": "wan-2.1-fast",
            "whyItFits": "Inexpensive sub-second exploration allows generating 8 broad visual hooks/framings for only $3.60 total. Operator selects top 2 before committing paid GPU budget to high-fidelity motion.",
            "knownFailureMode": "Motion blur and smear can occur during rapid 180-degree rotational moves.",
            "failureMitigation": "Generate 4-6 rough 5s clips, select top 2 movement curves, seed into Seedance for final ship.",
            "purpose": "Generate 8 concept variants exploring camera angle and basalt lighting. Operator selects 2 winners.",
            "inputs": {"batchSize": 8, "prompt": "Exploratory concepts: Monolithic frosted glass mist bottle on wet basalt rock.", "resolution": "720p", "aspectRatio": "16:9"},
            "expectedOutputs": "8 rough concept variants; operator selects 2 winners.",
            "estimatedAttempts": 8,
            "unitCost": 0.45,
            "estimatedTotalCost": 3.60,
            "actualCost": 3.60,
            "status": "Completed"
        },
        {
            "id": "step-2",
            "order": 2,
            "name": "Controlled Master Keyframes (Seedream Geometry & Reference Lock)",
            "stage": "Concept & Keyframe",
            "role": "CONTROL",
            "selectedModel": "ByteDance Seedream 2.0 (Product & Reference Lock)",
            "selectedModelId": "bytedance-seedream-2",
            "whyItFits": "Seedream 2.0 excels at reference conditioning, locking exact product packaging, textures, and geometry against client assets while placing it naturally on wet volcanic basalt.",
            "knownFailureMode": "Can stiffen organic elements if reference weight is over 0.85.",
            "failureMitigation": "Set reference weight to 0.76 for wet stone surface reflections.",
            "purpose": "Generate 2 locked master keyframe plates preserving client reference geometry and lighting.",
            "inputs": {"aspectRatio": "16:9", "resolution": "3840x2160", "referenceAssets": ["Aura_Hydrate_Bottle_3D_Master.png"]},
            "expectedOutputs": "2 locked master keyframe plates.",
            "estimatedAttempts": 3,
            "unitCost": 0.20,
            "estimatedTotalCost": 0.60,
            "actualCost": 0.60,
            "status": "Completed"
        },
        {
            "id": "step-3",
            "order": 3,
            "name": "Deterministic Camera Choreography (Higgsfield DoP 2.5)",
            "stage": "Camera Motion / DoP",
            "role": "CONTROL",
            "selectedModel": "Higgsfield DoP 2.5 (Director of Photography)",
            "selectedModelId": "higgsfield-dop-2.5",
            "whyItFits": "Enforces repeatable physical camera trajectories (orbital push-in, Steadicam tracking) without warping the locked subject keyframe.",
            "knownFailureMode": "Sudden extreme acceleration curves (>45 deg/sec) can warp background edges.",
            "failureMitigation": "Select 50mm prime profile and ease-in/ease-out logarithmic curve.",
            "purpose": "Apply smooth orbital dolly-in camera motion to the locked keyframe plate.",
            "inputs": {"cameraMovement": "Slow logarithmic push-in with 20-degree orbital pan"},
            "expectedOutputs": "Stabilized 5-second camera trajectory motion plates.",
            "estimatedAttempts": 2,
            "unitCost": 1.60,
            "estimatedTotalCost": 3.20,
            "actualCost": 3.20,
            "status": "Completed"
        },
        {
            "id": "step-4",
            "order": 4,
            "name": "Final Cinematic Motion Synthesis (Seedance Master)",
            "stage": "Cinematic Video Gen",
            "role": "SHIP",
            "selectedModel": "ByteDance Seedance 2.5 Master (Cinematic Video)",
            "selectedModelId": "bytedance-seedance-2.5",
            "whyItFits": "ByteDance Seedance 2.5 is the gold standard for commercial fluid dynamics, water droplets, and high temporal stability.",
            "knownFailureMode": "Rapid multi-person movement can occasionally cross limbs in background scenes.",
            "failureMitigation": "Use approved keyframe seed from CONTROL phase.",
            "purpose": "Synthesize final 5-second cinematic motion sequences with realistic fluid physics.",
            "inputs": {"fps": 24, "scenePrompts": "Water droplet rolling down frosted glass flacon, cold rain mist, subtle sunrise reflection."},
            "expectedOutputs": "Master generative motion shots.",
            "estimatedAttempts": 3,
            "unitCost": 1.50,
            "estimatedTotalCost": 4.50,
            "actualCost": 4.50,
            "status": "Completed"
        },
        {
            "id": "step-5",
            "order": 5,
            "name": "Continuity & Packaging Repair Pass (Qwen Surgical Inpaint)",
            "stage": "Concept & Keyframe",
            "role": "CONTROL",
            "selectedModel": "Qwen Image Edit / Inpaint Pro",
            "selectedModelId": "qwen-image-edit-v2",
            "whyItFits": "Self-repair loop triggered: surgically realigns reflection vector on wet basalt without re-rendering expensive 5-second video passes.",
            "knownFailureMode": "Hard edge boundary visible if inpainting mask feathering is below 8px.",
            "failureMitigation": "Feather inpaint mask by 14px.",
            "purpose": "Surgical repair pass to guarantee pristine reflection vector alignment and label crispness.",
            "inputs": {"inpaintFeatherPx": 14, "preservationMask": "Bottle puddle contact shadow"},
            "expectedOutputs": "1 repaired master plate with 100% verified reflection continuity.",
            "estimatedAttempts": 1,
            "unitCost": 0.15,
            "estimatedTotalCost": 0.15,
            "actualCost": 0.15,
            "status": "Completed"
        },
        {
            "id": "step-6",
            "order": 6,
            "name": "Broadcast Master Voiceover (ElevenLabs Ultra)",
            "stage": "Voice & Audio",
            "role": "FINISH",
            "selectedModel": "ElevenLabs Voice Studio Ultra",
            "selectedModelId": "elevenlabs-voice-studio",
            "whyItFits": "Generates warm, broadcast-grade narrative voiceover with natural pacing, micro-breaths, and studio EQ.",
            "knownFailureMode": "Specialized proper nouns require phonetic respelling.",
            "failureMitigation": "Provide phonetic respelling in script input.",
            "purpose": "Synthesize master vocal audio track matching video pacing.",
            "inputs": {"script": "From the ash of stillness, presence is born. Aura Hydrate Volcanic Mineral Mist."},
            "expectedOutputs": "Master voice audio file ready for final cut.",
            "estimatedAttempts": 2,
            "unitCost": 0.35,
            "estimatedTotalCost": 0.70,
            "actualCost": 0.70,
            "status": "Completed"
        },
        {
            "id": "step-7",
            "order": 7,
            "name": "Neural 4K Master Upscale & Warm Finish (Topaz Video AI)",
            "stage": "Finishing & Upscaling",
            "role": "FINISH",
            "selectedModel": "Topaz Video AI Pro (Neural Upscale & Interpolation)",
            "selectedModelId": "topaz-video-ai-pro",
            "whyItFits": "Executes 4K UHD super-resolution and applies warm 3800K sunrise LUT requested in Revision Round 1.",
            "knownFailureMode": "Over-sharpening halos if sharpness parameter exceeds 40%.",
            "failureMitigation": "Cap deblur strength at 25% and apply warm 3800K highlight grade.",
            "purpose": "Deliver clean 4K UHD master with warm hopeful reveal and natural film grain.",
            "inputs": {"targetResolution": "3840x2160", "lutCurve": "Warm Sunrise 3800K", "grainMatching": "35mm Kodak 5207"},
            "expectedOutputs": "4K master export compliant with client delivery specs.",
            "estimatedAttempts": 1,
            "unitCost": 0.90,
            "estimatedTotalCost": 0.90,
            "actualCost": 0.90,
            "status": "Completed"
        },
        {
            "id": "step-8",
            "order": 8,
            "name": "Kinetic Social Captions & 9:16 Vertical Safe-Zone Framing",
            "stage": "Finishing & Upscaling",
            "role": "FINISH",
            "selectedModel": "SubCaption Studio AI (Kinetic Typography)",
            "selectedModelId": "subcaption-studio-export",
            "whyItFits": "Burns in styled kinetic subtitles positioned safely inside Instagram/TikTok UI bounds.",
            "knownFailureMode": "Heavy background music can obscure mumbled speech.",
            "failureMitigation": "Pass isolated voice stem rather than stereo mix.",
            "purpose": "Generate 9:16 vertical cutdowns with animated captions.",
            "inputs": {"aspectRatio": "9:16", "safeZonePaddingPct": 15},
            "expectedOutputs": "Social-ready 9:16 vertical MP4 cutdown.",
            "estimatedAttempts": 1,
            "unitCost": 0.15,
            "estimatedTotalCost": 0.15,
            "actualCost": 0.15,
            "status": "Completed"
        }
    ],
    "totalEstimatedCost": 13.80,
    "approvalStatus": "Approved",
    "approvedBy": "David (Human Operator)",
    "approvedAt": now_iso,
    "maxApprovedSpend": 45.0,
    "notes": "Launch Video productized workflow. Human approved. Autonomous self-repair and revision applied."
}

store['workflows']['job-after-the-rain'] = rain_wf

# Generations for After the Rain
if 'generations' not in store:
    store['generations'] = {}

store['generations']['job-after-the-rain'] = [
    {
        "id": "gen-rain-motion-01",
        "jobId": "job-after-the-rain",
        "stepId": "step-4",
        "providerRequestId": "hf-req-rain-4821",
        "model": "ByteDance Seedance 2.5 Master (Cinematic Video)",
        "status": "Completed",
        "costEstimate": 4.50,
        "actualCost": 4.50,
        "outputUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "thumbnailUrl": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
        "outputType": "video",
        "aspectRatio": "16:9",
        "durationSeconds": 15,
        "startedAt": now_iso,
        "completedAt": now_iso
    }
]

# Analysis & Workflow for Night Orchard
orchard_analysis = {
    "id": "analysis-night-orchard",
    "jobId": "job-night-orchard",
    "jobType": "low_light_cinematic_glide",
    "conciseSummary": "Slow continuous 8-second night shot gliding through mist-covered heritage apple trees under starlight, revealing glowing ice cider bottle on stone ledge with deep shadow physics.",
    "deliverables": [
        {
            "name": "8s Master Twilight Glide Video",
            "type": "Hero Video",
            "format": "ProRes 422",
            "aspectRatio": "16:9",
            "durationSeconds": 8,
            "resolution": "3840x2160",
            "exactTextRequirements": ["Night Orchard", "Cider & Stone"],
            "description": "Continuous camera glide with low-light shadow dynamics and starlight."
        }
    ],
    "suppliedAssets": ["Night_Orchard_Bottle_Wax_Seal.jpg"],
    "missingAssets": [],
    "questionsForClient": [
        "Confirm whether Route A (Seedance 2.5 fluid mist) or Route B (Kling 1.5 Pro complex branch occlusion) is preferred."
    ],
    "brandConstraints": [
        "Preserve heritage wax-dip amber bottle authenticity; avoid noisy digital sensor grain in shadows."
    ],
    "rightsAndConsentFlags": [
        {
            "flag": "Heritage Brand Mark",
            "severity": "low",
            "details": "Client owned historical estate mark."
        }
    ],
    "technicalRisks": [
        "Low-light noise suppression on dark tree canopy textures."
    ],
    "revisionRisk": "low",
    "confidence": 96,
    "decision": "accept",
    "decisionReasons": [
        "Clearly scoped low-light atmospheric brief.",
        "Candidate for multi-model route comparison (Seedance vs Kling)."
    ],
    "proposedWorkflow": [
        {"stepName": "Atmospheric Mood Search", "capabilityNeeded": "concept_generation", "purpose": "Low-light lighting test"},
        {"stepName": "Keyframe Bottle & Stone Lock", "capabilityNeeded": "reference_control", "purpose": "Lock amber bottle and wax seal"},
        {"stepName": "Continuous 8s Camera Glide", "capabilityNeeded": "camera_motion", "purpose": "Smooth tracking pass"},
        {"stepName": "Final Low-Light Motion", "capabilityNeeded": "video_scene_synthesis", "purpose": "Synthesize starlight mist"},
        {"stepName": "Denoise & 4K Master", "capabilityNeeded": "neural_upscale", "purpose": "4K super-resolution and dark shadow cleanup"}
    ],
    "estimatedAttemptsByStep": {
        "Atmospheric Mood Search": 6,
        "Keyframe Bottle & Stone Lock": 2,
        "Continuous 8s Camera Glide": 2,
        "Final Low-Light Motion": 3,
        "Denoise & 4K Master": 1
    },
    "assumptions": ["Client approves 8-second continuous take."],
    "deterministicDecision": "accept",
    "deterministicReasons": ["Healthy margin (>98%)."],
    "calculatedProductionCost": 12.50,
    "calculatedGrossMargin": 2187.50,
    "calculatedMarginPct": 99.4,
    "modelUsed": "gpt-6-astra (Internal Analysis)",
    "analyzedAt": now_iso
}

store['analyses']['job-night-orchard'] = orchard_analysis
for j in store['jobs']:
    if j['id'] == 'job-night-orchard':
        j['originalAnalysis'] = orchard_analysis

# Save back to disk
with open(store_path, 'w', encoding='utf-8') as f:
    json.dump(store, f, indent=2)

print("Successfully injected demo workflows and analyses for After the Rain and Night Orchard!")
