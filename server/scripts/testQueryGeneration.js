import mediaService from '../src/services/mediaService.js';

// Test the query generation with the problematic topic
const title = "Hello World... Wide Web!";
const description = "Write your first script";
const keyPoints = ["PHP scripts must", "Three output methods:"];

console.log('🧪 Testing query generation...');
console.log('Original title:', title);
console.log('Original description:', description);
console.log('Original key points:', keyPoints);
console.log('');

const queries = mediaService.generateSearchQueries(title, description, keyPoints);

console.log('✅ Generated queries:');
queries.forEach((query, index) => {
  console.log(`${index + 1}. "${query}"`);
});

console.log('');
console.log('🔍 Testing each query with Google Image Search...');

async function testQueries() {
  for (let i = 0; i < Math.min(queries.length, 2); i++) {
    const query = queries[i];
    console.log(`\n📸 Testing query ${i + 1}: "${query}"`);
    
    try {
      const images = await mediaService.searchGoogleImages(query, 1);
      console.log(`✅ Success! Found ${images.length} images`);
      if (images.length > 0) {
        console.log(`   Sample: ${images[0].title}`);
        console.log(`   URL: ${images[0].url}`);
      }
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Response:`, error.response.data);
      }
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testQueries().catch(console.error);