import dotenv from 'dotenv';
import axios from 'axios';
import { FREE_MODELS, RECOMMENDED_FREE_MODEL, getRandomFreeModel, getModelInfo } from '../config/freeModels.js';
import mediaService from './mediaService.js';
import contentFilterService from './contentFilterService.js';
import apiKeyManager from './apiKeyManager.js';

// Load environment variables
dotenv.config();

class AIService {
  // Helper function to clean JSON content and remove comments
  cleanJsonContent(content) {
    try {
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid content provided to cleanJsonContent');
      }
      
      let cleaned = content.trim();
      
      // Remove markdown code blocks
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Split into lines for more precise comment removal
      const lines = cleaned.split('\n');
      const cleanedLines = lines.map(line => {
        try {
          // Remove single-line comments, but preserve URLs (http://, https://)
          // Look for // that's not preceded by : (to avoid breaking URLs)
          return line.replace(/(?<!:)\/\/(?!\/)[^\n\r]*$/, '').trim();
        } catch (regexError) {
          // Fallback: simple comment removal if regex fails
          const commentIndex = line.indexOf('//');
          if (commentIndex > 0 && line[commentIndex - 1] !== ':') {
            return line.substring(0, commentIndex).trim();
          }
          return line.trim();
        }
      }).filter(line => line.length > 0); // Remove empty lines
      
      cleaned = cleanedLines.join('\n');
      
      // Remove multi-line comments (/* comment */)
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Clean up trailing commas before closing brackets/braces
      cleaned = cleaned.replace(/,(\s*[\n\r]*\s*[}\]])/g, '$1');
      
      // Normalize whitespace but preserve JSON structure
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      return cleaned;
    } catch (error) {
      console.error('Error in cleanJsonContent:', error.message);
      // Return the original content if cleaning fails
      return content ? content.trim() : '';
    }
  }

  constructor() {
    // Use API Key Manager for multiple key rotation
    this.apiKeyManager = apiKeyManager;
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    // Enhanced model rotation strategy with verified available models (Jan 2025)
    this.modelPool = [
      { model: FREE_MODELS.OPENAI_GPT_OSS_20B, priority: 1, successRate: 1.0 },    // Latest OpenAI free model
      { model: FREE_MODELS.GLM_4_5_AIR, priority: 2, successRate: 1.0 },           // Z.AI efficient model (corrected ID)
      { model: FREE_MODELS.MISTRAL_SMALL_3_2, priority: 3, successRate: 1.0 },     // Latest Mistral
      { model: FREE_MODELS.QWEN3_CODER, priority: 4, successRate: 1.0 },           // Great for coding tasks
      { model: FREE_MODELS.GEMMA_3_12B, priority: 5, successRate: 1.0 },           // Google Gemma 3
      { model: FREE_MODELS.KIMI_K2, priority: 6, successRate: 1.0 },               // MoonshotAI
      { model: FREE_MODELS.QWEN3_8B, priority: 7, successRate: 1.0 },              // Newer Qwen 8B
      { model: FREE_MODELS.LLAMA_3_2_3B, priority: 8, successRate: 1.0 },          // Fast Meta model
      { model: FREE_MODELS.REKA_FLASH_3, priority: 9, successRate: 1.0 },          // Reka model
      { model: FREE_MODELS.HUNYUAN_A13B, priority: 10, successRate: 1.0 },         // Tencent model
      { model: FREE_MODELS.QWEN3_14B, priority: 11, successRate: 1.0 },            // Fallback to older Qwen
      { model: FREE_MODELS.DEEPSEEK_V3, priority: 12, successRate: 1.0 }           // DeepSeek as last resort
    ];
    
    // Use environment model as preferred, but not exclusive
    this.preferredModel = process.env.OPENROUTER_MODEL || RECOMMENDED_FREE_MODEL;
    
    // Initialize backward compatibility properties
    this.defaultModel = this.preferredModel;
    this.fallbackModels = this.modelPool.map(m => m.model).filter(m => m !== this.defaultModel);
    
    // Enhanced rate limit tracking with different timeouts per model
    this.rateLimitedModels = new Map(); // Track which models are rate limited and when
    this.modelStats = new Map(); // Track success/failure rates
    this.lastUsedModel = null;
    this.modelRotationIndex = 0;
    
    // Get current API key from manager
    this.currentApiKey = this.apiKeyManager.getCurrentKey();
    
    // Validate API key
    if (!this.currentApiKey) {
      console.error('No API keys configured in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('OPENROUTER')));
      throw new Error('AI service not configured: No API keys available');
    }
    
    console.log('AI Service initialized with API key manager');
    console.log('Current API key:', this.apiKeyManager.getKeyId(this.currentApiKey));
    console.log('Total API keys available:', this.apiKeyManager.apiKeys.length);
    
    // Initialize HTTP client (will be updated dynamically)
    this.updateHttpClient();
    
    // Check API key status on initialization
    this.checkApiKeyStatus();
  }

  /**
   * Update HTTP client with current API key
   */
  updateHttpClient() {
    this.currentApiKey = this.apiKeyManager.getCurrentKey();
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, // 5 minutes timeout for AI content generation
      headers: {
        'Authorization': `Bearer ${this.currentApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Tutor'
      }
    });
  }

  async checkApiKeyStatus() {
    try {
      const response = await this.client.get('/auth/key');
      console.log('🔑 API Key Status:', {
        label: response.data.data?.label,
        usage: response.data.data?.usage,
        limit: response.data.data?.limit,
        is_free_tier: response.data.data?.is_free_tier,
        rate_limit: response.data.data?.rate_limit
      });
    } catch (error) {
      console.error('❌ Failed to check API key status:', error.response?.data || error.message);
    }
  }



  async generateCompletion(messages, options = {}) {
    // Validate inputs
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required and cannot be empty');
    }

    // Use smart model selection instead of fixed model
    const modelToUse = options.model || this.selectBestAvailableModel();
    
    try {
      const result = await this._attemptCompletion(messages, modelToUse, options);
      this.recordModelSuccess(modelToUse);
      return result;
    } catch (error) {
      this.recordModelFailure(modelToUse, error);
      
      // If rate limited, model unavailable, or invalid model ID, try other models
      if (error.response?.status === 429 || error.response?.status === 503 || error.response?.status === 400) {
        console.log(`Model ${modelToUse} failed (${error.response?.status}), trying alternative models...`);
        
        const alternativeModels = this.getAlternativeModels(modelToUse);
        
        for (const alternativeModel of alternativeModels) {
          // Skip models that are known to be rate limited
          if (this.isModelRateLimited(alternativeModel)) {
            console.log(`Skipping ${alternativeModel} - recently rate limited`);
            continue;
          }
          
          try {
            console.log(`Trying alternative model: ${alternativeModel}`);
            const result = await this._attemptCompletion(messages, alternativeModel, options);
            this.recordModelSuccess(alternativeModel);
            return result;
          } catch (fallbackError) {
            this.recordModelFailure(alternativeModel, fallbackError);
            console.log(`Alternative model ${alternativeModel} also failed:`, fallbackError.message);
            continue;
          }
        }
        
        // Provide detailed guidance for rate limit issues
        const availableModels = this.getAvailableModels();
        const rateLimitedModels = Array.from(this.rateLimitedModels.keys());
        
        const rateLimitMessage = `All free models are currently rate limited or unavailable. This is common with free models during peak usage.

Possible solutions:
1. Wait a few minutes and try again (rate limits reset periodically)
2. Try again during off-peak hours (early morning or late evening)
3. Add credits to your OpenRouter account for more reliable access
4. Use a different OpenRouter API key if you have one

Models attempted: ${[modelToUse, ...alternativeModels].join(', ')}
Currently rate limited: ${rateLimitedModels.length > 0 ? rateLimitedModels.join(', ') : 'None tracked'}
Available models: ${availableModels.length > 0 ? availableModels.join(', ') : 'None currently available'}

The system will automatically retry with different models as they become available.`;
        
        throw new Error(rateLimitMessage);
      }
      
      throw error;
    }
  }

  async _attemptCompletion(messages, model, options = {}) {
    try {
      console.log('Sending request to OpenRouter with model:', model);
      const modelInfo = getModelInfo(model);
      console.log('Model info:', modelInfo.name, '-', modelInfo.description);
      
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        ...options
      });

      if (!response.data) {
        console.error('❌ No response.data from OpenRouter API');
        throw new Error('Invalid response format from AI service: No response data');
      }
      
      if (!response.data.choices) {
        console.error('❌ No choices in response.data:', response.data);
        throw new Error('Invalid response format from AI service: No choices array');
      }
      
      if (!response.data.choices[0]) {
        console.error('❌ No first choice in response.data.choices:', response.data.choices);
        throw new Error('Invalid response format from AI service: Empty choices array');
      }
      
      if (!response.data.choices[0].message) {
        console.error('❌ No message in first choice:', response.data.choices[0]);
        throw new Error('Invalid response format from AI service: No message in choice');
      }
      
      const message = response.data.choices[0].message;
      let content = message.content;
      
      // Handle DeepSeek R1 model which may put content in reasoning field
      if (!content && message.reasoning) {
        console.log('🧠 DeepSeek R1 detected: Using reasoning field as content');
        content = message.reasoning;
      }
      
      if (!content) {
        console.error('❌ No content in message:', message);
        console.error('❌ Finish reason:', response.data.choices[0].finish_reason);
        throw new Error('Invalid response format from AI service: No content in message');
      }

      // Record successful API key usage
      this.apiKeyManager.recordSuccess(this.currentApiKey);
      
      return {
        content: content,
        usage: response.data.usage,
        model: response.data.model
      };
    } catch (error) {
      console.error('AI Service Error:', {
        model,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error(`AI generation timeout: The model took too long to respond. This can happen with free models during high demand. Please try again in a few minutes.`);
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData?.error?.message?.includes('not a valid model ID')) {
          throw new Error(`Invalid model ID: ${model}. This model may no longer be available on OpenRouter.`);
        }
        throw new Error(`Bad request: ${errorData?.error?.message || error.message}`);
      } else if (error.response?.status === 401) {
        throw new Error('AI service authentication failed: Invalid API key');
      } else if (error.response?.status === 429) {
        const errorData = error.response?.data;
        
        // Track rate limited model
        this.markModelAsRateLimited(model);
        
        // Also mark the current API key as rate limited
        this.apiKeyManager.recordFailure(this.currentApiKey, error);
        
        // Try to switch to a different API key
        const nextKey = this.apiKeyManager.switchToNextKey();
        if (nextKey && nextKey !== this.currentApiKey) {
          console.log(`🔄 Switching API key due to rate limit`);
          this.updateHttpClient();
          
          // Retry with the new API key (but still throw error to trigger model fallback)
          console.log(`🔄 Will retry with different API key: ${this.apiKeyManager.getKeyId(this.currentApiKey)}`);
        }
        
        // Re-throw the error so the generateCompletion method can handle fallbacks
        throw error;
      } else if (error.response?.status === 503) {
        throw new Error(`Model ${model} is temporarily unavailable`);
      } else if (error.response?.status >= 500) {
        throw new Error('AI service is temporarily unavailable: Please try again later');
      }
      
      throw new Error(`AI generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateLearningPath(userPreferences, subject, batchSize = 'initial') {
    const { skillLevel, learningAge, tutorPersonality, learningFormat } = userPreferences;
    
    // Determine the scope based on batch size - ensuring minimum 5 modules
    let moduleCount, topicCount, maxTokens, exactModuleCount, exactTopicCount;
    if (batchSize === 'initial') {
      moduleCount = '8-10';
      topicCount = '6-8';
      exactModuleCount = 8; // Use exact number for more reliable generation
      exactTopicCount = 7;
      maxTokens = 6000;
    } else if (batchSize === 'extended') {
      moduleCount = '12-15';
      topicCount = '8-10';
      exactModuleCount = 12;
      exactTopicCount = 9;
      maxTokens = 8000;
    } else {
      moduleCount = '5-7'; // Changed from 4-6 to ensure minimum 5
      topicCount = '4-6';
      exactModuleCount = 6;
      exactTopicCount = 5;
      maxTokens = 4000;
    }
    
    // Enhanced prompt for comprehensive learning paths
    const systemPrompt = `You are an expert educational content creator. Create a comprehensive learning path for a ${skillLevel} level learner (${learningAge}) who prefers ${tutorPersonality} teaching and learns through ${learningFormat.join(', ')}.

Subject: ${subject}

${contentFilterService.getContentGuidelines()}

CRITICAL REQUIREMENTS:
1. You MUST create EXACTLY ${exactModuleCount} modules (not less, not more)
2. Each module MUST have EXACTLY ${exactTopicCount} topics
3. This is a professional-grade learning path that provides deep understanding
4. Each module should build upon previous knowledge
5. Each topic should provide substantial learning value

Return ONLY valid JSON with this exact structure:
{
  "title": "Learning path title",
  "description": "Comprehensive description (max 150 words)",
  "difficulty": "${skillLevel}",
  "estimatedDuration": 40,
  "prerequisites": ["prerequisite1", "prerequisite2", "prerequisite3"],
  "learningObjectives": ["objective1", "objective2", "objective3", "objective4", "objective5"],
  "modules": [
    {
      "title": "Module title",
      "description": "Detailed module description explaining what will be learned",
      "order": 1,
      "estimatedDuration": 240,
      "difficulty": "${skillLevel}",
      "learningObjectives": ["objective1", "objective2", "objective3"],
      "topics": [
        {
          "title": "Topic title",
          "description": "Detailed topic description explaining specific concepts covered",
          "order": 1,
          "estimatedDuration": 45,
          "difficulty": "${skillLevel}"
        }
      ]
    }
  ],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

MANDATORY: 
- Create EXACTLY ${exactModuleCount} modules with EXACTLY ${exactTopicCount} topics each
- Do not create fewer modules or topics
- Ensure logical progression from basic to advanced concepts
- Keep descriptions detailed but concise
- Return ONLY valid JSON format - NO comments, NO explanations, NO markdown
- Do NOT include // comments or /* comments */ in the JSON
- Ensure all JSON syntax is correct with proper commas and brackets`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a comprehensive ${skillLevel} level learning path for: ${subject}. 

CRITICAL REQUIREMENTS:
- You must create EXACTLY ${exactModuleCount} modules with EXACTLY ${exactTopicCount} topics each
- Do not create fewer modules or topics
- Make it thorough and professional-grade with substantial content in each topic
- Return ONLY valid JSON - no comments, no explanations, no markdown blocks
- Do NOT include // or /* */ comments in the JSON response` }
    ];

    console.log(`🤖 Requesting learning path generation from AI model pool (${batchSize} batch)`);
    console.log(`📊 Expected: EXACTLY ${exactModuleCount} modules with EXACTLY ${exactTopicCount} topics each`);
    console.log(`🔑 API Key configured: ${this.currentApiKey ? 'Yes' : 'No'}`);
    console.log(`🌐 Base URL: ${this.baseURL}`);
    
    let response;
    let lastError;
    
    // Get available models from the model pool
    const availableModels = this.modelPool
      .filter(modelInfo => !this.isModelRateLimited(modelInfo.model))
      .map(modelInfo => modelInfo.model);
    const modelsToTry = availableModels.length > 0 ? availableModels : [this.selectBestAvailableModel()];
    
    for (const model of modelsToTry) {
      try {
        console.log(`🔄 Attempting generation with model: ${model}`);
        response = await this.generateCompletion(messages, {
          temperature: 0.7, // Slightly lower for more consistent JSON
          maxTokens: Math.max(maxTokens, 8000), // Ensure minimum tokens for learning path generation
          model: model
        });
        console.log(`✅ Successfully generated content with model: ${model}`);
        break;
      } catch (error) {
        console.log(`❌ Model ${model} failed: ${error.message}`);
        lastError = error;
        
        // If it's a timeout or rate limit, try next model
        if (error.message.includes('timeout') || error.message.includes('rate limit') || error.message.includes('unavailable')) {
          continue;
        } else {
          // For other errors, don't try more models
          throw error;
        }
      }
    }
    
    // If all models failed, throw the last error
    if (!response) {
      throw lastError || new Error('All AI models failed to generate learning path');
    }

    console.log(`📝 AI response received (${response.content.length} characters)`);
    
    let jsonContent = null;
    try {
      // Validate response content exists
      if (!response || !response.content || typeof response.content !== 'string') {
        throw new Error('Invalid or empty AI response content');
      }
      
      // Clean the response to ensure valid JSON
      jsonContent = this.cleanJsonContent(response.content);
      
      if (!jsonContent || jsonContent.length === 0) {
        throw new Error('Cleaned JSON content is empty');
      }
      
      console.log('🧹 Cleaned JSON content (first 200 chars):', jsonContent.substring(0, 200) + '...');
      
      // Parse and validate the JSON
      const pathData = JSON.parse(jsonContent);
      
      // Validate required fields
      if (!pathData.title || !pathData.modules || !Array.isArray(pathData.modules)) {
        throw new Error('Invalid learning path structure: missing title or modules');
      }
      
      // Validate module count
      if (pathData.modules.length < exactModuleCount) {
        console.warn(`⚠️ AI generated only ${pathData.modules.length} modules, expected exactly ${exactModuleCount}. Accepting anyway.`);
      } else if (pathData.modules.length === exactModuleCount) {
        console.log(`✅ Perfect! AI generated exactly ${exactModuleCount} modules as requested.`);
      } else {
        console.log(`📊 AI generated ${pathData.modules.length} modules (expected ${exactModuleCount}).`);
      }
      
      // Ensure each module has topics
      pathData.modules.forEach((module, moduleIndex) => {
        if (!module.topics || !Array.isArray(module.topics)) {
          throw new Error(`Module ${moduleIndex + 1} is missing topics array`);
        }
        if (module.topics.length === 0) {
          throw new Error(`Module ${moduleIndex + 1} has no topics`);
        }
        
        // Validate topic count per module
        if (module.topics.length < exactTopicCount) {
          console.warn(`⚠️ Module ${moduleIndex + 1} has only ${module.topics.length} topics, expected exactly ${exactTopicCount}`);
        } else if (module.topics.length === exactTopicCount) {
          console.log(`✅ Module ${moduleIndex + 1} has exactly ${exactTopicCount} topics as requested.`);
        }
      });
      
      console.log(`✅ Learning path parsed successfully: "${pathData.title}" with ${pathData.modules.length} modules`);
      
      // Filter inappropriate content
      const filteredPathData = contentFilterService.filterLearningPath(pathData);
      
      // Log if content was filtered
      if (JSON.stringify(filteredPathData) !== JSON.stringify(pathData)) {
        console.log('⚠️ Content filtering applied to learning path');
      }
      
      return filteredPathData;
    } catch (parseError) {
      console.error('❌ Failed to parse AI-generated learning path:', parseError.message);
      console.error('Raw AI response (first 500 chars):', response.content.substring(0, 500) + '...');
      console.error('Cleaned content (first 300 chars):', jsonContent ? jsonContent.substring(0, 300) + '...' : 'N/A');
      
      // Try to extract and clean JSON from the response if it's embedded in text
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedContent = this.cleanJsonContent(jsonMatch[0]);
          
          console.log('🧹 Attempting to parse cleaned extracted JSON...');
          const extractedJson = JSON.parse(extractedContent);
          console.log('✅ Successfully extracted and cleaned JSON from response');
          return extractedJson;
        } catch (extractError) {
          console.error('❌ Failed to extract JSON:', extractError.message);
          console.error('Extracted content (first 200 chars):', jsonMatch[0].substring(0, 200) + '...');
          
          // Last resort: try to fix common JSON issues
          try {
            let lastResort = jsonMatch[0];
            
            // Fix common issues
            lastResort = lastResort.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
            lastResort = lastResort.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
            lastResort = lastResort.replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double quotes
            
            const fixedJson = JSON.parse(lastResort);
            console.log('✅ Successfully fixed and parsed JSON as last resort');
            return fixedJson;
          } catch (finalError) {
            console.error('❌ Final JSON fix attempt failed:', finalError.message);
          }
        }
      }
      
      throw new Error(`Failed to parse AI-generated learning path: ${parseError.message}. The AI model returned malformed JSON. Please try again.`);
    }
  }

  async generateAdditionalModules(userPreferences, subject, existingModules, count = 5) {
    const { skillLevel, learningAge, tutorPersonality, learningFormat } = userPreferences;
    
    // Create context from existing modules
    const existingTitles = existingModules.map(m => m.title).join(', ');
    const nextOrder = existingModules.length + 1;
    
    const systemPrompt = `You are an expert educational content creator. Generate additional advanced modules for an existing learning path.

Subject: ${subject}
Skill Level: ${skillLevel}
Existing Modules: ${existingTitles}

${contentFilterService.getContentGuidelines()}

Create ${count} NEW modules that build upon the existing knowledge. These should be more advanced and specialized topics that weren't covered in the initial modules.

Return ONLY valid JSON with this exact structure:
{
  "modules": [
    {
      "title": "Advanced module title",
      "description": "Detailed description of advanced concepts",
      "order": ${nextOrder},
      "estimatedDuration": 240,
      "difficulty": "${skillLevel}",
      "learningObjectives": ["objective1", "objective2", "objective3"],
      "topics": [
        {
          "title": "Advanced topic title",
          "description": "Detailed topic description",
          "order": 1,
          "estimatedDuration": 45,
          "difficulty": "${skillLevel}"
        }
      ]
    }
  ]
}

Create 10-14 topics per module. Focus on advanced, specialized, and practical applications.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate ${count} additional advanced modules for ${subject}` }
    ];

    console.log(`🤖 Requesting additional modules generation from AI model pool`);
    
    const response = await this.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 6000
    });

    try {
      let jsonContent = response.content.trim();
      
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const moduleData = JSON.parse(jsonContent);
      
      if (!moduleData.modules || !Array.isArray(moduleData.modules)) {
        throw new Error('Invalid additional modules structure');
      }
      
      // Update order numbers
      moduleData.modules.forEach((module, index) => {
        module.order = nextOrder + index;
      });
      
      console.log(`✅ Additional modules parsed successfully: ${moduleData.modules.length} modules`);
      
      return contentFilterService.filterLearningPath({ modules: moduleData.modules }).modules;
    } catch (parseError) {
      console.error('❌ Failed to parse AI-generated additional modules:', parseError.message);
      throw new Error(`Failed to parse additional modules: ${parseError.message}`);
    }
  }

  async generateAdditionalTopics(userPreferences, moduleContext, existingTopics, count = 5) {
    const { skillLevel, learningAge, tutorPersonality, learningFormat } = userPreferences;
    
    const existingTitles = existingTopics.map(t => t.title).join(', ');
    const nextOrder = existingTopics.length + 1;
    
    const systemPrompt = `You are an expert educational content creator. Generate additional topics for an existing module.

Module: ${moduleContext.title}
Module Description: ${moduleContext.description}
Existing Topics: ${existingTitles}

${contentFilterService.getContentGuidelines()}

Create ${count} NEW topics that complement the existing ones. These should cover additional aspects, advanced concepts, or practical applications not yet covered.

Return ONLY valid JSON with this exact structure:
{
  "topics": [
    {
      "title": "Additional topic title",
      "description": "Detailed topic description",
      "order": ${nextOrder},
      "estimatedDuration": 45,
      "difficulty": "${skillLevel}"
    }
  ]
}

Focus on practical, in-depth topics that provide real learning value.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate ${count} additional topics for the module "${moduleContext.title}"` }
    ];

    console.log(`🤖 Requesting additional topics generation for module: ${moduleContext.title}`);
    
    const response = await this.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 3000
    });

    try {
      let jsonContent = response.content.trim();
      
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const topicData = JSON.parse(jsonContent);
      
      if (!topicData.topics || !Array.isArray(topicData.topics)) {
        throw new Error('Invalid additional topics structure');
      }
      
      // Update order numbers
      topicData.topics.forEach((topic, index) => {
        topic.order = nextOrder + index;
      });
      
      console.log(`✅ Additional topics parsed successfully: ${topicData.topics.length} topics`);
      
      return topicData.topics;
    } catch (parseError) {
      console.error('❌ Failed to parse AI-generated additional topics:', parseError.message);
      throw new Error(`Failed to parse additional topics: ${parseError.message}`);
    }
  }

  async generateTopicContent(topic, userPreferences, moduleContext, retryCount = 0) {
    const { skillLevel, learningAge, tutorPersonality, learningFormat } = userPreferences;
    const maxRetries = 2;
    
    const systemPrompt = `You are an expert AI tutor with a ${tutorPersonality} personality. Create comprehensive, in-depth learning content for a ${skillLevel} level learner who is ${learningAge} years old and prefers ${learningFormat.join(', ')} learning formats.

Topic: ${topic.title}
Description: ${topic.description}
Module Context: ${moduleContext.title} - ${moduleContext.description}

${contentFilterService.getContentGuidelines()}

IMPORTANT: Create substantial, professional-grade content that provides deep understanding. This should be comprehensive enough for thorough learning, not just a brief overview.

You must respond with ONLY valid JSON format. Do not include any markdown formatting, code blocks, or additional text. Generate detailed content in this exact JSON structure:
{
  "content": {
    "text": "Comprehensive explanation of the topic with clear examples and explanations",
    "sections": [
      {
        "title": "Section title",
        "content": "Detailed explanation of this section",
        "visualSuggestion": "specific visual concept to illustrate this section",
        "type": "definition|concept|example|implementation"
      }
    ],
    "keyPoints": ["key point 1", "key point 2", "key point 3"],
    "summary": "Brief summary of the topic",
    "codeExamples": [
      {
        "language": "programming_language",
        "code": "actual code example",
        "explanation": "detailed explanation of the code",
        "isRunnable": true/false,
        "visualSuggestion": "visual concept to help understand this code"
      }
    ],
    "realWorldExamples": [
      {
        "title": "Example title",
        "description": "Real-world scenario description",
        "code": "practical code example",
        "language": "programming_language",
        "explanation": "how this applies in real world",
        "visualSuggestion": "real-world visual example"
      }
    ]
  },
  "quiz": {
    "questions": [
      {
        "question": "Question text",
        "type": "multiple_choice|true_false|short_answer|code",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": "correct answer",
        "explanation": "why this is correct",
        "difficulty": "easy|medium|hard"
      }
    ]
  }
}

Make the content engaging, practical, and appropriate for the learner's level. Include 5-8 comprehensive code examples and 5-7 quiz questions that test deep understanding.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate content for this topic` }
    ];

    const response = await this.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 12000 // Increased for more comprehensive content
    });

    try {
      // Clean the response content to handle potential formatting issues
      let cleanContent = response.content.trim();
      
      // Remove any markdown code block markers if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedContent = JSON.parse(cleanContent);
      
      // Validate the structure of the parsed content
      if (!parsedContent.content || !parsedContent.quiz) {
        throw new Error('Invalid content structure: missing required fields');
      }
      
      if (!parsedContent.content.text || !Array.isArray(parsedContent.quiz.questions)) {
        throw new Error('Invalid content structure: malformed content or quiz');
      }
      
      // Generate visual aids if user prefers visual/video content
      const shouldGenerateMedia = userPreferences.learningFormat.includes('visuals') || 
                                  userPreferences.learningFormat.includes('images') || 
                                  userPreferences.learningFormat.includes('videos');
      
      if (shouldGenerateMedia) {
        try {
          console.log(`🎨 Generating visual media for topic: ${topic.title}`);
          
          // Generate general visual aids for the topic
          const mediaResults = await mediaService.generateRelevantMedia(
            topic.title,
            topic.description,
            parsedContent.content.keyPoints || [],
            userPreferences.learningFormat
          );
          
          // Generate inline visuals for content sections
          const inlineVisuals = await mediaService.generateInlineVisuals(
            parsedContent.content.sections || [],
            parsedContent.content.codeExamples || [],
            parsedContent.content.realWorldExamples || [],
            userPreferences.learningFormat
          );
          
          // Convert media results to visualAids format
          const visualAids = [];
          
          // Add general images
          mediaResults.images.forEach(image => {
            visualAids.push({
              type: 'image',
              url: image.url,
              caption: image.caption || image.title,
              description: `Visual representation of ${topic.title}`,
              source: image.source,
              thumbnail: image.thumbnail
            });
          });
          
          // Add general videos
          mediaResults.videos.forEach(video => {
            visualAids.push({
              type: 'video',
              url: video.url,
              embedUrl: video.embedUrl,
              caption: video.title,
              description: video.description,
              source: video.source,
              thumbnail: video.thumbnail
            });
          });
          
          if (visualAids.length > 0) {
            parsedContent.content.visualAids = visualAids;
            console.log(`✅ Generated ${visualAids.length} general visual aids for topic`);
          }

          // Add inline visuals to content structure
          if (Object.keys(inlineVisuals.sections).length > 0 || 
              Object.keys(inlineVisuals.codeExamples).length > 0 || 
              Object.keys(inlineVisuals.realWorldExamples).length > 0) {
            parsedContent.content.inlineVisuals = inlineVisuals;
            console.log(`✅ Generated inline visuals for content sections`);
          }
        } catch (mediaError) {
          console.error('Error generating visual media:', mediaError.message);
          // Don't fail the entire content generation if media fails
        }
      }
      
      // Filter inappropriate content
      const filteredContent = contentFilterService.filterTopicContent(parsedContent);
      
      // Log if content was filtered
      if (JSON.stringify(filteredContent) !== JSON.stringify(parsedContent)) {
        console.log('⚠️ Content filtering applied to topic content');
      }
      
      // Check content quality
      const qualityScore = contentFilterService.getContentQualityScore(filteredContent.content?.text || '');
      console.log(`📊 Content quality score: ${qualityScore}/100`);
      
      return filteredContent;
    } catch (error) {
      console.error('Failed to parse AI-generated topic content:', error.message);
      console.error('Raw response content:', response.content);
      
      // Retry logic for parsing failures
      if (retryCount < maxRetries) {
        console.log(`Retrying topic content generation (attempt ${retryCount + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Progressive delay
        return this.generateTopicContent(topic, userPreferences, moduleContext, retryCount + 1);
      }
      
      // Try to extract partial content if possible
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse AI-generated topic content after ${maxRetries + 1} attempts: Invalid JSON format. Raw response: ${response.content.substring(0, 200)}...`);
      }
      
      throw new Error(`Failed to parse AI-generated topic content after ${maxRetries + 1} attempts: ${error.message}`);
    }
  }

  async generateChatResponse(messages, userPreferences, context = null) {
    const { tutorPersonality, skillLevel, learningAge, learningFormat } = userPreferences;
    
    // Build personality-specific traits
    const personalityTraits = {
      friendly: "warm, approachable, and supportive. Use encouraging language and make learning feel comfortable.",
      strict: "direct, structured, and focused on accuracy. Provide clear corrections and maintain high standards.",
      funny: "engaging, humorous, and entertaining. Use appropriate jokes, analogies, and light-hearted examples.",
      professional: "formal, precise, and thorough. Provide detailed explanations with proper terminology.",
      patient: "calm, understanding, and methodical. Take time to explain concepts thoroughly and repeat when necessary.",
      enthusiastic: "energetic, motivating, and passionate. Show excitement about learning and inspire curiosity."
    };

    // Build skill-level specific guidance
    const skillGuidance = {
      beginner: "Use simple language, provide step-by-step explanations, and include plenty of examples. Avoid jargon.",
      intermediate: "Build on existing knowledge, introduce new concepts gradually, and provide practical applications.",
      advanced: "Discuss complex topics, explore edge cases, and encourage critical thinking and problem-solving.",
      expert: "Engage in deep technical discussions, explore advanced patterns, and discuss best practices and optimizations."
    };

    // Build age-appropriate communication
    const ageGuidance = {
      child: "Use simple words, fun examples, and interactive elements. Keep explanations short and engaging.",
      teen: "Use relatable examples, current references, and encourage exploration and creativity.",
      adult: "Focus on practical applications, real-world scenarios, and professional development.",
      senior: "Be patient, provide clear step-by-step instructions, relate to life experiences, and avoid rushing through concepts."
    };

    let systemPrompt = `You are an expert AI programming tutor with a ${tutorPersonality} personality. You are ${personalityTraits[tutorPersonality]}

You're helping a ${skillLevel} level learner who is ${learningAge} years old.

Skill Level Guidance: ${skillGuidance[skillLevel]}
Age-Appropriate Communication: ${ageGuidance[learningAge]}

Learning Format Preferences: The learner prefers ${learningFormat.join(', ')}. When possible, incorporate these formats into your responses.

${contentFilterService.getContentGuidelines()}

Key Responsibilities:
1. **Code Explanation**: Break down code snippets line by line when requested
2. **Debugging Help**: Identify issues and suggest fixes with clear explanations
3. **Concept Clarification**: Explain programming concepts with appropriate examples
4. **Best Practices**: Share industry standards and clean code principles
5. **Problem Solving**: Guide through algorithmic thinking and solution approaches
6. **Learning Path Guidance**: Suggest next steps and related topics to explore

Response Guidelines:
- Always provide accurate, up-to-date information
- Include code examples when helpful
- Explain the "why" behind concepts, not just the "how"
- Encourage questions and deeper exploration
- Adapt complexity to the learner's skill level
- Be patient and supportive with mistakes`;

    if (context) {
      systemPrompt += `\n\nCurrent Learning Context: 
- Type: ${context.type}
- Title: ${context.title}`;
      
      if (context.description) {
        systemPrompt += `\n- Description: ${context.description}`;
      }
      
      systemPrompt += `\n\nUse this context to provide more relevant and targeted assistance. Reference the current learning material when appropriate.`;
    }

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await this.generateCompletion(chatMessages, {
      temperature: 0.8,
      maxTokens: 3000
    });

    // Filter the chat response content
    const filteredResponse = {
      ...response,
      content: contentFilterService.filterText(response.content)
    };

    // Log if content was filtered
    if (filteredResponse.content !== response.content) {
      console.log('⚠️ Content filtering applied to chat response');
    }

    return filteredResponse;
  }

  async generateVisualAidSuggestions(topic, content) {
    const systemPrompt = `You are an educational content expert. Based on the topic and content provided, suggest visual aids that would help learners understand the concepts better.

Topic: ${topic}
Content: ${content}

Return a JSON array of visual aid suggestions:
[
  {
    "type": "chart|diagram|image|video",
    "title": "Visual aid title",
    "description": "What this visual should show",
    "caption": "Caption for the visual",
    "priority": "high|medium|low"
  }
]

Focus on visuals that would genuinely help understanding, not just decoration.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate visual aid suggestions' }
    ];

    const response = await this.generateCompletion(messages, {
      temperature: 0.6,
      maxTokens: 1500
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error('Failed to parse visual aid suggestions');
    }
  }

  async explainCode(code, language, context, userPreferences) {
    const { skillLevel, learningAge, tutorPersonality } = userPreferences;
    
    const personalityTraits = {
      friendly: "warm, approachable, and supportive",
      strict: "direct, structured, and focused on accuracy",
      funny: "engaging, humorous, and entertaining",
      professional: "formal, precise, and thorough",
      patient: "calm, understanding, and methodical",
      enthusiastic: "energetic, motivating, and passionate"
    };

    const systemPrompt = `You are an expert programming tutor with a ${tutorPersonality} personality. You are ${personalityTraits[tutorPersonality]}.

You're helping a ${skillLevel} level learner who is ${learningAge} years old understand code.

Your task is to explain the provided ${language} code in a clear, educational manner.

Guidelines:
- Break down the code line by line or section by section
- Explain what each part does and why it's important
- Use appropriate terminology for the learner's skill level
- Highlight key programming concepts being demonstrated
- Point out best practices or potential improvements
- If there are errors, explain them constructively
- Relate the code to real-world applications when possible

Context: ${context || 'General code explanation'}

Provide your explanation in a structured format with clear sections.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` }
    ];

    return await this.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 4000
    });
  }

  async generateCodeSuggestions(code, language, issue, userPreferences) {
    const { skillLevel, tutorPersonality } = userPreferences;
    
    const systemPrompt = `You are an expert programming tutor helping a ${skillLevel} level learner with ${language} code.

The user is experiencing this issue: ${issue}

Analyze the provided code and provide helpful suggestions:

1. **Problem Analysis**: Identify what might be causing the issue
2. **Solution**: Provide a corrected version of the code with explanations
3. **Learning Points**: Explain the key concepts the user should understand
4. **Best Practices**: Share relevant coding best practices
5. **Next Steps**: Suggest what the user should learn next

Be ${tutorPersonality} in your approach and adjust complexity for a ${skillLevel} level learner.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here's my ${language} code that has an issue:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nIssue: ${issue}` }
    ];

    return await this.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 5000
    });
  }

  async generatePracticeExercises(topic, difficulty, count, userPreferences) {
    const { skillLevel, learningAge, tutorPersonality } = userPreferences;
    
    const systemPrompt = `You are an expert programming educator creating practice exercises for a ${skillLevel} level learner who is ${learningAge} years old.

Topic: ${topic}
Difficulty: ${difficulty}
Number of exercises: ${count}

Create ${count} programming exercises that help reinforce understanding of ${topic}.

Return a JSON array with this structure:
[
  {
    "title": "Exercise title",
    "description": "Clear description of what to build/solve",
    "difficulty": "${difficulty}",
    "estimatedTime": "estimated time in minutes",
    "instructions": [
      "Step 1: ...",
      "Step 2: ...",
      "Step 3: ..."
    ],
    "hints": [
      "Helpful hint 1",
      "Helpful hint 2"
    ],
    "starterCode": "// Optional starter code template",
    "expectedOutput": "Description of expected output",
    "learningObjectives": [
      "What the student will learn",
      "Key concepts reinforced"
    ],
    "tags": ["tag1", "tag2"]
  }
]

Make exercises progressively challenging and appropriate for ${skillLevel} level.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate ${count} practice exercises for ${topic} at ${difficulty} difficulty` }
    ];

    const response = await this.generateCompletion(messages, {
      temperature: 0.8,
      maxTokens: 6000
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error('Failed to parse practice exercises');
    }
  }

  async generateCodeReview(code, language, userPreferences) {
    const { skillLevel, tutorPersonality } = userPreferences;
    
    const systemPrompt = `You are an expert code reviewer helping a ${skillLevel} level programmer improve their ${language} code.

Provide a comprehensive code review covering:

1. **Code Quality**: Readability, structure, and organization
2. **Best Practices**: Following language-specific conventions
3. **Performance**: Potential optimizations and efficiency improvements
4. **Security**: Any security concerns or vulnerabilities
5. **Maintainability**: How easy the code is to maintain and extend
6. **Testing**: Suggestions for testing the code
7. **Documentation**: Comments and documentation improvements

Be ${tutorPersonality} but constructive in your feedback. Focus on education and improvement.

Format your response with clear sections and specific examples.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` }
    ];

    return await this.generateCompletion(messages, {
      temperature: 0.7,
      maxTokens: 5000
    });
  }

  // Utility methods for free model management
  getAvailableFreeModels() {
    return {
      default: this.defaultModel || this.preferredModel,
      fallbacks: this.fallbackModels || [],
      all: Object.values(FREE_MODELS),
      detailed: Object.entries(FREE_MODELS).map(([key, value]) => ({
        key,
        model: value,
        info: getModelInfo(value)
      }))
    };
  }

  getCurrentModel() {
    const currentModel = this.defaultModel || this.preferredModel;
    return {
      model: currentModel,
      info: getModelInfo(currentModel)
    };
  }

  setModel(modelName) {
    if (Object.values(FREE_MODELS).includes(modelName)) {
      this.defaultModel = modelName;
      console.log(`Switched to model: ${modelName}`);
      return true;
    }
    console.error(`Model ${modelName} is not in the free models list`);
    return false;
  }

  getRandomModel() {
    const randomModel = getRandomFreeModel();
    console.log(`Selected random model: ${randomModel}`);
    return randomModel;
  }

  // Rate limit management methods
  markModelAsRateLimited(model) {
    const now = Date.now();
    this.rateLimitedModels.set(model, now);
    console.log(`🚫 Marked ${model} as rate limited at ${new Date(now).toISOString()}`);
  }

  isModelRateLimited(model) {
    const rateLimitTime = this.rateLimitedModels.get(model);
    if (!rateLimitTime) return false;
    
    // Different timeout strategies based on model and error type
    let timeoutMinutes = 5; // Default 5 minutes for faster recovery
    
    // DeepSeek models might have longer rate limits
    if (model.includes('deepseek')) {
      timeoutMinutes = 15; // 15 minutes for DeepSeek models
    }
    
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const isStillLimited = (Date.now() - rateLimitTime) < timeoutMs;
    
    if (!isStillLimited) {
      this.rateLimitedModels.delete(model);
      console.log(`✅ ${model} rate limit expired, marking as available`);
    }
    
    return isStillLimited;
  }

  getAvailableModels() {
    return this.modelPool
      .filter(modelInfo => !this.isModelRateLimited(modelInfo.model))
      .map(modelInfo => modelInfo.model);
  }

  // Enhanced model selection with rotation and success rate consideration
  selectBestAvailableModel() {
    // First, try the preferred model if it's available
    if (this.preferredModel && !this.isModelRateLimited(this.preferredModel)) {
      return this.preferredModel;
    }

    // Get available models sorted by priority and success rate
    const availableModels = this.modelPool
      .filter(modelInfo => !this.isModelRateLimited(modelInfo.model))
      .sort((a, b) => {
        // Sort by success rate first, then by priority
        if (Math.abs(a.successRate - b.successRate) > 0.1) {
          return b.successRate - a.successRate; // Higher success rate first
        }
        return a.priority - b.priority; // Lower priority number = higher priority
      });

    if (availableModels.length === 0) {
      // If all models are rate limited, try the one that was rate limited longest ago
      const leastRecentlyLimited = Array.from(this.rateLimitedModels.entries())
        .sort((a, b) => a[1] - b[1])[0]; // Sort by timestamp, oldest first
      
      if (leastRecentlyLimited) {
        console.log(`⚠️ All models rate limited, trying least recently limited: ${leastRecentlyLimited[0]}`);
        return leastRecentlyLimited[0];
      }
      
      // Fallback to default model
      return this.preferredModel || FREE_MODELS.QWEN3_14B;
    }

    // Use round-robin among top models to distribute load
    const topModels = availableModels.filter(m => m.successRate >= 0.8);
    if (topModels.length > 1) {
      const selectedModel = topModels[this.modelRotationIndex % topModels.length];
      this.modelRotationIndex++;
      console.log(`🔄 Round-robin selected: ${selectedModel.model} (success rate: ${selectedModel.successRate.toFixed(2)})`);
      return selectedModel.model;
    }

    // Return the best available model
    const bestModel = availableModels[0];
    console.log(`🎯 Best available model: ${bestModel.model} (success rate: ${bestModel.successRate.toFixed(2)})`);
    return bestModel.model;
  }

  // Get alternative models excluding the failed one
  getAlternativeModels(excludeModel) {
    return this.modelPool
      .filter(modelInfo => modelInfo.model !== excludeModel)
      .sort((a, b) => {
        // Sort by success rate first, then by priority
        if (Math.abs(a.successRate - b.successRate) > 0.1) {
          return b.successRate - a.successRate;
        }
        return a.priority - b.priority;
      })
      .map(modelInfo => modelInfo.model);
  }

  // Record successful model usage
  recordModelSuccess(model) {
    const modelInfo = this.modelPool.find(m => m.model === model);
    if (modelInfo) {
      // Increase success rate gradually
      modelInfo.successRate = Math.min(1.0, modelInfo.successRate + 0.1);
    }
    
    // Update stats
    const stats = this.modelStats.get(model) || { successes: 0, failures: 0 };
    stats.successes++;
    this.modelStats.set(model, stats);
    
    this.lastUsedModel = model;
    console.log(`✅ Model ${model} succeeded (success rate: ${modelInfo?.successRate.toFixed(2) || 'unknown'})`);
  }

  // Record failed model usage
  recordModelFailure(model, error) {
    const modelInfo = this.modelPool.find(m => m.model === model);
    if (modelInfo) {
      // Decrease success rate based on error type
      const penalty = error.response?.status === 429 ? 0.3 : 0.1; // Larger penalty for rate limits
      modelInfo.successRate = Math.max(0.0, modelInfo.successRate - penalty);
    }
    
    // Update stats
    const stats = this.modelStats.get(model) || { successes: 0, failures: 0 };
    stats.failures++;
    this.modelStats.set(model, stats);
    
    console.log(`❌ Model ${model} failed (success rate: ${modelInfo?.successRate.toFixed(2) || 'unknown'})`);
  }

  // Get model statistics for debugging
  getModelStats() {
    return {
      // Model statistics
      modelPool: this.modelPool.map(m => ({
        model: m.model,
        priority: m.priority,
        successRate: m.successRate,
        isRateLimited: this.isModelRateLimited(m.model)
      })),
      rateLimitedModels: Array.from(this.rateLimitedModels.entries()).map(([model, time]) => ({
        model,
        limitedAt: new Date(time).toISOString(),
        minutesAgo: Math.floor((Date.now() - time) / 60000)
      })),
      modelStats: Array.from(this.modelStats.entries()).map(([model, stats]) => ({
        model,
        ...stats,
        successRate: stats.successes / (stats.successes + stats.failures)
      })),
      lastUsedModel: this.lastUsedModel,
      preferredModel: this.preferredModel,
      
      // API Key statistics
      apiKeyStats: this.apiKeyManager.getKeyStats(),
      currentApiKey: this.apiKeyManager.getKeyId(this.currentApiKey),
      availableApiKeys: this.apiKeyManager.getAvailableKeysCount()
    };
  }

  // Check if we can make requests (basic connectivity test)
  async checkServiceHealth() {
    try {
      const response = await this.client.get('/models', { timeout: 5000 });
      return {
        status: 'healthy',
        modelsAvailable: response.data?.data?.length || 0,
        message: 'OpenRouter API is accessible'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Cannot connect to OpenRouter API'
      };
    }
  }
}

export default new AIService();