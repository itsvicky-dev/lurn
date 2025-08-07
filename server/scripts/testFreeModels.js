#!/usr/bin/env node

import dotenv from 'dotenv';
import aiService from '../src/services/aiService.js';
import { FREE_MODELS } from '../src/config/freeModels.js';

// Load environment variables
dotenv.config();

async function testModel(modelName) {
  console.log(`\n🧪 Testing model: ${modelName}`);
  console.log('=' .repeat(50));
  
  const testMessages = [
    { role: 'user', content: 'Hello! Can you explain what JavaScript is in simple terms?' }
  ];

  try {
    const response = await aiService.generateCompletion(testMessages, { 
      model: modelName,
      maxTokens: 200 
    });
    
    console.log('✅ Success!');
    console.log('Response:', response.content.substring(0, 200) + '...');
    console.log('Model used:', response.model);
    console.log('Tokens used:', response.usage?.total_tokens || 'N/A');
    
    return true;
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return false;
  }
}

async function testAllFreeModels() {
  console.log('🚀 Testing all free models available on OpenRouter');
  console.log('This will help you identify which models are working\n');

  const results = {};
  
  for (const [name, model] of Object.entries(FREE_MODELS)) {
    const success = await testModel(model);
    results[name] = { model, success };
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n📊 Test Results Summary:');
  console.log('=' .repeat(50));
  
  const working = [];
  const failed = [];
  
  for (const [name, result] of Object.entries(results)) {
    if (result.success) {
      working.push(`✅ ${name}: ${result.model}`);
    } else {
      failed.push(`❌ ${name}: ${result.model}`);
    }
  }

  console.log('\n🟢 Working Models:');
  working.forEach(model => console.log(model));
  
  console.log('\n🔴 Failed Models:');
  failed.forEach(model => console.log(model));

  if (working.length > 0) {
    console.log(`\n💡 Recommendation: Use any of the working models above.`);
    console.log(`   Update your .env file with: OPENROUTER_MODEL=${Object.values(results).find(r => r.success)?.model}`);
  } else {
    console.log('\n⚠️  No models are currently working. This might be due to:');
    console.log('   - Rate limiting (try again later)');
    console.log('   - API key issues');
    console.log('   - Temporary service unavailability');
  }
}

async function showCurrentConfig() {
  console.log('🔧 Current Configuration:');
  console.log('=' .repeat(30));
  console.log('API Key:', process.env.OPENROUTER_API_KEY ? `${process.env.OPENROUTER_API_KEY.substring(0, 10)}...` : 'NOT SET');
  console.log('Current Model:', process.env.OPENROUTER_MODEL || 'Using default');
  console.log('Available Free Models:');
  
  const models = aiService.getAvailableFreeModels();
  models.forEach(({ key, model, info }) => {
    console.log(`  - ${key}: ${model}`);
    console.log(`    ${info.description}`);
  });
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await testAllFreeModels();
      break;
    case 'config':
      showCurrentConfig();
      break;
    case 'single':
      const modelToTest = process.argv[3];
      if (!modelToTest) {
        console.log('Usage: npm run test-models single <model-name>');
        console.log('Example: npm run test-models single deepseek/deepseek-r1:free');
        return;
      }
      await testModel(modelToTest);
      break;
    default:
      console.log('🤖 AI Tutor - Free Models Tester');
      console.log('Usage:');
      console.log('  npm run test-models test     - Test all free models');
      console.log('  npm run test-models config   - Show current configuration');
      console.log('  npm run test-models single <model> - Test a specific model');
      console.log('\nExamples:');
      console.log('  npm run test-models test');
      console.log('  npm run test-models single deepseek/deepseek-r1:free');
  }
}

main().catch(console.error);