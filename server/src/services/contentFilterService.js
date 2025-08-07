class ContentFilterService {
  constructor() {
    // Inappropriate words and phrases to filter out
    this.inappropriateWords = [
      // Profanity and inappropriate language
      'wtf', 'what the f', 'damn', 'shit', 'fuck', 'fucking', 'bitch', 'ass', 'asshole',
      'crap', 'piss', 'hell', 'bastard', 'slut', 'whore', 'dick', 'cock', 'pussy',
      
      // Inappropriate abbreviations commonly used in casual contexts
      'omg', 'lol', 'lmao', 'rofl', 'wtf', 'fml', 'stfu', 'gtfo', 'af',
      
      // Inappropriate casual expressions
      'sucks', 'screwed', 'pissed off', 'bullshit', 'bs',
      
      // Words that might be inappropriate in educational context
      'stupid', 'dumb', 'idiot', 'moron', 'retard', 'gay' // when used as insult
    ];

    // Professional alternatives for common inappropriate expressions
    this.replacements = {
      'wtf': 'What is',
      'what the f': 'What is',
      'what the hell': 'What is',
      'damn': 'very',
      'shit': 'content',
      'crap': 'content',
      'sucks': 'is challenging',
      'screwed': 'in trouble',
      'pissed off': 'frustrated',
      'bullshit': 'incorrect information',
      'bs': 'incorrect information',
      'stupid': 'challenging',
      'dumb': 'simple',
      'omg': 'notably',
      'lol': '',
      'lmao': '',
      'af': 'very'
    };

    // Educational-appropriate alternatives for common casual phrases
    this.educationalReplacements = {
      "WTF is": "What is",
      "WTF are": "What are", 
      "Where's The Fun": "Introduction to",
      "Let's dive into": "We will explore",
      "This is gonna": "This will",
      "You're gonna": "You will",
      "We're gonna": "We will",
      "It's gonna": "It will",
      "Wanna": "Want to",
      "Gotta": "Need to",
      "Kinda": "Somewhat",
      "Sorta": "Somewhat"
    };
  }

  /**
   * Filter inappropriate content from text
   * @param {string} text - Text to filter
   * @returns {string} - Filtered text
   */
  filterText(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let filteredText = text;

    // Apply educational replacements first (case-insensitive)
    Object.entries(this.educationalReplacements).forEach(([inappropriate, replacement]) => {
      const regex = new RegExp(inappropriate, 'gi');
      filteredText = filteredText.replace(regex, replacement);
    });

    // Apply general replacements (case-insensitive)
    Object.entries(this.replacements).forEach(([inappropriate, replacement]) => {
      const regex = new RegExp(`\\b${inappropriate}\\b`, 'gi');
      filteredText = filteredText.replace(regex, replacement);
    });

    // Remove any remaining inappropriate words that don't have replacements
    this.inappropriateWords.forEach(word => {
      if (!this.replacements[word]) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredText = filteredText.replace(regex, '[content filtered]');
      }
    });

    return filteredText;
  }

  /**
   * Filter learning path content
   * @param {Object} pathData - Learning path data
   * @returns {Object} - Filtered learning path data
   */
  filterLearningPath(pathData) {
    if (!pathData) return pathData;

    const filtered = { ...pathData };

    // Filter main fields
    if (filtered.title) filtered.title = this.filterText(filtered.title);
    if (filtered.description) filtered.description = this.filterText(filtered.description);

    // Filter modules
    if (filtered.modules && Array.isArray(filtered.modules)) {
      filtered.modules = filtered.modules.map(module => ({
        ...module,
        title: this.filterText(module.title),
        description: this.filterText(module.description),
        learningObjectives: module.learningObjectives?.map(obj => this.filterText(obj)),
        topics: module.topics?.map(topic => ({
          ...topic,
          title: this.filterText(topic.title),
          description: this.filterText(topic.description)
        }))
      }));
    }

    // Filter learning objectives
    if (filtered.learningObjectives && Array.isArray(filtered.learningObjectives)) {
      filtered.learningObjectives = filtered.learningObjectives.map(obj => this.filterText(obj));
    }

    return filtered;
  }

  /**
   * Filter topic content
   * @param {Object} topicContent - Topic content data
   * @returns {Object} - Filtered topic content data
   */
  filterTopicContent(topicContent) {
    if (!topicContent) return topicContent;

    const filtered = { ...topicContent };

    // Filter content section
    if (filtered.content) {
      const content = { ...filtered.content };
      
      if (content.text) content.text = this.filterText(content.text);
      if (content.summary) content.summary = this.filterText(content.summary);
      
      if (content.keyPoints && Array.isArray(content.keyPoints)) {
        content.keyPoints = content.keyPoints.map(point => this.filterText(point));
      }

      if (content.sections && Array.isArray(content.sections)) {
        content.sections = content.sections.map(section => ({
          ...section,
          title: this.filterText(section.title),
          content: this.filterText(section.content),
          visualSuggestion: this.filterText(section.visualSuggestion)
        }));
      }

      if (content.codeExamples && Array.isArray(content.codeExamples)) {
        content.codeExamples = content.codeExamples.map(example => ({
          ...example,
          explanation: this.filterText(example.explanation),
          visualSuggestion: this.filterText(example.visualSuggestion)
        }));
      }

      if (content.realWorldExamples && Array.isArray(content.realWorldExamples)) {
        content.realWorldExamples = content.realWorldExamples.map(example => ({
          ...example,
          title: this.filterText(example.title),
          description: this.filterText(example.description),
          explanation: this.filterText(example.explanation),
          visualSuggestion: this.filterText(example.visualSuggestion)
        }));
      }

      filtered.content = content;
    }

    // Filter quiz section
    if (filtered.quiz && filtered.quiz.questions && Array.isArray(filtered.quiz.questions)) {
      filtered.quiz.questions = filtered.quiz.questions.map(question => ({
        ...question,
        question: this.filterText(question.question),
        options: question.options?.map(option => this.filterText(option)),
        correctAnswer: this.filterText(question.correctAnswer),
        explanation: this.filterText(question.explanation)
      }));
    }

    return filtered;
  }

  /**
   * Check if content contains inappropriate material
   * @param {string} text - Text to check
   * @returns {boolean} - True if inappropriate content found
   */
  containsInappropriateContent(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const lowerText = text.toLowerCase();
    return this.inappropriateWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });
  }

  /**
   * Get content quality score (0-100)
   * @param {string} text - Text to evaluate
   * @returns {number} - Quality score
   */
  getContentQualityScore(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    let score = 100;

    // Deduct points for inappropriate content
    if (this.containsInappropriateContent(text)) {
      score -= 30;
    }

    // Deduct points for excessive casual language
    const casualWords = ['gonna', 'wanna', 'kinda', 'sorta', 'ya', 'ur', 'u'];
    const casualCount = casualWords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return count + (text.match(regex) || []).length;
    }, 0);

    score -= Math.min(casualCount * 5, 25); // Max 25 points deduction

    // Deduct points for poor grammar indicators
    const grammarIssues = [
      /\b(its|it's)\b.*\b(its|it's)\b/gi, // Incorrect its/it's usage pattern
      /\b(your|you're)\b.*\b(your|you're)\b/gi, // Incorrect your/you're usage pattern
      /[.!?]\s*[a-z]/g, // Sentences not starting with capital letters
    ];

    grammarIssues.forEach(pattern => {
      const matches = text.match(pattern) || [];
      score -= Math.min(matches.length * 3, 15);
    });

    return Math.max(score, 0);
  }

  /**
   * Generate professional content guidelines for AI
   * @returns {string} - Guidelines text
   */
  getContentGuidelines() {
    return `
CONTENT GUIDELINES:
- Use professional, educational language appropriate for learning
- Avoid casual abbreviations (WTF, OMG, LOL, etc.)
- Avoid profanity, slang, or inappropriate language
- Use complete words instead of contractions when possible
- Maintain a respectful, encouraging tone
- Focus on clear, educational explanations
- Use proper grammar and punctuation
- Avoid overly casual expressions like "gonna", "wanna", "kinda"
- Keep content appropriate for all ages and professional settings
- Use inclusive, respectful language
`;
  }
}

export default new ContentFilterService();