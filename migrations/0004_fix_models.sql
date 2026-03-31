-- Remove models that are not supported by HF Inference Providers
DELETE FROM hf_models WHERE model_id IN (
  'nvidia/Llama-3_1-Nemotron-Ultra-253B-v1',
  'meta-llama/Llama-4-Maverick-17B-128E-Instruct',
  'meta-llama/Llama-3.1-405B-Instruct',
  'Qwen/Qwen3-Coder-480B-A35B-Instruct',
  'Qwen/Qwen3-VL-235B-A22B-Thinking',
  'meta-llama/Llama-3.2-90B-Vision-Instruct',
  'openai/gpt-oss-120b'
);

-- Mark non-chat models so they're still in DB but not shown in chat
UPDATE hf_models SET status = 'non-chat' WHERE model_id IN (
  'black-forest-labs/FLUX.1-dev',
  'intfloat/multilingual-e5-large',
  'facebook/detr-resnet-50',
  'google-bert/bert-large-uncased-whole-word-masking-finetuned-squad',
  'medicalai/ClinicalBERT',
  'openai/whisper-large-v3'
);

-- Add newer verified models
INSERT OR IGNORE INTO hf_models (model_id, description, architecture, capabilities, status) VALUES
-- Latest DeepSeek
('deepseek-ai/DeepSeek-V3.2', 'Latest DeepSeek generation with improved reasoning', 'MoE', 'reasoning,coding,math', 'available'),
-- Newer Qwen variants
('Qwen/Qwen3-235B-A22B-Instruct-2507', 'Newer instruct-tuned Qwen3 flagship (July 2025)', 'MoE', 'reasoning,coding,instruction', 'available'),
('Qwen/Qwen3.5-35B-A3B', 'Compact efficient Qwen 3.5 MoE for fast inference', 'MoE', 'reasoning,efficient', 'available'),
-- Cohere vision
('CohereLabs/aya-vision-32b', 'Multilingual vision-language model from Cohere', 'Dense', 'vision,multilingual', 'available'),
-- Microsoft Phi
('microsoft/Phi-4-mini-instruct', 'Compact Microsoft Phi-4 for efficient chat', 'Dense', 'instruction,efficient', 'available'),
('microsoft/Phi-3.5-mini-instruct', 'Small Phi model for fast local and cloud inference', 'Dense', 'instruction,efficient', 'available'),
-- Mistral latest
('mistralai/Mistral-Nemo-Instruct-2407', 'Mistral Nemo 12B for fast multilingual chat', 'Dense', 'multilingual,instruction', 'available'),
('mistralai/Mixtral-8x7B-Instruct-v0.1', 'Mistral MoE with 8 experts for diverse tasks', 'MoE', 'instruction,reasoning', 'available');
