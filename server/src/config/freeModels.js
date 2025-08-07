// Free models available on OpenRouter (as of 2024)
// These models don't require payment but may have rate limits

export const FREE_MODELS = {
  // DeepSeek Models (Recommended for coding and reasoning)
  DEEPSEEK_R1: 'deepseek/deepseek-r1:free',
  DEEPSEEK_V3: 'deepseek/deepseek-v3:free', 
  DEEPSEEK_R1_DISTILL_QWEN_14B: 'deepseek/deepseek-r1-distill-qwen-14b:free',
  DEEPSEEK_R1_DISTILL_LLAMA_70B: 'deepseek/deepseek-r1-distill-llama-70b:free',
  DEEPSEEK_R1_QWEN3_8B: 'deepseek/deepseek-r1-0528-qwen3-8b:free',

  // Qwen Models (Good for general tasks)
  QWEN3_14B: 'qwen/qwen3-14b:free',
  QWEN3_3_5B: 'qwen/qwen3-3.5b:free',
  QWEN3_235B: 'qwen/qwen3-235b-a22b-07-25:free',

  // Other free models
  // Add more as they become available
};

// Default model recommendation
export const RECOMMENDED_FREE_MODEL = FREE_MODELS.DEEPSEEK_R1;

// Model descriptions and use cases
export const MODEL_INFO = {
  [FREE_MODELS.DEEPSEEK_R1]: {
    name: 'DeepSeek R1',
    description: 'Excellent for coding, reasoning, and educational content',
    strengths: ['Code generation', 'Problem solving', 'Educational explanations'],
    limitations: ['Rate limited to ~50 requests/day']
  },
  [FREE_MODELS.DEEPSEEK_V3]: {
    name: 'DeepSeek V3',
    description: 'General purpose model with good performance',
    strengths: ['General conversation', 'Content generation', 'Analysis'],
    limitations: ['Rate limited']
  },
  [FREE_MODELS.QWEN3_14B]: {
    name: 'Qwen3 14B',
    description: 'Balanced model for various tasks',
    strengths: ['Multilingual support', 'General tasks', 'Reasoning'],
    limitations: ['Rate limited']
  },
  [FREE_MODELS.QWEN3_3_5B]: {
    name: 'Qwen3 3.5B',
    description: 'Smaller, faster model for simple tasks',
    strengths: ['Fast responses', 'Simple queries', 'Low resource usage'],
    limitations: ['Less capable than larger models', 'Rate limited']
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