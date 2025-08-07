import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

interface SimpleCodeDisplayProps {
  code: string;
  language: string;
  height?: string;
  showCopyButton?: boolean;
}

const SimpleCodeDisplay: React.FC<SimpleCodeDisplayProps> = ({
  code,
  language,
  height = '300px',
  showCopyButton = true
}) => {
  const { theme } = useTheme();
  
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  // Choose syntax highlighting theme based on current theme
  const syntaxTheme = theme === 'light' ? vs : vscDarkPlus;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="bg-muted/30 border-b border-border p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {language}
          </span>
        </div>
        {showCopyButton && (
          <button
            onClick={copyCode}
            className="btn-ghost btn-sm"
            title="Copy code"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Code Content */}
      <div 
        className="overflow-auto"
        style={{ height }}
      >
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: 'hsl(var(--muted-foreground))',
            userSelect: 'none'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default SimpleCodeDisplay;