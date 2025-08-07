class CodeTemplateService {
  constructor() {
    this.templates = {
      // Scripting Languages
      javascript: {
        hello: `console.log("Hello, World!");`,
        variables: `// Variables and data types
let name = "JavaScript";
let version = 2024;
let isAwesome = true;
let numbers = [1, 2, 3, 4, 5];
let person = { name: "John", age: 30 };

console.log(\`Hello from \${name}!\`);
console.log("Version:", version);
console.log("Is awesome:", isAwesome);
console.log("Numbers:", numbers);
console.log("Person:", person);`,
        functions: `// Functions
function greet(name) {
    return \`Hello, \${name}!\`;
}

const add = (a, b) => a + b;

// Arrow function with multiple lines
const multiply = (a, b) => {
    const result = a * b;
    return result;
};

console.log(greet("World"));
console.log("5 + 3 =", add(5, 3));
console.log("4 * 6 =", multiply(4, 6));`,
        loops: `// Loops and iteration
const numbers = [1, 2, 3, 4, 5];

// For loop
for (let i = 0; i < numbers.length; i++) {
    console.log(\`Index \${i}: \${numbers[i]}\`);
}

// For...of loop
for (const num of numbers) {
    console.log("Number:", num);
}

// Array methods
numbers.forEach((num, index) => {
    console.log(\`Item \${index}: \${num}\`);
});

// Map and filter
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);

console.log("Doubled:", doubled);
console.log("Even numbers:", evens);`
      },

      python: {
        hello: `print("Hello, World!")`,
        variables: `# Variables and data types
name = "Python"
version = 3.12
is_awesome = True
numbers = [1, 2, 3, 4, 5]
person = {"name": "John", "age": 30}

print(f"Hello from {name}!")
print("Version:", version)
print("Is awesome:", is_awesome)
print("Numbers:", numbers)
print("Person:", person)`,
        functions: `# Functions
def greet(name):
    return f"Hello, {name}!"

def add(a, b):
    return a + b

# Lambda function
multiply = lambda a, b: a * b

# Function with default parameters
def power(base, exponent=2):
    return base ** exponent

print(greet("World"))
print("5 + 3 =", add(5, 3))
print("4 * 6 =", multiply(4, 6))
print("2^3 =", power(2, 3))
print("5^2 =", power(5))`,
        loops: `# Loops and iteration
numbers = [1, 2, 3, 4, 5]

# For loop with range
for i in range(len(numbers)):
    print(f"Index {i}: {numbers[i]}")

# For loop with enumerate
for index, num in enumerate(numbers):
    print(f"Item {index}: {num}")

# List comprehensions
doubled = [n * 2 for n in numbers]
evens = [n for n in numbers if n % 2 == 0]

print("Doubled:", doubled)
print("Even numbers:", evens)

# While loop
count = 0
while count < 3:
    print(f"Count: {count}")
    count += 1`
      },

      java: {
        hello: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
        variables: `public class Variables {
    public static void main(String[] args) {
        // Variables and data types
        String name = "Java";
        int version = 21;
        boolean isAwesome = true;
        int[] numbers = {1, 2, 3, 4, 5};
        
        System.out.println("Hello from " + name + "!");
        System.out.println("Version: " + version);
        System.out.println("Is awesome: " + isAwesome);
        System.out.print("Numbers: ");
        for (int num : numbers) {
            System.out.print(num + " ");
        }
        System.out.println();
    }
}`,
        functions: `public class Functions {
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
    
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int multiply(int a, int b) {
        return a * b;
    }
    
    public static void main(String[] args) {
        System.out.println(greet("World"));
        System.out.println("5 + 3 = " + add(5, 3));
        System.out.println("4 * 6 = " + multiply(4, 6));
    }
}`,
        loops: `public class Loops {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3, 4, 5};
        
        // Traditional for loop
        for (int i = 0; i < numbers.length; i++) {
            System.out.println("Index " + i + ": " + numbers[i]);
        }
        
        // Enhanced for loop
        for (int num : numbers) {
            System.out.println("Number: " + num);
        }
        
        // While loop
        int count = 0;
        while (count < 3) {
            System.out.println("Count: " + count);
            count++;
        }
    }
}`
      },

      cpp: {
        hello: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
        variables: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    // Variables and data types
    string name = "C++";
    int version = 23;
    bool isAwesome = true;
    vector<int> numbers = {1, 2, 3, 4, 5};
    
    cout << "Hello from " << name << "!" << endl;
    cout << "Version: " << version << endl;
    cout << "Is awesome: " << (isAwesome ? "true" : "false") << endl;
    cout << "Numbers: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    return 0;
}`,
        functions: `#include <iostream>
#include <string>
using namespace std;

string greet(string name) {
    return "Hello, " + name + "!";
}

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}

int main() {
    cout << greet("World") << endl;
    cout << "5 + 3 = " << add(5, 3) << endl;
    cout << "4 * 6 = " << multiply(4, 6) << endl;
    
    return 0;
}`,
        loops: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> numbers = {1, 2, 3, 4, 5};
    
    // Traditional for loop
    for (int i = 0; i < numbers.size(); i++) {
        cout << "Index " << i << ": " << numbers[i] << endl;
    }
    
    // Range-based for loop (C++11)
    for (int num : numbers) {
        cout << "Number: " << num << endl;
    }
    
    // While loop
    int count = 0;
    while (count < 3) {
        cout << "Count: " << count << endl;
        count++;
    }
    
    return 0;
}`
      },

      go: {
        hello: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
        variables: `package main

import "fmt"

func main() {
    // Variables and data types
    name := "Go"
    version := 1.21
    isAwesome := true
    numbers := []int{1, 2, 3, 4, 5}
    
    fmt.Printf("Hello from %s!\\n", name)
    fmt.Printf("Version: %.2f\\n", version)
    fmt.Printf("Is awesome: %t\\n", isAwesome)
    fmt.Printf("Numbers: %v\\n", numbers)
}`,
        functions: `package main

import "fmt"

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func add(a, b int) int {
    return a + b
}

func multiply(a, b int) int {
    return a * b
}

func main() {
    fmt.Println(greet("World"))
    fmt.Printf("5 + 3 = %d\\n", add(5, 3))
    fmt.Printf("4 * 6 = %d\\n", multiply(4, 6))
}`,
        loops: `package main

import "fmt"

func main() {
    numbers := []int{1, 2, 3, 4, 5}
    
    // Traditional for loop
    for i := 0; i < len(numbers); i++ {
        fmt.Printf("Index %d: %d\\n", i, numbers[i])
    }
    
    // Range loop
    for index, num := range numbers {
        fmt.Printf("Item %d: %d\\n", index, num)
    }
    
    // While-style loop
    count := 0
    for count < 3 {
        fmt.Printf("Count: %d\\n", count)
        count++
    }
}`
      },

      rust: {
        hello: `fn main() {
    println!("Hello, World!");
}`,
        variables: `fn main() {
    // Variables and data types
    let name = "Rust";
    let version = 1.75;
    let is_awesome = true;
    let numbers = vec![1, 2, 3, 4, 5];
    
    println!("Hello from {}!", name);
    println!("Version: {}", version);
    println!("Is awesome: {}", is_awesome);
    println!("Numbers: {:?}", numbers);
}`,
        functions: `fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    println!("{}", greet("World"));
    println!("5 + 3 = {}", add(5, 3));
    println!("4 * 6 = {}", multiply(4, 6));
}`,
        loops: `fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    
    // Traditional for loop with index
    for i in 0..numbers.len() {
        println!("Index {}: {}", i, numbers[i]);
    }
    
    // Iterator loop
    for (index, num) in numbers.iter().enumerate() {
        println!("Item {}: {}", index, num);
    }
    
    // While loop
    let mut count = 0;
    while count < 3 {
        println!("Count: {}", count);
        count += 1;
    }
}`
      },

      csharp: {
        hello: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
        variables: `using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        // Variables and data types
        string name = "C#";
        int version = 12;
        bool isAwesome = true;
        int[] numbers = {1, 2, 3, 4, 5};
        
        Console.WriteLine($"Hello from {name}!");
        Console.WriteLine($"Version: {version}");
        Console.WriteLine($"Is awesome: {isAwesome}");
        Console.WriteLine($"Numbers: [{string.Join(", ", numbers)}]");
    }
}`,
        functions: `using System;

class Program {
    static string Greet(string name) {
        return $"Hello, {name}!";
    }
    
    static int Add(int a, int b) {
        return a + b;
    }
    
    static int Multiply(int a, int b) {
        return a * b;
    }
    
    static void Main() {
        Console.WriteLine(Greet("World"));
        Console.WriteLine($"5 + 3 = {Add(5, 3)}");
        Console.WriteLine($"4 * 6 = {Multiply(4, 6)}");
    }
}`,
        loops: `using System;

class Program {
    static void Main() {
        int[] numbers = {1, 2, 3, 4, 5};
        
        // Traditional for loop
        for (int i = 0; i < numbers.Length; i++) {
            Console.WriteLine($"Index {i}: {numbers[i]}");
        }
        
        // Foreach loop
        foreach (int num in numbers) {
            Console.WriteLine($"Number: {num}");
        }
        
        // While loop
        int count = 0;
        while (count < 3) {
            Console.WriteLine($"Count: {count}");
            count++;
        }
    }
}`
      },

      php: {
        hello: `<?php
echo "Hello, World!\\n";
?>`,
        variables: `<?php
// Variables and data types
$name = "PHP";
$version = 8.3;
$isAwesome = true;
$numbers = [1, 2, 3, 4, 5];
$person = ["name" => "John", "age" => 30];

echo "Hello from $name!\\n";
echo "Version: $version\\n";
echo "Is awesome: " . ($isAwesome ? "true" : "false") . "\\n";
echo "Numbers: " . implode(", ", $numbers) . "\\n";
echo "Person: " . json_encode($person) . "\\n";
?>`,
        functions: `<?php
function greet($name) {
    return "Hello, $name!";
}

function add($a, $b) {
    return $a + $b;
}

function multiply($a, $b) {
    return $a * $b;
}

echo greet("World") . "\\n";
echo "5 + 3 = " . add(5, 3) . "\\n";
echo "4 * 6 = " . multiply(4, 6) . "\\n";
?>`,
        loops: `<?php
$numbers = [1, 2, 3, 4, 5];

// Traditional for loop
for ($i = 0; $i < count($numbers); $i++) {
    echo "Index $i: {$numbers[$i]}\\n";
}

// Foreach loop
foreach ($numbers as $index => $num) {
    echo "Item $index: $num\\n";
}

// While loop
$count = 0;
while ($count < 3) {
    echo "Count: $count\\n";
    $count++;
}
?>`
      },

      ruby: {
        hello: `puts "Hello, World!"`,
        variables: `# Variables and data types
name = "Ruby"
version = 3.2
is_awesome = true
numbers = [1, 2, 3, 4, 5]
person = { name: "John", age: 30 }

puts "Hello from #{name}!"
puts "Version: #{version}"
puts "Is awesome: #{is_awesome}"
puts "Numbers: #{numbers}"
puts "Person: #{person}"`,
        functions: `# Functions (methods)
def greet(name)
  "Hello, #{name}!"
end

def add(a, b)
  a + b
end

def multiply(a, b)
  a * b
end

puts greet("World")
puts "5 + 3 = #{add(5, 3)}"
puts "4 * 6 = #{multiply(4, 6)}"`,
        loops: `# Loops and iteration
numbers = [1, 2, 3, 4, 5]

# Each with index
numbers.each_with_index do |num, index|
  puts "Index #{index}: #{num}"
end

# Each loop
numbers.each do |num|
  puts "Number: #{num}"
end

# Times loop
3.times do |count|
  puts "Count: #{count}"
end

# Map and select
doubled = numbers.map { |n| n * 2 }
evens = numbers.select { |n| n.even? }

puts "Doubled: #{doubled}"
puts "Even numbers: #{evens}"`
      }
    };
  }

  getTemplate(language, templateType = 'hello') {
    const languageTemplates = this.templates[language];
    if (!languageTemplates) {
      return this.getDefaultTemplate(language);
    }
    
    return languageTemplates[templateType] || languageTemplates.hello || this.getDefaultTemplate(language);
  }

  getDefaultTemplate(language) {
    const comments = {
      javascript: '// ',
      python: '# ',
      java: '// ',
      cpp: '// ',
      c: '// ',
      go: '// ',
      rust: '// ',
      csharp: '// ',
      php: '// ',
      ruby: '# ',
      bash: '# ',
      perl: '# ',
      r: '# ',
      lua: '-- ',
      sql: '-- ',
      html: '<!-- ',
      css: '/* ',
      xml: '<!-- '
    };

    const comment = comments[language] || '// ';
    const ending = language === 'html' || language === 'xml' ? ' -->' : '';
    
    return `${comment}Welcome to ${language.charAt(0).toUpperCase() + language.slice(1)}!${ending}
${comment}Start coding here...${ending}`;
  }

  getAvailableTemplates(language) {
    const languageTemplates = this.templates[language];
    if (!languageTemplates) {
      return ['hello'];
    }
    
    return Object.keys(languageTemplates);
  }

  getAllLanguageTemplates() {
    return Object.keys(this.templates);
  }
}

export default new CodeTemplateService();