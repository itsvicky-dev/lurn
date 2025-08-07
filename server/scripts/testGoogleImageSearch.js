import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testGoogleImageSearch() {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  console.log('🔍 Testing Google Custom Search API...');
  console.log('API Key:', googleApiKey ? `${googleApiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('Search Engine ID:', googleSearchEngineId || 'NOT SET');
  
  if (!googleApiKey || googleApiKey === 'your-google-api-key-here') {
    console.error('❌ Google API Key is not properly configured');
    return;
  }
  
  if (!googleSearchEngineId || googleSearchEngineId === 'your-search-engine-id-here') {
    console.error('❌ Google Search Engine ID is not properly configured');
    console.log('📝 Please follow these steps to get your Search Engine ID:');
    console.log('1. Go to https://cse.google.com/cse/');
    console.log('2. Click "Add" to create a new search engine');
    console.log('3. Set "Sites to search" to "*" (search entire web)');
    console.log('4. Give it a name like "AI Tutor Image Search"');
    console.log('5. Click "Create" and copy the Search Engine ID');
    return;
  }
  
  try {
    console.log('🚀 Testing image search for "JavaScript programming"...');
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: googleApiKey,
        cx: googleSearchEngineId,
        q: 'JavaScript programming coding development',
        searchType: 'image',
        num: 3,
        safe: 'active',
        imgSize: 'medium',
        imgType: 'photo',
        rights: 'cc_publicdomain,cc_attribute,cc_sharealike'
      },
      timeout: 10000
    });
    
    if (response.data.items && response.data.items.length > 0) {
      console.log('✅ Success! Found', response.data.items.length, 'images');
      console.log('📸 Sample results:');
      response.data.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   URL: ${item.link}`);
        console.log(`   Thumbnail: ${item.image.thumbnailLink}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No images found in the response');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing Google Image Search:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
      
      if (error.response.status === 403) {
        console.log('💡 This might be due to:');
        console.log('- API key doesn\'t have Custom Search API enabled');
        console.log('- Daily quota exceeded');
        console.log('- Invalid Search Engine ID');
      }
    }
  }
}

// Run the test
testGoogleImageSearch().catch(console.error);