-- Seed HuggingFace models from router and inference API
INSERT OR IGNORE INTO hf_models (model_id, description, architecture, capabilities, status) VALUES
-- Qwen models
('Qwen/Qwen3-235B-A22B', 'Flagship Qwen MoE for reasoning, coding, and agentic tool use', 'MoE', 'reasoning,coding,tool-use', 'available'),
('Qwen/Qwen3-Coder-480B-A35B-Instruct', 'MoE coding agent with massive parameter count and tool use', 'MoE', 'coding,tool-use,agentic', 'available'),
('Qwen/Qwen3-Coder-30B-A3B-Instruct', 'Efficient MoE coder for fast coding and agent tasks', 'MoE', 'coding,agentic', 'available'),
('Qwen/Qwen3-VL-235B-A22B-Thinking', 'Vision-language Qwen for documents, GUI agents, and visual reasoning', 'MoE', 'vision,reasoning,documents', 'available'),
('Qwen/Qwen3-32B', 'Dense Qwen model for general reasoning and instruction following', 'Dense', 'reasoning,instruction', 'available'),
('Qwen/Qwen3-8B', 'Compact Qwen for efficient general-purpose inference', 'Dense', 'general,efficient', 'available'),
('Qwen/Qwen2.5-72B-Instruct', 'Dense instruction-tuned Qwen for broad task coverage', 'Dense', 'instruction,reasoning', 'available'),
('Qwen/Qwen2.5-Coder-32B-Instruct', 'Dense Qwen coding specialist with instruction tuning', 'Dense', 'coding,instruction', 'available'),
-- Meta Llama models
('meta-llama/Llama-4-Maverick-17B-128E-Instruct', 'Llama 4 MoE with 128 experts for diverse instruction tasks', 'MoE', 'instruction,reasoning,coding', 'available'),
('meta-llama/Llama-3.3-70B-Instruct', 'Dense Llama 3.3 for strong reasoning and code generation', 'Dense', 'reasoning,coding', 'available'),
('meta-llama/Llama-3.1-405B-Instruct', 'Largest dense Llama for maximum capability tasks', 'Dense', 'reasoning,coding,multilingual', 'available'),
('meta-llama/Llama-3.1-70B-Instruct', 'Dense Llama for balanced performance and efficiency', 'Dense', 'reasoning,coding', 'available'),
('meta-llama/Llama-3.2-90B-Vision-Instruct', 'Vision-language Llama for image understanding and reasoning', 'Dense', 'vision,reasoning,multimodal', 'available'),
('meta-llama/Llama-3.2-3B-Instruct', 'Compact Llama for edge deployment and fast inference', 'Dense', 'general,efficient', 'available'),
('meta-llama/Meta-Llama-3-8B-Instruct', 'Dense Llama 3 base for general instruction following', 'Dense', 'instruction,general', 'available'),
-- DeepSeek models
('deepseek-ai/DeepSeek-R1', 'Flagship DeepSeek reasoning model with chain-of-thought', 'MoE', 'reasoning,math,coding', 'available'),
('deepseek-ai/DeepSeek-V3', 'Dense DeepSeek for coding, math, and general reasoning', 'MoE', 'coding,math,reasoning', 'available'),
('deepseek-ai/DeepSeek-V3-0324', 'Updated DeepSeek V3 with improved coding and reasoning', 'MoE', 'coding,reasoning', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Llama-70B', 'Distilled DeepSeek R1 reasoning on Llama 70B backbone', 'Dense', 'reasoning,distilled', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Llama-8B', 'Compact distilled R1 reasoning on Llama 8B backbone', 'Dense', 'reasoning,efficient', 'available'),
('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', 'Distilled R1 reasoning on compact Qwen backbone', 'Dense', 'reasoning,efficient', 'available'),
-- Google models
('google/gemma-3-27b-it', 'Instruction-tuned Gemma 3 for strong general performance', 'Dense', 'instruction,reasoning', 'available'),
('google/gemma-2-9b-it', 'Efficient Gemma 2 for fast instruction following', 'Dense', 'instruction,efficient', 'available'),
('google/gemma-2-2b-it', 'Ultra-compact Gemma for edge and mobile deployment', 'Dense', 'efficient,edge', 'available'),
-- Mistral models
('mistralai/Mistral-Small-24B-Instruct-2501', 'Dense Mistral for efficient multilingual instruction following', 'Dense', 'multilingual,instruction', 'available'),
-- NVIDIA models
('nvidia/Llama-3_1-Nemotron-Ultra-253B-v1', 'NVIDIA-tuned Llama MoE for enterprise reasoning and agents', 'MoE', 'reasoning,enterprise,agentic', 'available'),
-- OpenAI open models
('openai/gpt-oss-120b', 'OpenAI open-source dense model for general reasoning', 'Dense', 'reasoning,general', 'available'),
('openai/whisper-large-v3', 'Speech recognition and transcription model', 'Dense', 'speech,transcription', 'available'),
-- Vision and embedding models
('black-forest-labs/FLUX.1-dev', 'High-quality text-to-image diffusion model', 'Diffusion', 'image-generation', 'available'),
('intfloat/multilingual-e5-large', 'Multilingual text embeddings for search and retrieval', 'Dense', 'embeddings,multilingual', 'available'),
('facebook/detr-resnet-50', 'Object detection transformer on ResNet-50 backbone', 'Dense', 'object-detection,vision', 'available'),
('google-bert/bert-large-uncased-whole-word-masking-finetuned-squad', 'BERT large for question answering on SQuAD', 'Dense', 'qa,nlp', 'available'),
('medicalai/ClinicalBERT', 'BERT fine-tuned on clinical notes for medical NLP', 'Dense', 'medical,nlp', 'available');

-- Seed built-in MCP tools
INSERT OR IGNORE INTO mcp_tools (name, description, input_schema) VALUES
('d1_query', 'Execute SQL query against the D1 database', '{"type":"object","properties":{"query":{"type":"string"},"params":{"type":"array"}},"required":["query"]}'),
('kv_get', 'Get a value from the KV namespace', '{"type":"object","properties":{"key":{"type":"string"}},"required":["key"]}'),
('kv_put', 'Store a value in the KV namespace', '{"type":"object","properties":{"key":{"type":"string"},"value":{"type":"string"}},"required":["key","value"]}'),
('list_workers', 'List all deployed workers', '{"type":"object","properties":{}}');

-- Seed built-in MCP resources
INSERT OR IGNORE INTO mcp_resources (uri, name, description, mime_type) VALUES
('d1://users', 'Users', 'All registered users', 'application/json'),
('d1://workers', 'Workers', 'All deployed workers', 'application/json'),
('d1://hf_models', 'HF Models', 'Available HuggingFace models', 'application/json'),
('d1://agent_sessions', 'Sessions', 'Agent sessions', 'application/json'),
('kv://config', 'Platform Config', 'Platform configuration', 'application/json');
