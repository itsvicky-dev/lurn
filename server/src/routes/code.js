import express from 'express';
import { authenticate, requireOnboarding } from '../middleware/auth.js';
import dockerCodeExecutionService from '../services/dockerCodeExecutionService.js';
import codeExecutionService from '../services/codeExecutionService.js';
import codeTemplateService from '../services/codeTemplateService.js';

const router = express.Router();

// Get supported languages
router.get('/languages', authenticate, requireOnboarding, async (req, res) => {
  try {
    const languages = dockerCodeExecutionService.getSupportedLanguages();
    const systemInfo = await dockerCodeExecutionService.getSystemInfo();
    
    res.json({ 
      languages,
      systemInfo
    });
  } catch (error) {
    console.error('Get supported languages error:', error);
    res.status(500).json({ message: 'Server error fetching supported languages' });
  }
});

// Execute code
router.post('/execute', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ message: 'Language and code are required' });
    }

    // Validate language
    const supportedLanguages = dockerCodeExecutionService.getSupportedLanguages();
    const languageConfig = supportedLanguages.find(lang => lang.id === language);
    
    if (!languageConfig) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    if (!languageConfig.runnable) {
      return res.status(400).json({ message: 'This language is not executable' });
    }

    // Execute code with Docker sandboxing (falls back to local execution if Docker unavailable)
    const result = await dockerCodeExecutionService.executeCode(language, code, {
      timeout: languageConfig.timeout || 10000,
      userId: req.user._id.toString()
    });

    res.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return res.status(408).json({ 
        message: 'Code execution timed out',
        error: 'Execution timed out. Please check for infinite loops or optimize your code.',
        output: '',
        executionTime: 0
      });
    }
    
    if (error.message.includes('memory')) {
      return res.status(413).json({ 
        message: 'Code execution exceeded memory limit',
        error: 'Memory limit exceeded. Please optimize your code to use less memory.',
        output: '',
        executionTime: 0
      });
    }

    res.status(500).json({ 
      message: 'Code execution failed',
      error: error.message,
      output: '',
      executionTime: 0
    });
  }
});

// Get code template
router.get('/template/:language', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { language } = req.params;
    const { type = 'hello' } = req.query;
    
    const template = codeTemplateService.getTemplate(language, type);
    const availableTemplates = codeTemplateService.getAvailableTemplates(language);
    
    res.json({ 
      template,
      availableTemplates,
      language,
      type
    });
  } catch (error) {
    console.error('Get code template error:', error);
    res.status(500).json({ message: 'Server error fetching code template' });
  }
});

// Get available templates for a language
router.get('/templates/:language', authenticate, requireOnboarding, async (req, res) => {
  try {
    const { language } = req.params;
    const availableTemplates = codeTemplateService.getAvailableTemplates(language);
    
    res.json({ 
      language,
      templates: availableTemplates
    });
  } catch (error) {
    console.error('Get available templates error:', error);
    res.status(500).json({ message: 'Server error fetching available templates' });
  }
});

// Get execution history (optional feature)
router.get('/history', authenticate, requireOnboarding, async (req, res) => {
  try {
    // In a real implementation, you might want to store execution history
    // For now, return empty array
    res.json({ history: [] });
  } catch (error) {
    console.error('Get execution history error:', error);
    res.status(500).json({ message: 'Server error fetching execution history' });
  }
});

// Check Docker system status
router.get('/system/status', authenticate, requireOnboarding, async (req, res) => {
  try {
    const systemInfo = await dockerCodeExecutionService.getSystemInfo();
    const dockerAvailable = await dockerCodeExecutionService.checkDockerAvailability();
    
    res.json({
      dockerAvailable,
      systemInfo,
      fallbackAvailable: true // Local execution is always available
    });
  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({ message: 'Server error fetching system status' });
  }
});

// Pull Docker images (admin endpoint - you might want to add admin auth)
router.post('/system/pull-images', authenticate, requireOnboarding, async (req, res) => {
  try {
    // This is a potentially long-running operation
    res.json({ message: 'Docker image pulling started in background' });
    
    // Run in background
    dockerCodeExecutionService.pullRequiredImages().catch(error => {
      console.error('Background image pulling failed:', error);
    });
  } catch (error) {
    console.error('Pull images error:', error);
    res.status(500).json({ message: 'Server error starting image pull' });
  }
});

export default router;