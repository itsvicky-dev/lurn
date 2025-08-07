import mediaService from '../src/services/mediaService.js';

async function testFullVisualAidsGeneration() {
  console.log('🎨 Testing Full Visual Aids Generation...');
  console.log('=' .repeat(50));
  
  // Test data similar to your PHP topic
  const topicTitle = "Hello World... Wide Web!";
  const topicDescription = "Write your first script and learn PHP basics";
  const keyPoints = ["PHP scripts must", "Three output methods:", "Server-side scripting"];
  const learningFormat = ['text', 'code', 'visuals', 'videos']; // Include both images and videos
  
  console.log('📋 Test Parameters:');
  console.log('Title:', topicTitle);
  console.log('Description:', topicDescription);
  console.log('Key Points:', keyPoints);
  console.log('Learning Format:', learningFormat);
  console.log('');
  
  try {
    console.log('🚀 Generating visual aids...');
    const results = await mediaService.generateRelevantMedia(
      topicTitle,
      topicDescription,
      keyPoints,
      learningFormat
    );
    
    console.log('');
    console.log('🎯 FINAL RESULTS:');
    console.log('=' .repeat(30));
    console.log(`📸 Images found: ${results.images.length}`);
    console.log(`🎥 Videos found: ${results.videos.length}`);
    console.log('');
    
    if (results.images.length > 0) {
      console.log('🖼️ IMAGES:');
      results.images.forEach((image, index) => {
        console.log(`${index + 1}. ${image.title}`);
        console.log(`   URL: ${image.url}`);
        console.log(`   Source: ${image.source}`);
        console.log(`   Thumbnail: ${image.thumbnail}`);
        console.log('');
      });
    }
    
    if (results.videos.length > 0) {
      console.log('🎬 VIDEOS:');
      results.videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   Channel: ${video.channelTitle}`);
        console.log(`   URL: ${video.url}`);
        console.log(`   Embed: ${video.embedUrl}`);
        console.log(`   Thumbnail: ${video.thumbnail}`);
        console.log('');
      });
    }
    
    if (results.images.length === 0 && results.videos.length === 0) {
      console.log('⚠️ No visual aids were generated. Check the logs above for any errors.');
    } else {
      console.log('✅ Visual aids generation completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error during visual aids generation:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFullVisualAidsGeneration().catch(console.error);