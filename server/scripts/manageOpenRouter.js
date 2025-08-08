#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { FREE_MODELS, getModelInfo } from '../src/config/freeModels.js';

// Load environment variables
dotenv.config();

const ENV_FILE = path.join(process.cwd(), '.env');

function updateEnvFile(key, value) {
  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ .env file not found');
    return false;
  }

  let envContent = fs.readFileSync(ENV_FILE, 'utf8');
  const lines = envContent.split('\n');
  let updated = false;

  // Update existing key or add new one
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = `${key}=${value}`;
      updated = true;
      break;
    }
  }

  if (!updated) {
    lines.push(`${key}=${value}`);
  }

  fs.writeFileSync(ENV_FILE, lines.join('\n'));
  return true;
}

function showCurrentConfig() {
  console.log('🔧 Current OpenRouter Configuration:');
  console.log('=' .repeat(40));
  console.log('API Key:', process.env.OPENROUTER_API_KEY ? `${process.env.OPENROUTER_API_KEY.substring(0, 15)}...` : '❌ NOT SET');
  console.log('Current Model:', process.env.OPENROUTER_MODEL || '❌ NOT SET');
  console.log('Base URL:', process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1 (default)');
  console.log();
}

function listAvailableModels() {
  console.log('📋 Available Free Models:');
  console.log('=' .repeat(40));
  
  Object.entries(FREE_MODELS).forEach(([key, modelId]) => {
    const info = getModelInfo(modelId);
    console.log(`${key}:`);
    console.log(`  Model ID: ${modelId}`);
    console.log(`  Name: ${info.name}`);
    console.log(`  Description: ${info.description}`);
    console.log(`  Strengths: ${info.strengths.join(', ')}`);
    console.log();
  });
}

function setModel(modelId) {
  // Validate model ID
  const validModels = Object.values(FREE_MODELS);
  if (!validModels.includes(modelId)) {
    console.error(`❌ Invalid model ID: ${modelId}`);
    console.log('Valid models:');
    validModels.forEach(model => console.log(`  - ${model}`));
    return false;
  }

  if (updateEnvFile('OPENROUTER_MODEL', modelId)) {
    console.log(`✅ Updated default model to: ${modelId}`);
    console.log('🔄 Restart your server to apply changes');
    return true;
  }
  return false;
}

function setApiKey(apiKey) {
  if (!apiKey.startsWith('sk-or-v1-')) {
    console.error('❌ Invalid API key format. OpenRouter keys start with "sk-or-v1-"');
    return false;
  }

  if (updateEnvFile('OPENROUTER_API_KEY', apiKey)) {
    console.log('✅ Updated API key');
    console.log('🔄 Restart your server to apply changes');
    return true;
  }
  return false;
}

function showHelp() {
  console.log('🤖 OpenRouter Configuration Manager');
  console.log();
  console.log('Usage:');
  console.log('  node scripts/manageOpenRouter.js <command> [options]');
  console.log();
  console.log('Commands:');
  console.log('  config              Show current configuration');
  console.log('  models              List available free models');
  console.log('  set-model <id>      Set default model');
  console.log('  set-key <key>       Set API key');
  console.log('  help                Show this help');
  console.log();
  console.log('Examples:');
  console.log('  node scripts/manageOpenRouter.js config');
  console.log('  node scripts/manageOpenRouter.js models');
  console.log('  node scripts/manageOpenRouter.js set-model deepseek/deepseek-chat-v3-0324:free');
  console.log('  node scripts/manageOpenRouter.js set-key sk-or-v1-your-key-here');
  console.log();
  console.log('💡 Tips:');
  console.log('  - Get your API key from: https://openrouter.ai/keys');
  console.log('  - Add credits for better reliability: https://openrouter.ai/credits');
  console.log('  - Check model status: npm run test-models test');
}

function checkRateLimitStatus() {
  console.log('📊 Rate Limit Guidance:');
  console.log('=' .repeat(30));
  console.log('Free models typically have these limits:');
  console.log('  • 20-50 requests per day per model');
  console.log('  • 20 requests per minute');
  console.log('  • Limits reset daily');
  console.log();
  console.log('To increase limits:');
  console.log('  1. Add $10+ credits to your OpenRouter account');
  console.log('  2. This unlocks 1000+ requests per day');
  console.log('  3. Same API key, no code changes needed');
  console.log();
  console.log('Current time:', new Date().toISOString());
  console.log('Peak usage hours: 9 AM - 5 PM UTC (avoid if possible)');
  console.log('Best times to try: Early morning or late evening UTC');
}

// Main execution
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'config':
      showCurrentConfig();
      break;
    case 'models':
      listAvailableModels();
      break;
    case 'set-model':
      if (!arg) {
        console.error('❌ Please provide a model ID');
        console.log('Usage: node scripts/manageOpenRouter.js set-model <model-id>');
        return;
      }
      setModel(arg);
      break;
    case 'set-key':
      if (!arg) {
        console.error('❌ Please provide an API key');
        console.log('Usage: node scripts/manageOpenRouter.js set-key <api-key>');
        return;
      }
      setApiKey(arg);
      break;
    case 'limits':
      checkRateLimitStatus();
      break;
    case 'help':
    default:
      showHelp();
  }
}

main().catch(console.error);