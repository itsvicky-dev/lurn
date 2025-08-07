import dotenv from 'dotenv';
import mediaService from '../src/services/mediaService.js';

// Load environment variables
dotenv.config();

async function testMediaService() {
  console.log('🧪 Testing Media Service...\n');

  // Test configuration
  console.log('📋 Configuration Check:');
  console.log('- Google API Key:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- Google Search Engine ID:', process.env.GOOGLE_SEARCH_ENGINE_ID ? '✅ Set' : '❌ Not set');
  console.log('- YouTube API Key:', process.env.YOUTUBE_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- Unsplash Access Key:', process.env.UNSPLASH_ACCESS_KEY ? '✅ Set' : '❌ Not set');
  console.log('');

  // Test search queries
  const testQueries = [
    'JavaScript variables',
    'Python functions',
    'React components'
  ];

  for (const query of testQueries) {
    console.log(`🔍 Testing query: "${query}"`);
    
    try {
      // Test image search
      console.log('  📸 Searching for images...');
      const images = await mediaService.searchImages(query, 2);
      console.log(`  ✅ Found ${images.length} images`);
      
      if (images.length > 0) {
        console.log(`  📝 Sample image: ${images[0].title}`);
        console.log(`  🔗 URL: ${images[0].url}`);
        console.log(`  📊 Source: ${images[0].source}`);
      }

      // Test video search
      console.log('  🎥 Searching for videos...');
      const videos = await mediaService.searchVideos(query, 1);
      console.log(`  ✅ Found ${videos.length} videos`);
      
      if (videos.length > 0) {
        console.log(`  📝 Sample video: ${videos[0].title}`);
        console.log(`  🔗 URL: ${videos[0].url}`);
        console.log(`  📺 Embed URL: ${videos[0].embedUrl}`);
      }

      console.log('');
    } catch (error) {
      console.error(`  ❌ Error testing "${query}":`, error.message);
      console.log('');
    }

    // Add delay between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test comprehensive media generation
  console.log('🎨 Testing comprehensive media generation...');
  try {
    const userPreferences = ['visuals', 'videos'];
    const mediaResults = await mediaService.generateRelevantMedia(
      'JavaScript Arrays',
      'Learn about JavaScript arrays and array methods',
      ['Array creation', 'Array methods', 'Array iteration'],
      userPreferences
    );

    console.log(`✅ Generated ${mediaResults.images.length} images and ${mediaResults.videos.length} videos`);
    
    if (mediaResults.images.length > 0) {
      console.log('📸 Sample generated image:', mediaResults.images[0].title);
    }
    
    if (mediaResults.videos.length > 0) {
      console.log('🎥 Sample generated video:', mediaResults.videos[0].title);
    }
  } catch (error) {
    console.error('❌ Error in comprehensive test:', error.message);
  }

  console.log('\n🏁 Media service testing completed!');
}

// Run the test
testMediaService().catch(console.error);