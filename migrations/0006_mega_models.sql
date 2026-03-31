-- Migration 0006: Mega model refresh - 100+ models across all categories
DELETE FROM hf_models;

INSERT INTO hf_models (model_id, description, architecture, capabilities, status) VALUES

-- =============================================
-- CHAT / REASONING MODELS
-- =============================================

-- Qwen 3.5 (Feb 2026 - newest)
('Qwen/Qwen3.5-397B-A17B', 'Qwen 3.5 Plus: 397B/17B active, 262K context, native multimodal', 'MoE', 'reasoning,coding,agentic,multimodal', 'available'),
('Qwen/Qwen3.5-122B-A10B', 'Qwen 3.5: 122B/10B active, thinking mode', 'MoE', 'reasoning,coding,thinking', 'available'),
('Qwen/Qwen3.5-35B-A3B', 'Qwen 3.5 Flash: 35B/3B active, fast inference', 'MoE', 'reasoning,efficient,fast', 'available'),
('Qwen/Qwen3.5-27B', 'Dense Qwen 3.5 27B', 'Dense', 'reasoning,instruction', 'available'),
('Qwen/Qwen3.5-9B', 'Compact Qwen 3.5 9B', 'Dense', 'general,efficient', 'available'),
('Qwen/Qwen3.5-4B', 'Small Qwen 3.5 4B', 'Dense', 'efficient,fast', 'available'),
('Qwen/Qwen3.5-2B', 'Tiny Qwen 3.5 2B for edge', 'Dense', 'efficient,edge', 'available'),

-- Qwen 3
('Qwen/Qwen3-235B-A22B-Instruct', 'Qwen3 flagship MoE with tool use, Apache 2.0', 'MoE', 'reasoning,coding,tool-use,agentic', 'available'),
('Qwen/Qwen3-30B-A3B-Instruct', 'Qwen3 efficient MoE 30B/3B active', 'MoE', 'reasoning,efficient', 'available'),
('Qwen/Qwen3-32B', 'Dense Qwen3 32B', 'Dense', 'reasoning,instruction', 'available'),
('Qwen/Qwen3-8B', 'Dense Qwen3 8B', 'Dense', 'general,efficient', 'available'),
('Qwen/Qwen3-4B', 'Dense Qwen3 4B compact', 'Dense', 'efficient,fast', 'available'),

-- Qwen 2.5
('Qwen/Qwen2.5-72B-Instruct', 'Qwen 2.5 72B instruction-tuned, strong multilingual', 'Dense', 'reasoning,multilingual', 'available'),
('Qwen/Qwen2.5-32B-Instruct', 'Qwen 2.5 32B instruction-tuned', 'Dense', 'reasoning,instruction', 'available'),
('Qwen/Qwen2.5-7B-Instruct', 'Qwen 2.5 7B efficient', 'Dense', 'instruction,efficient', 'available'),
('Qwen/Qwen2.5-3B-Instruct', 'Qwen 2.5 3B compact', 'Dense', 'instruction,efficient', 'available'),

-- DeepSeek
('deepseek-ai/DeepSeek-V3.2', 'Latest DeepSeek, comparable to GPT-5', 'MoE', 'reasoning,coding,math', 'available'),
('deepseek-ai/DeepSeek-V3.2-Speciale', 'DeepSeek deep reasoning, surpasses GPT-5', 'MoE', 'reasoning,math,thinking', 'available'),
('deepseek-ai/DeepSeek-V3.1', 'Hybrid thinking/non-thinking DeepSeek', 'MoE', 'reasoning,coding', 'available'),
('deepseek-ai/DeepSeek-R1', 'DeepSeek 685B reasoning, competitive with o1', 'MoE', 'reasoning,math,coding', 'available'),
('deepseek-ai/DeepSeek-V3', 'DeepSeek 685B general MoE', 'MoE', 'coding,math,reasoning', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', '32B distilled reasoning, outperforms o1-mini', 'Dense', 'reasoning,distilled', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Llama-70B', '70B distilled reasoning on Llama backbone', 'Dense', 'reasoning,distilled', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', '7B distilled reasoning', 'Dense', 'reasoning,efficient', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B', '1.5B ultra-compact distilled reasoning', 'Dense', 'reasoning,edge', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Llama-8B', '8B distilled reasoning on Llama', 'Dense', 'reasoning,efficient', 'available'),

-- Meta Llama
('meta-llama/Llama-4-Scout-17B-16E-Instruct', 'Llama 4 Scout: 109B/17B active, 16 experts, 10M context, multimodal', 'MoE', 'reasoning,multimodal,long-context', 'available'),
('meta-llama/Llama-4-Maverick-17B-128E-Instruct', 'Llama 4 Maverick: ~400B/17B active, 128 experts, 1M context', 'MoE', 'reasoning,multimodal,coding', 'available'),
('meta-llama/Llama-3.3-70B-Instruct', 'Llama 3.3 70B instruction-tuned', 'Dense', 'reasoning,coding', 'available'),
('meta-llama/Llama-3.1-70B-Instruct', 'Llama 3.1 70B, 128K context', 'Dense', 'reasoning,coding', 'available'),
('meta-llama/Llama-3.1-8B-Instruct', 'Llama 3.1 8B efficient, 128K context', 'Dense', 'instruction,efficient', 'available'),
('meta-llama/Llama-3.1-405B-Instruct', 'Llama 3.1 405B flagship', 'Dense', 'reasoning,coding,multilingual', 'available'),
('meta-llama/Llama-3.2-3B-Instruct', 'Compact Llama for fast inference', 'Dense', 'general,efficient', 'available'),

-- Mistral
('mistralai/Mistral-Small-4-119B-2603', 'Mistral Small 4 (Mar 2026): vision + function calling + agentic', 'MoE', 'reasoning,agentic,multimodal,tool-use', 'available'),
('mistralai/Mistral-Large-3-675B-Instruct-2512', 'Mistral Large 3: 675B MoE, 256K context, Apache 2.0', 'MoE', 'reasoning,coding,multilingual', 'available'),
('mistralai/Mixtral-8x7B-Instruct-v0.1', 'Mistral MoE 8x7B', 'MoE', 'instruction,reasoning', 'available'),
('mistralai/Mistral-7B-Instruct-v0.3', 'Mistral 7B v0.3 with 32K vocab', 'Dense', 'instruction,efficient', 'available'),
('mistralai/Mistral-Small-24B-Instruct-2501', 'Mistral Small 24B multilingual', 'Dense', 'multilingual,instruction', 'available'),

-- Google Gemma
('google/gemma-3-27b-it', 'Gemma 3 27B multimodal, 128K context', 'Dense', 'instruction,reasoning,multimodal', 'available'),
('google/gemma-3-12b-it', 'Gemma 3 12B instruction-tuned', 'Dense', 'instruction,efficient', 'available'),
('google/gemma-3-4b-it', 'Gemma 3 4B compact', 'Dense', 'efficient,fast', 'available'),
('google/gemma-3-1b-it', 'Gemma 3 1B ultra-compact', 'Dense', 'efficient,edge', 'available'),
('google/gemma-2-27b-it', 'Gemma 2 27B instruction-tuned', 'Dense', 'instruction,reasoning', 'available'),
('google/gemma-2-9b-it', 'Gemma 2 9B efficient', 'Dense', 'instruction,efficient', 'available'),

-- Microsoft Phi
('microsoft/phi-4', 'Microsoft Phi-4 14B, synthetic + high-quality data', 'Dense', 'reasoning,instruction', 'available'),
('microsoft/Phi-4-mini-instruct', 'Phi-4 mini compact chat', 'Dense', 'instruction,efficient', 'available'),
('microsoft/Phi-3.5-mini-instruct', 'Phi-3.5 mini 128K context', 'Dense', 'instruction,efficient', 'available'),
('microsoft/Phi-3.5-MoE-instruct', 'Phi-3.5 MoE: 16x3.8B, 6.6B active', 'MoE', 'instruction,efficient', 'available'),

-- Moonshot Kimi
('moonshotai/Kimi-K2.5', 'Kimi K2.5 multimodal agentic with Agent Swarm', 'MoE', 'agentic,multimodal,reasoning', 'available'),
('moonshotai/Kimi-K2-Instruct', 'Kimi K2: 1T params/32B active, general chat', 'MoE', 'reasoning,instruction,coding', 'available'),
('moonshotai/Kimi-K2-Thinking', 'Kimi K2 with native thinking, 256K context', 'MoE', 'reasoning,thinking,math', 'available'),

-- Cohere
('CohereForAI/c4ai-command-r-plus', 'Cohere Command R+ 104B with RAG and tool use', 'Dense', 'reasoning,tool-use,rag', 'available'),
('CohereForAI/c4ai-command-a-03-2025', 'Cohere Command A (Mar 2025), latest enterprise', 'Dense', 'reasoning,enterprise', 'available'),
('CohereLabs/aya-vision-32b', 'Cohere multilingual vision-language 32B', 'Dense', 'vision,multilingual', 'available'),

-- OpenAI open models
('openai/gpt-oss-120b', 'OpenAI GPT-OSS 120B with tool calling and reasoning', 'Dense', 'reasoning,agentic,tool-use', 'available'),
('openai/gpt-oss-20b', 'OpenAI GPT-OSS 20B compact', 'Dense', 'reasoning,efficient', 'available'),

-- NVIDIA
('nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16', 'Nemotron 3 Nano: hybrid Mamba-Transformer, 1M context, agentic', 'MoE', 'agentic,reasoning,long-context', 'available'),

-- Zhipu
('zai-org/GLM-4.5V', 'Zhipu GLM-4.5V reasoning vision model', 'Dense', 'reasoning,vision', 'available'),

-- =============================================
-- CODE MODELS
-- =============================================
('Qwen/Qwen2.5-Coder-32B-Instruct', 'Qwen 2.5 Coder 32B, strong code generation', 'Dense', 'coding,instruction', 'available'),
('Qwen/Qwen3-Coder-480B-A35B-Instruct', 'Qwen3 Coder flagship MoE 480B/35B, function calling', 'MoE', 'coding,agentic,tool-use', 'available'),
('Qwen/Qwen3-Coder-30B-A3B-Instruct', 'Qwen3 Coder efficient MoE 30B/3B', 'MoE', 'coding,efficient', 'available'),
('deepseek-ai/DeepSeek-Coder-V2-Instruct', 'DeepSeek Coder V2 MoE, 128K context, 338 languages', 'MoE', 'coding,multilingual', 'available'),
('mistralai/Codestral-22B-v0.1', 'Mistral Codestral 22B, 80+ languages, 86.6% HumanEval', 'Dense', 'coding,instruction', 'available'),
('mistralai/Mamba-Codestral-7B-v0.1', 'Mistral Mamba-based code model, ultra-fast inference', 'Mamba', 'coding,efficient,fast', 'available'),
('bigcode/starcoder2-15b', 'StarCoder2 15B: 600+ languages, 4T training tokens', 'Dense', 'coding,multilingual', 'available'),
('bigcode/starcoder2-7b', 'StarCoder2 7B code completion', 'Dense', 'coding,efficient', 'available'),
('bigcode/starcoder2-3b', 'StarCoder2 3B compact code model', 'Dense', 'coding,edge', 'available'),

-- =============================================
-- IMAGE GENERATION
-- =============================================
('black-forest-labs/FLUX.2-dev', 'FLUX.2: 32B next-gen, DSLR quality, character consistency', 'Diffusion', 'image-generation,editing', 'available'),
('black-forest-labs/FLUX.1-dev', 'FLUX.1 dev: state-of-the-art diffusion transformer', 'Diffusion', 'image-generation', 'available'),
('black-forest-labs/FLUX.1-schnell', 'FLUX.1 schnell: fast 1-4 step generation', 'Diffusion', 'image-generation,fast', 'available'),
('black-forest-labs/FLUX.1-Fill-dev', 'FLUX.1 inpainting for image editing', 'Diffusion', 'image-generation,inpainting', 'available'),
('stabilityai/stable-diffusion-3.5-large', 'SD 3.5 Large with MMDiT', 'Diffusion', 'image-generation', 'available'),
('stabilityai/stable-diffusion-3.5-large-turbo', 'SD 3.5 Large Turbo fast generation', 'Diffusion', 'image-generation,fast', 'available'),
('stabilityai/stable-diffusion-3.5-medium', 'SD 3.5 Medium MMDiT-X', 'Diffusion', 'image-generation,efficient', 'available'),
('stabilityai/stable-diffusion-3-medium', 'SD 3 Medium base', 'Diffusion', 'image-generation', 'available'),
('stabilityai/stable-diffusion-xl-base-1.0', 'SDXL: 3x larger UNet, dual text encoders', 'Diffusion', 'image-generation', 'available'),
('PixArt-alpha/PixArt-XL-2-1024-MS', 'PixArt-alpha: transformer T2I, competitive with Midjourney', 'Diffusion', 'image-generation', 'available'),

-- =============================================
-- VIDEO GENERATION
-- =============================================
('tencent/HunyuanVideo', 'HunyuanVideo 13B: outperforms Runway Gen-3 and Luma 1.6', 'Diffusion', 'video-generation', 'available'),
('Wan-AI/Wan2.1-T2V-14B', 'Wan 2.1 text-to-video 14B, 480P/720P', 'Diffusion', 'video-generation', 'available'),
('Wan-AI/Wan2.1-T2V-1.3B', 'Wan 2.1 text-to-video 1.3B compact', 'Diffusion', 'video-generation,efficient', 'available'),
('THUDM/CogVideoX-5b', 'CogVideoX 5B text-to-video diffusion', 'Diffusion', 'video-generation', 'available'),
('genmo/mochi-1-preview', 'Mochi 1: 10B video model, Apache 2.0', 'Diffusion', 'video-generation', 'available'),
('Lightricks/LTX-Video', 'LTX-Video: real-time 30 FPS at 1216x704', 'Diffusion', 'video-generation,fast', 'available'),

-- =============================================
-- EMBEDDING / RETRIEVAL
-- =============================================
('intfloat/multilingual-e5-large', 'Microsoft E5 Large: multilingual embeddings', 'Dense', 'embeddings,multilingual', 'non-chat'),
('intfloat/e5-mistral-7b-instruct', 'E5-Mistral 7B: instruction-following embeddings', 'Dense', 'embeddings,instruction', 'non-chat'),
('BAAI/bge-large-en-v1.5', 'BGE Large v1.5: #1 on MTEB benchmark', 'Dense', 'embeddings,english', 'non-chat'),
('BAAI/bge-m3', 'BGE-M3: 100+ languages, 8192 tokens', 'Dense', 'embeddings,multilingual', 'non-chat'),
('BAAI/bge-small-en-v1.5', 'BGE Small: compact English embeddings', 'Dense', 'embeddings,efficient', 'non-chat'),
('thenlper/gte-large', 'Alibaba GTE Large embeddings', 'Dense', 'embeddings', 'non-chat'),
('Qwen/Qwen3-Embedding-8B', 'Qwen3 Embedding 8B', 'Dense', 'embeddings', 'non-chat'),
('nomic-ai/nomic-embed-text-v1.5', 'Nomic Embed v1.5 multimodal text', 'Dense', 'embeddings,multimodal', 'non-chat'),
('nomic-ai/nomic-embed-text-v2-moe', 'Nomic Embed v2 MoE: first MoE embedding model', 'MoE', 'embeddings,efficient', 'non-chat'),
('jinaai/jina-embeddings-v3', 'Jina Embeddings v3: task-specific adapters', 'Dense', 'embeddings,retrieval', 'non-chat'),
('sentence-transformers/all-MiniLM-L6-v2', 'All-MiniLM lightweight sentence embeddings', 'Dense', 'embeddings,efficient', 'non-chat'),

-- =============================================
-- SPEECH / AUDIO
-- =============================================
('openai/whisper-large-v3', 'Whisper Large v3: SOTA ASR, 10-20% better than v2', 'Dense', 'speech,transcription', 'non-chat'),
('openai/whisper-large-v2', 'Whisper Large v2: robust multilingual ASR', 'Dense', 'speech,transcription', 'non-chat'),
('suno/bark', 'Bark: text-to-audio with music, laughter, multilingual speech', 'Dense', 'text-to-speech,audio', 'non-chat'),
('suno/bark-small', 'Bark Small: compact text-to-audio', 'Dense', 'text-to-speech,efficient', 'non-chat'),
('facebook/musicgen-large', 'MusicGen Large: text-conditioned music generation', 'Dense', 'music-generation', 'non-chat'),
('facebook/musicgen-melody', 'MusicGen Melody: music + melody conditioning', 'Dense', 'music-generation', 'non-chat'),
('mistralai/Voxtral-4B-TTS-2603', 'Voxtral TTS: 68% win rate over ElevenLabs, 9 langs, 20 voices', 'Dense', 'text-to-speech,multilingual', 'non-chat'),
('nari-labs/Dia-1.6B', 'Dia 1.6B: ultra-realistic dialogue TTS with emotion', 'Dense', 'text-to-speech,dialogue', 'non-chat'),
('nari-labs/Dia2-2B', 'Dia2: streaming dialogue TTS', 'Dense', 'text-to-speech,streaming', 'non-chat'),
('fishaudio/fish-speech-1.5', 'Fish Speech 1.5: TTS on 1M+ hours, multi-language', 'Dense', 'text-to-speech,multilingual', 'non-chat'),
('parler-tts/parler-tts-large-v1', 'Parler-TTS: natural language voice style control', 'Dense', 'text-to-speech', 'non-chat'),

-- =============================================
-- VISION / MULTIMODAL
-- =============================================
('Qwen/Qwen2.5-VL-72B-Instruct', 'Qwen2.5 VL 72B: object detection, UI understanding', 'Dense', 'vision,multimodal,reasoning', 'available'),
('Qwen/Qwen2.5-VL-32B-Instruct', 'Qwen2.5 VL 32B: GUI agentic tasks', 'Dense', 'vision,multimodal,agentic', 'available'),
('Qwen/Qwen2.5-VL-7B-Instruct', 'Qwen2.5 VL 7B with M-ROPE encoding', 'Dense', 'vision,multimodal,efficient', 'available'),
('Qwen/Qwen3-VL-235B-A22B-Instruct', 'Qwen3 VL flagship MoE multimodal with thinking', 'MoE', 'vision,multimodal,thinking', 'available'),
('meta-llama/Llama-3.2-11B-Vision-Instruct', 'Llama 3.2 11B vision-language', 'Dense', 'vision,multimodal', 'available'),
('meta-llama/Llama-3.2-90B-Vision-Instruct', 'Llama 3.2 90B vision-language', 'Dense', 'vision,multimodal,reasoning', 'available'),
('OpenGVLab/InternVL2_5-78B', 'InternVL 2.5 78B: SOTA open multimodal', 'Dense', 'vision,multimodal,reasoning', 'available'),
('OpenGVLab/InternVL2_5-8B', 'InternVL 2.5 8B efficient multimodal', 'Dense', 'vision,multimodal,efficient', 'available'),
('mistralai/Pixtral-Large-Instruct-2411', 'Pixtral Large: Mistral vision-language', 'Dense', 'vision,multimodal,instruction', 'available'),

-- =============================================
-- OBJECT DETECTION / SEGMENTATION
-- =============================================
('facebook/detr-resnet-50', 'DETR: end-to-end object detection transformer', 'Dense', 'object-detection,vision', 'non-chat'),
('facebook/sam3', 'SAM 3: Segment Anything, 270K concepts, video tracking', 'Dense', 'segmentation,vision', 'non-chat'),
('PekingU/rtdetr_r50vd', 'RT-DETR: real-time detection, 53% AP at 114 FPS', 'Dense', 'object-detection,fast', 'non-chat'),

-- =============================================
-- TRANSLATION / NLP
-- =============================================
('facebook/nllb-200-distilled-600M', 'NLLB: No Language Left Behind, 200+ languages', 'Dense', 'translation,multilingual', 'non-chat'),
('google/flan-t5-large', 'FLAN-T5 Large: instruction-tuned for reasoning/QA', 'Dense', 'nlp,instruction', 'non-chat'),
('google/flan-t5-base', 'FLAN-T5 Base: zero/few-shot NLP tasks', 'Dense', 'nlp,instruction', 'non-chat');
