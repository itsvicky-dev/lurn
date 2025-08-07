import express from 'express';
import CodingGame from '../models/CodingGame.js';
import GameSession from '../models/GameSession.js';
import GameProgress from '../models/GameProgress.js';
import { authenticate } from '../middleware/auth.js';
import codeExecutionService from '../services/codeExecutionService.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// Get all coding games with optional filters
router.get('/coding', authenticate, async (req, res) => {
  try {
    const { type, difficulty, language, category } = req.query;
    
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (language) filter.language = language;
    if (category) filter.category = category;
    
    const games = await CodingGame.find(filter)
      .select('-solution') // Don't send solution to client
      .sort({ difficulty: 1, createdAt: -1 });
    
    res.json({ games });
  } catch (error) {
    console.error('Error fetching coding games:', error);
    res.status(500).json({ message: 'Failed to fetch coding games' });
  }
});

// Get specific coding game
router.get('/coding/:gameId', authenticate, async (req, res) => {
  try {
    const game = await CodingGame.findById(req.params.gameId)
      .select('-solution'); // Don't send solution to client
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json({ game });
  } catch (error) {
    console.error('Error fetching coding game:', error);
    res.status(500).json({ message: 'Failed to fetch coding game' });
  }
});

// Start a new game session
router.post('/coding/:gameId/start', authenticate, async (req, res) => {
  try {
    const game = await CodingGame.findById(req.params.gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if user has an active session for this game
    let session = await GameSession.findOne({
      userId: req.user.id,
      gameId: req.params.gameId,
      status: 'in_progress'
    });
    
    if (!session) {
      // Create new session
      session = new GameSession({
        userId: req.user.id,
        gameId: req.params.gameId,
        code: game.starterCode || '',
        status: 'in_progress'
      });
      
      await session.save();
    }
    
    res.json({ session });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ message: 'Failed to start game' });
  }
});

// Submit solution for a game session
router.post('/sessions/:sessionId/submit', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    
    const session = await GameSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id
    }).populate('gameId');
    
    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }
    
    if (session.status !== 'in_progress') {
      return res.status(400).json({ message: 'Game session is not active' });
    }
    
    const game = session.gameId;
    session.code = code;
    session.attempts += 1;
    
    // Test the code against test cases
    const testResults = [];
    let allTestsPassed = true;
    
    for (let i = 0; i < game.testCases.length; i++) {
      const testCase = game.testCases[i];
      
      try {
        const startTime = Date.now();
        const result = await codeExecutionService.executeCode(game.language, code, {
          input: testCase.input,
          userId: req.user.id
        });
        const executionTime = Date.now() - startTime;
        
        const passed = result.output && result.output.trim() === testCase.expectedOutput.trim();
        
        testResults.push({
          testCaseIndex: i,
          passed,
          actualOutput: result.output || '',
          expectedOutput: testCase.expectedOutput,
          executionTime,
          error: result.error || null
        });
        
        if (!passed) {
          allTestsPassed = false;
        }
      } catch (error) {
        testResults.push({
          testCaseIndex: i,
          passed: false,
          actualOutput: '',
          expectedOutput: testCase.expectedOutput,
          executionTime: 0,
          error: error.message
        });
        allTestsPassed = false;
      }
    }
    
    session.testResults = testResults;
    
    if (allTestsPassed) {
      session.status = 'completed';
      session.completedAt = new Date();
      session.calculateScore();
      
      // Update user's game progress
      let progress = await GameProgress.findOne({ userId: req.user.id });
      if (!progress) {
        progress = new GameProgress({ userId: req.user.id });
      }
      
      await progress.updateAfterGame(session, game);
    } else {
      session.status = 'failed';
    }
    
    await session.save();
    
    res.json({ session });
  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({ message: 'Failed to submit solution' });
  }
});

// Use a hint
router.post('/sessions/:sessionId/hint', authenticate, async (req, res) => {
  try {
    const { hintIndex } = req.body;
    
    const session = await GameSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id
    }).populate('gameId');
    
    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }
    
    if (session.status !== 'in_progress') {
      return res.status(400).json({ message: 'Game session is not active' });
    }
    
    const game = session.gameId;
    
    if (hintIndex >= game.hints.length) {
      return res.status(400).json({ message: 'Invalid hint index' });
    }
    
    session.hintsUsed += 1;
    await session.save();
    
    res.json({ 
      hint: game.hints[hintIndex],
      hintsUsed: session.hintsUsed,
      totalHints: game.hints.length
    });
  } catch (error) {
    console.error('Error using hint:', error);
    res.status(500).json({ message: 'Failed to use hint' });
  }
});

// Abandon game session
router.post('/sessions/:sessionId/abandon', authenticate, async (req, res) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Game session not found' });
    }
    
    session.status = 'abandoned';
    await session.save();
    
    res.json({ message: 'Game abandoned successfully' });
  } catch (error) {
    console.error('Error abandoning game:', error);
    res.status(500).json({ message: 'Failed to abandon game' });
  }
});

// Get user's game progress
router.get('/progress', authenticate, async (req, res) => {
  try {
    let progress = await GameProgress.findOne({ userId: req.user.id });
    
    if (!progress) {
      progress = new GameProgress({ userId: req.user.id });
      await progress.save();
    }
    
    // Reset period stats if needed
    progress.resetPeriodStats();
    await progress.save();
    
    res.json({ progress });
  } catch (error) {
    console.error('Error fetching game progress:', error);
    res.status(500).json({ message: 'Failed to fetch game progress' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    
    let sortField = 'totalPoints';
    let gamesField = 'totalGamesCompleted';
    
    switch (period) {
      case 'daily':
        // For daily, we'll use weekly stats but filter by today
        sortField = 'weeklyPoints';
        gamesField = 'weeklyGamesCompleted';
        break;
      case 'weekly':
        sortField = 'weeklyPoints';
        gamesField = 'weeklyGamesCompleted';
        break;
      case 'monthly':
        sortField = 'monthlyPoints';
        gamesField = 'monthlyGamesCompleted';
        break;
      case 'all_time':
      default:
        sortField = 'totalPoints';
        gamesField = 'totalGamesCompleted';
        break;
    }
    
    const leaderboardData = await GameProgress.find({})
      .populate('userId', 'firstName lastName avatar')
      .sort({ [sortField]: -1 })
      .limit(50);
    
    const entries = leaderboardData.map((progress, index) => ({
      rank: index + 1,
      userId: progress.userId._id,
      userName: `${progress.userId.firstName} ${progress.userId.lastName}`,
      avatar: progress.userId.avatar,
      score: progress[sortField],
      gamesCompleted: progress[gamesField],
      averageTime: 0 // TODO: Calculate average completion time
    }));
    
    const leaderboard = {
      period,
      entries
    };
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

// Get user's game sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    
    const sessions = await GameSession.find(filter)
      .populate('gameId', 'title type difficulty language points')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching game sessions:', error);
    res.status(500).json({ message: 'Failed to fetch game sessions' });
  }
});

// Admin route to create sample games (for development)
router.post('/admin/seed', authenticate, async (req, res) => {
  try {
    // Check if user is admin (you might want to add proper admin middleware)
    // For now, we'll allow anyone to seed in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const sampleGames = [
      {
        title: "Two Sum",
        description: "Given an array of integers and a target sum, return indices of two numbers that add up to the target.",
        type: "code_challenge",
        difficulty: "easy",
        language: "javascript",
        category: "Arrays",
        estimatedTime: 15,
        points: 100,
        instructions: "Write a function that takes an array of numbers and a target sum, then returns the indices of two numbers that add up to the target.",
        starterCode: `function twoSum(nums, target) {
    // Your code here
}`,
        solution: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
        testCases: [
          {
            input: "twoSum([2,7,11,15], 9)",
            expectedOutput: "[0,1]",
            description: "Basic test case",
            isHidden: false
          },
          {
            input: "twoSum([3,2,4], 6)",
            expectedOutput: "[1,2]",
            description: "Another test case",
            isHidden: false
          }
        ],
        hints: [
          "Try using a hash map to store numbers you've seen",
          "For each number, check if its complement exists in the map"
        ],
        tags: ["arrays", "hash-map", "easy"],
        prerequisites: [],
        isUnlocked: true
      },
      {
        title: "Bug Hunt: Array Filter",
        description: "Find and fix the bug in this array filtering function",
        type: "bug_hunt",
        difficulty: "easy",
        language: "javascript",
        category: "Debugging",
        estimatedTime: 10,
        points: 80,
        instructions: "The function below should filter out even numbers and return only odd numbers, but it has a bug. Find and fix it!",
        starterCode: `function filterOddNumbers(numbers) {
    return numbers.filter(num => num % 2 == 0);
}`,
        solution: `function filterOddNumbers(numbers) {
    return numbers.filter(num => num % 2 !== 0);
}`,
        testCases: [
          {
            input: "filterOddNumbers([1,2,3,4,5])",
            expectedOutput: "[1,3,5]",
            description: "Filter odd numbers from mixed array",
            isHidden: false
          },
          {
            input: "filterOddNumbers([2,4,6,8])",
            expectedOutput: "[]",
            description: "All even numbers should return empty array",
            isHidden: false
          }
        ],
        hints: [
          "Look at the condition in the filter function",
          "What does num % 2 == 0 actually check for?"
        ],
        tags: ["debugging", "arrays", "filter"],
        prerequisites: [],
        isUnlocked: true
      },
      {
        title: "Code Completion: Fibonacci",
        description: "Complete the Fibonacci sequence function",
        type: "code_completion",
        difficulty: "medium",
        language: "javascript",
        category: "Algorithms",
        estimatedTime: 20,
        points: 150,
        instructions: "Complete the function to generate the nth Fibonacci number. The sequence starts with 0, 1, 1, 2, 3, 5, 8...",
        starterCode: `function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    
    // Complete the recursive or iterative solution here
    // Hint: fib(n) = fib(n-1) + fib(n-2)
    
}`,
        solution: `function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        let temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
        testCases: [
          {
            input: "fibonacci(0)",
            expectedOutput: "0",
            description: "Base case: 0th Fibonacci number",
            isHidden: false
          },
          {
            input: "fibonacci(5)",
            expectedOutput: "5",
            description: "5th Fibonacci number",
            isHidden: false
          },
          {
            input: "fibonacci(10)",
            expectedOutput: "55",
            description: "10th Fibonacci number",
            isHidden: true
          }
        ],
        hints: [
          "You can solve this recursively or iteratively",
          "Iterative solution is more efficient for large numbers",
          "Keep track of the previous two numbers in the sequence"
        ],
        tags: ["algorithms", "recursion", "dynamic-programming"],
        prerequisites: [],
        isUnlocked: true
      },
      {
        title: "Syntax Puzzle: Object Destructuring",
        description: "Fix the syntax errors in this object destructuring code",
        type: "syntax_puzzle",
        difficulty: "easy",
        language: "javascript",
        category: "ES6",
        estimatedTime: 8,
        points: 70,
        instructions: "The code below has syntax errors related to object destructuring. Fix them to make the function work correctly.",
        starterCode: `function getUserInfo(user) {
    const { name, age, email: userEmail } = user;
    const { street, city } = user.address;
    
    return {
        fullName: name,
        years: age,
        contact: userEmail,
        location: \`\${street}, \${city}\`
    };
}`,
        solution: `function getUserInfo(user) {
    const { name, age, email: userEmail } = user;
    const { street, city } = user.address;
    
    return {
        fullName: name,
        years: age,
        contact: userEmail,
        location: \`\${street}, \${city}\`
    };
}`,
        testCases: [
          {
            input: `getUserInfo({
  name: "John Doe",
  age: 30,
  email: "john@example.com",
  address: { street: "123 Main St", city: "New York" }
})`,
            expectedOutput: `{"fullName":"John Doe","years":30,"contact":"john@example.com","location":"123 Main St, New York"}`,
            description: "Extract user information",
            isHidden: false
          }
        ],
        hints: [
          "Check the object destructuring syntax",
          "Make sure all variable names are correctly assigned",
          "Look at the template literal syntax"
        ],
        tags: ["syntax", "destructuring", "es6"],
        prerequisites: [],
        isUnlocked: true
      },
      {
        title: "Algorithm Race: Quick Sort",
        description: "Implement the quicksort algorithm as fast as possible!",
        type: "algorithm_race",
        difficulty: "hard",
        language: "javascript",
        category: "Sorting",
        estimatedTime: 25,
        points: 250,
        instructions: "Implement the quicksort algorithm. You'll be scored based on correctness and time to completion!",
        starterCode: `function quickSort(arr) {
    // Implement quicksort algorithm here
    // Base case: arrays with 0 or 1 element are already sorted
    
    // Choose a pivot element
    
    // Partition the array around the pivot
    
    // Recursively sort the sub-arrays
    
    return arr;
}`,
        solution: `function quickSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }
    
    const pivot = arr[Math.floor(arr.length / 2)];
    const left = [];
    const right = [];
    const equal = [];
    
    for (let element of arr) {
        if (element < pivot) {
            left.push(element);
        } else if (element > pivot) {
            right.push(element);
        } else {
            equal.push(element);
        }
    }
    
    return [...quickSort(left), ...equal, ...quickSort(right)];
}`,
        testCases: [
          {
            input: "quickSort([3,6,8,10,1,2,1])",
            expectedOutput: "[1,1,2,3,6,8,10]",
            description: "Sort array with duplicates",
            isHidden: false
          },
          {
            input: "quickSort([5,4,3,2,1])",
            expectedOutput: "[1,2,3,4,5]",
            description: "Reverse sorted array",
            isHidden: false
          },
          {
            input: "quickSort([])",
            expectedOutput: "[]",
            description: "Empty array",
            isHidden: true
          }
        ],
        hints: [
          "Choose a good pivot element (middle element works well)",
          "Partition the array into elements less than, equal to, and greater than the pivot",
          "Recursively sort the left and right partitions"
        ],
        tags: ["algorithms", "sorting", "recursion", "divide-conquer"],
        prerequisites: [],
        isUnlocked: true
      },
      {
        title: "JavaScript Fundamentals Quiz",
        description: "Test your knowledge of JavaScript fundamentals with this interactive quiz",
        type: "quiz",
        difficulty: "easy",
        language: "javascript",
        category: "Fundamentals",
        estimatedTime: 10,
        points: 150,
        instructions: "Answer questions about JavaScript basics. Each question has a time limit!",
        solution: "", // Not applicable for quiz
        testCases: [], // Not applicable for quiz
        hints: [],
        tags: ["javascript", "fundamentals", "quiz"],
        prerequisites: [],
        isUnlocked: true,
        questions: [
          {
            question: "What is the correct way to declare a variable in JavaScript?",
            type: "multiple_choice",
            options: ["var x = 5;", "variable x = 5;", "v x = 5;", "declare x = 5;"],
            correctAnswer: "var x = 5;",
            explanation: "In JavaScript, variables are declared using 'var', 'let', or 'const' keywords.",
            difficulty: "easy",
            points: 25,
            timeLimit: 30
          },
          {
            question: "JavaScript is a compiled language.",
            type: "true_false",
            options: ["True", "False"],
            correctAnswer: "False",
            explanation: "JavaScript is an interpreted language, not compiled.",
            difficulty: "easy",
            points: 25,
            timeLimit: 20
          },
          {
            question: "What does 'typeof null' return in JavaScript?",
            type: "multiple_choice",
            options: ["null", "undefined", "object", "string"],
            correctAnswer: "object",
            explanation: "This is a well-known quirk in JavaScript - typeof null returns 'object'.",
            difficulty: "medium",
            points: 50,
            timeLimit: 45
          },
          {
            question: "Which method adds an element to the end of an array?",
            type: "multiple_choice",
            options: ["push()", "pop()", "shift()", "unshift()"],
            correctAnswer: "push()",
            explanation: "The push() method adds one or more elements to the end of an array.",
            difficulty: "easy",
            points: 25,
            timeLimit: 30
          },
          {
            question: "What is the output of: console.log(1 + '2' + 3)?",
            type: "short_answer",
            correctAnswer: "123",
            explanation: "JavaScript converts numbers to strings when concatenating with strings, so 1 + '2' becomes '12', then + 3 becomes '123'.",
            difficulty: "medium",
            points: 50,
            timeLimit: 60
          }
        ],
        timeLimit: 300 // 5 minutes total
      },
      {
        title: "Python Basics: List Comprehensions",
        description: "Master Python list comprehensions with this coding challenge",
        type: "code_challenge",
        difficulty: "medium",
        language: "python",
        category: "Python Basics",
        estimatedTime: 15,
        points: 120,
        instructions: "Create a function that uses list comprehension to filter and transform data. Return a list of squares of even numbers from the input list.",
        starterCode: `def square_evens(numbers):
    # Use list comprehension to return squares of even numbers
    # Example: [1,2,3,4,5] should return [4,16]
    pass`,
        solution: `def square_evens(numbers):
    return [x**2 for x in numbers if x % 2 == 0]`,
        testCases: [
          {
            input: "square_evens([1,2,3,4,5,6])",
            expectedOutput: "[4, 16, 36]",
            description: "Mixed odd and even numbers",
            isHidden: false
          },
          {
            input: "square_evens([1,3,5,7])",
            expectedOutput: "[]",
            description: "All odd numbers",
            isHidden: false
          },
          {
            input: "square_evens([2,4,6,8])",
            expectedOutput: "[4, 16, 36, 64]",
            description: "All even numbers",
            isHidden: true
          }
        ],
        hints: [
          "List comprehension syntax: [expression for item in iterable if condition]",
          "Use x**2 to square a number",
          "Use x % 2 == 0 to check if a number is even"
        ],
        tags: ["python", "list-comprehension", "filtering"],
        prerequisites: [],
        isUnlocked: true
      },
      {
        title: "CSS Flexbox Challenge",
        description: "Create a responsive layout using CSS Flexbox",
        type: "code_challenge",
        difficulty: "medium",
        language: "css",
        category: "CSS Layout",
        estimatedTime: 20,
        points: 140,
        instructions: "Create CSS rules to make a responsive navigation bar using Flexbox. The nav should have items evenly spaced with the logo on the left and menu items on the right.",
        starterCode: `.navbar {
    /* Add your flexbox styles here */
}

.logo {
    /* Logo styles */
}

.nav-items {
    /* Navigation items container */
}

.nav-item {
    /* Individual nav item styles */
}`,
        solution: `.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
}

.logo {
    font-weight: bold;
    font-size: 1.5rem;
}

.nav-items {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-item {
    cursor: pointer;
    transition: color 0.3s ease;
}`,
        testCases: [
          {
            input: "Check if .navbar has display: flex",
            expectedOutput: "true",
            description: "Navbar should use flexbox",
            isHidden: false
          },
          {
            input: "Check if .navbar has justify-content: space-between",
            expectedOutput: "true",
            description: "Items should be spaced apart",
            isHidden: false
          }
        ],
        hints: [
          "Use display: flex on the navbar container",
          "Use justify-content: space-between to separate logo and menu",
          "Use align-items: center for vertical alignment"
        ],
        tags: ["css", "flexbox", "layout", "responsive"],
        prerequisites: [],
        isUnlocked: true
      },
      {
        title: "React Hooks Quiz",
        description: "Test your knowledge of React Hooks",
        type: "quiz",
        difficulty: "medium",
        language: "javascript",
        category: "React",
        estimatedTime: 12,
        points: 200,
        instructions: "Answer questions about React Hooks and their usage patterns.",
        solution: "",
        testCases: [],
        hints: [],
        tags: ["react", "hooks", "quiz"],
        prerequisites: [],
        isUnlocked: true,
        questions: [
          {
            question: "Which hook is used to manage state in functional components?",
            type: "multiple_choice",
            options: ["useEffect", "useState", "useContext", "useReducer"],
            correctAnswer: "useState",
            explanation: "useState is the primary hook for managing state in functional components.",
            difficulty: "easy",
            points: 30,
            timeLimit: 30
          },
          {
            question: "useEffect runs after every render by default.",
            type: "true_false",
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "useEffect runs after every completed render, unless you provide a dependency array.",
            difficulty: "medium",
            points: 40,
            timeLimit: 45
          },
          {
            question: "What is the correct way to update state that depends on the previous state?",
            type: "multiple_choice",
            options: [
              "setState(prevState + 1)",
              "setState(prev => prev + 1)",
              "setState(state + 1)",
              "setState(++state)"
            ],
            correctAnswer: "setState(prev => prev + 1)",
            explanation: "When updating state based on previous state, use the functional update pattern to ensure you get the latest state value.",
            difficulty: "medium",
            points: 50,
            timeLimit: 60
          }
        ],
        timeLimit: 240
      }
    ];
    
    // Clear existing games
    await CodingGame.deleteMany({});
    
    // Insert sample games
    const games = await CodingGame.insertMany(sampleGames);
    
    res.json({ 
      message: 'Sample games created successfully',
      count: games.length,
      games: games.map(g => ({ id: g._id, title: g.title, type: g.type }))
    });
  } catch (error) {
    console.error('Error seeding games:', error);
    res.status(500).json({ message: 'Failed to seed games' });
  }
});

// AI Game Generation endpoint
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { 
      type, 
      difficulty, 
      language, 
      category, 
      topic,
      estimatedTime = 15,
      customRequirements 
    } = req.body;

    // Validate required fields
    if (!type || !difficulty || !language) {
      return res.status(400).json({ 
        message: 'Type, difficulty, and language are required' 
      });
    }

    // Validate game type
    const validTypes = ['code_challenge', 'bug_hunt', 'code_completion', 'syntax_puzzle', 'algorithm_race', 'quiz'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: `Invalid game type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ 
        message: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}` 
      });
    }

    console.log(`Generating ${type} game for ${language} at ${difficulty} level...`);

    // Generate the game using AI
    const gameData = await generateGameWithAI({
      type,
      difficulty,
      language,
      category: category || 'General',
      topic: topic || 'Programming Fundamentals',
      estimatedTime,
      customRequirements
    });

    // Create and save the game
    const game = new CodingGame({
      ...gameData,
      createdBy: req.user.id,
      isActive: true
    });

    await game.save();

    res.json({ 
      message: 'Game generated successfully',
      game: {
        id: game._id,
        title: game.title,
        type: game.type,
        difficulty: game.difficulty,
        language: game.language,
        category: game.category,
        estimatedTime: game.estimatedTime,
        points: game.points
      }
    });

  } catch (error) {
    console.error('Error generating game:', error);
    res.status(500).json({ 
      message: 'Failed to generate game',
      error: error.message 
    });
  }
});

// Helper function to generate game content using AI
async function generateGameWithAI(params) {
  const { type, difficulty, language, category, topic, estimatedTime, customRequirements } = params;

  let systemPrompt = '';
  let userPrompt = '';

  // Base points calculation
  const basePoints = {
    easy: 100,
    medium: 150,
    hard: 200
  };

  const points = basePoints[difficulty] + (estimatedTime * 2);

  if (type === 'quiz') {
    systemPrompt = `You are an expert programming instructor creating educational quizzes. Generate a comprehensive coding quiz that tests knowledge effectively.`;
    
    userPrompt = `Create a ${difficulty} level ${language} programming quiz about ${topic} in the ${category} category.

Requirements:
- Generate 5-8 questions of varying types (multiple choice, true/false)
- Each question should test different aspects of ${topic}
- Include clear explanations for correct answers
- Set appropriate time limits for each question (15-60 seconds)
- Make questions progressively challenging
- Estimated completion time: ${estimatedTime} minutes
${customRequirements ? `- Additional requirements: ${customRequirements}` : ''}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Quiz title",
  "description": "Brief description of what the quiz covers",
  "type": "quiz",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "category": "${category}",
  "estimatedTime": ${estimatedTime},
  "points": ${points},
  "instructions": "Clear instructions for taking the quiz",
  "solution": "N/A - Quiz type",
  "testCases": [],
  "hints": [],
  "tags": ["tag1", "tag2", "tag3"],
  "prerequisites": [],
  "questions": [
    {
      "question": "Question text",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Correct option",
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard",
      "points": 25,
      "timeLimit": 30
    }
  ],
  "timeLimit": 300
}`;

  } else if (type === 'code_challenge') {
    systemPrompt = `You are an expert programming instructor creating coding challenges. Generate practical, educational coding problems with proper test cases.`;
    
    userPrompt = `Create a ${difficulty} level ${language} coding challenge about ${topic} in the ${category} category.

Requirements:
- Create a clear, well-defined problem
- Provide starter code template
- Include complete working solution
- Generate 4-6 comprehensive test cases (mix of visible and hidden)
- Add 3-4 helpful hints
- Estimated completion time: ${estimatedTime} minutes
${customRequirements ? `- Additional requirements: ${customRequirements}` : ''}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Challenge title",
  "description": "Clear problem description",
  "type": "code_challenge",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "category": "${category}",
  "estimatedTime": ${estimatedTime},
  "points": ${points},
  "instructions": "Step-by-step instructions",
  "starterCode": "// Starter code template",
  "solution": "// Complete working solution",
  "testCases": [
    {
      "input": "function_call_or_input",
      "expectedOutput": "expected_result",
      "description": "Test case description",
      "isHidden": false
    }
  ],
  "hints": ["Hint 1", "Hint 2", "Hint 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "prerequisites": []
}`;

  } else if (type === 'bug_hunt') {
    systemPrompt = `You are an expert programming instructor creating bug hunting exercises. Generate code with realistic, educational bugs for students to find and fix.`;
    
    userPrompt = `Create a ${difficulty} level ${language} bug hunting exercise about ${topic} in the ${category} category.

Requirements:
- Provide buggy code that looks realistic
- Include 2-4 bugs depending on difficulty level
- Create test cases that reveal the bugs
- Provide the corrected solution
- Add hints that guide toward finding bugs
- Estimated completion time: ${estimatedTime} minutes
${customRequirements ? `- Additional requirements: ${customRequirements}` : ''}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Bug Hunt title",
  "description": "Description of what the code should do",
  "type": "bug_hunt",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "category": "${category}",
  "estimatedTime": ${estimatedTime},
  "points": ${points},
  "instructions": "Find and fix the bugs in this code",
  "starterCode": "// Buggy code here",
  "solution": "// Fixed code here",
  "testCases": [
    {
      "input": "test_input",
      "expectedOutput": "correct_output",
      "description": "What this test checks",
      "isHidden": false
    }
  ],
  "hints": ["Hint about bug location/type", "Another hint"],
  "tags": ["debugging", "tag2", "tag3"],
  "prerequisites": []
}`;

  } else if (type === 'code_completion') {
    systemPrompt = `You are an expert programming instructor creating code completion exercises. Generate partially complete code that students need to finish.`;
    
    userPrompt = `Create a ${difficulty} level ${language} code completion exercise about ${topic} in the ${category} category.

Requirements:
- Provide partially complete code with clear TODO sections
- Include comments explaining what needs to be implemented
- Create comprehensive test cases
- Provide complete working solution
- Add helpful hints for completion
- Estimated completion time: ${estimatedTime} minutes
${customRequirements ? `- Additional requirements: ${customRequirements}` : ''}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Code Completion title",
  "description": "What the completed code should accomplish",
  "type": "code_completion",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "category": "${category}",
  "estimatedTime": ${estimatedTime},
  "points": ${points},
  "instructions": "Complete the missing parts of the code",
  "starterCode": "// Partial code with TODO sections",
  "solution": "// Complete working code",
  "testCases": [
    {
      "input": "test_input",
      "expectedOutput": "expected_result",
      "description": "Test description",
      "isHidden": false
    }
  ],
  "hints": ["Hint for completion", "Another hint"],
  "tags": ["completion", "tag2", "tag3"],
  "prerequisites": []
}`;

  } else {
    // For other types like syntax_puzzle, algorithm_race
    systemPrompt = `You are an expert programming instructor creating ${type.replace('_', ' ')} exercises. Generate engaging, educational programming challenges.`;
    
    userPrompt = `Create a ${difficulty} level ${language} ${type.replace('_', ' ')} exercise about ${topic} in the ${category} category.

Requirements:
- Create an appropriate challenge for the ${type} format
- Provide starter code if applicable
- Include working solution
- Generate relevant test cases
- Add helpful hints
- Estimated completion time: ${estimatedTime} minutes
${customRequirements ? `- Additional requirements: ${customRequirements}` : ''}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Exercise title",
  "description": "Clear description",
  "type": "${type}",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "category": "${category}",
  "estimatedTime": ${estimatedTime},
  "points": ${points},
  "instructions": "Clear instructions",
  "starterCode": "// Starter code if needed",
  "solution": "// Working solution",
  "testCases": [
    {
      "input": "test_input",
      "expectedOutput": "expected_output",
      "description": "Test description",
      "isHidden": false
    }
  ],
  "hints": ["Helpful hint"],
  "tags": ["relevant", "tags"],
  "prerequisites": []
}`;
  }

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const response = await aiService.generateCompletion(messages, {
      temperature: 0.7,
      max_tokens: 4000
    });

    // Parse the AI response
    let gameData;
    try {
      // Extract JSON from response if it's wrapped in markdown or other text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      gameData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI Response:', response);
      throw new Error('AI generated invalid JSON response');
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'instructions'];
    for (const field of requiredFields) {
      if (!gameData[field]) {
        throw new Error(`AI response missing required field: ${field}`);
      }
    }

    // Ensure arrays exist
    gameData.testCases = gameData.testCases || [];
    gameData.hints = gameData.hints || [];
    gameData.tags = gameData.tags || [];
    gameData.prerequisites = gameData.prerequisites || [];

    // For quiz type, ensure questions exist
    if (type === 'quiz') {
      gameData.questions = gameData.questions || [];
      if (gameData.questions.length === 0) {
        throw new Error('Quiz must have at least one question');
      }
    }

    return gameData;

  } catch (error) {
    console.error('AI game generation error:', error);
    throw new Error(`Failed to generate game with AI: ${error.message}`);
  }
}

export default router;