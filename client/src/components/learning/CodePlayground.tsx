import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Square, Download, Copy, RotateCcw, Settings } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import SimpleCodeDisplay from './SimpleCodeDisplay';
import toast from 'react-hot-toast';

interface CodePlaygroundProps {
  initialCode?: string;
  initialLanguage?: string;
  readOnly?: boolean;
  height?: string;
  onCodeChange?: (code: string) => void;
}

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: 'js', runnable: true },
  { id: 'typescript', name: 'TypeScript', extension: 'ts', runnable: true },
  { id: 'python', name: 'Python', extension: 'py', runnable: true },
  { id: 'java', name: 'Java', extension: 'java', runnable: true },
  { id: 'cpp', name: 'C++', extension: 'cpp', runnable: true },
  { id: 'csharp', name: 'C#', extension: 'cs', runnable: true },
  { id: 'php', name: 'PHP', extension: 'php', runnable: true },
  { id: 'ruby', name: 'Ruby', extension: 'rb', runnable: true },
  { id: 'go', name: 'Go', extension: 'go', runnable: true },
  { id: 'rust', name: 'Rust', extension: 'rs', runnable: true },
  { id: 'html', name: 'HTML', extension: 'html', runnable: false },
  { id: 'css', name: 'CSS', extension: 'css', runnable: false },
  { id: 'sql', name: 'SQL', extension: 'sql', runnable: false },
  { id: 'json', name: 'JSON', extension: 'json', runnable: false },
];

const DEFAULT_CODE = {
  javascript: `// Welcome to the JavaScript playground!
console.log("Hello, World!");

// Try some basic operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);

// Function example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));`,

  python: `# Welcome to the Python playground!
print("Hello, World!")

# Try some basic operations
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled numbers:", doubled)

# Function example
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(10):", fibonacci(10))`,

  java: `// Welcome to the Java playground!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Array example
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Numbers: ");
        for (int num : numbers) {
            System.out.print(num + " ");
        }
        System.out.println();
        
        // Method example
        System.out.println("Fibonacci(10): " + fibonacci(10));
    }
    
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,

  cpp: `// Welcome to the C++ playground!
#include <iostream>
#include <vector>

using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Hello, World!" << endl;
    
    // Vector example
    vector<int> numbers = {1, 2, 3, 4, 5};
    cout << "Numbers: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    cout << "Fibonacci(10): " << fibonacci(10) << endl;
    
    return 0;
}`
};

const CodePlayground: React.FC<CodePlaygroundProps> = ({
  initialCode,
  initialLanguage = 'javascript',
  readOnly = false,
  height = '400px',
  onCodeChange
}) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode || DEFAULT_CODE[initialLanguage as keyof typeof DEFAULT_CODE] || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('vs-dark');
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    } else {
      setCode(DEFAULT_CODE[language as keyof typeof DEFAULT_CODE] || '');
    }
  }, [language, initialCode]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Fix scroll behavior - allow page scrolling when editor doesn't need to scroll
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      // More aggressive approach to fix scroll issues
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const editorScrollTop = editor.getScrollTop();
        const editorScrollHeight = editor.getScrollHeight();
        const editorHeight = editor.getLayoutInfo().height;
        
        // If the editor content fits within the visible area, scroll the page instead
        if (editorScrollHeight <= editorHeight) {
          window.scrollBy(0, e.deltaY);
          return false;
        }
        
        // If scrolling up and already at top, scroll the page
        if (e.deltaY < 0 && editorScrollTop <= 0) {
          window.scrollBy(0, e.deltaY);
          return false;
        }
        
        // If scrolling down and already at bottom, scroll the page
        if (e.deltaY > 0 && editorScrollTop >= editorScrollHeight - editorHeight) {
          window.scrollBy(0, e.deltaY);
          return false;
        }
        
        // Otherwise, let the editor handle the scroll
        editor.setScrollTop(editorScrollTop + e.deltaY);
        return false;
      };
      
      // Add the event listener with capture to intercept before Monaco handles it
      editorDomNode.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      
      // Also add to the scrollable element if it exists
      setTimeout(() => {
        const scrollableElement = editorDomNode.querySelector('.monaco-scrollable-element');
        if (scrollableElement) {
          scrollableElement.addEventListener('wheel', handleWheel, { passive: false, capture: true });
        }
      }, 100);
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const runCode = async () => {
    const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.id === language);
    
    if (!currentLanguage?.runnable) {
      toast.error('This language is not runnable in the playground');
      return;
    }

    setIsRunning(true);
    setShowOutput(true);
    setOutput('Running code...');

    try {
      // Simulate code execution (in a real implementation, you'd send this to a backend service)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock output based on language
      let mockOutput = '';
      switch (language) {
        case 'javascript':
          mockOutput = `Hello, World!
Doubled numbers: [2, 4, 6, 8, 10]
Fibonacci(10): 55`;
          break;
        case 'python':
          mockOutput = `Hello, World!
Doubled numbers: [2, 4, 6, 8, 10]
Fibonacci(10): 55`;
          break;
        case 'java':
          mockOutput = `Hello, World!
Numbers: 1 2 3 4 5 
Fibonacci(10): 55`;
          break;
        case 'cpp':
          mockOutput = `Hello, World!
Numbers: 1 2 3 4 5 
Fibonacci(10): 55`;
          break;
        default:
          mockOutput = 'Code executed successfully!';
      }
      
      setOutput(mockOutput);
    } catch (error) {
      setOutput(`Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const downloadCode = () => {
    const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.id === language);
    const filename = `code.${currentLanguage?.extension || 'txt'}`;
    
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Code downloaded!');
  };

  const resetCode = () => {
    const defaultCode = DEFAULT_CODE[language as keyof typeof DEFAULT_CODE] || '';
    setCode(defaultCode);
    onCodeChange?.(defaultCode);
    toast.success('Code reset to default!');
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.id === language);

  // Use SimpleCodeDisplay for read-only cases to avoid scroll issues
  if (readOnly) {
    return (
      <SimpleCodeDisplay
        code={code}
        language={language}
        height={height}
        showCopyButton={true}
      />
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card" 
         onWheel={(e) => {
           // Allow page scrolling if the editor doesn't need to scroll
           const target = e.currentTarget;
           const editor = editorRef.current;
           
           if (editor && readOnly) {
             const editorScrollHeight = editor.getScrollHeight();
             const editorHeight = editor.getLayoutInfo().height;
             
             // If content fits in editor, don't prevent page scrolling
             if (editorScrollHeight <= editorHeight) {
               e.stopPropagation();
             }
           }
         }}>
      {/* Toolbar */}
      <div className="bg-muted/30 border-b border-border p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={readOnly}
              className="input text-sm"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>

            {/* Run Button */}
            {currentLanguage?.runnable && !readOnly && (
              <button
                onClick={runCode}
                disabled={isRunning}
                className="btn-primary btn-sm flex items-center space-x-1"
              >
                {isRunning ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Running</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    <span>Run</span>
                  </>
                )}
              </button>
            )}

            {/* Output Toggle */}
            {showOutput && (
              <button
                onClick={() => setShowOutput(!showOutput)}
                className="btn-outline btn-sm flex items-center space-x-1"
              >
                <Square className="h-3 w-3" />
                <span>Output</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Settings */}
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="input text-sm"
              >
                <option value="vs-dark">Dark</option>
                <option value="light">Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
              <input
                type="number"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="input text-sm w-16"
                placeholder="Font"
              />
            </div>

            {/* Actions */}
            {!readOnly && (
              <>
                <button
                  onClick={copyCode}
                  className="btn-ghost btn-sm"
                  title="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={downloadCode}
                  className="btn-ghost btn-sm"
                  title="Download code"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={resetCode}
                  className="btn-ghost btn-sm"
                  title="Reset to default"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Editor */}
        <div 
          className={`monaco-editor-container ${showOutput ? 'w-1/2' : 'w-full'}`}
          data-readonly={readOnly.toString()}
        >
          <Editor
            height={height}
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
              readOnly,
              fontSize,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'line',
              selectOnLineNumbers: true,
              roundedSelection: false,
              cursorStyle: 'line',
              cursorBlinking: 'blink',
              smoothScrolling: false, // Disable smooth scrolling to prevent conflicts
              // Aggressive scroll fix - disable scrolling for read-only editors
              scrollbar: {
                vertical: readOnly ? 'hidden' : 'auto',
                horizontal: readOnly ? 'hidden' : 'auto',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: readOnly ? 0 : 8,
                horizontalScrollbarSize: readOnly ? 0 : 8,
              },
              // Completely disable mouse wheel for read-only editors
              mouseWheelScrollSensitivity: readOnly ? 0 : 1,
              fastScrollSensitivity: readOnly ? 0 : 5,
              // Better scroll handling
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              overviewRulerLanes: 0,
              // Disable some features that might interfere with scrolling
              contextmenu: !readOnly,
              links: false,
            }}
          />
        </div>

        {/* Output Panel */}
        {showOutput && (
          <div className="w-1/2 border-l border-border">
            <div className="bg-muted/30 border-b border-border px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Output</span>
                <button
                  onClick={() => setShowOutput(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Square className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-secondary text-green-400 font-mono text-sm overflow-auto" style={{ height }}>
              <pre className="whitespace-pre-wrap">{output || 'No output yet. Run your code to see results.'}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePlayground;