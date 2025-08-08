import React, { useState, useEffect, useRef } from 'react';
import { useCodePlayground } from '../../contexts/CodePlaygroundContext';
import apiService from '../../services/api';
import { 
  Play, 
  Square, 
  Plus, 
  Copy, 
  Trash2, 
  Download, 
  Upload,
  Settings,
  Code,
  Terminal,
  FileText,
  ChevronDown,
  Maximize2,
  Minimize2,
  Edit3,
  Check,
  X
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { CodePlayground } from '../../types';

// Monaco Editor (we'll need to install this)
// For now, we'll use a textarea as a placeholder
const CodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}> = ({ value, onChange, language, readOnly = false }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readOnly}
      className="w-full h-full p-4 font-mono text-sm bg-gray-900 dark:bg-gray-950 text-gray-100 border-none outline-none resize-none overflow-auto"
      placeholder={`Write your ${language} code here...`}
      spellCheck={false}
    />
  );
};

const CodePlaygroundPage: React.FC = () => {
  const {
    playgrounds,
    currentPlayground,
    supportedLanguages,
    loading,
    running,
    createPlayground,
    updatePlayground,
    runCode,
    deletePlayground,
    setCurrentPlayground,
    duplicatePlayground
  } = useCodePlayground();

  const [selectedLanguage, setSelectedLanguage] = useState(currentPlayground?.language || 'javascript');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'output' | 'ai-help'>('code');
  const [aiHelp, setAiHelp] = useState<{
    type: 'explanation' | 'suggestions' | 'review' | null;
    content: string;
    loading: boolean;
  }>({ type: null, content: '', loading: false });
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [editingPlaygroundId, setEditingPlaygroundId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const handleCreatePlayground = async (templateType?: string) => {
    try {
      let initialCode = '';
      let templateName = 'empty';
      
      // Handle empty playground or load template
      if (!templateType || templateType === 'empty') {
        // Create empty playground
        initialCode = '';
        templateName = 'empty';
      } else {
        // Load specific template
        try {
          const { template } = await apiService.getCodeTemplate(selectedLanguage, templateType);
          initialCode = template;
          templateName = templateType;
        } catch (error) {
          console.error('Failed to load template:', error);
          toast.error(`Failed to load ${templateType} template. Creating empty playground instead.`);
          initialCode = '';
          templateName = 'empty';
        }
      }
      
      // Create playground with the correct initial code
      const playground = createPlayground(selectedLanguage, initialCode);
      
      if (templateName === 'empty') {
        toast.success(`New empty ${selectedLanguage} playground created`);
      } else {
        toast.success(`New ${selectedLanguage} playground created with ${templateName} template`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const loadAvailableTemplates = async (language: string) => {
    try {
      const { templates } = await apiService.getAvailableTemplates(language);
      setAvailableTemplates(templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setAvailableTemplates([]);
    }
  };

  const handleRunCode = async () => {
    if (!currentPlayground) {
      toast.error('No playground selected');
      return;
    }

    await runCode(currentPlayground.id);
    setActiveTab('output');
  };

  const handleCopyCode = () => {
    if (!currentPlayground) return;
    
    navigator.clipboard.writeText(currentPlayground.code);
    toast.success('Code copied to clipboard');
  };

  const handleDownloadCode = () => {
    if (!currentPlayground) return;

    const language = supportedLanguages.find(lang => lang.id === currentPlayground.language);
    const extension = language?.extension || 'txt';
    const filename = `playground.${extension}`;
    
    const blob = new Blob([currentPlayground.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Code downloaded');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (currentPlayground) {
        updatePlayground(currentPlayground.id, { code: content });
        toast.success('File uploaded successfully');
      }
    };
    reader.readAsText(file);
  };

  const getCurrentLanguage = () => {
    if (!currentPlayground) return null;
    return supportedLanguages.find(lang => lang.id === currentPlayground.language);
  };

  const isRunnable = () => {
    const language = getCurrentLanguage();
    return language?.runnable || false;
  };

  const handleExplainCode = async () => {
    if (!currentPlayground) return;
    
    setAiHelp({ type: 'explanation', content: '', loading: true });
    setActiveTab('ai-help');
    
    try {
      const { explanation } = await apiService.explainCode(
        currentPlayground.code,
        currentPlayground.language,
        `Code playground - ${getCurrentLanguage()?.name}`
      );
      setAiHelp({ type: 'explanation', content: explanation, loading: false });
    } catch (error: any) {
      const { message, toast: toastMessage } = getErrorMessage(error);
      setAiHelp({ 
        type: 'explanation', 
        content: `Error getting explanation: ${message}`, 
        loading: false 
      });
      toast.error(toastMessage);
    }
  };

  const handleGetCodeSuggestions = async (issue: string) => {
    if (!currentPlayground) return;
    
    setAiHelp({ type: 'suggestions', content: '', loading: true });
    setActiveTab('ai-help');
    
    try {
      const { suggestions } = await apiService.generateCodeSuggestions(
        currentPlayground.code,
        currentPlayground.language,
        issue
      );
      setAiHelp({ type: 'suggestions', content: suggestions, loading: false });
    } catch (error: any) {
      const { message, toast: toastMessage } = getErrorMessage(error);
      setAiHelp({ 
        type: 'suggestions', 
        content: `Error getting suggestions: ${message}`, 
        loading: false 
      });
      toast.error(toastMessage);
    }
  };

  const handleCodeReview = async () => {
    if (!currentPlayground) return;
    
    setAiHelp({ type: 'review', content: '', loading: true });
    setActiveTab('ai-help');
    
    try {
      const { review } = await apiService.generateCodeReview(
        currentPlayground.code,
        currentPlayground.language
      );
      setAiHelp({ type: 'review', content: review, loading: false });
    } catch (error: any) {
      const { message, toast: toastMessage } = getErrorMessage(error);
      setAiHelp({ 
        type: 'review', 
        content: `Error getting review: ${message}`, 
        loading: false 
      });
      toast.error(toastMessage);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const status = await apiService.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const handleStartRename = (playground: CodePlayground) => {
    setEditingPlaygroundId(playground.id);
    setEditingName(playground.name || `${playground.language} Playground`);
  };

  const handleSaveRename = () => {
    if (editingPlaygroundId && editingName.trim()) {
      updatePlayground(editingPlaygroundId, { name: editingName.trim() });
      toast.success('Playground renamed successfully');
    }
    setEditingPlaygroundId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingPlaygroundId(null);
    setEditingName('');
  };

  const getErrorMessage = (error: any) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        message: 'The AI request timed out. This can happen during high demand periods. Please try again in a moment.',
        toast: 'Request timed out - please try again'
      };
    } else if (error.response?.status === 429) {
      return {
        message: 'AI service is currently rate limited. Please wait a moment and try again.',
        toast: 'Service temporarily unavailable'
      };
    } else if (error.response?.status >= 500) {
      return {
        message: 'AI service is temporarily unavailable. Please try again later.',
        toast: 'Service temporarily unavailable'
      };
    }
    return {
      message: error.message,
      toast: 'Request failed - please try again'
    };
  };

  React.useEffect(() => {
    loadSystemStatus();
  }, []);

  React.useEffect(() => {
    if (currentPlayground) {
      setSelectedLanguage(currentPlayground.language);
    }
  }, [currentPlayground?.language]);

  // Removed auto-creation of playground - user should manually create one

  return (
    <div className={`flex ${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[calc(100vh-180px)]'} bg-background`}>
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Playgrounds</h2>
          <p className="text-sm text-muted-foreground">Saved code playgrounds</p>
        </div>

        {/* Playground List */}
        <div className="flex-1 overflow-y-auto">
          {playgrounds.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Code className="h-12 w-12 mx-auto mb-2 text-muted" />
              <p className="text-sm">No playgrounds yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first playground</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {playgrounds.map((playground) => (
                <div
                  key={playground.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                    playground.id === currentPlayground?.id
                      ? 'bg-muted border border-border'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setCurrentPlayground(playground)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Code className="h-4 w-4 text-primary-600" />
                        {editingPlaygroundId === playground.id ? (
                          <div className="flex items-center space-x-2 flex-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                              className="flex-1 text-sm font-medium bg-background border border-border rounded px-2 py-1 text-card-foreground"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveRename();
                              }}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRename();
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-sm font-medium text-card-foreground truncate">
                            {playground.name || `${playground.language} Playground`}
                          </h3>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {supportedLanguages.find(lang => lang.id === playground.language)?.name || playground.language}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {playground.code.length} characters • {
                          playground.updatedAt ? new Date(playground.updatedAt).toLocaleDateString() : 'Just now'
                        }
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      {supportedLanguages.find(lang => lang.id === playground.language)?.runnable && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Runnable"></div>
                      )}
                      {editingPlaygroundId !== playground.id && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(playground);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-blue-600 transition-opacity"
                            title="Rename playground"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlayground(playground.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-600 transition-opacity"
                            title="Delete playground"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl font-semibold text-card-foreground">Code Playground</h1>
          </div>
          
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-muted hover:bg-accent rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-card-foreground">
                {getCurrentLanguage()?.name || 'Select Language'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            
            {showLanguageDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px] max-h-60 overflow-y-auto">
                {supportedLanguages.map((language) => (
                  <button
                    key={language.id}
                    onClick={() => {
                      setSelectedLanguage(language.id);
                      setShowLanguageDropdown(false);
                      // If there's a current playground, switch its language
                      if (currentPlayground) {
                        updatePlayground(currentPlayground.id, {
                          language: language.id,
                          code: language.defaultCode,
                          output: '',
                          error: ''
                        });
                      }
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-accent first:rounded-t-lg last:rounded-b-lg text-card-foreground ${
                      currentPlayground?.language === language.id ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{language.name}</span>
                      {language.runnable && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Runnable
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* New Playground with Template Options */}
          <div className="relative">
            <button
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              onMouseEnter={() => loadAvailableTemplates(selectedLanguage)}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            
            {showTemplateDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px] max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    handleCreatePlayground('empty');
                    setShowTemplateDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-accent first:rounded-t-lg"
                >
                  <div className="font-medium text-card-foreground">Empty Playground</div>
                  <div className="text-xs text-muted-foreground">Start from scratch</div>
                </button>
                
                {availableTemplates.map((template) => (
                  <button
                    key={template}
                    onClick={() => {
                      handleCreatePlayground(template);
                      setShowTemplateDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent last:rounded-b-lg"
                  >
                    <div className="font-medium capitalize text-card-foreground">{template} Template</div>
                    <div className="text-xs text-muted-foreground">
                      {template === 'hello' && 'Basic hello world example'}
                      {template === 'variables' && 'Variable declarations and types'}
                      {template === 'functions' && 'Function definitions and calls'}
                      {template === 'loops' && 'Loop structures and iteration'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {currentPlayground && (
            <>
              {isRunnable() && (
                <button
                  onClick={handleRunCode}
                  disabled={running}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {running ? (
                    <>
                      <Square className="h-4 w-4" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Run</span>
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleCopyCode}
                className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                title="Copy code"
              >
                <Copy className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleDownloadCode}
                className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                title="Download code"
              >
                <Download className="h-4 w-4" />
              </button>
              
              <label className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Upload file">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept=".js,.py,.java,.cpp,.cs,.go,.rs,.php,.rb,.swift,.kt,.html,.css,.sql"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* AI Assistance Buttons */}
              <div className="flex items-center space-x-1 border-l border-border pl-2 ml-2">
                <button
                  onClick={handleExplainCode}
                  disabled={!currentPlayground.code.trim() || aiHelp.loading}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Explain code with AI"
                >
                  <FileText className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => handleGetCodeSuggestions("I need help improving this code")}
                  disabled={!currentPlayground.code.trim() || aiHelp.loading}
                  className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Get AI suggestions"
                >
                  <Settings className="h-4 w-4" />
                </button>
                
                <button
                  onClick={handleCodeReview}
                  disabled={!currentPlayground.code.trim() || aiHelp.loading}
                  className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Get AI code review"
                >
                  <Code className="h-4 w-4" />
                </button>
              </div>
              
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Playground Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentPlayground ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-border bg-muted">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-card'
                    : 'text-muted-foreground hover:text-card-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Code</span>
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'output'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-card'
                    : 'text-muted-foreground hover:text-card-foreground'
                }`}
              >
                <Terminal className="h-4 w-4" />
                <span>Output</span>
                {(currentPlayground.output || currentPlayground.error) && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('ai-help')}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'ai-help'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-card'
                    : 'text-muted-foreground hover:text-card-foreground'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>AI Help</span>
                {aiHelp.content && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
              {activeTab === 'code' ? (
                <div className="h-full">
                  <CodeEditor
                    value={currentPlayground.code}
                    onChange={(code) => updatePlayground(currentPlayground.id, { code })}
                    language={currentPlayground.language}
                  />
                </div>
              ) : activeTab === 'output' ? (
                <div className="h-full p-4 bg-gray-900 dark:bg-gray-950 text-gray-100 font-mono text-sm overflow-auto">
                  {running ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Executing code...</span>
                    </div>
                  ) : (
                    <>
                      {currentPlayground.output && (
                        <div className="mb-4">
                          <div className="text-green-400 mb-2">Output:</div>
                          <pre className="whitespace-pre-wrap">{currentPlayground.output}</pre>
                        </div>
                      )}
                      {currentPlayground.error && (
                        <div className="mb-4">
                          <div className="text-red-400 mb-2">Error:</div>
                          <pre className="whitespace-pre-wrap text-red-300">{currentPlayground.error}</pre>
                        </div>
                      )}
                      {!currentPlayground.output && !currentPlayground.error && (
                        <div className="text-gray-500">
                          {isRunnable() 
                            ? 'Run your code to see the output here...'
                            : 'This language is not executable in the playground.'
                          }
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                // AI Help Tab
                <div className="h-full p-4 bg-background overflow-auto">
                  {aiHelp.loading ? (
                    <div className="flex items-center justify-center h-32">
                      <LoadingSpinner />
                      <span className="ml-2 text-muted-foreground">Getting AI assistance...</span>
                    </div>
                  ) : aiHelp.content ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 pb-2 border-b border-border">
                        <div className={`w-3 h-3 rounded-full ${
                          aiHelp.type === 'explanation' ? 'bg-blue-500' :
                          aiHelp.type === 'suggestions' ? 'bg-purple-500' :
                          'bg-orange-500'
                        }`}></div>
                        <h3 className="font-medium text-card-foreground">
                          {aiHelp.type === 'explanation' ? 'Code Explanation' :
                           aiHelp.type === 'suggestions' ? 'AI Suggestions' :
                           'Code Review'}
                        </h3>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-card-foreground leading-relaxed">
                          {aiHelp.content}
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-4 border-t border-border">
                        <button
                          onClick={handleExplainCode}
                          disabled={!currentPlayground.code.trim() || aiHelp.loading}
                          className="px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Explain Code
                        </button>
                        <button
                          onClick={() => handleGetCodeSuggestions("I need help improving this code")}
                          disabled={!currentPlayground.code.trim() || aiHelp.loading}
                          className="px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Get Suggestions
                        </button>
                        <button
                          onClick={handleCodeReview}
                          disabled={!currentPlayground.code.trim() || aiHelp.loading}
                          className="px-3 py-2 text-sm bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Code Review
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-card-foreground mb-2">AI Code Assistant</h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        Get AI-powered help with your code. Click one of the buttons below or use the AI buttons in the toolbar.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleExplainCode}
                          disabled={!currentPlayground?.code.trim()}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Explain Code</span>
                        </button>
                        <button
                          onClick={() => handleGetCodeSuggestions("I need help improving this code")}
                          disabled={!currentPlayground?.code.trim()}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Get Suggestions</span>
                        </button>
                        <button
                          onClick={handleCodeReview}
                          disabled={!currentPlayground?.code.trim()}
                          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Code className="h-4 w-4" />
                          <span>Code Review</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Playground Selected */
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-card-foreground mb-2">
                Welcome to Code Playground
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Write, run, and experiment with code in multiple programming languages. 
                Create a new playground to get started.
              </p>
              <button
                onClick={() => handleCreatePlayground('empty')}
                className="btn btn-primary p-2"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Playground
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default CodePlaygroundPage;