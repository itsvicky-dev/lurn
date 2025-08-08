import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function fetchAvailableModels() {
  console.log('🔍 Fetching Available Models from OpenRouter API');
  console.log('=' .repeat(60));
  
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const models = response.data.data;
    console.log(`\n📊 Total models available: ${models.length}`);
    
    // Filter for free models
    const freeModels = models.filter(model => 
      model.pricing && 
      (model.pricing.prompt === '0' || model.pricing.prompt === 0) &&
      (model.pricing.completion === '0' || model.pricing.completion === 0)
    );
    
    console.log(`\n🆓 Free models found: ${freeModels.length}`);
    console.log('\n📋 Free Models List:');
    console.log('-'.repeat(80));
    
    freeModels.forEach(model => {
      console.log(`✅ ${model.id}`);
      console.log(`   Name: ${model.name}`);
      console.log(`   Context: ${model.context_length || 'Unknown'} tokens`);
      console.log(`   Created: ${model.created ? new Date(model.created * 1000).toLocaleDateString() : 'Unknown'}`);
      console.log('');
    });
    
    // Generate updated config
    console.log('\n🔧 Suggested FREE_MODELS config:');
    console.log('-'.repeat(80));
    console.log('export const FREE_MODELS = {');
    
    freeModels.slice(0, 10).forEach((model, index) => {
      const key = model.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      console.log(`  ${key}: '${model.id}',${index < 9 ? '' : ''}`);
    });
    
    console.log('};');
    
  } catch (error) {
    console.error('❌ Error fetching models:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 API key might be invalid or expired');
    } else if (error.response?.status === 429) {
      console.log('\n💡 Rate limited - try again later');
    }
  }
}

fetchAvailableModels().then(() => {
  console.log('\n🏁 Fetch completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script error:', error);
  process.exit(1);
});