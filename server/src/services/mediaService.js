import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class MediaService {
  constructor() {
    // Google Custom Search API for images
    this.googleApiKey = process.env.GOOGLE_API_KEY;
    this.googleSearchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    // YouTube Data API
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    // Unsplash API as fallback for images
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    console.log('Media Service initialized with APIs:', {
      google: !!this.googleApiKey,
      youtube: !!this.youtubeApiKey,
      unsplash: !!this.unsplashAccessKey
    });
  }

  /**
   * Search for relevant images using Google Custom Search API
   * @param {string} query - Search query
   * @param {number} count - Number of images to fetch (max 10)
   * @param {string} subject - Subject/language being learned
   * @returns {Promise<Array>} Array of image objects
   */
  async searchImages(query, count = 5, subject = '') {
    try {
      // Try Google Custom Search first
      if (this.googleApiKey && this.googleSearchEngineId) {
        return await this.searchGoogleImages(query, count, subject);
      }
      
      // Fallback to Unsplash
      if (this.unsplashAccessKey) {
        return await this.searchUnsplashImages(query, count);
      }
      
      console.warn('No image search API configured');
      return [];
    } catch (error) {
      console.error('Error searching for images:', error.message);
      return [];
    }
  }

  /**
   * Search for relevant videos using YouTube Data API
   * @param {string} query - Search query
   * @param {number} count - Number of videos to fetch (max 10)
   * @param {string} subject - Subject/language being learned
   * @returns {Promise<Array>} Array of video objects
   */
  async searchVideos(query, count = 3, subject = '') {
    try {
      if (!this.youtubeApiKey) {
        console.warn('YouTube API key not configured');
        return [];
      }

      // Create more specific search query based on subject and topic
      let searchQuery = query;
      if (subject) {
        searchQuery = `${query} ${subject} tutorial programming`;
      } else {
        searchQuery = `${query} programming tutorial coding lesson`;
      }
      
      console.log(`🎥 Searching YouTube for: "${searchQuery}"`);

      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: this.youtubeApiKey,
          q: searchQuery,
          part: 'snippet',
          type: 'video',
          maxResults: count,
          order: 'relevance',
          videoDuration: 'medium', // 4-20 minutes
          videoEmbeddable: 'true',
          safeSearch: 'strict',
          relevanceLanguage: 'en',
          regionCode: 'US'
        },
        timeout: 10000
      });

      const videos = response.data.items?.map(item => ({
        type: 'video',
        title: item.snippet.title,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        duration: null, // Would need additional API call to get duration
        source: 'youtube',
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt
      })) || [];
      
      console.log(`✅ Found ${videos.length} videos from YouTube for query: "${query}"`);
      return videos;
      
    } catch (error) {
      console.error(`❌ YouTube search failed for query "${query}":`, error.message);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response:', error.response.data);
        
        if (error.response.status === 403) {
          console.error('💡 Possible issues:');
          console.error('- YouTube Data API v3 not enabled');
          console.error('- API key doesn\'t have YouTube Data API access');
          console.error('- Daily quota exceeded');
        }
      }
      
      return [];
    }
  }

  /**
   * Search images using Google Custom Search API
   */
  async searchGoogleImages(query, count, subject = '') {
    console.log(`🔍 Searching Google Images for: "${query}"`);
    
    try {
      // Create more specific search query based on subject and topic
      let searchQuery = query;
      if (subject) {
        // Make query more specific to the programming language/subject
        searchQuery = `${query} ${subject} code example screenshot syntax`;
      } else {
        searchQuery = `${query} programming code tutorial example`;
      }
      
      console.log(`🔍 Final search query: "${searchQuery}"`);
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: this.googleApiKey,
          cx: this.googleSearchEngineId,
          q: searchQuery,
          searchType: 'image',
          num: Math.min(count, 10),
          safe: 'active',
          imgSize: 'medium',
          imgType: 'photo',
          rights: 'cc_publicdomain,cc_attribute,cc_sharealike',
          // Add more specific parameters for better results
          fileType: 'jpg,png,gif,webp',
          imgColorType: 'color'
        },
        timeout: 10000
      });

      const images = response.data.items?.map(item => ({
        type: 'image',
        title: item.title,
        url: item.link,
        thumbnail: item.image.thumbnailLink,
        width: item.image.width,
        height: item.image.height,
        source: 'google',
        caption: item.snippet || item.title,
        // Add relevance scoring
        relevanceScore: this.calculateImageRelevance(item.title, item.snippet, query)
      })) || [];
      
      // Sort by relevance score (higher is better)
      images.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      console.log(`✅ Found ${images.length} images from Google for query: "${query}"`);
      return images;
      
    } catch (error) {
      console.error(`❌ Google Image Search failed for query "${query}":`, error.message);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response:', error.response.data);
        
        if (error.response.status === 403) {
          console.error('💡 Possible issues:');
          console.error('- API key doesn\'t have Custom Search API enabled');
          console.error('- Daily quota exceeded');
          console.error('- Invalid Search Engine ID');
        }
      }
      
      throw error;
    }
  }

  /**
   * Search images using Unsplash API
   */
  async searchUnsplashImages(query, count) {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: `${query} programming coding technology`,
        per_page: Math.min(count, 10),
        orientation: 'landscape'
      },
      headers: {
        'Authorization': `Client-ID ${this.unsplashAccessKey}`
      },
      timeout: 10000
    });

    return response.data.results?.map(item => ({
      type: 'image',
      title: item.alt_description || item.description || 'Programming Image',
      url: item.urls.regular,
      thumbnail: item.urls.small,
      width: item.width,
      height: item.height,
      source: 'unsplash',
      caption: item.alt_description || item.description || 'Programming related image',
      author: item.user.name,
      authorUrl: item.user.links.html
    })) || [];
  }

  /**
   * Generate relevant media based on topic content and user preferences
   * @param {string} topicTitle - Topic title
   * @param {string} topicDescription - Topic description
   * @param {Array} keyPoints - Key learning points
   * @param {Array} learningFormat - User's preferred learning formats
   * @param {string} subject - Programming language or subject being learned
   * @returns {Promise<Object>} Object containing images and videos
   */
  async generateRelevantMedia(topicTitle, topicDescription, keyPoints = [], learningFormat = [], subject = '') {
    console.log(`🎨 Generating media for topic: "${topicTitle}" in subject: "${subject}"`);
    console.log(`📋 Learning format preferences:`, learningFormat);
    
    const shouldIncludeImages = learningFormat.includes('visuals') || learningFormat.includes('images');
    const shouldIncludeVideos = learningFormat.includes('videos');

    console.log(`🖼️ Include images: ${shouldIncludeImages}`);
    console.log(`🎥 Include videos: ${shouldIncludeVideos}`);

    if (!shouldIncludeImages && !shouldIncludeVideos) {
      console.log('⚠️ No visual content requested based on learning format preferences');
      return { images: [], videos: [] };
    }

    // Create search queries based on topic content and subject
    const searchQueries = this.generateSearchQueries(topicTitle, topicDescription, keyPoints, subject);
    console.log(`🔍 Generated search queries:`, searchQueries);
    
    const results = {
      images: [],
      videos: []
    };

    // Fetch images if user prefers visual content - increased to get 3-5 images
    if (shouldIncludeImages) {
      console.log(`🖼️ Searching for images using ${Math.min(searchQueries.length, 3)} queries...`);
      
      for (const query of searchQueries.slice(0, 3)) { // Use 3 queries for more variety
        try {
          const images = await this.searchImages(query, 2, subject);
          results.images.push(...images);
          console.log(`📸 Added ${images.length} images from query: "${query}"`);
          
          // Add small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Error fetching images for query "${query}":`, error.message);
        }
      }
    }

    // Fetch videos if user prefers video content
    if (shouldIncludeVideos) {
      for (const query of searchQueries.slice(0, 2)) { // Use 2 queries for videos
        try {
          const videos = await this.searchVideos(query, 2, subject);
          results.videos.push(...videos);
          
          // Add small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error fetching videos for query "${query}":`, error.message);
        }
      }
    }

    // Remove duplicates and limit results - increased image limit to 5
    results.images = this.removeDuplicates(results.images, 'url').slice(0, 5);
    results.videos = this.removeDuplicates(results.videos, 'url').slice(0, 3);

    console.log(`🎯 Final results: ${results.images.length} images, ${results.videos.length} videos`);
    
    return results;
  }

  /**
   * Generate search queries based on topic content and subject
   */
  generateSearchQueries(title, description, keyPoints, subject = '') {
    // Sanitize and clean text for search queries
    const sanitizeQuery = (text) => {
      return text
        .replace(/[^\w\s]/g, ' ') // Remove special characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()
        .toLowerCase();
    };
    
    const queries = [];
    
    // Add sanitized title
    if (title) {
      const cleanTitle = sanitizeQuery(title);
      if (cleanTitle.length > 3) {
        queries.push(cleanTitle);
      }
    }
    
    // Add description-based query
    if (description) {
      const cleanDesc = sanitizeQuery(description);
      const descWords = cleanDesc.split(' ').slice(0, 4).join(' ');
      if (descWords.length > 3) {
        queries.push(descWords);
      }
    }
    
    // Add key points as queries
    keyPoints.slice(0, 3).forEach(point => {
      const cleanPoint = sanitizeQuery(point);
      const pointWords = cleanPoint.split(' ').slice(0, 3).join(' ');
      if (pointWords.length > 3) {
        queries.push(pointWords);
      }
    });
    
    // Add programming-specific context to make searches more relevant
    const enhancedQueries = queries.map(query => {
      let enhancedQuery = query;
      
      // Add subject-specific context first
      if (subject) {
        const cleanSubject = sanitizeQuery(subject);
        enhancedQuery = `${query} ${cleanSubject}`;
      }
      
      // Add specific programming context based on query content
      if (query.includes('hello world')) {
        return `${enhancedQuery} code example screenshot syntax`;
      } else if (query.includes('script')) {
        return `${enhancedQuery} code editor IDE syntax`;
      } else if (query.includes('variable') || query.includes('function')) {
        return `${enhancedQuery} code syntax example declaration`;
      } else if (query.includes('loop') || query.includes('array')) {
        return `${enhancedQuery} code example implementation`;
      } else if (query.includes('output')) {
        return `${enhancedQuery} console terminal result`;
      } else if (query.split(' ').length <= 2) {
        return `${enhancedQuery} programming tutorial code example`;
      }
      return `${enhancedQuery} code example tutorial`;
    });
    
    return enhancedQueries.filter(q => q && q.length > 3);
  }

  /**
   * Calculate relevance score for images based on title and snippet
   */
  calculateImageRelevance(title, snippet, query) {
    let score = 0;
    const text = `${title} ${snippet || ''}`.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');
    
    // Programming-related keywords get higher scores
    const programmingKeywords = [
      'code', 'programming', 'tutorial', 'development', 'coding', 'script',
      'php', 'javascript', 'python', 'html', 'css', 'java', 'c++',
      'ide', 'editor', 'syntax', 'function', 'variable', 'console',
      'terminal', 'output', 'hello world', 'example'
    ];
    
    // Check for programming keywords
    programmingKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 10;
      }
    });
    
    // Check for query word matches
    queryWords.forEach(word => {
      if (text.includes(word)) {
        score += 5;
      }
    });
    
    // Penalize irrelevant content
    const irrelevantKeywords = ['person', 'face', 'profile', 'photo', 'portrait'];
    irrelevantKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score -= 20;
      }
    });
    
    return score;
  }

  /**
   * Remove duplicate items from array based on a property
   */
  removeDuplicates(array, property) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[property];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * Validate media URL accessibility
   */
  async validateMediaUrl(url) {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get media recommendations for a specific programming concept
   */
  async getConceptMedia(concept, userPreferences, subject = '') {
    const conceptQueries = {
      'variables': ['programming variables', 'variable declaration'],
      'functions': ['programming functions', 'function definition'],
      'loops': ['programming loops', 'for loop while loop'],
      'arrays': ['programming arrays', 'array data structure'],
      'objects': ['programming objects', 'object oriented programming'],
      'classes': ['programming classes', 'class definition'],
      'inheritance': ['inheritance programming', 'class inheritance'],
      'algorithms': ['programming algorithms', 'algorithm implementation'],
      'data structures': ['data structures programming', 'linked list stack queue']
    };

    const queries = conceptQueries[concept.toLowerCase()] || [concept];
    const results = { images: [], videos: [] };

    for (const query of queries) {
      if (userPreferences.learningFormat.includes('visuals') || userPreferences.learningFormat.includes('images')) {
        const images = await this.searchImages(query, 2, subject);
        results.images.push(...images);
      }

      if (userPreferences.learningFormat.includes('videos')) {
        const videos = await this.searchVideos(query, 1, subject);
        results.videos.push(...videos);
      }
    }

    return {
      images: this.removeDuplicates(results.images, 'url').slice(0, 5),
      videos: this.removeDuplicates(results.videos, 'url').slice(0, 3)
    };
  }

  /**
   * Generate inline visuals for content sections
   * @param {Array} sections - Content sections with visual suggestions
   * @param {Array} codeExamples - Code examples with visual suggestions
   * @param {Array} realWorldExamples - Real world examples with visual suggestions
   * @param {Array} learningFormat - User's preferred learning formats
   * @param {string} subject - Programming language or subject being learned
   * @returns {Promise<Object>} Object containing inline visuals mapped to content
   */
  async generateInlineVisuals(sections = [], codeExamples = [], realWorldExamples = [], learningFormat = [], subject = '') {
    const shouldIncludeImages = learningFormat.includes('visuals') || learningFormat.includes('images');
    const shouldIncludeVideos = learningFormat.includes('videos');

    if (!shouldIncludeImages && !shouldIncludeVideos) {
      return { sections: {}, codeExamples: {}, realWorldExamples: {} };
    }

    const results = {
      sections: {},
      codeExamples: {},
      realWorldExamples: {}
    };

    // Generate visuals for content sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.visualSuggestion) {
        try {
          const media = await this.generateRelevantMedia(
            section.visualSuggestion,
            section.content,
            [section.title],
            learningFormat,
            subject
          );
          
          results.sections[i] = {
            images: media.images.slice(0, 1), // One image per section
            videos: media.videos.slice(0, 1)  // One video per section
          };

          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error generating visuals for section ${i}:`, error.message);
          results.sections[i] = { images: [], videos: [] };
        }
      }
    }

    // Generate visuals for code examples
    for (let i = 0; i < codeExamples.length; i++) {
      const example = codeExamples[i];
      if (example.visualSuggestion) {
        try {
          const media = await this.generateRelevantMedia(
            example.visualSuggestion,
            example.explanation,
            [example.language],
            learningFormat,
            subject
          );
          
          results.codeExamples[i] = {
            images: media.images.slice(0, 1),
            videos: media.videos.slice(0, 1)
          };

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error generating visuals for code example ${i}:`, error.message);
          results.codeExamples[i] = { images: [], videos: [] };
        }
      }
    }

    // Generate visuals for real world examples
    for (let i = 0; i < realWorldExamples.length; i++) {
      const example = realWorldExamples[i];
      if (example.visualSuggestion) {
        try {
          const media = await this.generateRelevantMedia(
            example.visualSuggestion,
            example.description,
            [example.title],
            learningFormat,
            subject
          );
          
          results.realWorldExamples[i] = {
            images: media.images.slice(0, 1),
            videos: media.videos.slice(0, 1)
          };

          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error generating visuals for real world example ${i}:`, error.message);
          results.realWorldExamples[i] = { images: [], videos: [] };
        }
      }
    }

    return results;
  }
}

export default new MediaService();