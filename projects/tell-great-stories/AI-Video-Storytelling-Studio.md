# AI Video Storytelling Studio

> A comprehensive guide to building high-quality viral videos for startup founders using AI-powered video generation on NVIDIA DGX Spark.

**Project Owner:** Jack Shen
**Hardware:** NVIDIA DGX Spark (128GB unified memory, GB10 SoC)
**Last Updated:** December 2025

---

## Table of Contents

1. [Project Overview](#part-1-project-overview)
2. [The Science of Viral Videos](#part-2-the-science-of-viral-videos)
3. [Storytelling Frameworks](#part-3-storytelling-frameworks)
4. [Video Production Design Guide](#part-4-video-production-design-guide)
5. [Startup Video Templates](#part-5-startup-video-templates)
6. [AI Video Pipeline (ComfyUI)](#part-6-ai-video-pipeline-comfyui)
7. [Technical Setup on DGX Spark](#part-7-technical-setup-on-dgx-spark)
8. [Post-Production Workflow](#part-8-post-production-workflow)
9. [Quality Checklist](#part-9-quality-checklist)
10. [Resources & References](#part-10-resources--references)
11. [Style Studies: Anthropic](#part-11-style-study-anthropic)

---

# Part 1: Project Overview

## 1.1 Vision

Create a systematized approach to producing high-quality, viral-ready videos for startup founders. This studio combines:

- **Proven storytelling frameworks** (MrBeast, YC, Hollywood)
- **AI-powered video generation** (ComfyUI + multiple models)
- **Professional production standards** (cinematography, pacing, sound)
- **Startup-specific templates** (launch, fundraising, features, interviews)

## 1.2 Target Video Types

| Video Type | Duration | Primary Goal | Key Metric |
|------------|----------|--------------|------------|
| **Launch Video** | 60-90 sec | Generate excitement | Shares, virality |
| **Feature Announcement** | 30-60 sec | Drive adoption | Click-through |
| **Fundraising Video** | 90-120 sec | Investor conversion | Meeting requests |
| **Vision Story** | 2-5 min | Build brand affinity | Watch time |
| **Founder Interview** | 3-10 min | Trust building | Engagement |
| **Demo/Explainer** | 60-90 sec | Clarity | Completion rate |

## 1.3 What Makes This Different

Traditional approach: Hire agency ($10K-50K), wait 4-8 weeks
**AI Studio approach**:
- Same storytelling rigor as top agencies
- AI-generated supplementary footage
- 10x faster iteration
- Consistent quality framework
- Runs locally on DGX Spark

---

# Part 2: The Science of Viral Videos

## 2.1 The Two Metrics That Matter

From the MrBeast Production Handbook:

### CTR (Click-Through Rate)
> "CTR is basically how many people see our thumbnail in their feeds divided by how many that click it."

**What drives CTR:**
- Thumbnail (50% of success)
- Title (50% of success)
- First impression / curiosity gap

### AVD/AVP (Average View Duration / Percentage)
> "For videos to do well, you must get their AVD and AVP as high as possible. The longer people watch, the better a video will do."

**What drives retention:**
- Hook (first 5-30 seconds)
- Pacing (no dull moments)
- Story structure
- Payoff/ending

## 2.2 The Attention Curve

Research shows viewer attention follows predictable patterns:

```
Attention Level
     ^
100% |*
     | *
 80% |  *
     |   * *
 60% |      * *
     |         * *
 40% |            * * *
     |                 * *
 20% |                    * *
     |________________________*_____> Time
     0s    30s   1m    2m    5m
```

### Critical Moments

| Timestamp | What Happens | Your Goal |
|-----------|--------------|-----------|
| **0-5 sec** | 20-30% drop immediately | Hook with stakes/curiosity |
| **5-30 sec** | Another 20% decide to leave | Validate the hook, show value |
| **30-60 sec** | Commitment point | Transition to story |
| **1-3 min** | "Hype to action" phase | Most exciting content |
| **3-6 min** | Deep engagement | Story builds, re-engage |
| **6+ min** | Invested viewers | Lead to payoff |

## 2.3 The Psychology of Editing

### Seconds Per Cut Research

| Content Type | Avg Shot Length | Why |
|--------------|-----------------|-----|
| Music videos (chorus) | 3.5 sec | High energy |
| Music videos (verse) | 5-6 sec | Breathing room |
| Commercials/Ads | 2-5 sec | Grab attention fast |
| Modern films | 4-6 sec | Neutral baseline |
| MrBeast videos | 3-7 sec | Constant stimulation |
| Documentary interviews | 8-15 sec | Allow emotional beats |

### The 3-5 Second Rule

> "Research estimates that it takes roughly 3-5 seconds for a viewer to fully engage with a shot before their attention starts wavering."

**Practical application:**
- Change something visually every 3-5 seconds
- Can be: cut, camera move, B-roll, text overlay, zoom
- Pattern interrupt every 30-60 seconds in talking segments

### Cognitive Load Theory

- Fast cuts = excitement, urgency
- Slow cuts = emotion, importance
- Varied pacing = maintains engagement
- Monotonous pacing = viewer fatigue

## 2.4 The "Wow Factor"

From MrBeast:
> "Anything that no other youtuber can do. And it's important we never lose our wow."

**For startup videos, "wow" means:**
- Showing something genuinely novel
- A statistic that makes people pause
- A visual that's unexpected
- A story beat that creates emotion

---

# Part 3: Storytelling Frameworks

## 3.1 The MrBeast Formula

### Core Structure

```
HOOK (0-30 sec)
    |
    v
SETUP + ESCALATION (30 sec - 3 min)
    |
    v
RE-ENGAGEMENT MOMENTS (throughout)
    |
    v
CLIMAX + PAYOFF (final 20%)
    |
    v
ABRUPT ENDING (no lingering)
```

### The "Stair Stepping" Format

Progressively increase stakes throughout the video:

```
Example: "I Bought The World's Largest Firework"

$1 firework
    |
$10 firework
    |
$50 firework
    |
$375 firework
    |
$1,000 firework
    |
$10,000 firework
    |
$100,000 firework
    |
WORLD RECORD (payoff)
```

**For startup videos:**
- Start with small pain point → escalate to massive problem
- Show small feature → build to transformative impact
- Begin with one user → scale to market opportunity

### The "Jenga Storytelling" Technique

> Show a quick peek of the end result at the beginning to keep viewers motivated to watch.

**Example applications:**
- Open with the transformation/result
- "By the end of this video, you'll see how we..."
- Flash forward to the climax, then "Let's start from the beginning"

## 3.2 The Hollywood Three-Act Structure

### Act 1: Setup (25% of runtime)
- Introduce the world/context
- Present the problem/conflict
- Hook the audience

### Act 2: Confrontation (50% of runtime)
- Rising action
- Obstacles and complications
- Character development
- Building tension

### Act 3: Resolution (25% of runtime)
- Climax
- Resolution
- New equilibrium

### Adapted for Startup Videos

| Act | Startup Video Element | Example |
|-----|----------------------|---------|
| **Act 1** | The Problem | "Every day, 10,000 developers waste 2 hours on..." |
| **Act 2** | The Journey/Solution | "We built X because... Here's how it works..." |
| **Act 3** | The Transformation | "Now those developers ship 3x faster" |

## 3.3 The YC Demo Day Framework

### The 60-Second Pitch Structure

From Y Combinator's guide:

```
1. ONE SLIDE (7 words or fewer)
2. ONE STORY (problem → solution → opportunity)
3. LEAD WITH TRACTION (don't bury impressive numbers)
4. KNOW YOUR STORY COLD (no reading, natural delivery)
```

### The DoorDash Pattern

Their YC Demo Day pitch:
1. **Clear intro**: "We're DoorDash, and we enable every restaurant to deliver"
2. **Traction graph**: 31% week-over-week growth
3. **Key metrics**: Delivery times, sales figures
4. **The ask**: Clear next step

### Best Practices

- Under 2 minutes for pitch videos
- One consistent narrative
- Emotional connection matters
- Show, don't tell (demonstrate the product)
- Professional production = credibility

## 3.4 The Hook Framework

### Types of Hooks

| Hook Type | Example | Best For |
|-----------|---------|----------|
| **Question** | "What if you could 10x your output?" | Curiosity |
| **Bold Statement** | "This will change how you think about X" | Authority |
| **Contrarian** | "Everything you know about X is wrong" | Attention |
| **Story** | "Last year, we almost went bankrupt..." | Emotion |
| **Demonstration** | [Show the product doing something amazing] | Proof |
| **Statistics** | "97% of startups fail because..." | Credibility |
| **Pain Point** | "Tired of wasting 3 hours a day on..." | Relatability |

### The 5-Second Test

Ask: "Would someone stop scrolling for this?"

Checklist:
- [ ] Creates curiosity gap
- [ ] Establishes stakes
- [ ] Promises value
- [ ] Is visually distinct
- [ ] Matches thumbnail promise

## 3.5 The Brendan Kane Format Framework

> "Trends are fleeting, while formats are repeatable storytelling structures that consistently perform well over time."

### 220+ Identified Formats

Key insight: Find formats that work, then adapt them to your content.

**High-performing formats for startups:**
1. Before/After transformation
2. "Day in the life" with product
3. Founder story arc
4. Problem → Frustration → Solution reveal
5. Customer testimonial journey
6. Behind-the-scenes building
7. "What if" scenario exploration

---

# Part 4: Video Production Design Guide

## 4.1 Shot Types Reference

### By Distance

| Shot Type | Frame | Use Case |
|-----------|-------|----------|
| **Extreme Wide (EWS)** | Full environment | Establishing scale |
| **Wide Shot (WS)** | Full body + environment | Context, setting |
| **Medium Wide (MWS)** | Knees up | Action, movement |
| **Medium Shot (MS)** | Waist up | Conversation, presentation |
| **Medium Close-Up (MCU)** | Chest up | **Standard interview shot** |
| **Close-Up (CU)** | Face only | Emotion, emphasis |
| **Extreme Close-Up (ECU)** | Eyes/detail | Intensity, detail |

### By Angle

| Angle | Effect | Use When |
|-------|--------|----------|
| **Eye Level** | Neutral, relatable | Default for interviews |
| **Low Angle** | Power, authority | Founder as leader |
| **High Angle** | Vulnerability, smaller | Problem state |
| **Dutch Angle** | Unease, tension | Disruption, problem |
| **Over-the-Shoulder** | Connection, conversation | Two-person scenes |
| **Bird's Eye** | Context, overview | Product demos, scale |

## 4.2 Interview Setup

### The Standard Setup

```
         [KEY LIGHT]
              |
              v  45-60°
    [FILL]         [SUBJECT]  --> [CAMERA]
              |
         [BACKLIGHT]
```

### Lighting Options

| Style | Look | Best For |
|-------|------|----------|
| **3-Point** | Professional, safe | Corporate, fundraising |
| **Rembrandt** | Dramatic triangle under eye | Serious, authority |
| **High Key** | Bright, optimistic | Launch, features |
| **Low Key** | Dramatic shadows | Vision, problem setup |

### Framing Rules

- **Rule of Thirds**: Place eyes on upper third line
- **Look Room**: More space in direction subject faces
- **Head Room**: Small gap above head
- **Background**: Textured, depth, relevant (not flat wall)

## 4.3 B-Roll Strategy

### A-Roll vs B-Roll

| A-Roll | B-Roll |
|--------|--------|
| Primary footage | Supplementary footage |
| Interview/talking head | Illustrative shots |
| "Telling" | "Showing" |
| The narration | The illustration |

### Essential B-Roll Types for Startups

1. **Product shots**
   - UI/UX in action
   - Physical product details
   - Screen recordings with motion

2. **Team shots**
   - Working at desks
   - Whiteboard sessions
   - Casual interactions

3. **Environment**
   - Office space
   - Meeting rooms
   - City/context

4. **Symbolic/Abstract**
   - Time-lapse
   - Data visualizations
   - Metaphorical imagery

5. **Customer context**
   - Users with product
   - Industry environments
   - Problem visualization

### B-Roll Timing

- Use B-roll every 5-10 seconds during talking segments
- Match B-roll to spoken content
- Use B-roll to hide cuts/edits
- Close-ups of hands = humanizing

## 4.4 Pacing and Rhythm

### The Pacing Formula

```
High Energy Moments: 2-3 second cuts
Moderate Moments: 4-5 second cuts
Emotional/Important Moments: 6-10 second cuts
Breathing Room: 8-15 second cuts
```

### Pattern Interrupt Schedule

| Video Length | Interrupt Frequency |
|--------------|---------------------|
| 30-60 sec | Every 10-15 sec |
| 1-3 min | Every 20-30 sec |
| 3-10 min | Every 30-60 sec |

### Types of Pattern Interrupts

1. Camera angle change
2. B-roll insertion
3. Text/graphic overlay
4. Sound effect/music change
5. Zoom (digital or physical)
6. Color grade shift
7. Split screen
8. Animation/motion graphic

## 4.5 Audio Guidelines

### Voice Recording

| Element | Standard |
|---------|----------|
| Sample rate | 48kHz |
| Bit depth | 24-bit |
| Levels | -12 to -6 dB peaks |
| Room tone | Record 30 sec of silence |
| Mic position | 6-12 inches from mouth |

### Music Selection

| Video Type | Music Style |
|------------|-------------|
| Launch/exciting | Upbeat, driving, builds |
| Fundraising | Inspiring, emotional, hopeful |
| Demo/explainer | Light, unobtrusive, corporate |
| Vision story | Cinematic, epic, emotional |
| Interview | Subtle underscore or none |

### Sound Design Layers

1. **Dialogue/VO** (loudest)
2. **Music** (background, -15 to -20 dB under dialogue)
3. **Sound effects** (accents, transitions)
4. **Ambiance** (subtle room tone, environment)

---

# Part 5: Startup Video Templates

## 5.1 Launch Video Template (60-90 sec)

### Structure

```
[0-5 sec]    HOOK: Bold statement or question
[5-15 sec]   PROBLEM: The pain point (emotional)
[15-30 sec]  SOLUTION: Introduce product (the reveal)
[30-50 sec]  DEMO: Show it working (wow moments)
[50-70 sec]  SOCIAL PROOF: Traction, testimonial snippet
[70-80 sec]  CTA: Clear next step
[80-90 sec]  LOGO + TAGLINE: Brand stamp
```

### Shot List

| Timestamp | Shot | Audio |
|-----------|------|-------|
| 0-5s | Bold visual or founder MCU | Hook statement |
| 5-15s | Problem visualization B-roll | VO describing pain |
| 15-20s | Product reveal (dramatic) | Transition sound + music shift |
| 20-50s | Product demo montage | Feature highlights VO |
| 50-60s | Customer/user footage | Testimonial or metrics |
| 60-70s | Founder CU | Call to action |
| 70-90s | Logo animation | Tagline + website |

### Example Script Template

```
HOOK:
"What if [bold promise]?"
-or-
"[Surprising statistic about problem]"

PROBLEM:
"Every day, [target audience] struggles with [specific pain].
They waste [time/money/energy] on [current solution].
It's [emotional adjective]."

SOLUTION:
"That's why we built [Product Name].
[One sentence description]."

DEMO:
"Watch what happens when you [key action].
[Feature 1] lets you [benefit].
[Feature 2] means [transformation]."

PROOF:
"[X users/customers] already [achievement].
[Specific metric or quote]."

CTA:
"Start [doing benefit] today.
Visit [website]."
```

## 5.2 Fundraising Video Template (90-120 sec)

### Structure

```
[0-10 sec]   TRACTION HOOK: Lead with your best number
[10-25 sec]  PROBLEM: Market opportunity
[25-40 sec]  SOLUTION: Your unique approach
[40-60 sec]  HOW IT WORKS: Brief demo
[60-80 sec]  TRACTION DEEP DIVE: Metrics, growth
[80-100 sec] TEAM: Why you'll win
[100-115 sec] THE ASK: Round details
[115-120 sec] CLOSE: Contact info
```

### Key Principles (from YC)

1. **Don't bury the lead** - Best metrics first
2. **One narrative** - Problem → Solution → Opportunity
3. **Show don't tell** - Demo over explanation
4. **Founder chemistry** - Show team dynamic
5. **Clarity over complexity** - Simple language

### Shot List

| Section | Shots | Notes |
|---------|-------|-------|
| Traction Hook | Animated graph/number + Founder | Big, bold typography |
| Problem | Market visualization, frustrated user B-roll | Emotional, relatable |
| Solution | Product UI, Founder explaining | Clean, professional |
| Demo | Screen recording with motion | Smooth, focused |
| Traction | Metrics animations, user growth | Data visualization |
| Team | Co-founders together, working | Natural, authentic |
| Ask | Founder direct to camera | Confident, clear |

## 5.3 Feature Announcement Template (30-60 sec)

### Structure

```
[0-5 sec]    HOOK: "Introducing [Feature Name]"
[5-15 sec]   BEFORE: The old way / pain point
[15-35 sec]  AFTER: The new capability (demo)
[35-50 sec]  BENEFITS: 2-3 key outcomes
[50-60 sec]  CTA: "Available now" + how to access
```

### Pacing Notes

- Very fast cuts (2-4 seconds)
- High energy music
- Bold text overlays
- Quick transitions (whip pans, zooms)

## 5.4 Vision Story Template (2-5 min)

### Structure

```
[0-30 sec]      COLD OPEN: Glimpse of the future you're building
[30 sec-1 min]  ORIGIN: Why this matters to you personally
[1-2 min]       THE PROBLEM: Deep dive into what's broken
[2-3 min]       THE VISION: What the world looks like solved
[3-4 min]       THE JOURNEY: How you're getting there
[4-4:30 min]    THE IMPACT: Who benefits and how
[4:30-5 min]    THE INVITATION: How viewers can be part of it
```

### Tone

- More cinematic, emotional
- Longer shots allowed (8-15 sec for emotional beats)
- Documentary-style interview footage
- Inspiring music throughout
- Strong visual metaphors

## 5.5 Founder Interview Template (3-10 min)

### Question Framework

**Origin Story (1-2 min)**
- What made you start this?
- What was the moment you knew?

**The Problem (1-2 min)**
- What's broken about [industry]?
- Who suffers most from this?

**The Solution (2-3 min)**
- How does [product] work?
- What makes your approach different?
- Show me [key feature].

**The Vision (1-2 min)**
- Where do you see this in 5 years?
- What's the ultimate impact?

**The Ask/Close (30-60 sec)**
- What do you need right now?
- How can people get involved?

### Production Notes

- MCU as base shot, CU for emotional moments
- Lots of B-roll to cover edits
- Let founder be natural, not scripted
- Best quotes often come in warm-up or cool-down

---

# Part 6: AI Video Pipeline (ComfyUI)

## 6.1 Video Model Comparison for DGX Spark

With 128GB unified memory, you can run any model at full precision.

| Model | Quality | Speed (DGX Spark) | Best For |
|-------|---------|-------------------|----------|
| **Wan 2.2** | Excellent | ~2-3 min | Versatile, anime, I2V |
| **HunyuanVideo** | Cinema-quality | ~4-8 min | Professional, commercial |
| **LTX Video** | Good | ~10-30 sec | Quick iterations |
| **CogVideoX** | Excellent | ~3-6 min | Technical, accurate |
| **Mochi 1** | Photorealistic | ~5-10 min | Realistic motion |

### Recommended Pipeline

```
CONCEPT/SCRIPT
      |
      v
STILL IMAGES (FLUX on DGX Spark)
      |
      v
IMAGE-TO-VIDEO (Wan 2.2 / HunyuanVideo)
      |
      v
SCENE STITCHING (Premiere Pro / DaVinci)
      |
      v
POST-PRODUCTION
```

## 6.2 Scene Generation Workflow

### Text-to-Video Direct

Best for: Abstract scenes, b-roll, establishing shots

```
Text Prompt → Video Model → Output
```

**Prompt structure:**
```
[Camera movement], [Subject action], [Environment], [Style], [Lighting]

Example:
"Slow dolly forward, startup team collaborating at whiteboard,
modern office with large windows, cinematic, golden hour lighting"
```

### Image-to-Video (Recommended)

Best for: Consistent characters, product shots, controlled scenes

```
FLUX (Text-to-Image) → Reference Image → Wan 2.2 (Image-to-Video) → Output
```

**Advantages:**
- More control over composition
- Consistent characters/products
- Can use real photos as base
- Better for stitching multiple scenes

### ControlNet-Guided Video

Best for: Matching specific motions, poses, compositions

```
Reference Video → Depth/Pose Extraction → ControlNet → Video Model → Output
```

## 6.3 ComfyUI Workflow Nodes

### Basic Video Generation

```
Load Video Model
      |
      v
Text Encoder (CLIP) ─────────────┐
      |                          |
Load Image (optional) ───────────┼──→ Video Sampler ──→ Video Decode ──→ Save
      |                          |
ControlNet (optional) ───────────┘
```

### Key Parameters

| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| Frames | 49-97 | Longer = more compute |
| FPS | 24 | Standard cinematic |
| CFG | 4-6 | Model dependent |
| Steps | 30-50 | Quality vs speed |
| Resolution | 720p-1080p | DGX Spark handles both |

## 6.4 Scene Types and Prompts

### Product Demo Scenes

```
Prompt: "Smooth zoom into laptop screen showing [app interface],
soft studio lighting, shallow depth of field,
professional product photography style"

Settings: High steps (50), low motion, Wan 2.2
```

### Abstract/Conceptual B-Roll

```
Prompt: "Abstract visualization of data flowing,
blue and purple particles connecting,
dark background, cinematic lighting"

Settings: HunyuanVideo for quality, 97 frames
```

### Office/Team Environments

```
Prompt: "Diverse team of developers working in modern office,
natural window lighting, medium shot, documentary style,
subtle camera movement left to right"

Settings: Wan 2.2 with image reference of real office
```

### Founder Speaking (AI Avatar)

For AI-generated founder footage (use ethically with consent):

```
Image Reference: High-quality founder photo
Motion: Subtle head movements, speaking gestures
Background: Consistent with brand

Note: Consider HeyGen or Synthesia for realistic talking heads
```

## 6.5 Maintaining Consistency

### Character Consistency

1. **IP-Adapter method**
   - Use IP-Adapter with reference images
   - Maintain same subject across scenes

2. **LoRA training** (if needed frequently)
   - Train LoRA on specific person/product
   - Apply to all generations

3. **Seed locking**
   - Use same seed for similar scenes
   - Maintain visual coherence

### Style Consistency

Create a "style reference" image set:
- Color palette
- Lighting mood
- Visual treatment

Apply via:
- IP-Adapter (style)
- LoRA
- Consistent prompting

## 6.6 Scene Stitching Strategy

### In ComfyUI

Use video-to-video with overlap:

```
Scene A (last frame) → Img2Vid → Transition → Scene B (first frame)
```

### In Post-Production (Recommended)

Export individual scenes → Import to Premiere/DaVinci → Add transitions

**Transition types:**
- Cross dissolve (default, safe)
- Motion transitions (energetic)
- Cut (for fast pacing)
- Fade to black (scene change)

---

# Part 7: Technical Setup on DGX Spark

## 7.1 ComfyUI Installation

```bash
# Clone ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install PyTorch for ARM64
pip install torch torchvision torchaudio

# Install requirements
pip install -r requirements.txt

# Launch
python main.py
```

## 7.2 Required Models

### Video Models (place in appropriate folders)

```bash
# Wan 2.1/2.2
models/unet/wan2.1_t2v_14b_bf16.safetensors

# HunyuanVideo
models/diffusers/HunyuanVideo/

# LTX Video
models/unet/ltx-video.safetensors

# FLUX (for image generation)
models/unet/flux1-dev.safetensors
models/clip/clip_l.safetensors
models/clip/t5xxl_fp16.safetensors
models/vae/ae.safetensors
```

### Custom Nodes to Install

```bash
# Via ComfyUI Manager, install:
- ComfyUI-AnimateDiff-Evolved
- ComfyUI-VideoHelperSuite
- ComfyUI-Frame-Interpolation
- ComfyUI-WanVideoWrapper
- ComfyUI_IPAdapter_plus
```

## 7.3 Optimized Settings for DGX Spark

| Setting | Value | Reason |
|---------|-------|--------|
| Precision | BF16 | Full quality, supported |
| Batch Size | 1-4 | Memory allows |
| CUDA Memory | No limit needed | 128GB unified |
| Attention | Default | Full precision attention |

### Performance Expectations

| Task | Time on DGX Spark |
|------|-------------------|
| FLUX image (1024x1024) | 5-10 sec |
| Wan 2.2 video (49 frames) | 2-3 min |
| HunyuanVideo (97 frames) | 5-8 min |
| LTX Video (quick) | 10-30 sec |

## 7.4 Batch Processing Setup

For generating multiple scenes:

```python
# scenes.json
{
  "scenes": [
    {
      "id": "scene_01",
      "prompt": "...",
      "frames": 49,
      "model": "wan2.2"
    },
    {
      "id": "scene_02",
      "prompt": "...",
      "frames": 97,
      "model": "hunyuan"
    }
  ]
}
```

Run via ComfyUI API for automation.

---

# Part 8: Post-Production Workflow

## 8.1 Editing Software

| Software | Best For | Price |
|----------|----------|-------|
| **DaVinci Resolve** | Color grading, free tier | Free / $295 |
| **Premiere Pro** | Industry standard | $22/mo |
| **Final Cut Pro** | Mac ecosystem | $299 |
| **CapCut** | Quick edits, social | Free |

## 8.2 Assembly Workflow

### Step 1: Import & Organize

```
Project/
├── 01_RAW/
│   ├── interviews/
│   ├── broll/
│   └── ai_generated/
├── 02_SELECTS/
├── 03_TIMELINE/
└── 04_EXPORTS/
```

### Step 2: Rough Cut

1. Lay down audio/VO first
2. Add primary footage to match
3. Don't worry about pacing yet
4. Get full story in place

### Step 3: Fine Cut

1. Trim for pacing (3-5 sec rule)
2. Add B-roll coverage
3. Add pattern interrupts
4. Check for dull moments

### Step 4: Polish

1. Color correction/grading
2. Audio mix and levels
3. Add music and SFX
4. Graphics and text
5. Transitions

### Step 5: Review

- Watch without sound (visual story clear?)
- Listen without video (audio compelling?)
- Watch at 2x speed (pacing issues obvious)
- Fresh eyes review

## 8.3 Export Settings

### For YouTube/Web

| Setting | Value |
|---------|-------|
| Codec | H.264 or H.265 |
| Resolution | 1920x1080 or 3840x2160 |
| Frame Rate | 24 or 30 fps |
| Bitrate | 20-50 Mbps (1080p) / 50-100 Mbps (4K) |
| Audio | AAC, 320 kbps, 48kHz |

### For Social Media

| Platform | Resolution | Aspect | Duration |
|----------|------------|--------|----------|
| YouTube | 1920x1080 | 16:9 | Any |
| LinkedIn | 1920x1080 | 16:9 | <10 min |
| Twitter/X | 1280x720 | 16:9 | <2:20 |
| Instagram Feed | 1080x1080 | 1:1 | <60 sec |
| Instagram Reels | 1080x1920 | 9:16 | <90 sec |
| TikTok | 1080x1920 | 9:16 | <3 min |

---

# Part 9: Quality Checklist

## 9.1 Pre-Production Checklist

- [ ] Clear objective defined (what action do we want?)
- [ ] Target audience identified
- [ ] Key message articulated (one sentence)
- [ ] Script/outline completed
- [ ] Shot list created
- [ ] B-roll needs identified
- [ ] Music selected
- [ ] Brand assets ready (logo, colors, fonts)

## 9.2 Hook Checklist

- [ ] First 5 seconds create curiosity
- [ ] Stakes are clear
- [ ] Matches thumbnail promise
- [ ] Would stop a scroll
- [ ] No slow build-up

## 9.3 Storytelling Checklist

- [ ] Clear beginning, middle, end
- [ ] One main narrative (not scattered)
- [ ] Emotional connection point exists
- [ ] No dull moments (watch retention graph)
- [ ] Satisfying payoff at end
- [ ] Ends abruptly (no lingering)

## 9.4 Technical Checklist

- [ ] Audio levels consistent (-12 to -6 dB)
- [ ] Music doesn't overpower dialogue
- [ ] Color consistent across scenes
- [ ] No jarring cuts
- [ ] Text readable (size, contrast, duration)
- [ ] Graphics match brand
- [ ] Exported at correct specs

## 9.5 Pacing Checklist

- [ ] Something visual changes every 3-5 seconds
- [ ] Pattern interrupt every 30-60 seconds
- [ ] Varied shot lengths (not monotonous)
- [ ] Energy matches content
- [ ] No section drags

## 9.6 Final Review Checklist

- [ ] Watch without sound - is story clear?
- [ ] Listen without video - is audio compelling?
- [ ] Watch at 2x speed - pacing issues?
- [ ] CTA is clear and appears on screen
- [ ] Thumbnail and title match content
- [ ] End screen/cards added (YouTube)

---

# Part 10: Resources & References

## 10.1 Key Documents

- [MrBeast Production Handbook](https://simonwillison.net/2024/Sep/15/how-to-succeed-in-mrbeast-production/) - Core principles
- [YC Demo Day Guide](https://www.ycombinator.com/blog/guide-to-demo-day-pitches/) - Pitch structure
- [StudioBinder Shot Guide](https://www.studiobinder.com/blog/ultimate-guide-to-camera-shots/) - Cinematography reference

## 10.2 AI Video Tools

| Tool | Use Case | URL |
|------|----------|-----|
| ComfyUI | Local video generation | comfy.org |
| HeyGen | AI avatars | heygen.com |
| Synthesia | AI presenters | synthesia.io |
| Runway | Quick generation | runway.com |
| Luma | Dream machine | lumalabs.ai |

## 10.3 Learning Resources

**Storytelling:**
- "Made to Stick" by Chip & Dan Heath
- "Building a StoryBrand" by Donald Miller

**Video Production:**
- Filmmaker's Handbook (technical)
- Every Frame a Painting (YouTube)

**AI Video:**
- ThinkDiffusion tutorials
- ComfyUI documentation

## 10.4 Music & Sound

| Source | License | URL |
|--------|---------|-----|
| Epidemic Sound | Subscription | epidemicsound.com |
| Artlist | Subscription | artlist.io |
| Uppbeat | Free tier | uppbeat.io |
| YouTube Audio Library | Free | youtube.com/audiolibrary |

## 10.5 Inspiration Examples

**Startup Videos:**
- Dollar Shave Club launch (viral, humor)
- Stripe's product videos (clean, professional)
- Notion's brand videos (aesthetic, emotional)
- Linear's announcements (design-forward)

**Founder Stories:**
- How I Built This podcast (narrative structure)
- Acquired podcast (deep dives)

---

# Appendix A: Quick Reference Cards

## The Hook Formula

```
[CURIOSITY GAP] + [STAKES] + [PROMISE] = HOOK

Example:
"This startup was failing..." (curiosity)
"...with 2 weeks of runway left..." (stakes)
"...until they discovered one thing that changed everything." (promise)
```

## The MrBeast Retention Formula

```
HOOK (0-30s) → ESCALATION (30s-3m) → RE-ENGAGE (every 2-3m) → PAYOFF (end)
```

## The Startup Video Formula

```
PROBLEM → SOLUTION → PROOF → CTA

30% emotion, 50% demonstration, 20% ask
```

## Shot Length Guide

```
High energy: 2-3 sec
Normal: 4-5 sec
Emotional: 6-10 sec
Documentary: 8-15 sec
```

---

*This document is a living guide. Update as you learn and iterate.*

**Next Steps:**
1. Set up ComfyUI on DGX Spark
2. Generate test scenes with each model
3. Create first video using Launch template
4. Review, iterate, improve

---

# Part 11: Style Study - Anthropic

## 11.1 Brand Overview

Anthropic represents the gold standard for AI company video production. Their visual identity balances technical sophistication with human-centered storytelling, creating content that feels both trustworthy and accessible.

### Brand Pillars

Anthropic communicates three core tenets across all content:
- **Helpful** - AI as a thinking partner, not replacement
- **Harmless** - Safety-first messaging
- **Honest** - Transparency in capabilities and limitations

### Visual Identity (by Geist Agency)

| Element | Specification |
|---------|---------------|
| **Primary Color** | Warm rust-orange (#C15F3C "Crail") |
| **Neutrals** | Off-white, light grey |
| **Typography** | Styrene (Commercial Type) + Tiempos (Klim) |
| **Logo** | Pure typographic with slash element (code reference) |
| **Overall Feel** | "Calm. Thoughtful. Even beautiful." |

### Design Philosophy

> "Doing the simple thing that works."

- Clean, minimalist approach
- Muted color palette
- Modular, scalable layouts
- Technical rigor meets human storytelling

## 11.2 Video Types Analysis

### Type 1: Brand Campaign ("Keep Thinking")

**Campaign Details:**
- Agency: Mother London
- Director: Daniel Wolfe (Love Song Films)
- DP: André Chemetoff
- Music: MF DOOM
- Format: 90-second hero film

**Structure Analysis:**

```
[0-45 sec]  PROBLEM MONTAGE
            - "Frenetic" pacing
            - Chaos, confusion, destruction imagery
            - Fast cuts, anxiety-inducing
            - Repeated phrase: "There's never been a worse time"

[45 sec]    THE PIVOT
            - Music shift to empowering tone
            - Visual pause/breath
            - Script flip: "There's never been a BETTER time"

[45-85 sec] SOLUTION MONTAGE
            - Problem solvers in action
            - Code, bikes, art, marine conservation
            - Warm, human-centered imagery
            - Strategy, focus, collaboration

[85-90 sec] RESOLUTION
            - Tagline: "Keep Thinking"
            - Claude branding
```

**Visual Style Characteristics:**

| Aspect | First Half (Problem) | Second Half (Solution) |
|--------|---------------------|------------------------|
| Pacing | Frenetic, rapid cuts | Measured, purposeful |
| Color | Desaturated, cold | Warm, Anthropic palette |
| Subjects | Abstract chaos | Real humans working |
| Emotion | Anxiety, overwhelm | Hope, capability |
| Music | Tension-building | Empowering, resolved |

**Key Technique: The Pivot**
The emotional flip at the midpoint is the core creative device. It:
1. Acknowledges viewer's existing fears about AI
2. Reframes AI as solution, not threat
3. Creates emotional contrast (makes the positive feel more positive)

### Type 2: Product Demo Videos

**Format: Screencast Style**

Anthropic's product demos use clean screen recordings with specific characteristics:

**Visual Approach:**
- Clean desktop environment
- Fluid transitions between features
- No cluttered UI or distractions
- Focus on the task being accomplished

**Pacing:**
- Breaks complex concepts into digestible segments
- Allows features to "breathe" (not rushed)
- Accessible to broad audience

**Audio Design:**
- Engaging background music (subtle)
- Clear voiceover explaining actions
- No awkward silences

**Structure:**
```
1. HOOK: Show the end result first (what Claude accomplished)
2. SETUP: Brief context for the task
3. DEMO: Real-time or slightly accelerated workflow
4. HIGHLIGHT: Key moments of capability
5. CLOSE: Reiterate the value
```

**Example Demo Structure (Integrations Video):**
```
[0-5 sec]   Result: "Claude retrieved this from Confluence"
[5-15 sec]  Setup: "You can now connect Claude to your tools"
[15-45 sec] Demo: Screen recording of connection + retrieval
[45-55 sec] Highlight: "It even created a to-do list automatically"
[55-60 sec] Close: "Try Integrations today"
```

### Type 3: Announcement Videos

**Characteristics:**
- Lead with the capability, not the technical details
- Show don't tell (live demos over slides)
- "Real-time" feel (Claude generating on the fly)
- Acknowledge limitations candidly (builds trust)

**Example: Claude 4 Launch**
- Live coding demos
- Real repositories shown
- Mistakes included (humanizing)
- Technical depth for developer audience

## 11.3 Anthropic Style Guide for Your Videos

### Color Palette to Emulate

```
Primary:
- Warm rust-orange: #C15F3C
- Deep charcoal: #1A1A1A

Neutrals:
- Off-white: #F5F5F0
- Light grey: #E8E8E3
- Medium grey: #A0A0A0

Accents (use sparingly):
- Soft blue: #6B8CAE
- Muted green: #7A9E7E
```

### Typography Approach

| Use Case | Font Choice | Weight |
|----------|-------------|--------|
| Headlines | Sans-serif, geometric | Bold |
| Body text | Serif or humanist sans | Regular |
| UI/Code | Monospace | Regular |
| Captions | Sans-serif | Medium |

**Key principle:** Pair technical (sans/mono) with humanist (serif) to balance rigor with warmth.

### Motion Design Principles

**Transitions:**
- Smooth fades over hard cuts
- Subtle zooms (not jarring)
- Fluid, organic movement
- No flashy effects

**Pacing:**
- Measured, not rushed
- Let moments breathe
- Technical content gets more time
- Emotional beats held longer

**Animation:**
- Minimal, purposeful
- Enhance comprehension, not decoration
- Consistent easing curves
- Subtle particle/flow effects for AI visualization

### Audio Design

**Music Selection:**
- Warm electronic or orchestral
- Building/evolving compositions
- Nothing aggressive or "tech startup cliché"
- MF DOOM-style hip-hop for edgier pieces

**Sound Design:**
- Subtle, not overwhelming
- Soft UI sounds
- Avoid generic "whoosh" transitions
- Natural, grounded feel

### Tone of Voice

| Anthropic Does | Anthropic Doesn't |
|----------------|-------------------|
| Acknowledge complexity | Oversimplify or hype |
| Show real capabilities | Make unrealistic promises |
| Speak to humans | Use excessive jargon |
| Admit limitations | Hide flaws |
| Stay grounded | Be flashy or gimmicky |

### Messaging Framework

**Problem Framing:**
- Acknowledge the real challenge
- Don't minimize or exaggerate
- Connect to human experience

**Solution Framing:**
- AI as "thinking partner"
- Amplifies human capability
- Doesn't replace human judgment
- "Keep thinking" - you're still in control

**Proof Framing:**
- Show, don't tell
- Real demos over claims
- Let the product speak

## 11.4 Applying Anthropic Style to Startup Videos

### For Launch Videos

**Anthropic-inspired structure:**
```
[0-15 sec]  THE PROBLEM (acknowledge real pain)
            - Quick cuts showing frustration
            - "There's never been a harder time to..."

[15-20 sec] THE PIVOT
            - Music shift
            - "Until now."

[20-50 sec] THE SOLUTION
            - Warm, human-centered demo
            - Real users, real outcomes

[50-60 sec] THE INVITATION
            - "Keep [verb]-ing" tagline style
            - Clean CTA
```

### For Product Demos

**Anthropic-inspired approach:**
1. Start with the outcome, not the setup
2. Clean, uncluttered screen recordings
3. Let the product do the talking
4. Subtle music, clear narration
5. Acknowledge what it can't do (builds trust)

### For Fundraising Videos

**Anthropic-inspired elements:**
- Lead with traction (show, don't tell)
- Balanced optimism (not hype)
- Technical credibility through demonstration
- Human-centered framing of impact
- Warm color palette, professional feel

## 11.5 Anthropic Style Checklist

### Visual
- [ ] Warm rust-orange accent color
- [ ] Off-white/grey backgrounds
- [ ] Clean, minimal compositions
- [ ] No cluttered frames
- [ ] Thoughtful typography pairing

### Motion
- [ ] Smooth transitions
- [ ] Measured pacing
- [ ] Subtle zoom/movement
- [ ] No flashy effects
- [ ] Organic, fluid feel

### Audio
- [ ] Warm, building music
- [ ] Clear voiceover
- [ ] Subtle sound design
- [ ] Nothing aggressive or cliché

### Messaging
- [ ] Acknowledge real challenges
- [ ] AI as partner, not replacement
- [ ] Show don't tell
- [ ] Honest about limitations
- [ ] Human-centered framing

### Emotional Arc
- [ ] Start with problem (tension)
- [ ] Clear pivot moment
- [ ] End with empowerment
- [ ] Leave viewer hopeful, not anxious

---

## 11.6 Quick Reference: Anthropic Style

### The Formula

```
PROBLEM (tension) → PIVOT → SOLUTION (hope) → INVITATION
```

### The Palette

```
#C15F3C (rust-orange) + #F5F5F0 (off-white) + #1A1A1A (charcoal)
```

### The Tagline Pattern

```
"Keep [verb]-ing"
- Keep thinking
- Keep building
- Keep solving
- Keep creating
```

### The Core Message

> "AI as a thinking partner that amplifies human capability, not replaces it."

---

*Sources:*
- [Geist Agency - Anthropic Brand](https://geist.co/work/anthropic)
- [Mother London - Keep Thinking Campaign](https://creative.salon/articles/work/anthropic-claude-mother-keep-thinking)
- [The Drum - Anthropic Brand Campaign](https://www.thedrum.com/news/2025/09/19/ad-the-day-anthropic-launches-first-major-brand-campaign-claude)
- [Campaign US - Ad of the Week Analysis](https://www.campaignlive.com/article/ad-week-anthropic-keep-thinking-claude-mother/1933114)

---

*Created for the AI Video Storytelling Studio project. December 2025.*
