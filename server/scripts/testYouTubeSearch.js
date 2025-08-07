import mediaService from '../src/services/mediaService.js';

async function testYouTubeSearch() {
  console.log('🎥 Testing YouTube API...');
  
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  console.log('YouTube API Key:', youtubeApiKey ? `${youtubeApiKey.substring(0, 10)}...` : 'NOT SET');
  
  if (!youtubeApiKey || youtubeApiKey === 'your-youtube-api-key-here') {
    console.error('❌ YouTube API Key is not properly configured');
    console.log('📝 Please follow these steps to get your YouTube API Key:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Select your project (same one used for Custom Search)');
    console.log('3. Go to "APIs & Services" > "Library"');
    console.log('4. Search for "YouTube Data API v3" and enable it');
    console.log('5. Go to "APIs & Services" > "Credentials"');
    console.log('6. Create or use existing API Key');
    console.log('7. Make sure the API Key has YouTube Data API v3 enabled');
    return;
  }
  
  try {
    console.log('🚀 Testing video search for "hello world programming"...');
    
    const videos = await mediaService.searchVideos('hello world programming', 2);
    
    if (videos && videos.length > 0) {
      console.log(`✅ Success! Found ${videos.length} videos`);
      console.log('🎬 Sample results:');
      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   Channel: ${video.channelTitle}`);
        console.log(`   URL: ${video.url}`);
        console.log(`   Embed: ${video.embedUrl}`);
        console.log(`   Thumbnail: ${video.thumbnail}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No videos found in the response');
    }
    
  } catch (error) {
    console.error('❌ Error testing YouTube search:', error.message);
  }
}

// Run the test
testYouTubeSearch().catch(console.error);