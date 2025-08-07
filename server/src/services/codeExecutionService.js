import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodeExecutionService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
    
    this.supportedLanguages = [
      // Scripting Languages
      {
        id: 'javascript',
        name: 'JavaScript',
        extension: 'js',
        runnable: true,
        command: 'node',
        args: [],
        category: 'scripting',
        description: 'JavaScript runtime with Node.js'
      },
      {
        id: 'python',
        name: 'Python',
        extension: 'py',
        runnable: true,
        command: 'python',
        args: [],
        category: 'scripting',
        description: 'Python interpreter'
      },
      {
        id: 'python3',
        name: 'Python 3',
        extension: 'py',
        runnable: true,
        command: 'python3',
        args: [],
        category: 'scripting',
        description: 'Python 3 interpreter'
      },
      {
        id: 'ruby',
        name: 'Ruby',
        extension: 'rb',
        runnable: true,
        command: 'ruby',
        args: [],
        category: 'scripting',
        description: 'Ruby interpreter'
      },
      {
        id: 'php',
        name: 'PHP',
        extension: 'php',
        runnable: true,
        command: 'php',
        args: [],
        category: 'scripting',
        description: 'PHP interpreter'
      },
      {
        id: 'perl',
        name: 'Perl',
        extension: 'pl',
        runnable: true,
        command: 'perl',
        args: [],
        category: 'scripting',
        description: 'Perl interpreter'
      },
      {
        id: 'bash',
        name: 'Bash',
        extension: 'sh',
        runnable: true,
        command: 'bash',
        args: [],
        category: 'scripting',
        description: 'Bash shell script'
      },
      
      // Compiled Languages
      {
        id: 'java',
        name: 'Java',
        extension: 'java',
        runnable: true,
        command: 'javac',
        args: [],
        runCommand: 'java',
        compileFirst: true,
        category: 'compiled',
        description: 'Java compiler and runtime'
      },
      {
        id: 'cpp',
        name: 'C++',
        extension: 'cpp',
        runnable: true,
        command: 'g++',
        args: ['-o'],
        runCommand: './program',
        compileFirst: true,
        category: 'compiled',
        description: 'C++ compiler (GCC)'
      },
      {
        id: 'c',
        name: 'C',
        extension: 'c',
        runnable: true,
        command: 'gcc',
        args: ['-o'],
        runCommand: './program',
        compileFirst: true,
        category: 'compiled',
        description: 'C compiler (GCC)'
      },
      {
        id: 'csharp',
        name: 'C#',
        extension: 'cs',
        runnable: true,
        command: 'csc',
        args: [],
        runCommand: 'mono',
        compileFirst: true,
        category: 'compiled',
        description: 'C# compiler (Mono)'
      },
      {
        id: 'go',
        name: 'Go',
        extension: 'go',
        runnable: true,
        command: 'go',
        args: ['run'],
        category: 'compiled',
        description: 'Go compiler and runtime'
      },
      {
        id: 'rust',
        name: 'Rust',
        extension: 'rs',
        runnable: true,
        command: 'rustc',
        args: ['-o'],
        runCommand: './program',
        compileFirst: true,
        category: 'compiled',
        description: 'Rust compiler'
      },
      {
        id: 'swift',
        name: 'Swift',
        extension: 'swift',
        runnable: true,
        command: 'swift',
        args: [],
        category: 'compiled',
        description: 'Swift compiler'
      },
      {
        id: 'kotlin',
        name: 'Kotlin',
        extension: 'kt',
        runnable: true,
        command: 'kotlinc',
        args: ['-script'],
        category: 'compiled',
        description: 'Kotlin compiler'
      },
      {
        id: 'scala',
        name: 'Scala',
        extension: 'scala',
        runnable: true,
        command: 'scala',
        args: [],
        category: 'compiled',
        description: 'Scala interpreter'
      },
      
      // Functional Languages
      {
        id: 'haskell',
        name: 'Haskell',
        extension: 'hs',
        runnable: true,
        command: 'ghc',
        args: ['-o'],
        runCommand: './program',
        compileFirst: true,
        category: 'functional',
        description: 'Haskell compiler (GHC)'
      },
      {
        id: 'ocaml',
        name: 'OCaml',
        extension: 'ml',
        runnable: true,
        command: 'ocaml',
        args: [],
        category: 'functional',
        description: 'OCaml interpreter'
      },
      {
        id: 'erlang',
        name: 'Erlang',
        extension: 'erl',
        runnable: true,
        command: 'erl',
        args: ['-noshell', '-s'],
        category: 'functional',
        description: 'Erlang runtime'
      },
      {
        id: 'elixir',
        name: 'Elixir',
        extension: 'ex',
        runnable: true,
        command: 'elixir',
        args: [],
        category: 'functional',
        description: 'Elixir interpreter'
      },
      
      // Other Languages
      {
        id: 'r',
        name: 'R',
        extension: 'r',
        runnable: true,
        command: 'Rscript',
        args: [],
        category: 'statistical',
        description: 'R statistical computing'
      },
      {
        id: 'matlab',
        name: 'MATLAB',
        extension: 'm',
        runnable: true,
        command: 'octave',
        args: ['--no-gui'],
        category: 'mathematical',
        description: 'GNU Octave (MATLAB compatible)'
      },
      {
        id: 'lua',
        name: 'Lua',
        extension: 'lua',
        runnable: true,
        command: 'lua',
        args: [],
        category: 'scripting',
        description: 'Lua interpreter'
      },
      {
        id: 'dart',
        name: 'Dart',
        extension: 'dart',
        runnable: true,
        command: 'dart',
        args: [],
        category: 'compiled',
        description: 'Dart runtime'
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        extension: 'ts',
        runnable: true,
        command: 'ts-node',
        args: [],
        category: 'scripting',
        description: 'TypeScript runtime with ts-node'
      },
      
      // Markup and Styling Languages (non-executable)
      {
        id: 'html',
        name: 'HTML',
        extension: 'html',
        runnable: false,
        category: 'markup',
        description: 'HyperText Markup Language'
      },
      {
        id: 'css',
        name: 'CSS',
        extension: 'css',
        runnable: false,
        category: 'styling',
        description: 'Cascading Style Sheets'
      },
      {
        id: 'xml',
        name: 'XML',
        extension: 'xml',
        runnable: false,
        category: 'markup',
        description: 'eXtensible Markup Language'
      },
      {
        id: 'json',
        name: 'JSON',
        extension: 'json',
        runnable: false,
        category: 'data',
        description: 'JavaScript Object Notation'
      },
      {
        id: 'yaml',
        name: 'YAML',
        extension: 'yaml',
        runnable: false,
        category: 'data',
        description: 'YAML Ain\'t Markup Language'
      },
      {
        id: 'markdown',
        name: 'Markdown',
        extension: 'md',
        runnable: false,
        category: 'markup',
        description: 'Markdown markup language'
      },
      
      // Database Languages
      {
        id: 'sql',
        name: 'SQL',
        extension: 'sql',
        runnable: false,
        category: 'database',
        description: 'Structured Query Language'
      },
      {
        id: 'plsql',
        name: 'PL/SQL',
        extension: 'sql',
        runnable: false,
        category: 'database',
        description: 'Oracle PL/SQL'
      },
      
      // Assembly Languages
      {
        id: 'assembly',
        name: 'Assembly',
        extension: 'asm',
        runnable: false,
        category: 'low-level',
        description: 'Assembly language'
      },
      
      // Configuration Languages
      {
        id: 'dockerfile',
        name: 'Dockerfile',
        extension: 'dockerfile',
        runnable: false,
        category: 'config',
        description: 'Docker container configuration'
      },
      {
        id: 'nginx',
        name: 'Nginx Config',
        extension: 'conf',
        runnable: false,
        category: 'config',
        description: 'Nginx configuration'
      }
    ];
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  async executeCode(language, code, options = {}) {
    const { timeout = 10000, maxMemory = 128 * 1024 * 1024, userId } = options;
    
    const languageConfig = this.supportedLanguages.find(lang => lang.id === language);
    if (!languageConfig || !languageConfig.runnable) {
      throw new Error(`Language ${language} is not supported or not runnable`);
    }

    // For JavaScript, we can use Node.js built-in evaluation for simple cases
    if (language === 'javascript') {
      return await this.executeJavaScript(code, timeout);
    }

    // For Python, try to use python command
    if (language === 'python') {
      return await this.executePython(code, timeout, userId);
    }

    // For other languages, try the full compilation/execution process
    const executionId = uuidv4();
    const userTempDir = path.join(this.tempDir, userId || 'anonymous');
    
    try {
      // Ensure user temp directory exists
      await fs.mkdir(userTempDir, { recursive: true });
      
      const filename = `${executionId}.${languageConfig.extension}`;
      const filepath = path.join(userTempDir, filename);
      
      // Write code to file
      await fs.writeFile(filepath, code, 'utf8');
      
      let result;
      
      if (languageConfig.compileFirst) {
        // Compile first, then run
        result = await this.compileAndRun(languageConfig, filepath, userTempDir, executionId, timeout);
      } else {
        // Direct execution
        result = await this.runCode(languageConfig, filepath, timeout);
      }
      
      // Clean up
      await this.cleanup(userTempDir, executionId, languageConfig.extension);
      
      return result;
    } catch (error) {
      // Clean up on error
      try {
        await this.cleanup(userTempDir, executionId, languageConfig.extension);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      // If compiler/interpreter not found, provide helpful error
      if (error.message.includes('ENOENT') || error.message.includes('not found')) {
        return {
          output: '',
          error: `${languageConfig.name} interpreter/compiler not found. Please install ${languageConfig.name} to run code in this language.`,
          executionTime: 0
        };
      }
      
      throw error;
    }
  }

  async executeJavaScript(code, timeout) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        // Create a safe execution context
        const originalConsoleLog = console.log;
        let output = '';
        
        // Override console.log to capture output
        console.log = (...args) => {
          output += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') + '\n';
        };
        
        // Set timeout
        const timeoutId = setTimeout(() => {
          console.log = originalConsoleLog;
          resolve({
            output,
            error: 'Execution timed out',
            executionTime: Date.now() - startTime
          });
        }, timeout);
        
        try {
          // Use eval in a try-catch for simple JavaScript execution
          // Note: This is not secure for production use
          eval(code);
          
          clearTimeout(timeoutId);
          console.log = originalConsoleLog;
          
          resolve({
            output,
            error: '',
            executionTime: Date.now() - startTime
          });
        } catch (error) {
          clearTimeout(timeoutId);
          console.log = originalConsoleLog;
          
          resolve({
            output,
            error: error.message,
            executionTime: Date.now() - startTime
          });
        }
      } catch (error) {
        resolve({
          output: '',
          error: `JavaScript execution error: ${error.message}`,
          executionTime: Date.now() - startTime
        });
      }
    });
  }

  async executePython(code, timeout, userId) {
    const executionId = uuidv4();
    const userTempDir = path.join(this.tempDir, userId || 'anonymous');
    
    try {
      await fs.mkdir(userTempDir, { recursive: true });
      
      const filename = `${executionId}.py`;
      const filepath = path.join(userTempDir, filename);
      
      await fs.writeFile(filepath, code, 'utf8');
      
      const result = await this.runCode({ command: 'python', args: [] }, filepath, timeout);
      
      await this.cleanup(userTempDir, executionId, 'py');
      
      return result;
    } catch (error) {
      try {
        await this.cleanup(userTempDir, executionId, 'py');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      if (error.message.includes('ENOENT') || error.message.includes('not found')) {
        return {
          output: '',
          error: 'Python interpreter not found. Please install Python to run Python code.',
          executionTime: 0
        };
      }
      
      throw error;
    }
  }

  async executeJavaScript(code, timeout) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        // Create a safe execution context
        const originalConsoleLog = console.log;
        let output = '';
        
        // Override console.log to capture output
        console.log = (...args) => {
          output += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') + '\n';
        };
        
        // Set timeout
        const timeoutId = setTimeout(() => {
          console.log = originalConsoleLog;
          resolve({
            output,
            error: 'Execution timed out',
            executionTime: Date.now() - startTime
          });
        }, timeout);
        
        try {
          // Use eval in a try-catch for simple JavaScript execution
          // Note: This is not secure for production use
          eval(code);
          
          clearTimeout(timeoutId);
          console.log = originalConsoleLog;
          
          resolve({
            output,
            error: '',
            executionTime: Date.now() - startTime
          });
        } catch (error) {
          clearTimeout(timeoutId);
          console.log = originalConsoleLog;
          
          resolve({
            output,
            error: error.message,
            executionTime: Date.now() - startTime
          });
        }
      } catch (error) {
        resolve({
          output: '',
          error: `JavaScript execution error: ${error.message}`,
          executionTime: Date.now() - startTime
        });
      }
    });
  }

  async executePython(code, timeout, userId) {
    const executionId = uuidv4();
    const userTempDir = path.join(this.tempDir, userId || 'anonymous');
    
    try {
      await fs.mkdir(userTempDir, { recursive: true });
      
      const filename = `${executionId}.py`;
      const filepath = path.join(userTempDir, filename);
      
      await fs.writeFile(filepath, code, 'utf8');
      
      const result = await this.runCode({ command: 'python', args: [] }, filepath, timeout);
      
      await this.cleanup(userTempDir, executionId, 'py');
      
      return result;
    } catch (error) {
      try {
        await this.cleanup(userTempDir, executionId, 'py');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      if (error.message.includes('ENOENT') || error.message.includes('not found')) {
        return {
          output: '',
          error: 'Python interpreter not found. Please install Python to run Python code.',
          executionTime: 0
        };
      }
      
      throw error;
    }
  }

  async compileAndRun(languageConfig, filepath, workingDir, executionId, timeout) {
    // Compile step
    const compileResult = await this.compile(languageConfig, filepath, workingDir, executionId);
    
    if (compileResult.error) {
      return {
        output: '',
        error: compileResult.error,
        executionTime: compileResult.executionTime
      };
    }
    
    // Run step
    const executablePath = this.getExecutablePath(languageConfig, workingDir, executionId);
    const runResult = await this.runExecutable(languageConfig, executablePath, workingDir, timeout);
    
    return {
      output: runResult.output,
      error: runResult.error,
      executionTime: compileResult.executionTime + runResult.executionTime
    };
  }

  async compile(languageConfig, filepath, workingDir, executionId) {
    const startTime = Date.now();
    
    let args = [...languageConfig.args];
    
    if (languageConfig.id === 'java') {
      args = [filepath];
    } else if (languageConfig.id === 'cpp' || languageConfig.id === 'rust') {
      const executablePath = this.getExecutablePath(languageConfig, workingDir, executionId);
      args = [...args, executablePath, filepath];
    } else if (languageConfig.id === 'csharp') {
      args = [filepath];
    }
    
    return new Promise((resolve) => {
      const process = spawn(languageConfig.command, args, {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        
        if (code !== 0) {
          resolve({
            output: stdout,
            error: stderr || `Compilation failed with exit code ${code}`,
            executionTime
          });
        } else {
          resolve({
            output: stdout,
            error: '',
            executionTime
          });
        }
      });
      
      process.on('error', (error) => {
        resolve({
          output: '',
          error: `Compilation error: ${error.message}`,
          executionTime: Date.now() - startTime
        });
      });
    });
  }

  async runCode(languageConfig, filepath, timeout) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const args = [...languageConfig.args, filepath];
      const process = spawn(languageConfig.command, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      let isTimeout = false;
      
      const timeoutId = setTimeout(() => {
        isTimeout = true;
        process.kill('SIGKILL');
      }, timeout);
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        clearTimeout(timeoutId);
        const executionTime = Date.now() - startTime;
        
        if (isTimeout) {
          resolve({
            output: stdout,
            error: 'Execution timed out',
            executionTime
          });
        } else {
          resolve({
            output: stdout,
            error: stderr,
            executionTime
          });
        }
      });
      
      process.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          output: '',
          error: `Execution error: ${error.message}`,
          executionTime: Date.now() - startTime
        });
      });
    });
  }

  async runExecutable(languageConfig, executablePath, workingDir, timeout) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      let command, args;
      
      if (languageConfig.id === 'java') {
        // For Java, run the class file
        const className = path.basename(executablePath, '.class');
        command = 'java';
        args = [className];
      } else if (languageConfig.id === 'csharp') {
        command = languageConfig.runCommand;
        args = [executablePath];
      } else {
        command = executablePath;
        args = [];
      }
      
      const process = spawn(command, args, {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      let isTimeout = false;
      
      const timeoutId = setTimeout(() => {
        isTimeout = true;
        process.kill('SIGKILL');
      }, timeout);
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        clearTimeout(timeoutId);
        const executionTime = Date.now() - startTime;
        
        if (isTimeout) {
          resolve({
            output: stdout,
            error: 'Execution timed out',
            executionTime
          });
        } else {
          resolve({
            output: stdout,
            error: stderr,
            executionTime
          });
        }
      });
      
      process.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          output: '',
          error: `Execution error: ${error.message}`,
          executionTime: Date.now() - startTime
        });
      });
    });
  }

  getExecutablePath(languageConfig, workingDir, executionId) {
    if (languageConfig.id === 'java') {
      return path.join(workingDir, `${executionId}.class`);
    } else if (languageConfig.id === 'csharp') {
      return path.join(workingDir, `${executionId}.exe`);
    } else {
      return path.join(workingDir, 'program');
    }
  }

  async cleanup(workingDir, executionId, extension) {
    try {
      const patterns = [
        `${executionId}.${extension}`,
        `${executionId}.class`,
        `${executionId}.exe`,
        'program'
      ];
      
      for (const pattern of patterns) {
        try {
          await fs.unlink(path.join(workingDir, pattern));
        } catch (error) {
          // File might not exist, ignore
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default new CodeExecutionService();