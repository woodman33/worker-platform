-- Migration 0007: Replace with verified working models only
-- Only models confirmed available on HF Inference Providers
DELETE FROM hf_models;

INSERT INTO hf_models (model_id, description, architecture, capabilities, status) VALUES

-- =============================================
-- CHAT / REASONING (verified on HF Inference Providers)
-- =============================================

-- Qwen (use -Instruct variants for proper chat)
('Qwen/Qwen3-235B-A22B-Instruct', 'Qwen3 flagship MoE 235B/22B active, tool use, Apache 2.0', 'MoE', 'reasoning,coding,tool-use,agentic', 'available'),
('Qwen/Qwen3-30B-A3B-Instruct', 'Qwen3 efficient MoE 30B/3B active', 'MoE', 'reasoning,efficient', 'available'),
('Qwen/Qwen3-32B', 'Dense Qwen3 32B reasoning', 'Dense', 'reasoning,instruction', 'available'),
('Qwen/Qwen3-8B', 'Dense Qwen3 8B efficient', 'Dense', 'general,efficient', 'available'),
('Qwen/Qwen3-4B', 'Dense Qwen3 4B compact', 'Dense', 'efficient,fast', 'available'),
('Qwen/Qwen2.5-72B-Instruct', 'Qwen 2.5 72B instruction-tuned, strong multilingual', 'Dense', 'reasoning,multilingual', 'available'),
('Qwen/Qwen2.5-32B-Instruct', 'Qwen 2.5 32B instruction-tuned', 'Dense', 'reasoning,instruction', 'available'),
('Qwen/Qwen2.5-7B-Instruct', 'Qwen 2.5 7B efficient', 'Dense', 'instruction,efficient', 'available'),
('Qwen/Qwen2.5-3B-Instruct', 'Qwen 2.5 3B compact', 'Dense', 'instruction,efficient', 'available'),

-- DeepSeek
('deepseek-ai/DeepSeek-R1', 'DeepSeek 685B reasoning, competitive with o1', 'MoE', 'reasoning,math,coding', 'available'),
('deepseek-ai/DeepSeek-V3-0324', 'DeepSeek V3 March 2024 refresh, strong general', 'MoE', 'coding,math,reasoning', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', '32B distilled reasoning', 'Dense', 'reasoning,distilled', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Llama-70B', '70B distilled reasoning on Llama', 'Dense', 'reasoning,distilled', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', '7B distilled reasoning compact', 'Dense', 'reasoning,efficient', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Llama-8B', '8B distilled reasoning on Llama', 'Dense', 'reasoning,efficient', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B', '1.5B ultra-compact distilled reasoning', 'Dense', 'reasoning,edge', 'available'),

-- Meta Llama
('meta-llama/Llama-3.3-70B-Instruct', 'Llama 3.3 70B instruction-tuned', 'Dense', 'reasoning,coding', 'available'),
('meta-llama/Llama-3.1-70B-Instruct', 'Llama 3.1 70B, 128K context', 'Dense', 'reasoning,coding', 'available'),
('meta-llama/Llama-3.1-8B-Instruct', 'Llama 3.1 8B efficient, 128K context', 'Dense', 'instruction,efficient', 'available'),
('meta-llama/Llama-3.2-3B-Instruct', 'Compact Llama for fast inference', 'Dense', 'general,efficient', 'available'),
('meta-llama/Llama-3.2-11B-Vision-Instruct', 'Llama 3.2 11B vision-language', 'Dense', 'vision,multimodal', 'available'),
('meta-llama/Llama-3.2-90B-Vision-Instruct', 'Llama 3.2 90B vision-language', 'Dense', 'vision,multimodal,reasoning', 'available'),
('meta-llama/Llama-4-Scout-17B-16E-Instruct', 'Llama 4 Scout: MoE, 10M context, multimodal', 'MoE', 'reasoning,multimodal,long-context', 'available'),

-- Mistral
('mistralai/Mistral-Small-24B-Instruct-2501', 'Mistral Small 24B multilingual', 'Dense', 'multilingual,instruction', 'available'),
('mistralai/Mistral-7B-Instruct-v0.3', 'Mistral 7B v0.3 with 32K vocab', 'Dense', 'instruction,efficient', 'available'),
('mistralai/Mixtral-8x7B-Instruct-v0.1', 'Mistral MoE 8x7B', 'MoE', 'instruction,reasoning', 'available'),

-- Google Gemma
('google/gemma-2-27b-it', 'Gemma 2 27B instruction-tuned', 'Dense', 'instruction,reasoning', 'available'),
('google/gemma-2-9b-it', 'Gemma 2 9B efficient', 'Dense', 'instruction,efficient', 'available'),
('google/gemma-2-2b-it', 'Gemma 2 2B ultra-compact', 'Dense', 'efficient,edge', 'available'),

-- Microsoft Phi
('microsoft/phi-4', 'Microsoft Phi-4 14B reasoning', 'Dense', 'reasoning,instruction', 'available'),
('microsoft/Phi-3.5-mini-instruct', 'Phi-3.5 mini 128K context', 'Dense', 'instruction,efficient', 'available'),

-- Moonshot Kimi (user confirmed working)
('moonshotai/Kimi-K2-Instruct', 'Kimi K2: 1T params/32B active, general chat', 'MoE', 'reasoning,instruction,coding', 'available'),

-- Cohere
('CohereForAI/c4ai-command-r-plus', 'Cohere Command R+ 104B with RAG and tool use', 'Dense', 'reasoning,tool-use,rag', 'available'),

-- OpenAI open-source
('openai/gpt-oss-120b', 'OpenAI GPT-OSS 120B with tool calling', 'Dense', 'reasoning,agentic,tool-use', 'available'),
('openai/gpt-oss-20b', 'OpenAI GPT-OSS 20B compact', 'Dense', 'reasoning,efficient', 'available'),

-- NVIDIA
('nvidia/Llama-3.1-Nemotron-70B-Instruct-HF', 'Nemotron 70B: reward-tuned Llama for helpfulness', 'Dense', 'reasoning,instruction', 'available'),

-- Zhipu
('zai-org/GLM-4.5V', 'Zhipu GLM-4.5V reasoning vision model', 'Dense', 'reasoning,vision', 'available'),

-- =============================================
-- CODE MODELS (chat-compatible)
-- =============================================
('Qwen/Qwen2.5-Coder-32B-Instruct', 'Qwen 2.5 Coder 32B, strong code generation', 'Dense', 'coding,instruction', 'available'),
('deepseek-ai/DeepSeek-Coder-V2-Instruct', 'DeepSeek Coder V2 MoE, 128K context', 'MoE', 'coding,multilingual', 'available'),

-- =============================================
-- VISION / MULTIMODAL (chat-compatible)
-- =============================================
('Qwen/Qwen2.5-VL-72B-Instruct', 'Qwen2.5 VL 72B: object detection, UI understanding', 'Dense', 'vision,multimodal,reasoning', 'available'),
('Qwen/Qwen2.5-VL-7B-Instruct', 'Qwen2.5 VL 7B with M-ROPE encoding', 'Dense', 'vision,multimodal,efficient', 'available'),
('mistralai/Pixtral-12B-2409', 'Pixtral 12B: Mistral vision-language', 'Dense', 'vision,multimodal,instruction', 'available'),

-- =============================================
-- IMAGE GENERATION (via /v1/images/generations)
-- =============================================
('black-forest-labs/FLUX.1-dev', 'FLUX.1 dev: state-of-the-art diffusion transformer', 'Diffusion', 'image-generation', 'available'),
('black-forest-labs/FLUX.1-schnell', 'FLUX.1 schnell: fast 1-4 step generation', 'Diffusion', 'image-generation,fast', 'available'),
('stabilityai/stable-diffusion-3.5-large', 'SD 3.5 Large with MMDiT', 'Diffusion', 'image-generation', 'available'),
('stabilityai/stable-diffusion-3.5-large-turbo', 'SD 3.5 Large Turbo fast generation', 'Diffusion', 'image-generation,fast', 'available'),
('stabilityai/stable-diffusion-3.5-medium', 'SD 3.5 Medium MMDiT-X', 'Diffusion', 'image-generation,efficient', 'available'),

-- =============================================
-- EMBEDDINGS (via /v1/embeddings - non-chat)
-- =============================================
('BAAI/bge-large-en-v1.5', 'BGE Large v1.5: top English embeddings', 'Dense', 'embeddings,english', 'non-chat'),
('BAAI/bge-small-en-v1.5', 'BGE Small: compact English embeddings', 'Dense', 'embeddings,efficient', 'non-chat'),
('sentence-transformers/all-MiniLM-L6-v2', 'All-MiniLM lightweight sentence embeddings', 'Dense', 'embeddings,efficient', 'non-chat'),

-- =============================================
-- SPEECH (non-chat)
-- =============================================
('openai/whisper-large-v3', 'Whisper Large v3: SOTA speech recognition', 'Dense', 'speech,transcription', 'non-chat');
