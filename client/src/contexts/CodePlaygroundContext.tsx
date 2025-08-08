import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { type CodePlayground, type SupportedLanguage } from '../types';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface CodePlaygroundContextType {
  playgrounds: CodePlayground[];
  currentPlayground: CodePlayground | null;
  supportedLanguages: SupportedLanguage[];
  loading: boolean;
  running: boolean;
  createPlayground: (language: string, initialCode?: string) => CodePlayground;
  updatePlayground: (id: string, updates: Partial<CodePlayground>) => void;
  runCode: (id: string) => Promise<void>;
  deletePlayground: (id: string) => void;
  setCurrentPlayground: (playground: CodePlayground | null) => void;
  duplicatePlayground: (id: string) => CodePlayground;
  savePlayground: (id: string, name?: string) => Promise<void>;
}

const CodePlaygroundContext = createContext<CodePlaygroundContextType | undefined>(undefined);

export const useCodePlayground = () => {
  const context = useContext(CodePlaygroundContext);
  if (context === undefined) {
    throw new Error('useCodePlayground must be used within a CodePlaygroundProvider');
  }
  return context;
};

interface CodePlaygroundProviderProps {
  children: ReactNode;
}

// Supported programming languages with their configurations
const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: 'js',
    monacoLanguage: 'javascript',
    defaultCode: `// JavaScript Playground
console.log("Hello, World!");

// Try some JavaScript features
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);

// Function example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));`,
    runnable: true
  },
  {
    id: 'python',
    name: 'Python',
    extension: 'py',
    monacoLanguage: 'python',
    defaultCode: `# Python Playground
print("Hello, World!")

# Try some Python features
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled numbers:", doubled)

# Function example
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(10):", fibonacci(10))

# Class example
class Calculator:
    def add(self, a, b):
        return a + b
    
    def multiply(self, a, b):
        return a * b

calc = Calculator()
print("5 + 3 =", calc.add(5, 3))
print("5 * 3 =", calc.multiply(5, 3))`,
    runnable: true
  },
  {
    id: 'java',
    name: 'Java',
    extension: 'java',
    monacoLanguage: 'java',
    defaultCode: `// Java Playground
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
        
        // Object example
        Calculator calc = new Calculator();
        System.out.println("5 + 3 = " + calc.add(5, 3));
    }
    
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    static class Calculator {
        public int add(int a, int b) {
            return a + b;
        }
    }
}`,
    runnable: true
  },
  {
    id: 'cpp',
    name: 'C++',
    extension: 'cpp',
    monacoLanguage: 'cpp',
    defaultCode: `// C++ Playground
#include <iostream>
#include <vector>
#include <algorithm>

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
    
    // Function example
    cout << "Fibonacci(10): " << fibonacci(10) << endl;
    
    return 0;
}`,
    runnable: true
  },
  {
    id: 'csharp',
    name: 'C#',
    extension: 'cs',
    monacoLanguage: 'csharp',
    defaultCode: `// C# Playground
using System;
using System.Linq;

class Program 
{
    static void Main() 
    {
        Console.WriteLine("Hello, World!");
        
        // Array example
        int[] numbers = {1, 2, 3, 4, 5};
        var doubled = numbers.Select(n => n * 2).ToArray();
        Console.WriteLine("Doubled: " + string.Join(", ", doubled));
        
        // Method example
        Console.WriteLine("Fibonacci(10): " + Fibonacci(10));
        
        // Object example
        var calc = new Calculator();
        Console.WriteLine("5 + 3 = " + calc.Add(5, 3));
    }
    
    static int Fibonacci(int n) 
    {
        if (n <= 1) return n;
        return Fibonacci(n - 1) + Fibonacci(n - 2);
    }
    
    class Calculator 
    {
        public int Add(int a, int b) => a + b;
    }
}`,
    runnable: true
  },
  {
    id: 'go',
    name: 'Go',
    extension: 'go',
    monacoLanguage: 'go',
    defaultCode: `// Go Playground
package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    fmt.Println("Hello, World!")
    
    // Slice example
    numbers := []int{1, 2, 3, 4, 5}
    fmt.Println("Numbers:", numbers)
    
    // Function example
    fmt.Printf("Fibonacci(10): %d\\n", fibonacci(10))
    
    // Struct example
    type Calculator struct{}
    
    func (c Calculator) Add(a, b int) int {
        return a + b
    }
    
    calc := Calculator{}
    fmt.Printf("5 + 3 = %d\\n", calc.Add(5, 3))
}`,
    runnable: true
  },
  {
    id: 'rust',
    name: 'Rust',
    extension: 'rs',
    monacoLanguage: 'rust',
    defaultCode: `// Rust Playground
fn fibonacci(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    println!("Hello, World!");
    
    // Vector example
    let numbers = vec![1, 2, 3, 4, 5];
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    println!("Doubled: {:?}", doubled);
    
    // Function example
    println!("Fibonacci(10): {}", fibonacci(10));
    
    // Struct example
    struct Calculator;
    
    impl Calculator {
        fn add(&self, a: i32, b: i32) -> i32 {
            a + b
        }
    }
    
    let calc = Calculator;
    println!("5 + 3 = {}", calc.add(5, 3));
}`,
    runnable: true
  },
  {
    id: 'php',
    name: 'PHP',
    extension: 'php',
    monacoLanguage: 'php',
    defaultCode: `<?php
// PHP Playground
echo "Hello, World!\\n";

// Array example
$numbers = [1, 2, 3, 4, 5];
$doubled = array_map(function($n) { return $n * 2; }, $numbers);
echo "Doubled: " . implode(", ", $doubled) . "\\n";

// Function example
function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n - 1) + fibonacci($n - 2);
}

echo "Fibonacci(10): " . fibonacci(10) . "\\n";

// Class example
class Calculator {
    public function add($a, $b) {
        return $a + $b;
    }
}

$calc = new Calculator();
echo "5 + 3 = " . $calc->add(5, 3) . "\\n";
?>`,
    runnable: true
  },
  {
    id: 'ruby',
    name: 'Ruby',
    extension: 'rb',
    monacoLanguage: 'ruby',
    defaultCode: `# Ruby Playground
puts "Hello, World!"

# Array example
numbers = [1, 2, 3, 4, 5]
doubled = numbers.map { |n| n * 2 }
puts "Doubled: #{doubled.join(', ')}"

# Method example
def fibonacci(n)
  return n if n <= 1
  fibonacci(n - 1) + fibonacci(n - 2)
end

puts "Fibonacci(10): #{fibonacci(10)}"

# Class example
class Calculator
  def add(a, b)
    a + b
  end
end

calc = Calculator.new
puts "5 + 3 = #{calc.add(5, 3)}"`,
    runnable: true
  },
  {
    id: 'swift',
    name: 'Swift',
    extension: 'swift',
    monacoLanguage: 'swift',
    defaultCode: `// Swift Playground
import Foundation

func fibonacci(_ n: Int) -> Int {
    if n <= 1 { return n }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

print("Hello, World!")

// Array example
let numbers = [1, 2, 3, 4, 5]
let doubled = numbers.map { $0 * 2 }
print("Doubled: \\(doubled)")

// Function example
print("Fibonacci(10): \\(fibonacci(10))")

// Class example
class Calculator {
    func add(_ a: Int, _ b: Int) -> Int {
        return a + b
    }
}

let calc = Calculator()
print("5 + 3 = \\(calc.add(5, 3))")`,
    runnable: true
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    extension: 'kt',
    monacoLanguage: 'kotlin',
    defaultCode: `// Kotlin Playground
fun fibonacci(n: Int): Int {
    return if (n <= 1) n else fibonacci(n - 1) + fibonacci(n - 2)
}

fun main() {
    println("Hello, World!")
    
    // List example
    val numbers = listOf(1, 2, 3, 4, 5)
    val doubled = numbers.map { it * 2 }
    println("Doubled: $doubled")
    
    // Function example
    println("Fibonacci(10): \${fibonacci(10)}")
    
    // Class example
    class Calculator {
        fun add(a: Int, b: Int) = a + b
    }
    
    val calc = Calculator()
    println("5 + 3 = \${calc.add(5, 3)}")
}`,
    runnable: true
  },
  {
    id: 'html',
    name: 'HTML',
    extension: 'html',
    monacoLanguage: 'html',
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Playground</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .highlight {
            background-color: #e3f2fd;
            padding: 10px;
            border-left: 4px solid #2196f3;
            margin: 10px 0;
        }
        button {
            background-color: #2196f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to HTML Playground!</h1>
        <p>This is a sample HTML page with CSS styling and JavaScript functionality.</p>
        
        <div class="highlight">
            <h3>Interactive Elements</h3>
            <button onclick="showAlert()">Click Me!</button>
            <button onclick="changeColor()">Change Color</button>
        </div>
        
        <h3>Form Example</h3>
        <form onsubmit="handleSubmit(event)">
            <input type="text" id="nameInput" placeholder="Enter your name" required>
            <button type="submit">Submit</button>
        </form>
        
        <div id="output"></div>
    </div>

    <script>
        function showAlert() {
            alert('Hello from JavaScript!');
        }
        
        function changeColor() {
            const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            document.querySelector('.highlight').style.backgroundColor = randomColor;
        }
        
        function handleSubmit(event) {
            event.preventDefault();
            const name = document.getElementById('nameInput').value;
            document.getElementById('output').innerHTML = 
                '<h4>Hello, ' + name + '!</h4><p>Form submitted successfully.</p>';
        }
    </script>
</body>
</html>`,
    runnable: false
  },
  {
    id: 'css',
    name: 'CSS',
    extension: 'css',
    monacoLanguage: 'css',
    defaultCode: `/* CSS Playground */
/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Card component */
.card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    max-width: 400px;
    width: 90%;
    text-align: center;
    transform: translateY(0);
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-10px);
}

/* Typography */
h1 {
    color: #2c3e50;
    margin-bottom: 1rem;
    font-size: 2rem;
}

p {
    color: #7f8c8d;
    margin-bottom: 1.5rem;
}

/* Button styles */
.btn {
    background: linear-gradient(45deg, #3498db, #2980b9);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.btn:hover {
    background: linear-gradient(45deg, #2980b9, #3498db);
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

/* Animation */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.card {
    animation: fadeIn 0.6s ease-out;
}

/* Responsive design */
@media (max-width: 768px) {
    .card {
        padding: 1.5rem;
    }
    
    h1 {
        font-size: 1.5rem;
    }
}`,
    runnable: false
  },
  {
    id: 'sql',
    name: 'SQL',
    extension: 'sql',
    monacoLanguage: 'sql',
    defaultCode: `-- SQL Playground
-- Sample database schema and queries

-- Create tables
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (name, email, age) VALUES
    ('John Doe', 'john@example.com', 25),
    ('Jane Smith', 'jane@example.com', 30),
    ('Bob Johnson', 'bob@example.com', 35);

INSERT INTO posts (user_id, title, content) VALUES
    (1, 'First Post', 'This is my first post!'),
    (1, 'Learning SQL', 'SQL is really powerful for data management.'),
    (2, 'Hello World', 'Just saying hello to everyone!'),
    (3, 'Database Design', 'Good database design is crucial for performance.');

-- Query examples
-- Select all users
SELECT * FROM users;

-- Select users with their post count
SELECT 
    u.name,
    u.email,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.name, u.email
ORDER BY post_count DESC;

-- Select posts with user information
SELECT 
    p.title,
    p.content,
    u.name as author,
    p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- Find users older than 28
SELECT name, email, age 
FROM users 
WHERE age > 28;`,
    runnable: false
  }
];

export const CodePlaygroundProvider: React.FC<CodePlaygroundProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [playgrounds, setPlaygrounds] = useState<CodePlayground[]>([]);
  const [currentPlayground, setCurrentPlayground] = useState<CodePlayground | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>(SUPPORTED_LANGUAGES);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Load saved playgrounds when user is authenticated
  const loadSavedPlaygrounds = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Check if saved playgrounds exist in localStorage
      const savedPlaygrounds = localStorage.getItem(`playgrounds_${user.id}`);
      if (savedPlaygrounds) {
        const parsed = JSON.parse(savedPlaygrounds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlaygrounds(parsed);
          if (!currentPlayground) {
            setCurrentPlayground(parsed[0]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load saved playgrounds:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save playgrounds to localStorage whenever they change
  const savePlaygroundsToStorage = () => {
    if (user) {
      if (playgrounds.length > 0) {
        localStorage.setItem(`playgrounds_${user.id}`, JSON.stringify(playgrounds));
      } else {
        // Remove the key if no playgrounds exist
        localStorage.removeItem(`playgrounds_${user.id}`);
      }
    }
  };

  // Load supported languages and saved playgrounds when user is authenticated
  React.useEffect(() => {
    if (!user) return; // Don't load if user is not authenticated
    
    const loadSupportedLanguages = async () => {
      try {
        const { languages } = await apiService.getSupportedLanguages();
        // Map server languages to client format
        const mappedLanguages = languages.map((lang: any) => ({
          id: lang.id,
          name: lang.name,
          extension: lang.extension,
          monacoLanguage: getMonacoLanguage(lang.id),
          defaultCode: getDefaultCode(lang.id),
          runnable: lang.runnable
        }));
        setSupportedLanguages(mappedLanguages);
      } catch (error) {
        console.error('Failed to load supported languages:', error);
        // Keep using the default languages if server request fails
      }
    };

    loadSupportedLanguages();
    loadSavedPlaygrounds();
  }, [user]);

  // Save playgrounds when they change
  React.useEffect(() => {
    savePlaygroundsToStorage();
  }, [playgrounds, user]);

  // Helper functions
  const getMonacoLanguage = (languageId: string): string => {
    const mapping: Record<string, string> = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'typescript': 'typescript',
      'html': 'html',
      'css': 'css',
      'sql': 'sql',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'markdown': 'markdown'
    };
    return mapping[languageId] || 'plaintext';
  };

  const getDefaultCode = (languageId: string): string => {
    const defaultLang = SUPPORTED_LANGUAGES.find(lang => lang.id === languageId);
    return defaultLang?.defaultCode || `// ${languageId} code\nconsole.log("Hello, World!");`;
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const createPlayground = (language: string, initialCode?: string): CodePlayground => {
    const supportedLang = supportedLanguages.find(lang => lang.id === language);
    if (!supportedLang) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const now = new Date().toISOString();
    const playground: CodePlayground = {
      id: generateId(),
      name: `${supportedLang.name} Playground`,
      language,
      code: initialCode !== undefined ? initialCode : supportedLang.defaultCode,
      output: '',
      error: '',
      isRunning: false,
      createdAt: now,
      updatedAt: now
    };

    setPlaygrounds(prev => [playground, ...prev]);
    setCurrentPlayground(playground);
    
    return playground;
  };

  const updatePlayground = (id: string, updates: Partial<CodePlayground>) => {
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setPlaygrounds(prev => prev.map(playground => 
      playground.id === id ? { ...playground, ...updatesWithTimestamp } : playground
    ));

    if (currentPlayground?.id === id) {
      setCurrentPlayground(prev => prev ? { ...prev, ...updatesWithTimestamp } : null);
    }
  };

  const runCode = async (id: string): Promise<void> => {
    const playground = playgrounds.find(p => p.id === id);
    if (!playground) {
      toast.error('Playground not found');
      return;
    }

    const supportedLang = SUPPORTED_LANGUAGES.find(lang => lang.id === playground.language);
    if (!supportedLang?.runnable) {
      toast.error(`${supportedLang?.name || playground.language} is not executable in this playground`);
      return;
    }

    try {
      setRunning(true);
      updatePlayground(id, { isRunning: true, output: '', error: '' });

      // Call the API to execute code
      const result = await apiService.executeCode({
        language: playground.language,
        code: playground.code
      });

      updatePlayground(id, {
        isRunning: false,
        output: result.output || '',
        error: result.error || ''
      });

      if (result.error) {
        toast.error('Code execution failed');
      } else {
        toast.success('Code executed successfully');
      }
    } catch (error: any) {
      console.error('Code execution error:', error);
      updatePlayground(id, {
        isRunning: false,
        output: '',
        error: error.message || 'Failed to execute code'
      });
      toast.error('Failed to execute code');
    } finally {
      setRunning(false);
    }
  };

  const deletePlayground = (id: string) => {
    setPlaygrounds(prev => prev.filter(playground => playground.id !== id));
    
    if (currentPlayground?.id === id) {
      const remaining = playgrounds.filter(p => p.id !== id);
      setCurrentPlayground(remaining.length > 0 ? remaining[0] : null);
    }
    
    toast.success('Playground deleted');
  };

  const duplicatePlayground = (id: string): CodePlayground => {
    const original = playgrounds.find(p => p.id === id);
    if (!original) {
      throw new Error('Playground not found');
    }

    const duplicate: CodePlayground = {
      ...original,
      id: generateId(),
      output: '',
      error: '',
      isRunning: false
    };

    setPlaygrounds(prev => [duplicate, ...prev]);
    setCurrentPlayground(duplicate);
    
    toast.success('Playground duplicated');
    return duplicate;
  };

  const savePlayground = async (id: string, name?: string): Promise<void> => {
    const playground = playgrounds.find(p => p.id === id);
    if (!playground) {
      toast.error('Playground not found');
      return;
    }

    try {
      setLoading(true);
      // Update playground name if provided
      if (name) {
        updatePlayground(id, { ...playground, name } as any);
      }
      
      // Save to localStorage immediately
      savePlaygroundsToStorage();
      
      toast.success('Playground saved successfully');
    } catch (error: any) {
      console.error('Save playground error:', error);
      toast.error('Failed to save playground');
    } finally {
      setLoading(false);
    }
  };

  const value: CodePlaygroundContextType = {
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
    duplicatePlayground,
    savePlayground,
  };

  return (
    <CodePlaygroundContext.Provider value={value}>
      {children}
    </CodePlaygroundContext.Provider>
  );
};