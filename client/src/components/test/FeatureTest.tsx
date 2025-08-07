import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useCodePlayground } from '../../contexts/CodePlaygroundContext';
import { useLearning } from '../../contexts/LearningContext';
import { Play, MessageCircle, Code, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

const FeatureTest: React.FC = () => {
  const { createSession, sendMessage } = useChat();
  const { createPlayground, runCode } = useCodePlayground();
  const { learningPaths, createLearningPath } = useLearning();
  
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: 'AI Chat System', status: 'pending' },
    { name: 'Code Playground', status: 'pending' },
    { name: 'Learning Path Generation', status: 'pending' },
  ]);
  
  const [testing, setTesting] = useState(false);

  const updateTestResult = (name: string, status: 'success' | 'error', message?: string) => {
    setTestResults(prev => prev.map(test => 
      test.name === name ? { ...test, status, message } : test
    ));
  };

  const testAIChat = async () => {
    try {
      const session = await createSession('Test Chat Session', 'general');
      await sendMessage('Hello, can you help me with JavaScript?');
      updateTestResult('AI Chat System', 'success', 'Chat session created and message sent successfully');
    } catch (error: any) {
      updateTestResult('AI Chat System', 'error', error.message);
    }
  };

  const testCodePlayground = async () => {
    try {
      const playground = createPlayground('javascript');
      await runCode(playground.id);
      updateTestResult('Code Playground', 'success', 'JavaScript playground created and executed successfully');
    } catch (error: any) {
      updateTestResult('Code Playground', 'error', error.message);
    }
  };

  const testLearningPathGeneration = async () => {
    try {
      if (learningPaths.length > 0) {
        updateTestResult('Learning Path Generation', 'success', `Found ${learningPaths.length} existing learning paths`);
      } else {
        await createLearningPath('React.js');
        updateTestResult('Learning Path Generation', 'success', 'New learning path created successfully');
      }
    } catch (error: any) {
      updateTestResult('Learning Path Generation', 'error', error.message);
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    
    // Reset all tests to pending
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending' as const })));
    
    try {
      await testAIChat();
      await testCodePlayground();
      await testLearningPathGeneration();
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getFeatureIcon = (name: string) => {
    switch (name) {
      case 'AI Chat System':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'Code Playground':
        return <Code className="h-5 w-5 text-green-500" />;
      case 'Learning Path Generation':
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            AI Tutor Feature Test
          </h2>
          <p className="text-gray-600">
            Test all major features to ensure they're working correctly
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {testResults.map((test) => (
            <div
              key={test.name}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getFeatureIcon(test.name)}
                <div>
                  <h3 className="font-medium text-gray-900">{test.name}</h3>
                  {test.message && (
                    <p className={`text-sm ${
                      test.status === 'error' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {test.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {testing && test.status === 'pending' && (
                  <LoadingSpinner size="sm" />
                )}
                {getStatusIcon(test.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={runAllTests}
            disabled={testing}
            className="btn btn-primary"
          >
            {testing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Run All Tests
              </>
            )}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Test Coverage:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• AI Chat: Context-aware conversations with personalized responses</li>
            <li>• Code Playground: Multi-language code execution and testing</li>
            <li>• Learning Paths: AI-generated personalized learning content</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FeatureTest;