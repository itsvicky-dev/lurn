// Free models available on OpenRouter (as of 2024)
// These models don't require payment but may have rate limits

export const FREE_MODELS = {
  // Latest and most reliable models (verified working as of Jan 2025)
  
  // OpenAI Models
  OPENAI_GPT_OSS_20B: 'openai/gpt-oss-20b:free', // Latest OpenAI free model
  
  // Z.AI Models (corrected ID)
  GLM_4_5_AIR: 'z-ai/glm-4.5-air:free', // Note: hyphen, not dot
  
  // Qwen Models (verified working)
  QWEN3_CODER: 'qwen/qwen3-coder:free', // Specialized for coding
  QWEN3_14B: 'qwen/qwen3-14b:free',
  QWEN3_8B: 'qwen/qwen3-8b:free', // Newer 8B model
  QWEN3_4B: 'qwen/qwen3-4b:free',
  QWEN3_30B_A3B: 'qwen/qwen3-30b-a3b:free', // Larger model
  QWEN3_235B_A22B: 'qwen/qwen3-235b-a22b:free', // Corrected ID
  
  // Mistral Models
  MISTRAL_SMALL_3_2: 'mistralai/mistral-small-3.2-24b-instruct:free',
  MISTRAL_SMALL_3_1: 'mistralai/mistral-small-3.1-24b-instruct:free',
  MISTRAL_SMALL_3: 'mistralai/mistral-small-24b-instruct-2501:free',
  
  // Google Models
  GEMINI_2_5_PRO_EXP: 'google/gemini-2.5-pro-exp-03-25', // No :free suffix
  GEMINI_2_0_FLASH_EXP: 'google/gemini-2.0-flash-exp:free',
  GEMMA_3_27B: 'google/gemma-3-27b-it:free',
  GEMMA_3_12B: 'google/gemma-3-12b-it:free',
  GEMMA_3_4B: 'google/gemma-3-4b-it:free',
  
  // DeepSeek Models
  DEEPSEEK_R1: 'deepseek/deepseek-r1:free',
  DEEPSEEK_R1_0528: 'deepseek/deepseek-r1-0528:free', // Newer version
  DEEPSEEK_V3: 'deepseek/deepseek-chat-v3-0324:free',
  DEEPSEEK_R1_DISTILL_QWEN_14B: 'deepseek/deepseek-r1-distill-qwen-14b:free',
  DEEPSEEK_R1_DISTILL_LLAMA_70B: 'deepseek/deepseek-r1-distill-llama-70b:free',
  
  // Meta Models
  LLAMA_3_3_70B: 'meta-llama/llama-3.3-70b-instruct:free',
  LLAMA_3_1_405B: 'meta-llama/llama-3.1-405b-instruct:free', // Huge model
  LLAMA_3_2_11B_VISION: 'meta-llama/llama-3.2-11b-vision-instruct:free',
  LLAMA_3_2_3B: 'meta-llama/llama-3.2-3b-instruct:free',
  
  // Specialized Models
  KIMI_K2: 'moonshotai/kimi-k2:free', // MoonshotAI
  KIMI_DEV_72B: 'moonshotai/kimi-dev-72b:free',
  NVIDIA_NEMOTRON_ULTRA: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
  REKA_FLASH_3: 'rekaai/reka-flash-3:free',
  
  // Other reliable models
  HUNYUAN_A13B: 'tencent/hunyuan-a13b-instruct:free',
  SARVAM_M: 'sarvamai/sarvam-m:free',
};

// Default model recommendation - using Qwen for better JSON generation
export const RECOMMENDED_FREE_MODEL = FREE_MODELS.QWEN3_14B;

// Model descriptions and use cases (Updated Jan 2025)
export const MODEL_INFO = {
  // OpenAI Models
  [FREE_MODELS.OPENAI_GPT_OSS_20B]: {
    name: 'OpenAI GPT OSS 20B',
    description: 'Latest OpenAI free model with excellent performance',
    strengths: ['High-quality responses', 'General conversation', 'Content generation'],
    limitations: ['Rate limited']
  },
  
  // Z.AI Models
  [FREE_MODELS.GLM_4_5_AIR]: {
    name: 'GLM 4.5 Air',
    description: 'Z.AI\'s efficient model for general tasks',
    strengths: ['Fast responses', 'General conversation', 'Balanced performance'],
    limitations: ['Rate limited']
  },
  
  // Mistral Models
  [FREE_MODELS.MISTRAL_SMALL_3_2]: {
    name: 'Mistral Small 3.2 24B',
    description: 'Latest Mistral model with strong performance',
    strengths: ['Reasoning', 'Code generation', 'Multilingual support'],
    limitations: ['Rate limited']
  },
  
  // Qwen Models
  [FREE_MODELS.QWEN3_CODER]: {
    name: 'Qwen3 Coder',
    description: 'Specialized model for coding tasks',
    strengths: ['Code generation', 'Code explanation', 'Programming help'],
    limitations: ['Rate limited', 'Focused on coding']
  },
  [FREE_MODELS.QWEN3_14B]: {
    name: 'Qwen3 14B',
    description: 'Balanced model for various tasks',
    strengths: ['Multilingual support', 'General tasks', 'Reasoning'],
    limitations: ['Rate limited']
  },
  [FREE_MODELS.QWEN3_8B]: {
    name: 'Qwen3 8B',
    description: 'Newer 8B model with good performance',
    strengths: ['Fast responses', 'General tasks', 'Efficient'],
    limitations: ['Rate limited']
  },
  [FREE_MODELS.QWEN3_4B]: {
    name: 'Qwen3 4B',
    description: 'Smaller, faster model for simple tasks',
    strengths: ['Fast responses', 'Simple queries', 'Low resource usage'],
    limitations: ['Less capable than larger models', 'Rate limited']
  },
  
  // Google Models
  [FREE_MODELS.GEMMA_3_12B]: {
    name: 'Google Gemma 3 12B',
    description: 'Google\'s latest Gemma model',
    strengths: ['High quality', 'General conversation', 'Reasoning'],
    limitations: ['Rate limited']
  },
  
  // MoonshotAI Models
  [FREE_MODELS.KIMI_K2]: {
    name: 'Kimi K2',
    description: 'MoonshotAI\'s efficient model',
    strengths: ['Fast responses', 'General tasks', 'Good performance'],
    limitations: ['Rate limited']
  },
  
  // Meta Models
  [FREE_MODELS.LLAMA_3_2_3B]: {
    name: 'Llama 3.2 3B',
    description: 'Fast and efficient Meta model',
    strengths: ['Very fast', 'Low resource usage', 'Good for simple tasks'],
    limitations: ['Smaller model', 'Rate limited']
  },
  
  // Reka Models
  [FREE_MODELS.REKA_FLASH_3]: {
    name: 'Reka Flash 3',
    description: 'Reka\'s fast and efficient model',
    strengths: ['Fast responses', 'General conversation', 'Good performance'],
    limitations: ['Rate limited']
  },
  
  // Tencent Models
  [FREE_MODELS.HUNYUAN_A13B]: {
    name: 'Hunyuan A13B',
    description: 'Tencent\'s multilingual model',
    strengths: ['Multilingual support', 'General tasks', 'Good performance'],
    limitations: ['Rate limited']
  },
  
  // DeepSeek Models (fallback)
  [FREE_MODELS.DEEPSEEK_V3]: {
    name: 'DeepSeek V3 0324',
    description: 'General purpose model with good performance',
    strengths: ['General conversation', 'Content generation', 'Analysis'],
    limitations: ['Rate limited']
  },
  [FREE_MODELS.DEEPSEEK_R1]: {
    name: 'DeepSeek R1',
    description: 'Excellent for coding, reasoning, and educational content',
    strengths: ['Code generation', 'Problem solving', 'Educational explanations'],
    limitations: ['Rate limited to ~50 requests/day']
  }
};

// Function to get a random free model (for load balancing)
export const getRandomFreeModel = () => {
  const models = Object.values(FREE_MODELS);
  return models[Math.floor(Math.random() * models.length)];
};

// Function to get model info
export const getModelInfo = (modelName) => {
  return MODEL_INFO[modelName] || { 
    name: modelName, 
    description: 'Free model', 
    strengths: [], 
    limitations: ['Rate limited'] 
  };
};