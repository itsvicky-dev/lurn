import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import tar from 'tar-stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DockerCodeExecutionService {
  constructor() {
    this.docker = new Docker();
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
    
    // Language configurations with Docker images
    this.supportedLanguages = [
      // Scripting Languages
      {
        id: 'javascript',
        name: 'JavaScript',
        extension: 'js',
        runnable: true,
        dockerImage: 'node:18-alpine',
        command: ['node'],
        category: 'scripting',
        description: 'JavaScript runtime with Node.js',
        memoryLimit: '128m',
        timeout: 10000
      },
      {
        id: 'python',
        name: 'Python',
        extension: 'py',
        runnable: true,
        dockerImage: 'python:3.11-alpine',
        command: ['python'],
        category: 'scripting',
        description: 'Python interpreter',
        memoryLimit: '128m',
        timeout: 10000
      },
      {
        id: 'ruby',
        name: 'Ruby',
        extension: 'rb',
        runnable: true,
        dockerImage: 'ruby:3.2-alpine',
        command: ['ruby'],
        category: 'scripting',
        description: 'Ruby interpreter',
        memoryLimit: '128m',
        timeout: 10000
      },
      {
        id: 'php',
        name: 'PHP',
        extension: 'php',
        runnable: true,
        dockerImage: 'php:8.2-cli-alpine',
        command: ['php'],
        category: 'scripting',
        description: 'PHP interpreter',
        memoryLimit: '128m',
        timeout: 10000
      },
      {
        id: 'go',
        name: 'Go',
        extension: 'go',
        runnable: true,
        dockerImage: 'golang:1.21-alpine',
        command: ['go', 'run'],
        category: 'compiled',
        description: 'Go compiler and runtime',
        memoryLimit: '256m',
        timeout: 15000
      },
      {
        id: 'rust',
        name: 'Rust',
        extension: 'rs',
        runnable: true,
        dockerImage: 'rust:1.75-alpine',
        command: ['sh', '-c'],
        compileCommand: 'rustc main.rs -o main && ./main',
        category: 'compiled',
        description: 'Rust compiler',
        memoryLimit: '256m',
        timeout: 20000
      },
      {
        id: 'java',
        name: 'Java',
        extension: 'java',
        runnable: true,
        dockerImage: 'openjdk:17-alpine',
        command: ['sh', '-c'],
        compileCommand: 'javac Main.java && java Main',
        category: 'compiled',
        description: 'Java compiler and runtime',
        memoryLimit: '256m',
        timeout: 20000
      },
      {
        id: 'cpp',
        name: 'C++',
        extension: 'cpp',
        runnable: true,
        dockerImage: 'gcc:12-alpine',
        command: ['sh', '-c'],
        compileCommand: 'g++ -o main main.cpp && ./main',
        category: 'compiled',
        description: 'C++ compiler (GCC)',
        memoryLimit: '256m',
        timeout: 20000
      },
      {
        id: 'c',
        name: 'C',
        extension: 'c',
        runnable: true,
        dockerImage: 'gcc:12-alpine',
        command: ['sh', '-c'],
        compileCommand: 'gcc -o main main.c && ./main',
        category: 'compiled',
        description: 'C compiler (GCC)',
        memoryLimit: '256m',
        timeout: 20000
      },
      {
        id: 'csharp',
        name: 'C#',
        extension: 'cs',
        runnable: true,
        dockerImage: 'mcr.microsoft.com/dotnet/sdk:7.0-alpine',
        command: ['sh', '-c'],
        compileCommand: 'dotnet new console --force && cp Program.cs Program.cs.bak && cp main.cs Program.cs && dotnet run',
        category: 'compiled',
        description: 'C# compiler (.NET)',
        memoryLimit: '512m',
        timeout: 30000
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        extension: 'ts',
        runnable: true,
        dockerImage: 'node:18-alpine',
        command: ['sh', '-c'],
        compileCommand: 'npm install -g typescript && tsc main.ts && node main.js',
        category: 'scripting',
        description: 'TypeScript compiler and runtime',
        memoryLimit: '256m',
        timeout: 20000
      },
      {
        id: 'swift',
        name: 'Swift',
        extension: 'swift',
        runnable: true,
        dockerImage: 'swift:5.9-focal',
        command: ['swift'],
        category: 'compiled',
        description: 'Swift compiler',
        memoryLimit: '256m',
        timeout: 20000
      },
      {
        id: 'kotlin',
        name: 'Kotlin',
        extension: 'kt',
        runnable: true,
        dockerImage: 'zenika/kotlin:1.9-jdk17-alpine',
        command: ['sh', '-c'],
        compileCommand: 'kotlinc main.kt -include-runtime -d main.jar && java -jar main.jar',
        category: 'compiled',
        description: 'Kotlin compiler',
        memoryLimit: '512m',
        timeout: 30000
      },
      {
        id: 'scala',
        name: 'Scala',
        extension: 'scala',
        runnable: true,
        dockerImage: 'hseeberger/scala-sbt:17.0.2_1.6.2_3.1.1',
        command: ['scala'],
        category: 'compiled',
        description: 'Scala interpreter',
        memoryLimit: '512m',
        timeout: 30000
      },
      {
        id: 'r',
        name: 'R',
        extension: 'r',
        runnable: true,
        dockerImage: 'r-base:4.3.2',
        command: ['Rscript'],
        category: 'statistical',
        description: 'R statistical computing',
        memoryLimit: '256m',
        timeout: 15000
      },
      {
        id: 'lua',
        name: 'Lua',
        extension: 'lua',
        runnable: true,
        dockerImage: 'nickblah/lua:5.4-alpine',
        command: ['lua'],
        category: 'scripting',
        description: 'Lua interpreter',
        memoryLimit: '128m',
        timeout: 10000
      },
      {
        id: 'dart',
        name: 'Dart',
        extension: 'dart',
        runnable: true,
        dockerImage: 'dart:3.2-sdk',
        command: ['dart', 'run'],
        category: 'compiled',
        description: 'Dart runtime',
        memoryLimit: '256m',
        timeout: 15000
      },
      {
        id: 'perl',
        name: 'Perl',
        extension: 'pl',
        runnable: true,
        dockerImage: 'perl:5.38-slim',
        command: ['perl'],
        category: 'scripting',
        description: 'Perl interpreter',
        memoryLimit: '128m',
        timeout: 10000
      },
      {
        id: 'bash',
        name: 'Bash',
        extension: 'sh',
        runnable: true,
        dockerImage: 'bash:5.2-alpine3.18',
        command: ['bash'],
        category: 'scripting',
        description: 'Bash shell script',
        memoryLimit: '64m',
        timeout: 10000
      },
      
      // Non-executable languages for syntax highlighting only
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
        id: 'sql',
        name: 'SQL',
        extension: 'sql',
        runnable: false,
        category: 'database',
        description: 'Structured Query Language'
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
        id: 'xml',
        name: 'XML',
        extension: 'xml',
        runnable: false,
        category: 'markup',
        description: 'eXtensible Markup Language'
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
    const { timeout, userId } = options;
    
    const languageConfig = this.supportedLanguages.find(lang => lang.id === language);
    if (!languageConfig || !languageConfig.runnable) {
      throw new Error(`Language ${language} is not supported or not runnable`);
    }

    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      // Check if Docker is available
      await this.docker.ping();
    } catch (error) {
      console.warn('Docker not available, falling back to local execution');
      return await this.fallbackExecution(language, code, options);
    }

    try {
      // Create execution context
      const result = await this.executeInDocker(languageConfig, code, executionId, {
        timeout: timeout || languageConfig.timeout,
        userId
      });

      return {
        ...result,
        executionTime: Date.now() - startTime,
        executionId,
        language: languageConfig.name
      };
    } catch (error) {
      console.error(`Docker execution error for ${language}:`, error);
      
      // Fallback to local execution if Docker fails
      if (error.message.includes('Docker') || error.message.includes('container')) {
        console.warn('Docker execution failed, falling back to local execution');
        return await this.fallbackExecution(language, code, options);
      }
      
      throw error;
    }
  }

  async executeInDocker(languageConfig, code, executionId, options) {
    const { timeout, userId } = options;
    
    // Prepare the filename based on language requirements
    let filename = `main.${languageConfig.extension}`;
    if (languageConfig.id === 'java') {
      filename = 'Main.java'; // Java requires class name to match filename
    }

    // Create tar stream with the code file
    const tarStream = this.createTarStream(filename, code, languageConfig);
    
    // Determine the command to run
    let cmd;
    if (languageConfig.compileCommand) {
      cmd = [languageConfig.command[0], languageConfig.command[1], languageConfig.compileCommand];
    } else {
      cmd = [...languageConfig.command, filename];
    }

    // Create and run container
    const container = await this.docker.createContainer({
      Image: languageConfig.dockerImage,
      Cmd: cmd,
      WorkingDir: '/app',
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: false,
      Tty: false,
      NetworkMode: 'none', // No network access for security
      Memory: this.parseMemoryLimit(languageConfig.memoryLimit),
      MemorySwap: this.parseMemoryLimit(languageConfig.memoryLimit), // Same as memory to prevent swap
      CpuQuota: 50000, // Limit CPU usage to 50%
      CpuPeriod: 100000,
      PidsLimit: 50, // Limit number of processes
      ReadonlyRootfs: false, // Some compilers need write access
      User: 'nobody', // Run as non-root user when possible
      SecurityOpt: ['no-new-privileges:true'],
      CapDrop: ['ALL'], // Drop all capabilities
      Ulimits: [
        { Name: 'nofile', Soft: 64, Hard: 64 }, // Limit file descriptors
        { Name: 'nproc', Soft: 32, Hard: 32 }   // Limit processes
      ]
    });

    try {
      // Put the tar stream into the container
      await container.putArchive(tarStream, { path: '/app' });

      // Start the container
      await container.start();

      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Execution timed out'));
        }, timeout);
      });

      // Wait for container to finish or timeout
      const resultPromise = container.wait();
      
      let result;
      try {
        result = await Promise.race([resultPromise, timeoutPromise]);
      } catch (error) {
        // Kill container if it times out
        try {
          await container.kill();
        } catch (killError) {
          console.error('Error killing container:', killError);
        }
        throw error;
      }

      // Get logs
      const logStream = await container.logs({
        stdout: true,
        stderr: true,
        timestamps: false
      });

      const logs = logStream.toString('utf8');
      
      // Parse stdout and stderr
      const output = this.parseDockerLogs(logs);

      return {
        output: output.stdout,
        error: output.stderr,
        exitCode: result.StatusCode
      };

    } finally {
      // Clean up container
      try {
        await container.remove({ force: true });
      } catch (error) {
        console.error('Error removing container:', error);
      }
    }
  }

  createTarStream(filename, code, languageConfig) {
    const pack = tar.pack();
    
    // Add the main code file
    pack.entry({ name: filename }, code);
    
    // Add additional files for specific languages
    if (languageConfig.id === 'csharp') {
      // Create a basic .csproj file for C#
      const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net7.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`;
      pack.entry({ name: 'Program.csproj' }, csprojContent);
    }
    
    pack.finalize();
    return pack;
  }

  parseMemoryLimit(memoryStr) {
    if (!memoryStr) return 134217728; // 128MB default
    
    const match = memoryStr.match(/^(\d+)([kmg]?)$/i);
    if (!match) return 134217728;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'k': return value * 1024;
      case 'm': return value * 1024 * 1024;
      case 'g': return value * 1024 * 1024 * 1024;
      default: return value;
    }
  }

  parseDockerLogs(logs) {
    // Docker logs format: 8 bytes header + payload
    // First byte indicates stream type (1=stdout, 2=stderr)
    let stdout = '';
    let stderr = '';
    
    try {
      let offset = 0;
      while (offset < logs.length) {
        if (offset + 8 > logs.length) break;
        
        const streamType = logs[offset];
        const size = logs.readUInt32BE(offset + 4);
        
        if (offset + 8 + size > logs.length) break;
        
        const content = logs.slice(offset + 8, offset + 8 + size).toString('utf8');
        
        if (streamType === 1) {
          stdout += content;
        } else if (streamType === 2) {
          stderr += content;
        }
        
        offset += 8 + size;
      }
    } catch (error) {
      // If parsing fails, treat entire log as stdout
      stdout = logs.toString('utf8');
    }
    
    return { stdout: stdout.trim(), stderr: stderr.trim() };
  }

  async fallbackExecution(language, code, options) {
    // Import the original service for fallback
    const { default: originalService } = await import('./codeExecutionService.js');
    return await originalService.executeCode(language, code, options);
  }

  async pullRequiredImages() {
    console.log('Pulling required Docker images for code execution...');
    
    const runnableLanguages = this.supportedLanguages.filter(lang => lang.runnable);
    const images = [...new Set(runnableLanguages.map(lang => lang.dockerImage))];
    
    for (const image of images) {
      try {
        console.log(`Pulling ${image}...`);
        await this.docker.pull(image);
        console.log(`✓ ${image} pulled successfully`);
      } catch (error) {
        console.warn(`⚠ Failed to pull ${image}:`, error.message);
      }
    }
    
    console.log('Docker image pulling completed');
  }

  async checkDockerAvailability() {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getSystemInfo() {
    try {
      const info = await this.docker.info();
      return {
        dockerAvailable: true,
        containers: info.Containers,
        images: info.Images,
        memoryLimit: info.MemTotal,
        cpus: info.NCPU
      };
    } catch (error) {
      return {
        dockerAvailable: false,
        error: error.message
      };
    }
  }
}

export default new DockerCodeExecutionService();