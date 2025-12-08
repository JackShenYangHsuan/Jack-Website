# ComfyUI Complete Reference Guide

> The definitive advanced reference manual for ComfyUI - covering installation, workflows, and all capabilities for image, video, audio, and 3D generation.

**Last Updated:** December 2025
**ComfyUI Version:** v0.3.75+

---

## Table of Contents

1. [Introduction & Setup](#part-1-introduction--setup)
   - [1.6 NVIDIA DGX Spark Setup](#16-nvidia-dgx-spark-setup)
   - [1.7 Loading Hugging Face Models](#17-loading-hugging-face-models)
2. [Core Concepts](#part-2-core-concepts)
3. [Text-to-Image](#part-3-text-to-image)
4. [Image-to-Image](#part-4-image-to-image)
5. [Inpainting & Outpainting](#part-5-inpainting--outpainting)
6. [ControlNet](#part-6-controlnet)
7. [Consistent Characters & Style](#part-7-consistent-characters--style)
8. [Image Enhancement](#part-8-image-enhancement)
9. [Video Generation](#part-9-video-generation)
10. [Advanced Features](#part-10-advanced-features)
11. [3D & Audio Generation](#part-11-3d--audio-generation)
12. [Essential Custom Nodes](#part-12-essential-custom-nodes)
13. [Workflow Optimization](#part-13-workflow-optimization)
14. [Troubleshooting & Resources](#part-14-troubleshooting--resources)

---

# Part 1: Introduction & Setup

## 1.1 What is ComfyUI?

ComfyUI is the most powerful open-source node-based application for generative AI. It provides a visual interface for building complex AI generation pipelines without writing code. Think of it as a flowchart builder where each node performs a specific function (loading models, encoding prompts, sampling, etc.) and you connect them together to create sophisticated workflows.

### Key Characteristics

- **Node-Based Interface**: Visual programming through connected nodes
- **Modular Architecture**: Combine any AI models and operations
- **Smart Optimization**: Only re-executes changed workflow sections
- **Memory Efficient**: Runs on GPUs with as low as 1GB VRAM through smart offloading
- **Fully Offline**: No mandatory internet connection required
- **Open Source**: GPL-3.0 licensed, 95.8k+ GitHub stars

### Supported Model Architectures

| Model Type | Versions Supported |
|------------|-------------------|
| Stable Diffusion | SD 1.x, SD 2.x |
| SDXL | Base, Refiner, Turbo |
| Stable Cascade | Stage A, B, C |
| SD3 / SD3.5 | All variants |
| FLUX | Dev, Schnell, Pro (API) |
| FLUX.2 | Dev (32B parameter) |
| Hunyuan-DiT | All versions |
| PixArt | Alpha, Sigma |
| AuraFlow | v0.1+ |
| Lumina-T2X | T2I models |

## 1.2 System Requirements

### Minimum Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU VRAM | 4GB | 8GB+ |
| System RAM | 8GB | 16GB+ |
| Storage | 20GB | 100GB+ (for models) |
| Python | 3.10+ | 3.11 |

### GPU Compatibility

**NVIDIA (Best Support)**
- CUDA 13.0+ required
- RTX 20/30/40 series recommended
- GTX 10 series supported with limitations

**AMD**
- ROCm 6.4+ required
- RX 6000/7000 series recommended
- Windows support via DirectML

**Intel Arc**
- XPU acceleration supported
- A770/A750 recommended

**Apple Silicon**
- Metal acceleration (MPS)
- M1/M2/M3 chips supported
- 16GB unified memory recommended

**NVIDIA DGX Spark**
- Grace Blackwell GB10 SoC
- 128GB unified memory
- 6144 CUDA cores
- 1 PFLOP NVFP4 AI compute
- Can load 200B+ parameter models
- See [Section 1.6](#16-nvidia-dgx-spark-setup) for detailed setup

### VRAM Requirements by Task

| Task | Minimum VRAM | Recommended |
|------|--------------|-------------|
| SD 1.5 Basic | 4GB | 6GB |
| SDXL Basic | 6GB | 8GB |
| FLUX (FP8) | 8GB | 12GB |
| FLUX (FP16) | 16GB | 24GB |
| AnimateDiff | 8GB | 12GB |
| Wan 2.1 Video | 12GB | 16GB |
| Hunyuan3D | 12GB | 16GB |
| ControlNet + SDXL | 10GB | 12GB |

## 1.3 Installation Options

### Option 1: Desktop Application (Recommended for Beginners)

The easiest way to get started. Available for Windows, macOS, and Linux.

1. Download from [comfy.org](https://www.comfy.org)
2. Run the installer
3. Launch ComfyUI Desktop
4. ComfyUI Manager is pre-installed

**Desktop Configuration Location:**
- Windows: `C:\Users\YourUsername\AppData\Roaming\ComfyUI\`
- macOS: `~/Library/Application Support/ComfyUI/`
- Linux: `~/.config/ComfyUI/`

### Option 2: Portable Version (Windows)

Pre-packaged standalone version with everything included.

1. Download the 7z package from [GitHub Releases](https://github.com/comfyanonymous/ComfyUI/releases)
2. Extract to desired location (avoid paths with spaces)
3. Run `run_nvidia_gpu.bat` or `run_cpu.bat`

### Option 3: Manual Installation

**Step 1: Clone Repository**
```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
```

**Step 2: Create Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows
```

**Step 3: Install Dependencies**
```bash
# NVIDIA GPU
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt

# AMD GPU (Linux)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0
pip install -r requirements.txt

# Apple Silicon
pip install torch torchvision torchaudio
pip install -r requirements.txt
```

**Step 4: Run ComfyUI**
```bash
python main.py
```

### Option 4: comfy-cli

```bash
pip install comfy-cli
comfy install
comfy launch
```

### Option 5: Cloud Services

- **Comfy Cloud**: Browser-based, no local setup
- **RunPod**: GPU cloud with ComfyUI templates
- **ThinkDiffusion**: Managed ComfyUI instances
- **Paperspace**: Gradient notebooks with ComfyUI

## 1.4 Model Folder Structure

Understanding the folder structure is crucial for organizing your models:

```
ComfyUI/
├── models/
│   ├── checkpoints/          # Main model files (.safetensors, .ckpt)
│   │   ├── SD15/             # Recommended: organize by version
│   │   ├── SDXL/
│   │   └── FLUX/
│   ├── clip/                 # CLIP text encoder models
│   ├── clip_vision/          # CLIP vision models (for IP-Adapter)
│   ├── controlnet/           # ControlNet models
│   ├── diffusers/            # Diffusers format models
│   ├── embeddings/           # Textual inversion embeddings
│   ├── hypernetworks/        # Hypernetwork models
│   ├── loras/                # LoRA models
│   ├── style_models/         # Style models
│   ├── unet/                 # UNET models (FLUX, etc.)
│   ├── upscale_models/       # Upscaler models (ESRGAN, etc.)
│   ├── vae/                  # VAE models
│   └── vae_approx/           # VAE approximation models
├── input/                    # Input images for workflows
├── output/                   # Generated outputs
└── custom_nodes/             # Custom node extensions
```

### Using Extra Model Paths

Share models between multiple ComfyUI installations or with other UIs (like A1111):

**Portable/Manual Installation:**
Create `extra_model_paths.yaml` in ComfyUI root:

```yaml
# Example configuration
a1111:
    base_path: D:/stable-diffusion-webui/

    checkpoints: models/Stable-diffusion
    loras: models/Lora
    embeddings: embeddings
    vae: models/VAE
    controlnet: models/ControlNet

shared_models:
    base_path: E:/AI-Models/

    checkpoints: checkpoints
    loras: loras
    controlnet: controlnet
```

**Desktop Version:**
Edit `extra_models_config.yaml` in the AppData folder.

### Best Practices for Organization

1. **Use subfolders by version**: `checkpoints/SD15/`, `checkpoints/SDXL/`, `checkpoints/FLUX/`
2. **Avoid spaces in paths**: Use underscores or hyphens
3. **Use symlinks**: Link to shared model directories to save disk space
4. **Descriptive naming**: Include model version and purpose in filenames

## 1.5 Installing ComfyUI Manager

ComfyUI Manager is essential for managing custom nodes. It's pre-installed in Desktop version.

### Manual Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Comfy-Org/ComfyUI-Manager.git
```

Restart ComfyUI after installation.

### Using ComfyUI Manager

1. Click **Manager** button in the menu
2. **Install Custom Nodes**: Browse and install from registry
3. **Install Missing Nodes**: Auto-detect and install nodes required by loaded workflows
4. **Update All**: Keep all custom nodes up to date
5. **Install via Git URL**: Install nodes not in registry

### Security Considerations

- Custom nodes execute Python code on your system
- Only install from trusted sources
- Review node repositories before installing
- Prefer popular nodes with active maintenance

## 1.6 NVIDIA DGX Spark Setup

### What is DGX Spark?

NVIDIA DGX Spark is a compact AI supercomputer designed for developers, data scientists, and AI researchers. It's styled like a miniaturized DGX-1, measuring just 150 x 150 x 50.5 mm.

### Hardware Specifications

| Component | Specification |
|-----------|---------------|
| SoC | Grace Blackwell GB10 |
| CPU | 20-core Arm64 |
| GPU | Blackwell-based with 6144 CUDA cores |
| Memory | 128GB unified (CPU+GPU shared) |
| AI Performance | 1 PFLOP (NVFP4) |
| RT Cores | 4th generation |
| Tensor Cores | 5th generation |
| Storage | Up to 4TB (Founder's Edition) |
| Size | 150 x 150 x 50.5 mm |
| OS | DGX OS (Ubuntu 24.04 LTS based) |

### Model Capacity

The 128GB unified memory pool allows loading models with up to **200 billion parameters** (using NVFP4 format). This makes DGX Spark ideal for running:
- FLUX models at full BF16 precision
- Large video generation models
- Multiple models simultaneously

### ComfyUI Installation on DGX Spark

DGX Spark runs Linux (Ubuntu 24.04), so standard NVIDIA installation works:

**Step 1: Clone Repository**
```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
```

**Step 2: Create Virtual Environment**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Step 3: Install Dependencies**
```bash
pip install torch torchvision torchaudio
pip install -r requirements.txt
```

**Step 4: Run ComfyUI**
```bash
python main.py
```

**Step 5: Access in Browser**
Navigate to `http://localhost:8188`

### Alternative: Docker Installation

NVIDIA provides containerized setup:

```bash
# Pull ComfyUI container
docker pull nvidia/comfyui:latest

# Run with GPU access
docker run --gpus all -p 8188:8188 nvidia/comfyui:latest
```

All needed Docker containers and models are pulled automatically.

### Performance on DGX Spark

| Model | Precision | Generation Time |
|-------|-----------|-----------------|
| FLUX.1 Dev | BF16 | ~97 seconds (50 steps) |
| SDXL | FP16 | ~15-30 seconds |
| SD 1.5 | FP16 | ~10-15 seconds |

ComfyUI leverages the Blackwell GPU's Tensor Cores for accelerated diffusion sampling.

### Tips for DGX Spark

1. **Use BF16/FP16 precision** - Full precision runs well with 128GB memory
2. **Run multiple workflows** - Sufficient memory for parallel generation
3. **Large batch sizes** - Memory allows batches of 4-8 images
4. **Video generation** - Excellent for AnimateDiff and Wan models
5. **No VRAM constraints** - Can run any model without quantization

### Pricing

- **Founder's Edition**: $3,999 (4TB storage, gold cladding)
- **OEM versions**: Available from Dell, Lenovo, HP, Asus, Acer (varying storage/price)

## 1.7 Loading Hugging Face Models

ComfyUI supports multiple methods for loading models from Hugging Face.

### Method 1: Manual Download (Recommended)

**Step 1: Find Model on Hugging Face**
Browse [huggingface.co](https://huggingface.co) for models.

**Step 2: Download Model Files**
```bash
# Using git lfs
git lfs install
git clone https://huggingface.co/runwayml/stable-diffusion-v1-5

# Or download individual files via web interface
```

**Step 3: Place in Correct Folder**

| Model Type | Folder |
|------------|--------|
| Checkpoints (.safetensors/.ckpt) | `models/checkpoints/` |
| Diffusers format (folder) | `models/diffusers/` |
| LoRA | `models/loras/` |
| VAE | `models/vae/` |
| CLIP | `models/clip/` |
| ControlNet | `models/controlnet/` |

**Step 4: Refresh or Restart ComfyUI**

### Method 2: Diffusers Hub Model Down-Loader Node

Use the WAS Node Suite's built-in downloader:

```
Diffusers Hub Model Down-Loader
├── repo_id: "stabilityai/stable-diffusion-xl-base-1.0"
├── revision: "main" (or specific commit)
└── Output: Downloaded model path
```

This downloads directly from Hugging Face Hub into your workflow.

### Method 3: ComfyUI-Diffusers Extension

For native Hugging Face Diffusers pipeline support:

**Installation:**
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Limitex/ComfyUI-Diffusers.git
cd ComfyUI-Diffusers
pip install -r requirements.txt
```

**Features:**
- Load any Diffusers-format model directly
- Support for Stream Diffusion (real-time generation)
- Text2Img, Img2Img, and Inpainting pipelines
- SDXL support with optional VAE and ControlNet

**Nodes Available:**
- `Diffusers Pipeline Loader` - Load models by HF repo ID
- `Text2ImgStableDiffusionPipeline`
- `Img2ImgStableDiffusionPipeline`
- `InpaintingStableDiffusionPipeline`

### Method 4: ComfyUI-HF Extension

Dedicated Hugging Face model loaders:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/mbrostami/ComfyUI-HF
```

Provides nodes for loading models directly from Hugging Face repositories.

### Method 5: Diffusers-in-ComfyUI

Alternative Diffusers integration:

**Installation via ComfyUI Manager:**
1. Open Manager
2. Search for "Diffusers in Comfy UI"
3. Install and restart

**Features:**
- Specify HF path directly in nodes
- SDXL support
- Optional VAE and ControlNet integration
- Per-pipeline configuration

### Converting Diffusers to SafeTensors

Some models are only available in Diffusers format. Convert them:

**Using diffusers library:**
```python
from diffusers import StableDiffusionPipeline
import torch

# Load diffusers model
pipe = StableDiffusionPipeline.from_pretrained(
    "path/to/diffusers/model",
    torch_dtype=torch.float16
)

# Save as safetensors
pipe.save_pretrained("output_folder", safe_serialization=True)
```

**Using conversion scripts:**
- Check the model's HF repo for conversion scripts
- Community tools available on GitHub

### Hugging Face Model Formats

| Format | Description | ComfyUI Support |
|--------|-------------|-----------------|
| .safetensors | Single file, safe format | Native (Load Checkpoint) |
| .ckpt | Legacy format | Native (Load Checkpoint) |
| Diffusers (folder) | HF Diffusers format | Via `models/diffusers/` or extensions |
| GGUF | Quantized format | Via GGUF loader nodes |

### Authentication for Gated Models

Some HF models require authentication (e.g., FLUX Dev):

**Step 1: Create HF Account and Accept License**
Visit the model page and accept terms.

**Step 2: Get Access Token**
Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

**Step 3: Login via CLI**
```bash
huggingface-cli login
# Enter your token when prompted
```

**Step 4: Download Gated Model**
```bash
huggingface-cli download black-forest-labs/FLUX.1-dev \
    --include "*.safetensors" \
    --local-dir ./models/unet/
```

### Popular Hugging Face Models for ComfyUI

| Model | Repo ID | Type |
|-------|---------|------|
| SD 1.5 | runwayml/stable-diffusion-v1-5 | Checkpoint |
| SDXL Base | stabilityai/stable-diffusion-xl-base-1.0 | Checkpoint |
| FLUX.1 Dev | black-forest-labs/FLUX.1-dev | UNET |
| FLUX.1 Schnell | black-forest-labs/FLUX.1-schnell | UNET |
| SD3 Medium | stabilityai/stable-diffusion-3-medium | Checkpoint |
| ControlNet | lllyasviel/control_v11p_sd15_canny | ControlNet |
| IP-Adapter | h94/IP-Adapter | IP-Adapter |

---

# Part 2: Core Concepts

## 2.1 Understanding the Node-Based Interface

### Workspace Navigation

| Action | Control |
|--------|---------|
| Pan | Hold Space + Drag / Middle Mouse Drag |
| Zoom | Mouse Wheel |
| Select Node | Left Click |
| Multi-Select | Ctrl + Click / Drag Selection Box |
| Delete Node | Delete / Backspace |
| Duplicate Node | Ctrl + D |
| Add Node | Double-click canvas / Right-click menu |

### Node Anatomy

```
┌─────────────────────────────────────┐
│           NODE TITLE                │
├─────────────────────────────────────┤
│ ○ input_1      [widget]    output ○ │
│ ○ input_2      [widget]             │
│                [dropdown]           │
│                [slider]             │
└─────────────────────────────────────┘
```

- **Inputs (Left)**: Connection points for receiving data
- **Outputs (Right)**: Connection points for sending data
- **Widgets**: Configurable parameters (dropdowns, sliders, text fields)
- **Title**: Node name (double-click to rename)

### Data Types and Colors

| Color | Data Type |
|-------|-----------|
| Pink/Magenta | MODEL (diffusion model) |
| Yellow | CLIP (text encoder) |
| Red | VAE (image encoder/decoder) |
| Orange | CONDITIONING (prompt embeddings) |
| Pink | LATENT (latent space image) |
| Green | IMAGE (pixel image) |
| White | MASK |
| Gray | Various (numbers, strings, etc.) |

### Connection Rules

- Only compatible types can connect (matching colors)
- One output can connect to multiple inputs
- One input accepts only one connection
- Drag from output to input to create connection
- Right-click connection to delete

## 2.2 Essential Nodes Explained

### Load Checkpoint

The primary node for loading Stable Diffusion models.

```
Load Checkpoint
├── Input: ckpt_name (dropdown)
└── Outputs:
    ├── MODEL (diffusion model)
    ├── CLIP (text encoder)
    └── VAE (variational autoencoder)
```

**Parameters:**
- `ckpt_name`: Select model from `models/checkpoints/`

**Usage Notes:**
- For FLUX models, use **Load Diffusion Model** instead
- Returns three components that can be used independently
- Models load into VRAM on first use

### CLIP Text Encode (Prompt)

Converts text prompts into conditioning embeddings.

```
CLIP Text Encode
├── Inputs:
│   ├── clip (CLIP model)
│   └── text (string widget)
└── Output: CONDITIONING
```

**Parameters:**
- `text`: Your prompt text

**Prompt Syntax:**
```
# Basic prompt
a beautiful sunset over mountains

# Weighted emphasis (increases importance)
a (beautiful:1.2) sunset over mountains

# De-emphasis (decreases importance)
a (cloudy:0.5) sunset

# Combining
a ((highly detailed)) landscape, (photorealistic:1.3)
```

### KSampler

The core sampling node that generates images through iterative denoising.

```
KSampler
├── Inputs:
│   ├── model (MODEL)
│   ├── positive (CONDITIONING)
│   ├── negative (CONDITIONING)
│   └── latent_image (LATENT)
└── Output: LATENT
```

**Parameters:**

| Parameter | Range | Description |
|-----------|-------|-------------|
| seed | 0 - 2^64 | Random seed for reproducibility |
| control_after_generate | fixed/increment/decrement/randomize | Seed behavior between runs |
| steps | 1-150 | Number of denoising iterations |
| cfg | 1.0-30.0 | Classifier-free guidance scale |
| sampler_name | (dropdown) | Sampling algorithm |
| scheduler | (dropdown) | Noise schedule |
| denoise | 0.0-1.0 | Amount of noise to remove |

**Recommended Settings:**

| Use Case | Steps | CFG | Sampler | Scheduler |
|----------|-------|-----|---------|-----------|
| Quality | 25-30 | 7-8 | dpm++ 2m | karras |
| Speed | 15-20 | 7 | euler | normal |
| Creative | 30-40 | 5-6 | euler_ancestral | karras |
| FLUX | 20-28 | 1.0 | euler | simple |

### Empty Latent Image

Creates a blank latent space image for text-to-image generation.

```
Empty Latent Image
├── Widgets:
│   ├── width (int)
│   ├── height (int)
│   └── batch_size (int)
└── Output: LATENT
```

**Parameters:**
- `width`: Image width (must be divisible by 8)
- `height`: Image height (must be divisible by 8)
- `batch_size`: Number of images to generate

**Common Resolutions:**

| Model | Resolution | Aspect Ratio |
|-------|------------|--------------|
| SD 1.5 | 512x512 | 1:1 |
| SD 1.5 | 512x768 | 2:3 |
| SDXL | 1024x1024 | 1:1 |
| SDXL | 896x1152 | 7:9 |
| SDXL | 1216x832 | 3:2 |
| FLUX | 1024x1024 | 1:1 |
| FLUX | 1360x768 | 16:9 |

### VAE Decode

Converts latent space images to pixel images.

```
VAE Decode
├── Inputs:
│   ├── samples (LATENT)
│   └── vae (VAE)
└── Output: IMAGE
```

### VAE Encode

Converts pixel images to latent space (for img2img).

```
VAE Encode
├── Inputs:
│   ├── pixels (IMAGE)
│   └── vae (VAE)
└── Output: LATENT
```

### Save Image

Saves generated images to disk.

```
Save Image
├── Inputs:
│   └── images (IMAGE)
└── Widget: filename_prefix (string)
```

**Features:**
- Saves to `output/` folder
- Embeds workflow metadata in PNG files
- Auto-increments filenames

### Preview Image

Displays images in the workflow without saving.

```
Preview Image
├── Input: images (IMAGE)
└── (displays in node)
```

## 2.3 Workflows - Creation, Saving, Loading

### Creating Workflows

1. **Start Fresh**: Menu > Workflows > New
2. **From Template**: Menu > Workflows > Browse Templates
3. **Build Manually**: Add nodes and connect them

### Basic Text-to-Image Workflow Structure

```
Load Checkpoint ─┬─ MODEL ──────────────────────────┐
                 ├─ CLIP ─┬─ CLIP Text Encode (+) ──┼─ KSampler ── VAE Decode ── Save Image
                 │        └─ CLIP Text Encode (-) ──┤
                 └─ VAE ────────────────────────────┼──────────────┘
                                                    │
Empty Latent Image ─────────────────────────────────┘
```

### Saving Workflows

**As JSON File:**
- Menu > Workflows > Save
- Keyboard: Ctrl + S
- Stores complete workflow definition

**Embedded in Image:**
- All PNGs saved by ComfyUI contain workflow metadata
- Drag any ComfyUI-generated PNG to load its workflow

### Loading Workflows

**From JSON:**
- Menu > Workflows > Open (Ctrl + O)
- Drag JSON file onto canvas

**From Image:**
- Drag PNG with embedded metadata onto canvas
- Works with any ComfyUI-generated image

**From URL:**
- Menu > Workflows > Load from URL

### Handling Missing Nodes

When loading a workflow with custom nodes you don't have:

1. Click **Manager** in menu
2. Click **Install Missing Custom Nodes**
3. Select nodes to install
4. Restart ComfyUI

## 2.4 Understanding Checkpoints, VAE, CLIP

### Checkpoints

A checkpoint (`.safetensors` or `.ckpt`) is a complete model package containing:

- **UNET**: The diffusion model that generates images
- **CLIP**: Text encoder that understands prompts
- **VAE**: Encoder/decoder for latent space conversion

**Popular Checkpoints:**

| Model | Type | Best For |
|-------|------|----------|
| Realistic Vision | SD 1.5 | Photorealistic images |
| DreamShaper | SD 1.5 | Fantasy, versatile |
| Deliberate | SD 1.5 | Detailed illustrations |
| Juggernaut XL | SDXL | Photorealistic, all-around |
| RealVisXL | SDXL | Photorealistic portraits |
| Pony Diffusion | SDXL | Anime/illustration |

### VAE (Variational Autoencoder)

The VAE handles conversion between pixel and latent space:

- **Encoder**: Compresses images (1024x1024 → 128x128 latent)
- **Decoder**: Reconstructs images from latent space

**Why Use Separate VAE?**

Some checkpoints have suboptimal VAE. External VAE can improve:
- Color accuracy
- Fine detail preservation
- Reduced color bleeding

**Recommended VAE Models:**

| VAE | Compatible With | Notes |
|-----|-----------------|-------|
| vae-ft-mse-840000 | SD 1.5 | Standard, good colors |
| sdxl_vae | SDXL | Official SDXL VAE |
| ae.safetensors | FLUX | Required for FLUX |

### CLIP (Contrastive Language-Image Pre-training)

CLIP converts text prompts into embeddings the model understands.

**CLIP Architecture:**
- Tokenizes text (max 77 tokens for SD 1.5)
- Converts tokens to embeddings
- Embeddings guide the diffusion process

**SDXL Uses Dual CLIP:**
- CLIP-L (OpenAI)
- CLIP-G (OpenCLIP)

**FLUX Uses:**
- CLIP-L
- T5-XXL (larger text encoder for better prompt following)

## 2.5 Samplers & Schedulers Guide

### Understanding Samplers

Samplers determine HOW the model iteratively denoises the latent image.

**Deterministic Samplers** (same seed = same result):
- Euler
- DPM++ 2M
- DPM++ 2S
- UniPC
- LCM

**Stochastic/Ancestral Samplers** (introduce randomness):
- Euler A (Ancestral)
- DPM++ 2M SDE
- DPM++ 2S A
- DPM++ 3M SDE
- DPMPP_2M_SDE_GPU

### Sampler Comparison

| Sampler | Speed | Quality | Best Steps | Notes |
|---------|-------|---------|------------|-------|
| euler | Fast | Good | 15-25 | Good baseline |
| euler_ancestral | Fast | Good | 20-30 | Creative variations |
| dpm++ 2m | Medium | Excellent | 20-30 | Community favorite |
| dpm++ 2m sde | Slower | Excellent | 25-40 | Best detail quality |
| dpm++ 3m sde | Slowest | Best | 30-50 | Maximum quality |
| uni_pc | Fast | Good | 10-15 | Efficient, low steps |
| lcm | Fastest | Good | 4-8 | Requires LCM LoRA |
| ddim | Medium | Good | 50+ | Classic, needs more steps |

### Understanding Schedulers

Schedulers determine the noise schedule - how much noise is present at each step.

| Scheduler | Description | Best With |
|-----------|-------------|-----------|
| normal | Linear noise reduction | DDIM |
| karras | Emphasizes fine details | DPM++ variants |
| exponential | Smooth transitions | General use |
| sgm_uniform | Stable Diffusion 3 | SD3, SDXL |
| simple | Basic linear | FLUX |
| ddim_uniform | Optimized for DDIM | DDIM only |
| beta | Beta distribution | Experimental |

### Optimal Sampler/Scheduler Combinations

| Goal | Sampler | Scheduler | Steps | CFG |
|------|---------|-----------|-------|-----|
| Best Quality | dpm++ 2m sde | karras | 30-35 | 7-8 |
| Fast Preview | euler | normal | 15 | 7 |
| Creative | euler_a | karras | 25 | 5-6 |
| FLUX | euler | simple | 20-28 | 1.0 |
| LCM/Turbo | lcm | sgm_uniform | 4-8 | 1-2 |
| SD3 | dpm++ 2m | sgm_uniform | 28 | 4.5 |

## 2.6 CFG Scale and Parameter Settings

### CFG (Classifier-Free Guidance) Scale

CFG controls how strongly the model follows your prompt:

| CFG Value | Effect |
|-----------|--------|
| 1-3 | Very loose, creative, may ignore prompt |
| 4-6 | Balanced creativity and prompt following |
| 7-9 | Strong prompt adherence (default range) |
| 10-15 | Very strict, may become oversaturated |
| 15+ | Often produces artifacts, too strict |

**Model-Specific CFG:**

| Model Type | Recommended CFG |
|------------|-----------------|
| SD 1.5 | 7-9 |
| SDXL | 5-8 |
| SD3 | 4-5 |
| FLUX | 1.0 (uses guidance node) |
| Pony | 6-8 |

### Denoise Parameter

Controls how much of the original image to preserve (for img2img):

| Denoise | Effect |
|---------|--------|
| 0.0 | No change (identical to input) |
| 0.1-0.3 | Minor adjustments, strong preservation |
| 0.4-0.6 | Moderate changes, balanced |
| 0.7-0.8 | Major changes, loose preservation |
| 0.9-1.0 | Near complete regeneration |

### Steps Parameter

| Steps | Quality | Speed | Use Case |
|-------|---------|-------|----------|
| 10-15 | Basic | Fast | Previews, LCM |
| 20-25 | Good | Balanced | Standard generation |
| 30-40 | Excellent | Slow | Final renders |
| 50+ | Diminishing returns | Very slow | Rarely needed |

### Batch Size

- Higher batch = more images per run
- Memory usage: `VRAM × batch_size`
- Throughput efficient but requires more VRAM

---

# Part 3: Text-to-Image

## 3.1 Basic Text-to-Image Workflow

### Minimal Workflow Nodes

1. **Load Checkpoint**: Load your model
2. **CLIP Text Encode (Positive)**: Your main prompt
3. **CLIP Text Encode (Negative)**: Things to avoid
4. **Empty Latent Image**: Canvas size
5. **KSampler**: Generate the image
6. **VAE Decode**: Convert to pixels
7. **Save Image**: Output the result

### Node Connections

```
Load Checkpoint
    ├── MODEL → KSampler (model)
    ├── CLIP → CLIP Text Encode (+) → KSampler (positive)
    ├── CLIP → CLIP Text Encode (-) → KSampler (negative)
    └── VAE → VAE Decode (vae)

Empty Latent Image → KSampler (latent_image)

KSampler → VAE Decode → Save Image
```

### Quick Start Settings

| Parameter | Value |
|-----------|-------|
| Resolution | 512x512 (SD1.5) / 1024x1024 (SDXL) |
| Steps | 20 |
| CFG | 7 |
| Sampler | dpm++ 2m |
| Scheduler | karras |
| Denoise | 1.0 |

## 3.2 Prompt Engineering Techniques

### Prompt Structure

```
[Subject], [Description], [Environment], [Style], [Quality Tags]
```

**Example:**
```
a young woman with long black hair, wearing a red dress,
standing in a flower garden, golden hour lighting,
professional photography, 8k uhd, highly detailed
```

### Quality Boosters

**Positive Prompt Additions:**
```
masterpiece, best quality, highly detailed, sharp focus,
professional, 8k uhd, high resolution, intricate details,
photorealistic, cinematic lighting, dramatic lighting
```

**Negative Prompt Essentials:**
```
worst quality, low quality, blurry, jpeg artifacts,
watermark, text, logo, signature, cropped, out of frame,
ugly, deformed, disfigured, mutation, bad anatomy,
bad proportions, extra limbs, missing limbs
```

### Style Modifiers

| Category | Examples |
|----------|----------|
| Art Style | oil painting, watercolor, digital art, pencil sketch |
| Photography | portrait, landscape, macro, street photography |
| Lighting | golden hour, studio lighting, rim light, dramatic shadows |
| Mood | ethereal, dark, vibrant, melancholic, serene |
| Era | 1920s, cyberpunk, medieval, futuristic |
| Artist Style | in the style of [artist], [artist]-inspired |

### Token Limit Awareness

- SD 1.5: 77 tokens maximum
- SDXL: 77 tokens per CLIP (dual encoding)
- FLUX: Extended via T5 encoder

**Tip**: Use `CLIP Text Encode (Long)` node for prompts exceeding 77 tokens.

## 3.3 CLIP Text Encoding

### Standard CLIP Text Encode

Basic encoding for single prompts:

```
CLIP Text Encode
├── clip: from Load Checkpoint
└── text: "your prompt here"
```

### CLIP Text Encode (SDXL)

For SDXL models with dual text encoders:

```
CLIPTextEncodeSDXL
├── clip: from Load Checkpoint
├── text_g: main prompt (CLIP-G)
├── text_l: style/detail prompt (CLIP-L)
├── width/height: target resolution
└── crop_w/crop_h: crop coordinates
```

**SDXL Prompt Strategy:**
- `text_g`: Subject and main description
- `text_l`: Style, quality, and artistic direction

### Dual CLIP Loader (FLUX)

FLUX requires both CLIP-L and T5:

```
DualCLIPLoader
├── clip_name1: "clip_l.safetensors"
├── clip_name2: "t5xxl_fp16.safetensors"
└── type: "flux"
```

## 3.4 Weight Adjustment & Prompt Scheduling

### Attention/Weight Syntax

```
# Increase weight (more emphasis)
(keyword:1.2)
((keyword))  # Same as (keyword:1.1)

# Decrease weight (less emphasis)
(keyword:0.8)
[keyword]    # Same as (keyword:0.9)

# Strong emphasis
(((keyword)))  # (keyword:1.331)

# Combining
a (beautiful:1.3) sunset with (clouds:0.7)
```

### Keyboard Shortcuts for Weights

| Shortcut | Action |
|----------|--------|
| Ctrl + Up | Increase weight by 0.05 |
| Ctrl + Down | Decrease weight by 0.05 |

### Prompt Scheduling (Step-Based)

Change prompts during generation:

```
# Switch at step 10
[prompt1:prompt2:10]

# Switch at 50% of steps
[prompt1:prompt2:0.5]

# Fade between prompts
[prompt1|prompt2]
```

**Example:**
```
[a dog:a cat:0.5] sitting on grass
# First half: dog, second half: cat
```

### Prompt Alternation

```
{option1|option2|option3}
```

ComfyUI randomly selects one option per generation.

### BREAK Keyword

Forces a new chunk of 77 tokens:

```
first part of prompt BREAK second part of prompt
```

Useful for separating distinct concepts.

## 3.5 Using Negative Prompts

### Purpose of Negative Prompts

Negative prompts tell the model what to avoid:
- Unwanted content
- Quality issues
- Style elements to exclude

### Universal Negative Prompt

```
worst quality, low quality, normal quality, lowres,
jpeg artifacts, blurry, noise, film grain,
watermark, text, logo, signature, username,
cropped, out of frame, cut off,
ugly, deformed, disfigured, mutation, mutated,
bad anatomy, bad proportions, malformed limbs,
extra limbs, missing limbs, fused fingers,
too many fingers, long neck
```

### Style-Specific Negatives

**For Photorealistic:**
```
cartoon, anime, illustration, drawing, painting,
3d render, cgi, digital art, artwork
```

**For Anime/Illustration:**
```
realistic, photograph, 3d, photorealistic,
real life, photo, hyperrealistic
```

### Negative Embeddings

Use pre-trained embeddings for better negative prompting:

```
embedding:EasyNegative, embedding:bad-hands-5
```

Popular negative embeddings:
- EasyNegative
- bad-hands-5
- bad_prompt_version2
- ng_deepnegative_v1_75t

---

# Part 4: Image-to-Image

## 4.1 Basic Img2Img Workflow

### Workflow Modifications

Replace `Empty Latent Image` with:

```
Load Image → VAE Encode → KSampler
```

### Complete Workflow

```
Load Checkpoint
    ├── MODEL → KSampler
    ├── CLIP → CLIP Text Encode (+) → KSampler (positive)
    ├── CLIP → CLIP Text Encode (-) → KSampler (negative)
    └── VAE → VAE Encode → VAE Decode

Load Image → VAE Encode → KSampler → VAE Decode → Save Image
```

### Key Difference from Txt2Img

Instead of starting from noise, img2img:
1. Takes your input image
2. Encodes it to latent space (VAE Encode)
3. Adds controlled noise (based on denoise)
4. Denoises with prompt guidance

## 4.2 Understanding Denoise Parameter

The denoise value controls transformation strength:

```
denoise = 0.0: Output identical to input
denoise = 1.0: Complete regeneration (like txt2img)
```

### Visual Guide

| Denoise | Preservation | Change Level |
|---------|--------------|--------------|
| 0.1-0.2 | Very High | Color correction, minor style |
| 0.3-0.4 | High | Style transfer, keep composition |
| 0.5-0.6 | Medium | Significant changes, structure preserved |
| 0.7-0.8 | Low | Major transformation |
| 0.9-1.0 | Minimal | Near complete regeneration |

### Practical Applications

| Task | Recommended Denoise |
|------|---------------------|
| Color adjustment | 0.1-0.2 |
| Style transfer | 0.3-0.5 |
| Background change | 0.4-0.6 |
| Artistic interpretation | 0.5-0.7 |
| Complete restyle | 0.7-0.9 |

## 4.3 Style Transfer Techniques

### Basic Style Transfer

1. Load your content image
2. Use a style-focused prompt
3. Set denoise to 0.4-0.6
4. Use appropriate checkpoint (e.g., artistic model)

**Example Prompt:**
```
Positive: oil painting, impressionist style, vibrant brushstrokes
Negative: photo, realistic, digital
```

### Using Style Models

Some workflows use dedicated style models:
- Style LoRAs
- Style embeddings
- Reference-based methods (IP-Adapter)

### Multi-Pass Refinement

For better results, run multiple passes:

1. First pass: denoise 0.6, broad style
2. Second pass: denoise 0.3, refine details
3. Optional: upscale and detail pass

## 4.4 FLUX Img2Img Workflow

FLUX requires a different workflow structure:

### Required Nodes

```
Load Diffusion Model (unet)
DualCLIPLoader (CLIP-L + T5)
Load VAE (ae.safetensors)
```

### FLUX Workflow Structure

```
Load Diffusion Model → MODEL
DualCLIPLoader → CLIP → CLIPTextEncode → CONDITIONING
Load VAE → VAE

Load Image → VAE Encode → KSampler → VAE Decode → Save Image
                              ↑
                    FluxGuidance node
                    (guidance scale: 3.5-4.0)
```

### FLUX-Specific Settings

| Parameter | Value |
|-----------|-------|
| CFG | 1.0 |
| Guidance (via FluxGuidance node) | 3.5-4.0 |
| Sampler | euler |
| Scheduler | simple |
| Steps | 20-28 |

### Notes

- FLUX doesn't use traditional CFG
- Use `FluxGuidance` node to control prompt adherence
- FP8 version requires less VRAM but slightly lower quality
- GGUF versions available for low VRAM systems

---

# Part 5: Inpainting & Outpainting

## 5.1 Using the Mask Editor

### Accessing the Mask Editor

1. Add a **Load Image** node
2. Load your image
3. Right-click the image preview
4. Select **"Open in MaskEditor"**

### Mask Editor Controls

| Tool | Function |
|------|----------|
| Brush | Paint mask area (white = edit, black = preserve) |
| Eraser | Remove mask |
| Size Slider | Adjust brush size |
| Opacity | Mask softness (affects feathering) |
| Clear | Remove all mask |
| Save | Apply mask to node |

### Mask Tips

- **White areas**: Will be regenerated
- **Black areas**: Will be preserved
- **Soft edges**: Use 30-70% opacity for blending
- **Feathering**: Helps blend inpainted areas

## 5.2 Inpainting Workflows

### Basic Inpainting Setup

```
Load Image ─────────────────────────┬─→ VAE Encode for Inpainting
    └── (Open in MaskEditor) ──────┤
                                    ↓
                              LATENT with mask
                                    ↓
                               KSampler
                                    ↓
                              VAE Decode
```

### Key Nodes

**VAE Encode (for Inpainting)**
```
VAE Encode (for Inpainting)
├── pixels: original image
├── vae: from checkpoint
├── mask: from Load Image (mask output)
└── grow_mask_by: pixels to expand mask (0-64)
```

**SetLatentNoiseMask** (alternative method)
```
SetLatentNoiseMask
├── samples: encoded latent
└── mask: mask image
```

### Inpainting Parameters

| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| denoise | 0.8-1.0 | Higher for better integration |
| grow_mask_by | 6-16 | Helps blend edges |
| steps | 25-35 | More steps for detail |

### Using Inpainting Models

Specialized inpainting models produce better results:

- `512-inpainting-ema.safetensors` (SD 1.5)
- `Juggernaut-XL-Inpainting.safetensors` (SDXL)

Place in `models/checkpoints/` and use with Load Checkpoint.

### Object Removal

1. Mask the object completely
2. Prompt describing what should replace it
3. High denoise (0.9-1.0)
4. Negative prompt: the object you're removing

### Object Addition

1. Mask where new object should appear
2. Prompt describing the new object
3. Moderate denoise (0.7-0.9)
4. May need multiple attempts

## 5.3 Outpainting Techniques

### What is Outpainting?

Extending an image beyond its original borders by generating new content that seamlessly continues the existing scene.

### Manual Outpainting

1. **Pad Image for Outpainting** node
   - Adds blank space around image
   - Creates appropriate mask

```
Pad Image for Outpainting
├── image: input image
├── left/right/top/bottom: pixels to add
└── feathering: blend amount
```

2. Connect to inpainting workflow
3. Prompt should describe the extended scene

### Outpainting Settings

| Parameter | Value |
|-----------|-------|
| Padding | 128-512 pixels per side |
| Feathering | 32-64 pixels |
| denoise | 0.9-1.0 |
| grow_mask_by | 8-16 |

### Iterative Outpainting

For large extensions:
1. Outpaint one direction at a time
2. Use the result as input for next direction
3. Maintain consistent prompts
4. Match lighting/style descriptions

## 5.4 Specialized Inpainting Models

### Why Use Inpainting Models?

Regular models weren't trained for partial image generation. Inpainting models:
- Better understand context around masked areas
- Produce more coherent fills
- Better edge blending

### Available Inpainting Models

**SD 1.5:**
- `sd-v1-5-inpainting.safetensors`
- `realistic-vision-v5-inpainting.safetensors`

**SDXL:**
- `Juggernaut-XL-Inpainting.safetensors`
- `SDXL-Inpainting.safetensors`

**FLUX:**
- Use `FLUX Fill` workflow with:
  - `flux1-fill-dev.safetensors`

### FLUX Fill Workflow

```
FLUX Fill Dev
├── Specialized for inpainting/outpainting
├── Better context understanding
├── Supports both inpainting and outpainting
└── Requires specific workflow nodes
```

---

# Part 6: ControlNet

## 6.1 What is ControlNet?

ControlNet adds conditional control to image generation by using preprocessed input images (edge maps, depth maps, poses, etc.) to guide the output structure while letting the prompt control style and content.

### How ControlNet Works

1. **Preprocess** your input image (extract edges, depth, pose, etc.)
2. **Condition** the model with this control signal
3. **Generate** images that follow the control structure

### Benefits

- Maintain specific poses
- Preserve composition
- Control structural elements
- Transfer structure from reference images

## 6.2 Types of ControlNet

### Edge/Line Detection

| Type | Best For | Model |
|------|----------|-------|
| **Canny** | Hard edges, architecture | control_canny |
| **Lineart** | Soft line drawings | control_lineart |
| **Softedge** | Smooth edges, organic shapes | control_softedge |
| **Scribble** | Rough sketches | control_scribble |
| **MLSD** | Straight lines, buildings | control_mlsd |

### Depth

| Type | Best For | Model |
|------|----------|-------|
| **Depth MiDaS** | General depth | control_depth |
| **Depth Zoe** | More accurate depth | control_zoe_depth |
| **Depth Anything** | State-of-art depth | depth_anything |

### Pose/Structure

| Type | Best For | Model |
|------|----------|-------|
| **OpenPose** | Human poses | control_openpose |
| **DWPose** | More accurate poses | dwpose |
| **MediaPipe Face** | Facial landmarks | mediapipe_face |

### Semantic/Content

| Type | Best For | Model |
|------|----------|-------|
| **Segmentation** | Scene composition | control_seg |
| **Normal Map** | Surface details | control_normal |
| **Shuffle** | Style transfer | control_shuffle |
| **IP2P** | Instruction-based | control_ip2p |
| **Tile** | Detail preservation | control_tile |

### SDXL ControlNets

SDXL-specific versions available from:
- diffusers/controlnet-sdxl
- xinsir/controlnet-sdxl

### FLUX ControlNets

- `flux-controlnet-canny` (XLabs-AI)
- `flux-controlnet-depth` (XLabs-AI)
- `flux-controlnet-union` (InstantX)

## 6.3 Installing ControlNet Models

### Model Locations

```
ComfyUI/models/controlnet/
├── SD15/
│   ├── control_canny-fp16.safetensors
│   ├── control_depth-fp16.safetensors
│   └── ...
├── SDXL/
│   └── ...
└── FLUX/
    └── ...
```

### Installing Preprocessors

ComfyUI only includes Canny preprocessor by default. Install `ComfyUI_Controlnet_Aux` for all preprocessors:

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Fannovel16/ComfyUI_Controlnet_Aux
```

Or use ComfyUI Manager: Search for "ControlNet Auxiliary Preprocessors"

### Download Sources

- **Hugging Face**: Most comprehensive
- **Civitai**: Community models
- **GitHub Releases**: Official models

## 6.4 Basic ControlNet Workflow

### Workflow Structure

```
Load Image → Preprocessor → Control Apply
                                 ↓
Load Checkpoint → CLIP Text Encode → KSampler → VAE Decode
                                         ↑
                              Load ControlNet Model
```

### Essential Nodes

**Load ControlNet Model**
```
Load ControlNet Model
├── control_net_name: (dropdown)
└── Output: CONTROL_NET
```

**Apply ControlNet**
```
Apply ControlNet
├── conditioning: from CLIP Text Encode
├── control_net: from Load ControlNet
├── image: preprocessed control image
└── strength: 0.0-2.0 (typically 0.8-1.0)
```

### Preprocessor Nodes

**Canny Edge:**
```
Canny Edge Preprocessor
├── image: input image
├── low_threshold: 100 (default)
├── high_threshold: 200 (default)
└── Output: edge map
```

**OpenPose:**
```
OpenPose Preprocessor
├── image: input image
├── detect_hand: true/false
├── detect_body: true/false
├── detect_face: true/false
└── Output: pose image
```

### Strength Parameter

| Strength | Effect |
|----------|--------|
| 0.0 | No control effect |
| 0.3-0.5 | Light guidance |
| 0.6-0.8 | Moderate control |
| 0.9-1.0 | Strong control |
| 1.0-1.5 | Very strict (may cause artifacts) |

## 6.5 Multi-ControlNet Workflows

### Combining Multiple ControlNets

You can chain multiple ControlNets:

```
CLIP Text Encode → Apply ControlNet (Depth) → Apply ControlNet (OpenPose) → KSampler
```

### Strategy for Combining

| Combination | Use Case |
|-------------|----------|
| Depth + Canny | Preserve structure AND edges |
| OpenPose + Depth | Character pose with scene depth |
| Lineart + Tile | Colorize while preserving detail |
| Canny + Scribble | Precise edges + creative freedom |

### Balancing Multiple Controls

- Lower individual strengths (0.4-0.7 each)
- Prioritize one control type
- Experiment with order (later = stronger influence)

## 6.6 T2I-Adapters

### What are T2I-Adapters?

Lighter alternatives to ControlNet:
- Much faster (minimal speed impact)
- Lower VRAM usage
- Slightly less precise control

### Available T2I-Adapters

- t2i-adapter-canny
- t2i-adapter-sketch
- t2i-adapter-depth
- t2i-adapter-openpose
- t2i-adapter-color
- t2i-adapter-style

### Usage

Same workflow as ControlNet, but use:
```
Load ControlNet Model (works for T2I-Adapters)
```

Place T2I-Adapter models in `models/controlnet/` folder.

### When to Use T2I-Adapters

- Speed is priority
- Lower VRAM available
- Less precise control acceptable
- Combining many control inputs

---

# Part 7: Consistent Characters & Style

## 7.1 IP-Adapter Introduction

IP-Adapter (Image Prompt Adapter) allows using reference images to guide generation style, content, or subject consistency. Think of it as "image prompting" instead of text prompting.

### How IP-Adapter Works

1. Extracts features from reference image via CLIP Vision
2. Injects these features into the generation process
3. Generated images inherit characteristics from reference

### IP-Adapter Variants

| Model | Best For |
|-------|----------|
| ip-adapter | General image prompting |
| ip-adapter-plus | Higher fidelity |
| ip-adapter-plus-face | Face preservation |
| ip-adapter-faceid | Identity preservation |
| ip-adapter-faceid-plus | Best face identity |

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus
```

**Required Models:**
- IP-Adapter models → `models/ipadapter/`
- CLIP Vision models → `models/clip_vision/`

## 7.2 IPAdapter FaceID Plus

### Purpose

Maintain consistent facial identity across multiple generations.

### Required Models

1. **IP-Adapter FaceID Plus V2**: Main model
2. **CLIP-ViT-H-14**: Vision encoder
3. **InsightFace**: Face analysis (installed via pip)
4. **FaceID LoRA**: Required companion LoRA

### Workflow Setup

```
Reference Face Image → IPAdapter FaceID
                            ↓
                    Apply IPAdapter
                            ↓
                       KSampler
```

### Key Nodes

**IPAdapter FaceID**
```
IPAdapter FaceID
├── ipadapter: IPAdapter model
├── clip_vision: CLIP vision model
├── insightface: InsightFace model
├── image: reference face image
└── weight: 0.7-1.0
```

### Best Practices

- Use clear, front-facing reference photos
- Multiple reference images improve consistency
- Combine with LoRA for specific features
- Lower weight (0.6-0.8) for more prompt flexibility

## 7.3 Creating Consistent Characters

### Method 1: IP-Adapter + Consistent Seed

1. Generate base character with fixed seed
2. Use IP-Adapter to maintain features
3. Change prompts for different scenes/poses

### Method 2: Character LoRA

1. Train a LoRA on your character
2. Use trigger word in prompts
3. Consistent across any scene

### Method 3: Reference Image Pipeline

```
Base Character Image → IP-Adapter → New Scene Generation
                           +
                    ControlNet (OpenPose) → Specific Pose
```

### Workflow for Consistent Character

```
Load Checkpoint → MODEL
Load IP-Adapter → IPADAPTER
Load CLIP Vision → CLIP_VISION

Reference Image → IPAdapter Encoder → Apply IPAdapter
                                           ↓
Empty Latent → KSampler → VAE Decode → Save
```

### Tips for Consistency

1. **Same model/checkpoint** across all generations
2. **Reference from multiple angles** if using FaceID
3. **Consistent prompts** for style/quality
4. **Use negative prompts** to prevent drift
5. **ControlNet for poses** maintains body consistency

## 7.4 Style Transfer with IPAdapter

### Image Style Transfer

Use IP-Adapter to transfer artistic style from reference:

```
Style Reference Image → IPAdapter (weight: 0.6-0.8)
                             ↓
                     Style-transferred output
```

### Settings for Style Transfer

| Parameter | Recommended |
|-----------|-------------|
| weight | 0.6-0.8 |
| weight_type | style transfer |
| start_at | 0.0 |
| end_at | 1.0 |

### Combining Subject and Style

Two IP-Adapters in sequence:

```
Subject Reference → IPAdapter 1 (subject) → Apply
                                              ↓
Style Reference → IPAdapter 2 (style) → Apply
                                              ↓
                                         KSampler
```

## 7.5 InstantID Integration

### What is InstantID?

More advanced face identity preservation than IP-Adapter FaceID:
- Better identity preservation
- Works with single reference image
- Faster than multiple-reference methods

### Required Components

- InstantID model
- AntelopeV2 face analysis
- IP-Adapter model (specific version)
- ControlNet model (InstantID-specific)

### InstantID Workflow

```
Reference Face → Face Analysis → InstantID Apply
                                       ↓
                              ControlNet (Face Keypoints)
                                       ↓
                                   KSampler
```

### InstantID vs FaceID

| Aspect | InstantID | FaceID |
|--------|-----------|--------|
| Reference Images | 1 | 1-5 |
| Identity Accuracy | Higher | Good |
| Speed | Faster | Moderate |
| Flexibility | More rigid | More flexible |
| Prompt Following | Good | Better |

---

# Part 8: Image Enhancement

## 8.1 Upscaling Methods Overview

Three main approaches to upscaling in ComfyUI:

### 1. Pixel Resampling (Basic)

Simple algorithmic scaling:
- Nearest Neighbor
- Bilinear
- Bicubic
- Lanczos

**Pros**: Fast, no AI required
**Cons**: No detail enhancement

### 2. AI Upscale Models

Neural network upscaling:
- ESRGAN variants
- RealESRGAN
- SwinIR
- 4x-UltraSharp

**Pros**: Adds realistic detail
**Cons**: May add artifacts, slower

### 3. SD Secondary Sampling (Hires Fix)

Re-run through diffusion model:
- Upscale latent
- Re-sample with lower denoise

**Pros**: Best quality, coherent with model
**Cons**: Slowest, can change content

## 8.2 ESRGAN Upscaling

### Setup

Download ESRGAN models → `models/upscale_models/`

Popular models:
- 4x-ESRGAN
- 4x-UltraSharp
- RealESRGAN_x4plus
- RealESRGAN_x4plus_anime_6B

### Basic Workflow

```
Image → Upscale Image (using Model) → Save Image
```

### Upscale Model Loader

```
Load Upscale Model
├── model_name: (dropdown)
└── Output: UPSCALE_MODEL
```

### Image Scale with Model

```
Upscale Image (using Model)
├── upscale_model: from loader
├── image: input image
└── Output: upscaled IMAGE
```

### Choosing Models

| Model | Best For | Scale |
|-------|----------|-------|
| 4x-ESRGAN | General | 4x |
| 4x-UltraSharp | Detailed, clean | 4x |
| RealESRGAN_x4plus | Photos, realistic | 4x |
| RealESRGAN_anime | Anime/illustration | 4x |
| 4x-Ultrasharp | Maximum detail | 4x |

## 8.3 Ultimate SD Upscale

### What is It?

Tile-based upscaling using Stable Diffusion:
1. Upscales image with AI model first
2. Splits into tiles
3. Re-processes each tile with SD
4. Blends tiles together

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/ssitu/ComfyUI_UltimateSDUpscale --recursive
```

### Workflow

```
Image → Ultimate SD Upscale → Save Image
            ↑
    KSampler (model, positive, negative)
    Upscale Model
    VAE
```

### Ultimate SD Upscale Parameters

| Parameter | Recommended |
|-----------|-------------|
| upscale_by | 2.0-4.0 |
| seed | match original or fixed |
| steps | 20-30 |
| cfg | 7 |
| denoise | 0.2-0.4 |
| tile_width | 512-768 |
| tile_height | 512-768 |
| seam_fix_mode | Half Tile |
| seam_fix_denoise | 0.25 |

### Tips

- Lower denoise (0.1-0.3) preserves original
- Higher denoise (0.4-0.6) allows more enhancement
- Use same model as original generation
- Match positive/negative prompts if possible

## 8.4 SUPIR Upscaling

### What is SUPIR?

State-of-the-art upscaling using latent space and diffusion:
- Super Resolution via Implicit Regularizers
- Excellent detail reconstruction
- Minimal artifacts

### Installation

Use ComfyUI Manager to install SUPIR nodes.

### Required Models

- SUPIR model (F or Q variant)
- SDXL checkpoint (for prior)
- CLIP models

### SUPIR Workflow

```
Image → SUPIR Model Loader → SUPIR Sampler → Save Image
              ↑
     SDXL Checkpoint (for conditioning)
```

### SUPIR vs Other Methods

| Method | Quality | Speed | VRAM |
|--------|---------|-------|------|
| ESRGAN | Good | Fast | Low |
| Ultimate SD | Very Good | Slow | Medium |
| SUPIR | Excellent | Slower | High |

## 8.5 Face Restoration (GFPGAN, CodeFormer)

### Purpose

Fix distorted, blurry, or damaged faces in generated images.

### GFPGAN

**Installation:**
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/comfyorg/comfyui_gfpgan
```

Download `GFPGANv1.4.pth` → `models/facerestore_models/`

**Usage:**
```
Image → GFPGAN Face Restore → Enhanced Image
```

### CodeFormer

Alternative to GFPGAN with fidelity control:

**Parameters:**
- `fidelity`: 0.0 (full enhance) to 1.0 (preserve original)

**Usage:**
```
Image → CodeFormer Face Restore → Enhanced Image
            └── fidelity: 0.5
```

### When to Use

- Faces are blurry or distorted
- After heavy img2img transformation
- After upscaling
- Face swap cleanup

### Best Practices

1. Run after main generation
2. Apply to final output
3. Use fidelity control to balance
4. Can combine: GFPGAN → CodeFormer

## 8.6 Face Swap Workflows

### Overview

Replace faces in images while maintaining natural appearance.

### Popular Face Swap Nodes

- **ReActor**: Most popular, good quality
- **ComfyUI-FaceSwap**: Simple implementation
- **Faceless Node**: Comprehensive toolkit

### ReActor Workflow

```
Target Image → ReActor Face Swap → Result
Source Face ↗     ↓
              Face Restore (GFPGAN)
```

### Required Models

- `inswapper_128.onnx` (face swap)
- `GFPGANv1.4.pth` (restoration)
- InsightFace models

### ReActor Parameters

| Parameter | Description |
|-----------|-------------|
| source_image | Face to swap in |
| input_image | Target image |
| face_restore_model | GFPGAN/CodeFormer |
| face_restore_visibility | 0.0-1.0 |
| codeformer_fidelity | 0.0-1.0 |

### Tips for Better Results

1. Use high-quality source face images
2. Match lighting conditions
3. Similar face angles help
4. Apply face restoration after swap
5. May need color correction for skin tones

---

# Part 9: Video Generation

## 9.1 AnimateDiff Setup & Usage

### What is AnimateDiff?

AnimateDiff adds motion to Stable Diffusion by training motion modules that work with existing SD checkpoints.

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved
```

### Required Models

1. **Motion Models** → `models/animatediff_models/`
   - mm_sd_v15_v2.ckpt
   - mm_sd_v14.ckpt
   - mm_sdxl_v10_beta.ckpt

2. **SD Checkpoint** (must match motion model version)
   - SD 1.5 checkpoint for v15 motion
   - SDXL checkpoint for SDXL motion

### Basic AnimateDiff Workflow

```
Load Checkpoint → Apply AnimateDiff Model → KSampler → Decode → Video Combine
                          ↑
              Load Motion Model
              Context Options
```

### Key Nodes

**AnimateDiff Loader**
```
AnimateDiff Loader
├── model: from Load Checkpoint
├── motion_model: motion module name
├── context_options: (optional)
└── Output: MODEL (with motion)
```

**Video Combine**
```
Video Combine
├── images: decoded frames
├── frame_rate: 8-24
├── format: GIF/MP4/WebM
└── Output: video file
```

### Context Options

Controls temporal coherence:

| Parameter | Description |
|-----------|-------------|
| context_length | Frames processed together (16-32) |
| context_stride | Frame overlap |
| context_overlap | Overlap between contexts |

### AnimateDiff Settings

| Parameter | Recommended |
|-----------|-------------|
| frames | 16-32 |
| fps | 8-12 |
| context_length | 16 |
| steps | 20-30 |
| cfg | 7.5 |

## 9.2 Wan 2.1/2.2 Video Generation

### What is Wan?

Wan is a state-of-the-art video generation model supporting:
- Text-to-video
- Image-to-video
- Video-to-video
- Up to 4K resolution

### Wan 2.1 Setup

**Required Models:**
- `wan2.1_t2v_14b_bf16.safetensors` (or FP8/GGUF variants)
- CLIP models
- VAE

**VRAM Requirements:**
- FP16: 24GB+
- FP8: 16GB
- GGUF: 12GB+

### Wan 2.2 Improvements

- Better temporal consistency
- Improved lighting/effects
- Smoother motion
- Cross-modal creation (image to video)

### Basic Wan Workflow

```
Wan Model Loader → Wan T2V → Video Combine
       ↑
   CLIP Encode (prompt)
```

### Wan Parameters

| Parameter | Recommended |
|-----------|-------------|
| steps | 30-50 |
| cfg | 4-6 |
| frames | 49-97 |
| fps | 24 |
| resolution | 720p-1080p |

### Wan with Depth Control

```
Input Video → Depth Anything → Wan Depth Control → Output Video
                                      ↑
                              Wan Model + Prompt
```

## 9.3 Video-to-Video Workflows

### AnimateDiff Video-to-Video

Convert existing video to AI-styled video:

```
Load Video → Video to Images → VAE Encode → AnimateDiff Pipeline → Video Combine
                                                  ↑
                                        ControlNet (optional)
```

### Workflow Steps

1. **Extract frames** from source video
2. **Apply style** via prompt + denoise
3. **Maintain motion** via AnimateDiff or frame consistency
4. **Recombine** frames to video

### Maintaining Consistency

- Use ControlNet (depth/pose) to preserve motion
- Lower denoise (0.4-0.6) to keep structure
- IP-Adapter for style consistency
- Frame interpolation to smooth results

### Batch Processing Video

```
Video Frames → Batch Loader → Per-Frame Processing → Frame Combiner
```

## 9.4 Frame Interpolation

### Purpose

- Increase video frame rate (e.g., 12fps → 24fps)
- Smooth jerky animations
- Create slow-motion effects

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Fannovel16/ComfyUI-Frame-Interpolation
```

### Frame Interpolation Models

- **FILM**: High quality, moderate speed
- **RIFE**: Fast, good quality
- **GIMM-VFI**: Latest, excellent results

### Workflow

```
Video Frames → Frame Interpolate → Interpolated Frames → Video Combine
                     ↑
           Multiplier: 2x, 4x, etc.
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| multiplier | 2 = double fps, 4 = quadruple |
| model | FILM/RIFE/GIMM |
| quality | Trade-off speed vs quality |

## 9.5 Video Upscaling

### Methods

1. **Frame-by-frame ESRGAN**
2. **Video-specific upscalers** (RealESRGAN-video)
3. **Topaz AI** (external tool)

### ComfyUI Workflow

```
Video → Extract Frames → Upscale Each Frame → Combine to Video
```

### Batch Upscaling

```
Load Video Frames (batch) → Upscale Model → Save Frames
```

### RealESRGAN Video

```
Video Frames → RealESRGAN_x4 → Upscaled Frames → Video Combine
```

### Tips

- Process in batches to manage VRAM
- Match output fps to original
- Apply frame interpolation AFTER upscaling
- Consider temporal consistency (flickering)

---

# Part 10: Advanced Features

## 10.1 LoRA - Usage & Training

### What is LoRA?

Low-Rank Adaptation - small models (10-200MB) that modify existing checkpoints to add:
- Specific styles
- Characters
- Concepts
- Objects

### Using LoRAs

**LoRA Loader Node:**
```
Load LoRA
├── model: from checkpoint
├── clip: from checkpoint
├── lora_name: (dropdown)
├── strength_model: -2.0 to 2.0
└── strength_clip: -2.0 to 2.0
```

### Workflow

```
Load Checkpoint ─┬─ MODEL ─→ Load LoRA ─→ KSampler
                 └─ CLIP ──→ Load LoRA
```

### LoRA Strength

| Strength | Effect |
|----------|--------|
| 0.0 | No effect |
| 0.3-0.5 | Subtle influence |
| 0.6-0.8 | Moderate effect |
| 1.0 | Full effect |
| 1.2+ | Overfit, may cause artifacts |

### Stacking Multiple LoRAs

```
Checkpoint → LoRA 1 → LoRA 2 → LoRA 3 → KSampler
```

**Note**: Order matters! Later LoRAs can override earlier ones.

### LoRA Training (Basics)

**Tools:**
- Kohya_ss (recommended)
- sd-scripts
- ComfyUI training nodes

**Dataset Requirements:**
- 15-50 high-quality images
- Consistent subject
- Varied poses/angles
- Good captions

**Training Settings (FLUX LoRA):**
| Parameter | Recommended |
|-----------|-------------|
| Rank | 32-64 |
| Learning Rate | 1e-4 |
| Steps | 800-1500 |
| Optimizer | AdamW8bit |
| Precision | bf16 |

## 10.2 Textual Inversion / Embeddings

### What are Embeddings?

Tiny files (5-50KB) that teach the model new concepts via the text encoder.

### Using Embeddings

**In Prompts:**
```
embedding:EasyNegative
embedding:my_character
```

**Folder:** `models/embeddings/`

### Embedding vs LoRA

| Aspect | Embedding | LoRA |
|--------|-----------|------|
| File Size | ~5-50KB | ~10-200MB |
| Training Time | Hours | Minutes-Hours |
| Quality | Good for concepts | Better for style |
| Flexibility | Any checkpoint | Checkpoint-specific |

### Training Embeddings

**Requirements:**
- 3-10 images
- Consistent concept
- Less compute than LoRA

**Training Parameters:**
- Learning rate: 0.001-0.005
- Steps: 2000-5000
- Vectors per token: 4-8

## 10.3 Model Merging

### Purpose

Combine characteristics from multiple models:
- Blend styles
- Mix capabilities
- Create custom base models

### Merge Methods

**Weighted Sum:**
```
Result = (Model_A × weight) + (Model_B × (1 - weight))
```

**Add Difference:**
```
Result = Model_A + (Model_B - Model_C) × weight
```

### ComfyUI Nodes

**Model Merge:**
```
ModelMergeSimple
├── model1: first model
├── model2: second model
└── ratio: 0.0-1.0 (blend weight)
```

### Merging Tips

1. Merge similar architectures only (SD1.5 + SD1.5, SDXL + SDXL)
2. Start with 0.5 ratio
3. Test merged model immediately
4. Save successful merges as new checkpoint

## 10.4 Hypernetworks

### What are Hypernetworks?

Small neural networks that modify the attention layers of the main model.

**Use Cases:**
- Style modification
- Artist style replication
- Concept injection

### Usage

```
models/hypernetworks/your_hypernetwork.pt
```

**In workflow:**
```
Load Checkpoint → Apply Hypernetwork → KSampler
```

### Hypernetwork vs LoRA

| Aspect | Hypernetwork | LoRA |
|--------|--------------|------|
| Mechanism | Attention modification | Weight modification |
| File Size | 50-500MB | 10-200MB |
| Flexibility | More flexible | More precise |
| Training | Slower | Faster |

**Note**: LoRA is generally preferred in modern workflows.

## 10.5 FLUX Model Workflows

### FLUX Architecture

FLUX uses a different architecture:
- DiT (Diffusion Transformer) instead of UNet
- Dual text encoders (CLIP-L + T5)
- Different VAE (ae.safetensors)
- No traditional CFG (uses guidance scale)

### Required Models

```
models/unet/flux1-dev.safetensors          # or flux1-schnell
models/clip/clip_l.safetensors
models/clip/t5xxl_fp16.safetensors         # or fp8 variant
models/vae/ae.safetensors
```

### FLUX Text-to-Image Workflow

```
UNETLoader (flux model) → MODEL
DualCLIPLoader → CLIP → CLIPTextEncode → CONDITIONING
VAELoader (ae) → VAE

Empty Latent → FluxGuidance → KSampler → VAEDecode → Save
                    ↑
              guidance: 3.5
```

### FLUX-Specific Nodes

**FluxGuidance:**
```
FluxGuidance
├── conditioning: from text encode
└── guidance: 3.0-4.0
```

### FLUX Settings

| Parameter | Value |
|-----------|-------|
| CFG | 1.0 (always) |
| Guidance | 3.0-4.0 |
| Sampler | euler |
| Scheduler | simple |
| Steps | 20-28 (schnell: 4) |

### FLUX Schnell vs Dev

| Aspect | Schnell | Dev |
|--------|---------|-----|
| Steps | 4 | 20-28 |
| Quality | Good | Better |
| Speed | Very fast | Moderate |
| License | Apache 2.0 | Non-commercial |

### FLUX GGUF (Low VRAM)

For systems with 8-12GB VRAM:

```
Download GGUF quantized model
Use UnetLoaderGGUF node
Lower memory usage, slightly lower quality
```

### FLUX ControlNet

```
FLUX ControlNet models available:
- flux-controlnet-canny
- flux-controlnet-depth
- flux-controlnet-union (multiple types in one)
```

---

# Part 11: 3D & Audio Generation

## 11.1 Hunyuan3D 2.0 Setup

### What is Hunyuan3D?

Tencent's open-source 3D generation model:
- Generate 3D models from text/image
- High-fidelity mesh output
- PBR texture support
- GLB/OBJ export

### Requirements

- 12GB VRAM minimum (full pipeline)
- 5GB for Hunyuan3D-2mini
- Python 3.10+
- CUDA 11.8+

### Installation

**Via ComfyUI Manager:**
Search for "Hunyuan3D" or "ComfyUI-3D-Pack"

**Manual:**
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/MrForExample/ComfyUI-3D-Pack
pip install -r requirements.txt
```

### Required Models

Place in appropriate directories:
- `hunyuan3d-dit-v2-0-fp16.safetensors` → `models/unet/`
- `hunyuan3d-paint-v2-0` → `models/diffusers/`
- `hunyuan3d-delight-v2-0` → `models/diffusers/`

### Basic Workflow

```
Text/Image Input → Hunyuan3D-DiT → Shape Generation → Texture Generation → Export GLB
```

### Workflow Steps

1. **Input**: Text prompt or reference image
2. **Multi-view Generation**: Create views of the object
3. **Shape Reconstruction**: Generate 3D mesh
4. **Texture Painting**: Apply textures
5. **Export**: GLB, OBJ, or other formats

### Hunyuan3D Variants

| Model | VRAM | Speed | Quality |
|-------|------|-------|---------|
| Hunyuan3D-2 | 12GB | Standard | Best |
| Hunyuan3D-2mini | 5GB | Fast | Good |
| Hunyuan3D-2-Turbo | 6GB | Faster | Good |

## 11.2 3D Model Generation from Images

### Image-to-3D Pipeline

```
Reference Image → Image Preprocessor → Hunyuan3D → 3D Mesh
```

### Tips for Good Results

1. **Clear subject**: Single object, clean background
2. **Good lighting**: Even lighting, no harsh shadows
3. **Multiple angles**: Helps with back/side generation
4. **Simple geometry**: Complex objects may need refinement

### Post-Processing

Generated meshes can be:
- Imported into Blender
- Exported as GLB/OBJ/FBX
- Used in game engines
- 3D printed

## 11.3 ACE-Step Music Generation

### What is ACE-Step?

Open-source music generation model:
- Text-to-music
- Up to 4 minutes per generation
- 15x faster than LLM-based alternatives
- Supports 19 languages
- Apache 2.0 license

### Installation

**Model:**
Download `ace_step_v1_3.5b.safetensors` → `models/checkpoints/`

**Custom Nodes:**
Use ComfyUI Manager or:
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/billwuhao/ComfyUI_ACE-Step
```

### Basic Workflow

```
ACE-Step Loader → ACE-Step Sampler → Save Audio
        ↑
   Text Prompt (style tags + lyrics)
```

### Prompt Format

**Tags** (describe style):
```
pop, electronic, upbeat, female vocals, 120bpm
```

**Lyrics** (with structure):
```
[verse]
Walking down the street today
[chorus]
Life is beautiful in every way
[bridge]
Instrumental break
```

### ACE-Step Settings

| Parameter | Recommended |
|-----------|-------------|
| steps | 65 |
| cfg | 4.0 |
| sampler | er_sde |
| scheduler | linear_quadratic |
| multiplier | 1.15 |

### Tips

- CFG 4.0 is optimal (higher causes artifacts)
- 65 steps provides best quality
- Use clear structure tags ([verse], [chorus])
- Style tags dramatically affect output

## 11.4 Audio Generation Workflows

### Audio Types Supported

- **Music**: Full songs with vocals
- **Instrumental**: No vocals
- **Sound Effects**: Short audio clips
- **Voice**: With additional models

### Advanced ACE-Step Features

**LoRA Support:**
Fine-tune for specific styles or voices

**ControlNet:**
Guide generation with reference audio

**Voice Cloning:**
With additional voice models

### Integration with Video

```
Video Generation → Audio Generation → Combine
       ↓                  ↓
  AnimateDiff/Wan    ACE-Step
```

### Audio Output Formats

- WAV (uncompressed)
- MP3 (compressed)
- OGG (compressed)

---

# Part 12: Essential Custom Nodes

## 12.1 ComfyUI Manager

### Purpose

Central hub for managing all custom nodes.

### Features

- **Install Custom Nodes**: Browse and install from registry
- **Update All**: Keep nodes current
- **Install Missing**: Auto-detect workflow requirements
- **Disable/Enable**: Toggle nodes without uninstalling
- **Git URL Install**: Add unregistered nodes

### Key Functions

| Button | Function |
|--------|----------|
| Install Custom Nodes | Browse registry |
| Install Missing Nodes | For loaded workflow |
| Update All | Update all installed |
| Install via Git URL | Manual installation |
| Snapshot Manager | Backup/restore configurations |

### Best Practices

1. Update regularly but test after updates
2. Use snapshots before major updates
3. Only install trusted nodes
4. Check compatibility before installing

## 12.2 WAS Node Suite

### Overview

Largest custom node pack with hundreds of utility nodes.

### Key Node Categories

**Image Processing:**
- Image Blend
- Image Resize
- Image Save (with metadata)
- Image Composite
- Image Crop

**Text Operations:**
- Text Concatenate
- Text to Conditioning
- Text Random
- Text Find/Replace

**Math & Logic:**
- Number Operations
- Boolean Logic
- Random Generators

**Utilities:**
- Checkpoint Loader
- VAE Loader
- Model Tools

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/WASasquatch/was-node-suite-comfyui
```

### Commonly Used Nodes

| Node | Purpose |
|------|---------|
| WAS Image Save | Save with metadata/subfolders |
| WAS Text Concatenate | Combine text strings |
| WAS Image Blend | Blend images with modes |
| WAS Number Input | Numeric parameter input |

## 12.3 ComfyUI Impact Pack

### Overview

Focused on image enhancement and face processing.

### Key Features

- **Face Detection/Restoration**
- **Segmentation**
- **Detail Enhancement**
- **Wildcard Support**

### Important Nodes

**Detectors:**
- SAM (Segment Anything)
- BBOX (Bounding Box) Detectors
- Face Detectors

**Enhancers:**
- FaceDetailer
- DetailerPipe
- Ultimate SD Upscale integration

### FaceDetailer Workflow

```
Image → Face Detection → Crop Faces → Enhance Each → Composite Back
```

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack
```

## 12.4 ComfyUI Essentials

### Overview

Quality-of-life nodes missing from core ComfyUI.

### Key Nodes

| Node | Function |
|------|----------|
| Image Resize | Resize with various methods |
| Image Crop | Crop to dimensions |
| Image Flip | Flip horizontal/vertical |
| Mask Blur | Blur mask edges |
| Get Image Size | Return dimensions |
| Debug (Console) | Print to console |

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/comfyorg/comfyui-essentials
```

**Note**: Original repository by cubiq is maintenance-only. Use the comfyorg fork.

## 12.5 IPAdapter Plus

### Overview

Complete IP-Adapter implementation for ComfyUI.

### Features

- All IP-Adapter models supported
- FaceID variants
- Style transfer modes
- Weight scheduling
- Multiple reference images

### Key Nodes

| Node | Purpose |
|------|---------|
| IPAdapter Model Loader | Load IP-Adapter |
| IPAdapter Apply | Apply to generation |
| IPAdapter Encoder | Encode reference images |
| IPAdapter FaceID | Face identity preservation |

### Required Models

- IP-Adapter models → `models/ipadapter/`
- CLIP Vision → `models/clip_vision/`
- InsightFace (for FaceID) → pip install

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus
```

## 12.6 KJNodes

### Overview

Quality-of-life and image transformation nodes.

### Notable Nodes

| Node | Function |
|------|----------|
| Color Match | Match color palettes |
| Get/Set widgets | Dynamic parameter control |
| Batch nodes | Batch processing utilities |
| Mask tools | Advanced mask operations |

### Color Match Example

```
Reference Image → Color Match → Target Image
                      ↓
               Color-matched output
```

### Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/kijai/ComfyUI-KJNodes
```

---

# Part 13: Workflow Optimization

## 13.1 Keyboard Shortcuts

### Essential Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + Enter | Queue prompt (generate) |
| Ctrl + S | Save workflow |
| Ctrl + O | Open workflow |
| Ctrl + D | Duplicate selected nodes |
| Ctrl + C | Copy nodes |
| Ctrl + V | Paste nodes |
| Delete | Delete selected |
| Ctrl + Z | Undo |
| Ctrl + Y | Redo |

### Node Management

| Shortcut | Action |
|----------|--------|
| Ctrl + M | Mute node (skip execution) |
| Ctrl + B | Bypass node (pass through) |
| Ctrl + G | Group selected nodes |
| Double-click | Add node (search) |
| Shift + Drag | Connect to multiple inputs |

### Navigation

| Shortcut | Action |
|----------|--------|
| Space + Drag | Pan canvas |
| Scroll | Zoom in/out |
| Home | Fit workflow to screen |
| F | Focus selected node |

### Prompt Editing

| Shortcut | Action |
|----------|--------|
| Ctrl + Up | Increase prompt weight (+0.05) |
| Ctrl + Down | Decrease prompt weight (-0.05) |

## 13.2 Performance Optimization Tips

### VRAM Management

1. **Use FP8/GGUF models** for lower VRAM
2. **Close other applications** using GPU
3. **Reduce batch size** if OOM errors
4. **Use VAE tiling** for large images
5. **Enable smart memory** (--lowvram flag)

### Speed Optimization

1. **Install xFormers** (NVIDIA): 15-25% speedup
2. **Enable PyTorch 2.0** optimizations
3. **Use efficient samplers** (Euler, DPM++ 2M)
4. **Reduce steps** where acceptable
5. **Use Turbo/LCM** for fast previews

### Startup Flags

```bash
# Low VRAM mode
python main.py --lowvram

# CPU offload
python main.py --cpu

# Specific GPU
python main.py --cuda-device 0

# Disable preview
python main.py --disable-auto-launch
```

### Workflow Efficiency

1. **Use mute (Ctrl+M)** to skip unused nodes
2. **Group related nodes** for organization
3. **Use primitive nodes** for shared parameters
4. **Remove unused nodes** from workflow
5. **Use subgraphs** for reusable components

## 13.3 VRAM Management

### VRAM Usage by Component

| Component | Approximate VRAM |
|-----------|-----------------|
| SD 1.5 | 4GB |
| SDXL | 6GB |
| FLUX FP16 | 16GB |
| FLUX FP8 | 10GB |
| ControlNet | +1-2GB each |
| IP-Adapter | +2GB |
| AnimateDiff | +2-4GB |

### Reducing VRAM Usage

1. **Use quantized models**
   - FP8 instead of FP16
   - GGUF quantization

2. **Enable tiling**
   - VAE Decode Tiled
   - Tiled samplers

3. **Lower resolution**
   - Generate at 512x512, upscale later

4. **Reduce batch size**
   - 1 image at a time

5. **Use CPU offloading**
   - --lowvram or --cpu flags

### Monitoring VRAM

```bash
# NVIDIA
nvidia-smi

# During generation
watch -n 1 nvidia-smi
```

## 13.4 Batch Processing

### Single-Image Batching

Increase `batch_size` in Empty Latent Image:
- Generates multiple images per queue
- Same prompt, different seeds

### Folder-Based Batching

Use batch loader nodes:

```
Load Image Batch → Process Each → Save Each
```

### Auto Queue

Enable in ComfyUI settings:
- Automatically queue after completion
- Useful for overnight generation
- Combine with seed randomization

### CSV-Driven Batching

```
Load CSV → Parse Rows → Generate Per Row → Save
```

Each CSV row provides:
- Prompt
- Negative prompt
- Seed
- Other parameters

### Batch Processing Tips

1. **Chunk large batches** (500-1000 per run)
2. **Monitor progress** between chunks
3. **Save intermediate results**
4. **Use consistent naming** for output

## 13.5 API & Automation

### ComfyUI API

ComfyUI exposes a REST API on port 8188:

```
http://127.0.0.1:8188/
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /prompt | POST | Queue workflow |
| /queue | GET | View queue status |
| /history | GET | Generation history |
| /view | GET | View output images |
| /interrupt | POST | Cancel generation |

### Submitting Workflow via API

```python
import json
import requests

workflow = json.load(open("workflow.json"))

response = requests.post(
    "http://127.0.0.1:8188/prompt",
    json={"prompt": workflow}
)
```

### Headless Operation

Run without UI:
```bash
python main.py --listen 0.0.0.0 --port 8188
```

### Automation Tools

- **ComfyUI-Copilot**: AI assistant for workflows
- **ComfyUI-to-Python**: Convert workflows to Python
- **Workflow scripts**: Custom automation

---

# Part 14: Troubleshooting & Resources

## 14.1 Common Issues & Solutions

### "Out of Memory" (OOM) Errors

**Solutions:**
1. Use `--lowvram` flag
2. Reduce image resolution
3. Lower batch size to 1
4. Use FP8/GGUF models
5. Close other GPU applications
6. Enable VAE tiling

### "Missing Node" When Loading Workflow

**Solutions:**
1. Click Manager → Install Missing Custom Nodes
2. Restart ComfyUI after installation
3. Check node compatibility with ComfyUI version

### Black or Corrupted Images

**Causes & Solutions:**
- Wrong VAE: Use matching VAE for model
- NaN values: Reduce CFG, check prompt
- Incompatible models: Ensure model matches architecture

### Generation Takes Forever

**Solutions:**
1. Reduce step count
2. Use faster sampler (Euler)
3. Lower resolution
4. Check for infinite loops in workflow
5. Update CUDA/PyTorch

### "Model Not Found"

**Solutions:**
1. Check file is in correct folder
2. Verify file extension (.safetensors, .ckpt)
3. Refresh ComfyUI (press R or restart)
4. Check extra_model_paths.yaml configuration

### ControlNet Not Working

**Solutions:**
1. Ensure preprocessor matches ControlNet type
2. Check model compatibility (SD1.5 vs SDXL)
3. Verify control image is properly formatted
4. Adjust strength parameter

### Preview Not Updating

**Solutions:**
1. Check for muted nodes
2. Verify connections are complete
3. Clear ComfyUI cache
4. Restart ComfyUI

## 14.2 Recommended Model Sources

### Official Sources

| Source | URL | Notes |
|--------|-----|-------|
| Hugging Face | huggingface.co | Most comprehensive |
| Civitai | civitai.com | Community models |
| GitHub Releases | Various | Official releases |

### Model Categories

**Checkpoints:**
- Hugging Face: stabilityai, runwayml
- Civitai: Various community models

**LoRAs:**
- Civitai: Largest collection
- Hugging Face: Some official

**ControlNet:**
- Hugging Face: lllyasviel, diffusers

**Upscalers:**
- OpenModelDB
- GitHub releases

### Safety Considerations

- Scan downloads with antivirus
- Prefer .safetensors over .ckpt
- Check model licensing
- Verify source reputation

## 14.3 Community Resources

### Official

- **GitHub**: github.com/comfyanonymous/ComfyUI
- **Documentation**: docs.comfy.org
- **Discord**: Official ComfyUI Discord

### Tutorials & Learning

| Resource | Focus |
|----------|-------|
| ComfyUI Wiki | comfyui-wiki.com |
| Stable Diffusion Art | General tutorials |
| RunComfy | Workflow guides |
| ThinkDiffusion | Video tutorials |

### Workflow Sharing

- **OpenArt**: openart.ai/workflows
- **Civitai**: Workflow images
- **ComfyWorkflows**: comfyworkflows.com

### Reddit Communities

- r/StableDiffusion
- r/comfyui

## 14.4 Official Documentation Links

### Core Documentation

| Resource | URL |
|----------|-----|
| Official Docs | https://docs.comfy.org |
| GitHub Repo | https://github.com/comfyanonymous/ComfyUI |
| Examples | https://comfyanonymous.github.io/ComfyUI_examples |

### Model Documentation

| Model | Documentation |
|-------|--------------|
| FLUX | https://docs.comfy.org/tutorials/flux |
| SD3 | https://docs.comfy.org/tutorials/sd3 |
| ControlNet | https://docs.comfy.org/tutorials/controlnet |

### Custom Node Documentation

| Node Pack | URL |
|-----------|-----|
| ComfyUI Manager | https://github.com/Comfy-Org/ComfyUI-Manager |
| Impact Pack | https://github.com/ltdrdata/ComfyUI-Impact-Pack |
| IPAdapter Plus | https://github.com/cubiq/ComfyUI_IPAdapter_plus |
| AnimateDiff | https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved |

---

# Appendix A: Quick Reference Cards

## Sampler Quick Reference

| Need | Sampler | Steps | Scheduler |
|------|---------|-------|-----------|
| Best Quality | dpm++ 2m sde | 30 | karras |
| Fast Preview | euler | 15 | normal |
| Creative | euler_a | 25 | karras |
| FLUX | euler | 20 | simple |
| Turbo/LCM | lcm | 4-8 | sgm_uniform |

## CFG Quick Reference

| Model | Recommended CFG |
|-------|-----------------|
| SD 1.5 | 7-9 |
| SDXL | 5-8 |
| SD3 | 4-5 |
| FLUX | 1.0 |

## Denoise Quick Reference

| Task | Denoise |
|------|---------|
| Color correction | 0.1-0.2 |
| Style transfer | 0.3-0.5 |
| Major change | 0.6-0.8 |
| Full regeneration | 0.9-1.0 |

## Resolution Quick Reference

| Model | Standard | Portrait | Landscape |
|-------|----------|----------|-----------|
| SD 1.5 | 512x512 | 512x768 | 768x512 |
| SDXL | 1024x1024 | 896x1152 | 1152x896 |
| FLUX | 1024x1024 | 768x1344 | 1344x768 |

---

# Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Checkpoint** | Complete model file containing UNET, CLIP, and VAE |
| **CFG** | Classifier-Free Guidance - controls prompt adherence |
| **CLIP** | Text encoder that converts prompts to embeddings |
| **Conditioning** | Encoded prompt data that guides generation |
| **Denoise** | Amount of transformation in img2img (0-1) |
| **Embedding** | Trained text concept (textual inversion) |
| **Latent** | Compressed image representation in latent space |
| **LoRA** | Low-Rank Adaptation - small model modifier |
| **Sampler** | Algorithm for iterative denoising |
| **Scheduler** | Controls noise level at each step |
| **UNET** | Core diffusion model architecture |
| **VAE** | Variational Autoencoder - encodes/decodes images |

---

*This guide is based on research from official ComfyUI documentation, community wikis, and tutorials current as of December 2025. ComfyUI is actively developed and features may change.*

**Key Sources:**
- [ComfyUI Official Documentation](https://docs.comfy.org)
- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [ComfyUI Wiki](https://comfyui-wiki.com)
- [RunComfy Tutorials](https://www.runcomfy.com/tutorials)
- [Stable Diffusion Art](https://stable-diffusion-art.com/comfyui/)
