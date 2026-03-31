-- Migration 0005: Comprehensive model update - March 2026
-- Remove all old models and re-seed with verified latest models

DELETE FROM hf_models;

INSERT INTO hf_models (model_id, description, architecture, capabilities, status) VALUES

-- === QWEN 3.5 (February 2026) - DEFAULT TIER ===
('Qwen/Qwen3.5-397B-A17B', 'Flagship Qwen 3.5 MoE (Qwen3.5-Plus), 397B total / 17B active, 262K context', 'MoE', 'reasoning,coding,agentic,multimodal', 'available'),
('Qwen/Qwen3.5-122B-A10B', 'Qwen 3.5 MoE, 122B total / 10B active, thinking mode', 'MoE', 'reasoning,coding,thinking', 'available'),
('Qwen/Qwen3.5-35B-A3B', 'Qwen 3.5 Flash MoE, 35B total / 3B active, fast inference', 'MoE', 'reasoning,efficient,fast', 'available'),
('Qwen/Qwen3.5-27B', 'Dense Qwen 3.5 for strong general performance', 'Dense', 'reasoning,instruction', 'available'),
('Qwen/Qwen3.5-9B', 'Compact Qwen 3.5 dense model', 'Dense', 'general,efficient', 'available'),
('Qwen/Qwen3.5-4B', 'Small Qwen 3.5 for fast lightweight tasks', 'Dense', 'efficient,fast', 'available'),
('Qwen/Qwen3.5-2B', 'Tiny Qwen 3.5 for edge/mobile', 'Dense', 'efficient,edge', 'available'),

-- === QWEN 3 (still available) ===
('Qwen/Qwen3-235B-A22B', 'Qwen 3 flagship MoE for reasoning and coding', 'MoE', 'reasoning,coding,tool-use', 'available'),
('Qwen/Qwen3-32B', 'Dense Qwen 3 for general reasoning', 'Dense', 'reasoning,instruction', 'available'),
('Qwen/Qwen3-8B', 'Compact Qwen 3', 'Dense', 'general,efficient', 'available'),
('Qwen/Qwen3-Coder-30B-A3B-Instruct', 'Qwen 3 MoE coding specialist', 'MoE', 'coding,agentic', 'available'),

-- === DEEPSEEK (Latest) ===
('deepseek-ai/DeepSeek-V3.2', 'Latest DeepSeek, comparable to GPT-5', 'MoE', 'reasoning,coding,math', 'available'),
('deepseek-ai/DeepSeek-V3.2-Speciale', 'DeepSeek deep reasoning, surpasses GPT-5', 'MoE', 'reasoning,math,thinking', 'available'),
('deepseek-ai/DeepSeek-V3.1', 'Hybrid thinking/non-thinking DeepSeek', 'MoE', 'reasoning,coding', 'available'),
('deepseek-ai/DeepSeek-R1', 'DeepSeek reasoning with chain-of-thought', 'MoE', 'reasoning,math,coding', 'available'),
('deepseek-ai/DeepSeek-V3-0324', 'DeepSeek V3 March 2024 release', 'MoE', 'coding,reasoning', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Llama-70B', 'Distilled R1 reasoning on Llama 70B', 'Dense', 'reasoning,distilled', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', 'Distilled R1 on compact Qwen', 'Dense', 'reasoning,efficient', 'available'),

-- === META LLAMA 4 ===
('meta-llama/Llama-4-Scout-17B-16E-Instruct', 'Llama 4 Scout MoE, 16 experts, 10M context', 'MoE', 'reasoning,multimodal,long-context', 'available'),

-- === META LLAMA 3.x ===
('meta-llama/Llama-3.3-70B-Instruct', 'Dense Llama 3.3 for reasoning and code', 'Dense', 'reasoning,coding', 'available'),
('meta-llama/Llama-3.1-70B-Instruct', 'Dense Llama 3.1 balanced performance', 'Dense', 'reasoning,coding', 'available'),
('meta-llama/Llama-3.2-3B-Instruct', 'Compact Llama for fast inference', 'Dense', 'general,efficient', 'available'),
('meta-llama/Meta-Llama-3-8B-Instruct', 'Llama 3 base instruction model', 'Dense', 'instruction,general', 'available'),

-- === MISTRAL (Latest) ===
('mistralai/Mistral-Small-4-119B-2603', 'Mistral Small 4, March 2026, multimodal agentic', 'MoE', 'reasoning,agentic,multimodal', 'available'),
('mistralai/Mistral-Large-3-675B-Instruct-2512', 'Mistral Large 3, 675B MoE, 256K context', 'MoE', 'reasoning,coding,multilingual', 'available'),
('mistralai/Mixtral-8x7B-Instruct-v0.1', 'Mistral MoE 8 experts', 'MoE', 'instruction,reasoning', 'available'),
('mistralai/Mistral-Small-24B-Instruct-2501', 'Dense Mistral for efficient multilingual chat', 'Dense', 'multilingual,instruction', 'available'),

-- === MOONSHOT KIMI ===
('moonshotai/Kimi-K2.5', 'Kimi K2.5 multimodal agentic, Agent Swarm', 'MoE', 'agentic,multimodal,reasoning', 'available'),
('moonshotai/Kimi-K2-Instruct', 'Kimi K2, 1T params / 32B active, general chat', 'MoE', 'reasoning,instruction,coding', 'available'),
('moonshotai/Kimi-K2-Thinking', 'Kimi K2 with native thinking, 256K context', 'MoE', 'reasoning,thinking,math', 'available'),

-- === GOOGLE GEMMA ===
('google/gemma-3-27b-it', 'Gemma 3 27B instruction-tuned', 'Dense', 'instruction,reasoning', 'available'),
('google/gemma-3-12b-it', 'Gemma 3 12B instruction-tuned', 'Dense', 'instruction,efficient', 'available'),
('google/gemma-3-4b-it', 'Gemma 3 4B compact', 'Dense', 'efficient,fast', 'available'),
('google/gemma-3-1b-it', 'Gemma 3 1B ultra-compact', 'Dense', 'efficient,edge', 'available'),

-- === MICROSOFT PHI ===
('microsoft/Phi-4-mini-instruct', 'Microsoft Phi-4 compact chat model', 'Dense', 'instruction,efficient', 'available'),
('microsoft/Phi-3.5-mini-instruct', 'Microsoft Phi-3.5 small model', 'Dense', 'instruction,efficient', 'available'),

-- === COHERE ===
('CohereLabs/aya-vision-32b', 'Multilingual vision-language model', 'Dense', 'vision,multilingual', 'available'),

-- === IMAGE GENERATION ===
('black-forest-labs/FLUX.2-dev', 'FLUX.2 32B params, state-of-the-art text-to-image and editing', 'Diffusion', 'image-generation,editing', 'available'),
('black-forest-labs/FLUX.1-dev', 'FLUX.1 12B text-to-image', 'Diffusion', 'image-generation', 'available'),
('black-forest-labs/FLUX.1-schnell', 'FLUX.1 fast variant for quick generation', 'Diffusion', 'image-generation,fast', 'available'),
('stabilityai/stable-diffusion-3.5-large', 'Stable Diffusion 3.5 Large', 'Diffusion', 'image-generation', 'available'),
('stabilityai/stable-diffusion-3.5-large-turbo', 'SD 3.5 Large Turbo, 4-step fast generation', 'Diffusion', 'image-generation,fast', 'available'),
('stabilityai/stable-diffusion-3.5-medium', 'Stable Diffusion 3.5 Medium', 'Diffusion', 'image-generation,efficient', 'available'),

-- === SPEECH ===
('mistralai/Voxtral-4B-TTS-2603', 'Mistral TTS, 9 languages, 20 voices', 'Dense', 'text-to-speech,multilingual', 'available');
