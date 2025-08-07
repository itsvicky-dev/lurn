import contentFilterService from '../services/contentFilterService.js';

/**
 * Middleware to validate and filter content before sending to client
 */
export const validateContent = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to filter content
  res.json = function(data) {
    try {
      // Filter the response data based on its structure
      const filteredData = filterResponseData(data);
      
      // Log if content was filtered
      if (JSON.stringify(filteredData) !== JSON.stringify(data)) {
        console.log('⚠️ Content validation middleware applied filtering');
      }
      
      // Call original json method with filtered data
      return originalJson.call(this, filteredData);
    } catch (error) {
      console.error('Content validation error:', error);
      // If filtering fails, send original data to avoid breaking the response
      return originalJson.call(this, data);
    }
  };

  next();
};

/**
 * Filter response data based on its structure
 * @param {*} data - Response data to filter
 * @returns {*} - Filtered data
 */
function filterResponseData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle different response structures
  if (data.learningPath) {
    return {
      ...data,
      learningPath: contentFilterService.filterLearningPath(data.learningPath)
    };
  }

  if (data.learningPaths && Array.isArray(data.learningPaths)) {
    return {
      ...data,
      learningPaths: data.learningPaths.map(path => 
        contentFilterService.filterLearningPath(path)
      )
    };
  }

  if (data.topic) {
    return {
      ...data,
      topic: {
        ...data.topic,
        content: data.topic.content ? 
          contentFilterService.filterTopicContent({ content: data.topic.content }).content : 
          data.topic.content
      }
    };
  }

  if (data.module) {
    return {
      ...data,
      module: {
        ...data.module,
        title: contentFilterService.filterText(data.module.title),
        description: contentFilterService.filterText(data.module.description),
        topics: data.module.topics?.map(topic => ({
          ...topic,
          title: contentFilterService.filterText(topic.title),
          description: contentFilterService.filterText(topic.description)
        }))
      }
    };
  }

  if (data.response) {
    // Chat response
    return {
      ...data,
      response: contentFilterService.filterText(data.response)
    };
  }

  if (data.content) {
    // Generic content response
    return {
      ...data,
      content: contentFilterService.filterText(data.content)
    };
  }

  // For arrays, filter each item
  if (Array.isArray(data)) {
    return data.map(item => filterResponseData(item));
  }

  // For objects, recursively filter string values
  const filtered = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      filtered[key] = contentFilterService.filterText(value);
    } else if (typeof value === 'object') {
      filtered[key] = filterResponseData(value);
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Middleware specifically for learning content routes
 */
export const validateLearningContent = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    try {
      let filteredData = data;

      // Apply specific filtering for learning content
      if (data.learningPath) {
        filteredData = {
          ...data,
          learningPath: contentFilterService.filterLearningPath(data.learningPath)
        };
      }

      if (data.topic && data.topic.content) {
        const topicContent = contentFilterService.filterTopicContent({ content: data.topic.content });
        filteredData = {
          ...data,
          topic: {
            ...data.topic,
            content: topicContent.content
          }
        };
      }

      // Check content quality and log warnings
      if (data.topic?.content?.text) {
        const qualityScore = contentFilterService.getContentQualityScore(data.topic.content.text);
        if (qualityScore < 70) {
          console.log(`⚠️ Low content quality score: ${qualityScore}/100 for topic: ${data.topic.title}`);
        }
      }

      return originalJson.call(this, filteredData);
    } catch (error) {
      console.error('Learning content validation error:', error);
      return originalJson.call(this, data);
    }
  };

  next();
};

/**
 * Middleware for chat responses
 */
export const validateChatContent = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    try {
      let filteredData = data;

      if (data.response) {
        const filteredResponse = contentFilterService.filterText(data.response);
        filteredData = {
          ...data,
          response: filteredResponse
        };

        // Check if the response contains inappropriate content
        if (contentFilterService.containsInappropriateContent(data.response)) {
          console.log('⚠️ Inappropriate content detected and filtered in chat response');
        }
      }

      return originalJson.call(this, filteredData);
    } catch (error) {
      console.error('Chat content validation error:', error);
      return originalJson.call(this, data);
    }
  };

  next();
};

export default {
  validateContent,
  validateLearningContent,
  validateChatContent
};