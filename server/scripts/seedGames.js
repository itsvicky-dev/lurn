import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingGame from '../src/models/CodingGame.js';

// Load environment variables
dotenv.config();

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
    instructions: `Write a function that takes an array of numbers and a target sum, then returns the indices of two numbers that add up to the target.

Example:
- Input: nums = [2,7,11,15], target = 9
- Output: [0,1] (because nums[0] + nums[1] = 2 + 7 = 9)

Constraints:
- Each input would have exactly one solution
- You may not use the same element twice`,
    starterCode: `function twoSum(nums, target) {
    // Your code here
    
}

// Test your function
console.log(twoSum([2,7,11,15], 9)); // Should return [0,1]`,
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
        description: "Different indices",
        isHidden: false
      },
      {
        input: "twoSum([3,3], 6)",
        expectedOutput: "[0,1]",
        description: "Same numbers",
        isHidden: true
      }
    ],
    hints: [
      "Try using a hash map to store numbers you've seen",
      "For each number, check if its complement (target - current number) exists in the map",
      "Remember to store the index, not just the number"
    ],
    tags: ["arrays", "hash-map", "easy", "leetcode"],
    prerequisites: []
  },
  {
    title: "Palindrome Check",
    description: "Write a function to check if a given string is a palindrome (reads the same forwards and backwards).",
    type: "code_challenge",
    difficulty: "easy",
    language: "javascript",
    category: "Strings",
    estimatedTime: 10,
    points: 80,
    instructions: `Write a function that checks if a string is a palindrome.

A palindrome is a word, phrase, number, or other sequence of characters that reads the same forward and backward.

Example:
- "racecar" → true
- "hello" → false
- "A man a plan a canal Panama" → true (ignoring spaces and case)

Requirements:
- Ignore spaces and punctuation
- Case insensitive`,
    starterCode: `function isPalindrome(str) {
    // Your code here
    
}

// Test your function
console.log(isPalindrome("racecar")); // Should return true
console.log(isPalindrome("hello")); // Should return false`,
    solution: `function isPalindrome(str) {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
}`,
    testCases: [
      {
        input: 'isPalindrome("racecar")',
        expectedOutput: "true",
        description: "Simple palindrome",
        isHidden: false
      },
      {
        input: 'isPalindrome("hello")',
        expectedOutput: "false",
        description: "Not a palindrome",
        isHidden: false
      },
      {
        input: 'isPalindrome("A man a plan a canal Panama")',
        expectedOutput: "true",
        description: "Complex palindrome with spaces",
        isHidden: true
      }
    ],
    hints: [
      "Convert the string to lowercase first",
      "Remove all non-alphanumeric characters",
      "Compare the string with its reverse"
    ],
    tags: ["strings", "palindrome", "easy"],
    prerequisites: []
  },
  {
    title: "FizzBuzz",
    description: "Write a program that prints numbers from 1 to n, but replaces multiples of 3 with 'Fizz', multiples of 5 with 'Buzz', and multiples of both with 'FizzBuzz'.",
    type: "code_challenge",
    difficulty: "easy",
    language: "javascript",
    category: "Logic",
    estimatedTime: 12,
    points: 90,
    instructions: `Write a function that returns an array of strings representing the FizzBuzz sequence from 1 to n.

Rules:
- For multiples of 3: return "Fizz"
- For multiples of 5: return "Buzz"  
- For multiples of both 3 and 5: return "FizzBuzz"
- For all other numbers: return the number as a string

Example: fizzBuzz(15) should return:
["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]`,
    starterCode: `function fizzBuzz(n) {
    // Your code here
    
}

// Test your function
console.log(fizzBuzz(15));`,
    solution: `function fizzBuzz(n) {
    const result = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) {
            result.push("FizzBuzz");
        } else if (i % 3 === 0) {
            result.push("Fizz");
        } else if (i % 5 === 0) {
            result.push("Buzz");
        } else {
            result.push(i.toString());
        }
    }
    return result;
}`,
    testCases: [
      {
        input: "fizzBuzz(15)",
        expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
        description: "Standard FizzBuzz test",
        isHidden: false
      },
      {
        input: "fizzBuzz(5)",
        expectedOutput: '["1","2","Fizz","4","Buzz"]',
        description: "Smaller range",
        isHidden: false
      }
    ],
    hints: [
      "Use the modulo operator (%) to check divisibility",
      "Check for multiples of 15 first (both 3 and 5)",
      "Remember to convert numbers to strings"
    ],
    tags: ["logic", "loops", "modulo", "easy"],
    prerequisites: []
  },
  {
    title: "Reverse String",
    description: "Write a function that reverses a string without using built-in reverse methods.",
    type: "code_challenge",
    difficulty: "easy",
    language: "javascript",
    category: "Strings",
    estimatedTime: 8,
    points: 70,
    instructions: `Write a function that reverses a string without using the built-in reverse() method.

Example:
- Input: "hello"
- Output: "olleh"

Challenge: Try to do it in-place if possible, or use a loop instead of built-in methods.`,
    starterCode: `function reverseString(str) {
    // Your code here - don't use str.split('').reverse().join('')!
    
}

// Test your function
console.log(reverseString("hello")); // Should return "olleh"`,
    solution: `function reverseString(str) {
    let reversed = '';
    for (let i = str.length - 1; i >= 0; i--) {
        reversed += str[i];
    }
    return reversed;
}`,
    testCases: [
      {
        input: 'reverseString("hello")',
        expectedOutput: '"olleh"',
        description: "Basic string reversal",
        isHidden: false
      },
      {
        input: 'reverseString("JavaScript")',
        expectedOutput: '"tpircSavaJ"',
        description: "Longer string",
        isHidden: false
      },
      {
        input: 'reverseString("a")',
        expectedOutput: '"a"',
        description: "Single character",
        isHidden: true
      }
    ],
    hints: [
      "Use a loop to iterate through the string backwards",
      "Build the result character by character",
      "Start from the last index and work towards 0"
    ],
    tags: ["strings", "loops", "easy"],
    prerequisites: []
  },
  {
    title: "Find Maximum Number",
    description: "Write a function that finds the maximum number in an array without using Math.max().",
    type: "code_challenge",
    difficulty: "easy",
    language: "javascript",
    category: "Arrays",
    estimatedTime: 10,
    points: 75,
    instructions: `Write a function that finds the maximum number in an array without using Math.max().

Example:
- Input: [3, 7, 2, 9, 1]
- Output: 9

Handle edge cases:
- Empty array should return undefined
- Array with one element should return that element`,
    starterCode: `function findMax(numbers) {
    // Your code here - don't use Math.max()!
    
}

// Test your function
console.log(findMax([3, 7, 2, 9, 1])); // Should return 9`,
    solution: `function findMax(numbers) {
    if (numbers.length === 0) return undefined;
    
    let max = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] > max) {
            max = numbers[i];
        }
    }
    return max;
}`,
    testCases: [
      {
        input: "findMax([3, 7, 2, 9, 1])",
        expectedOutput: "9",
        description: "Array with positive numbers",
        isHidden: false
      },
      {
        input: "findMax([-5, -2, -10, -1])",
        expectedOutput: "-1",
        description: "Array with negative numbers",
        isHidden: false
      },
      {
        input: "findMax([])",
        expectedOutput: "undefined",
        description: "Empty array",
        isHidden: true
      }
    ],
    hints: [
      "Start by assuming the first element is the maximum",
      "Loop through the rest of the array and compare each element",
      "Update your maximum whenever you find a larger number"
    ],
    tags: ["arrays", "loops", "comparison", "easy"],
    prerequisites: []
  },
  {
    title: "JavaScript Fundamentals Quiz",
    description: "Test your knowledge of JavaScript basics including variables, functions, and data types.",
    type: "quiz",
    difficulty: "easy",
    language: "javascript",
    category: "Fundamentals",
    estimatedTime: 10,
    points: 150,
    instructions: "Answer questions about JavaScript fundamentals. Each question has a time limit, so think carefully but don't take too long!",
    solution: "", // Not applicable for quiz
    testCases: [], // Not applicable for quiz
    hints: [],
    tags: ["javascript", "fundamentals", "quiz", "variables", "functions"],
    prerequisites: [],
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
        explanation: "JavaScript is an interpreted language, not compiled. It's executed directly by the browser or Node.js runtime.",
        difficulty: "easy",
        points: 25,
        timeLimit: 20
      },
      {
        question: "What does 'typeof null' return in JavaScript?",
        type: "multiple_choice",
        options: ["null", "undefined", "object", "string"],
        correctAnswer: "object",
        explanation: "This is a well-known quirk in JavaScript - typeof null returns 'object' due to a bug in the original implementation.",
        difficulty: "medium",
        points: 50,
        timeLimit: 45
      },
      {
        question: "Which method is used to add an element to the end of an array?",
        type: "multiple_choice",
        options: ["push()", "pop()", "shift()", "unshift()"],
        correctAnswer: "push()",
        explanation: "The push() method adds one or more elements to the end of an array and returns the new length.",
        difficulty: "easy",
        points: 25,
        timeLimit: 30
      },
      {
        question: "What will 'console.log(2 + '2')' output?",
        type: "multiple_choice",
        options: ["4", "22", "NaN", "Error"],
        correctAnswer: "22",
        explanation: "JavaScript performs type coercion. The number 2 is converted to a string and concatenated with '2', resulting in '22'.",
        difficulty: "medium",
        points: 25,
        timeLimit: 40
      }
    ],
    timeLimit: 300 // 5 minutes total
  },
  {
    title: "Binary Search",
    description: "Implement the binary search algorithm to find a target value in a sorted array.",
    type: "code_challenge",
    difficulty: "medium",
    language: "javascript",
    category: "Algorithms",
    estimatedTime: 20,
    points: 150,
    instructions: `Implement binary search to find the index of a target value in a sorted array.

Binary search works by:
1. Compare target with middle element
2. If target equals middle, return the index
3. If target is less than middle, search left half
4. If target is greater than middle, search right half
5. Repeat until found or search space is empty

Return the index if found, -1 if not found.

Example:
- Input: nums = [1,3,5,7,9,11], target = 7
- Output: 3 (index of 7 in the array)`,
    starterCode: `function binarySearch(nums, target) {
    // Your code here
    
}

// Test your function
console.log(binarySearch([1,3,5,7,9,11], 7)); // Should return 3`,
    solution: `function binarySearch(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}`,
    testCases: [
      {
        input: "binarySearch([1,3,5,7,9,11], 7)",
        expectedOutput: "3",
        description: "Target found in middle",
        isHidden: false
      },
      {
        input: "binarySearch([1,3,5,7,9,11], 1)",
        expectedOutput: "0",
        description: "Target at beginning",
        isHidden: false
      },
      {
        input: "binarySearch([1,3,5,7,9,11], 12)",
        expectedOutput: "-1",
        description: "Target not found",
        isHidden: true
      }
    ],
    hints: [
      "Use two pointers: left and right to define the search space",
      "Calculate the middle index as Math.floor((left + right) / 2)",
      "Update left or right based on comparison with middle element"
    ],
    tags: ["algorithms", "binary-search", "arrays", "medium"],
    prerequisites: ["arrays", "loops"]
  },
  {
    title: "Fibonacci Sequence",
    description: "Generate the nth number in the Fibonacci sequence efficiently.",
    type: "code_challenge",
    difficulty: "medium",
    language: "javascript",
    category: "Algorithms",
    estimatedTime: 15,
    points: 120,
    instructions: `Write a function that returns the nth number in the Fibonacci sequence.

The Fibonacci sequence starts with 0 and 1, and each subsequent number is the sum of the two preceding ones:
0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...

Example:
- fibonacci(0) → 0
- fibonacci(1) → 1  
- fibonacci(6) → 8

Try to implement an efficient solution (avoid simple recursion for large numbers).`,
    starterCode: `function fibonacci(n) {
    // Your code here
    
}

// Test your function
console.log(fibonacci(6)); // Should return 8`,
    solution: `function fibonacci(n) {
    if (n <= 1) return n;
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        const temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
    testCases: [
      {
        input: "fibonacci(0)",
        expectedOutput: "0",
        description: "Base case: F(0)",
        isHidden: false
      },
      {
        input: "fibonacci(1)",
        expectedOutput: "1",
        description: "Base case: F(1)",
        isHidden: false
      },
      {
        input: "fibonacci(6)",
        expectedOutput: "8",
        description: "F(6) = 8",
        isHidden: false
      },
      {
        input: "fibonacci(10)",
        expectedOutput: "55",
        description: "Larger number",
        isHidden: true
      }
    ],
    hints: [
      "Handle base cases: F(0) = 0, F(1) = 1",
      "Use iteration instead of recursion for efficiency",
      "Keep track of the last two numbers in the sequence"
    ],
    tags: ["algorithms", "fibonacci", "dynamic-programming", "medium"],
    prerequisites: ["loops", "variables"]
  }
];

async function seedGames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing games
    await CodingGame.deleteMany({});
    console.log('Cleared existing games');

    // Insert sample games
    const games = await CodingGame.insertMany(sampleGames);
    console.log(`✅ Successfully seeded ${games.length} games:`);
    
    games.forEach(game => {
      console.log(`  - ${game.title} (${game.type}, ${game.difficulty})`);
    });

    console.log('\n🎮 Games are ready! You can now:');
    console.log('  1. Visit the Games page in your app');
    console.log('  2. Try the coding challenges');
    console.log('  3. Take the JavaScript quiz');
    console.log('  4. Check the leaderboard');

  } catch (error) {
    console.error('❌ Error seeding games:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedGames();