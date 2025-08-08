# Lurn - Full-Stack Learning Platform

A comprehensive AI-powered tutoring platform built with React, Node.js, MongoDB, and OpenRouter API integration.

## Features

### 🎯 User Onboarding & Personalization
- Comprehensive onboarding flow to capture learning preferences
- Subject selection, skill level assessment, and learning style preferences
- AI tutor personality customization
- Dynamic learning path generation based on preferences

### 📚 Intelligent Learning Flow
- AI-generated structured learning paths with modules and topics
- Content generation on-demand to avoid unnecessary API calls
- Progress tracking with completion status for each topic/module
- Adaptive difficulty based on user performance

### 💬 Interactive AI Chat
- Real-time AI chat integration in learning spaces
- Context-aware responses based on current topic/module
- Socket.IO powered real-time messaging
- Personalized responses based on tutor personality settings

### 💻 Advanced Code Playground
- **Docker-Based Execution**: Secure, sandboxed code execution in isolated containers
- **Multi-Language Support**: JavaScript, Python, Java, C++, C#, Go, Rust, PHP, Ruby, and more
- **AI-Powered Assistance**: Code explanation, suggestions, and comprehensive code reviews
- **Real-Time Execution**: See results immediately with proper error handling
- **Template System**: Pre-built code templates for quick learning
- **Security Features**: Resource limits, timeouts, and network isolation

### 🎨 Rich Learning Content
- Real-world code examples with explanations
- Visual aids and diagrams
- Interactive quizzes with instant feedback
- Markdown-based content rendering with syntax highlighting

### 🔄 Enhanced AI Tutor System
- **OpenRouter Integration**: Powered by GPT-4, Claude, and other leading AI models
- **Code-Aware AI**: Specialized assistance for programming learning
- **Adaptive Learning**: Adjusts to learning progress and user behavior
- **Personality-Driven**: Customizable tutor personality (friendly, strict, funny, etc.)
- **Practice Generation**: AI-generated coding exercises and challenges
- **Comprehensive Analytics**: Detailed progress tracking and insights

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Monaco Editor** for code playground
- **Socket.IO Client** for real-time chat
- **React Router** for navigation
- **React Hook Form** for form management
- **React Markdown** for content rendering

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Docker** for secure code execution
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **OpenRouter API** integration for AI responses
- **bcryptjs** for password hashing

### Database
- **MongoDB** for data persistence
- Comprehensive schemas for users, learning paths, modules, topics, and chat sessions

## Project Structure

```
ai-tutor/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Learning)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API and Socket services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── socket/         # Socket.IO handlers
│   │   └── index.js        # Server entry point
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Docker Desktop (for code execution)
- OpenRouter API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-tutor
```

### 2. Docker Setup (Required for Code Execution)
Set up the Docker environment for secure code execution:

**Windows:**
```bash
docker-setup.bat
```

**Linux/Mac:**
```bash
chmod +x docker-setup.sh
./docker-setup.sh
```

### 3. Quick Setup (Windows)
Run the setup script to install all dependencies:
```bash
setup.bat
```

Or run the start script to install and start both server and client:
```bash
start.bat
```

### 4. Manual Setup

#### Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the server directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ai-tutor
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random-for-production
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
NODE_ENV=development

# Docker Configuration
DOCKER_ENABLED=true
DOCKER_NETWORK=ai-tutor-network
DOCKER_TIMEOUT=30000
DOCKER_MEMORY_LIMIT=128m
DOCKER_CPU_LIMIT=0.5
```

Start the backend server:
```bash
npm run dev
```

#### Frontend Setup
```bash
cd client
npm install --legacy-peer-deps
```

Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:3001/api
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Database Setup
The application will automatically create the necessary collections when you start using it. Make sure MongoDB is running on your system.

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MongoDB**: mongodb://localhost:27017/ai-tutor

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### User Management
- `POST /api/user/onboarding` - Complete user onboarding
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/preferences` - Update learning preferences
- `GET /api/user/stats` - Get user statistics

### Learning
- `GET /api/learning/paths` - Get user's learning paths
- `GET /api/learning/paths/:id` - Get specific learning path
- `POST /api/learning/paths` - Create new learning path
- `GET /api/learning/modules/:id` - Get module details
- `GET /api/learning/topics/:id` - Get topic with content
- `POST /api/learning/topics/:id/complete` - Mark topic as completed
- `POST /api/learning/topics/:id/quiz` - Submit quiz answers

### AI Integration
- `POST /api/ai/ask` - Ask AI tutor a question
- `POST /api/ai/explain-code` - Get code explanation
- `POST /api/ai/code-suggestions` - Get code improvement suggestions
- `POST /api/ai/code-review` - Get comprehensive code review
- `POST /api/ai/coding-exercises` - Generate coding exercises
- `POST /api/ai/visual-aids/:topicId` - Generate visual aids
- `POST /api/ai/regenerate-content/:topicId` - Regenerate topic content
- `POST /api/ai/practice-exercises/:topicId` - Generate practice exercises

### Chat
- `GET /api/chat/sessions` - Get user's chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/sessions/:id` - Get specific chat session
- `POST /api/chat/sessions/:id/messages` - Send message
- `PUT /api/chat/sessions/:id` - Update chat session
- `DELETE /api/chat/sessions/:id` - Delete chat session

### Code Execution
- `GET /api/code/languages` - Get supported programming languages
- `POST /api/code/execute` - Execute code in sandboxed environment
- `GET /api/code/template/:language` - Get code template for language
- `GET /api/code/templates/:language` - Get available templates for language
- `GET /api/code/system/status` - Check Docker system status
- `POST /api/code/system/pull-images` - Pull required Docker images

## Socket.IO Events

### Client to Server
- `join_chat_session` - Join a chat session room
- `leave_chat_session` - Leave a chat session room
- `send_message` - Send a message in chat
- `typing` - Indicate user is typing
- `quick_question` - Ask a quick question without creating session

### Server to Client
- `new_message` - New message received
- `ai_typing` - AI is generating response
- `user_typing` - Another user is typing
- `quick_answer` - Response to quick question
- `progress_updated` - Learning progress updated

## Key Features Implementation

### 1. AI Content Generation
The system uses OpenRouter API to generate:
- Structured learning paths based on user preferences
- Detailed topic content with explanations and examples
- Interactive quizzes with multiple question types
- Code examples in various programming languages
- Visual aid suggestions and descriptions

### 2. Personalized Learning Experience
- Tutor personality affects response tone and style
- Learning format preferences influence content presentation
- Skill level determines content complexity and depth
- Progress tracking enables adaptive learning paths

### 3. Real-time Chat System
- WebSocket-based real-time communication
- Context-aware AI responses based on current learning material
- Typing indicators and message status
- Chat history persistence

### 4. Advanced Code Playground
- **Docker-Based Execution**: Secure, sandboxed code execution
- **Multi-Language Support**: 9+ programming languages with real execution
- **AI Integration**: Code explanation, suggestions, and reviews
- **Security Features**: Resource limits, timeouts, network isolation
- **Template System**: Pre-built code templates for learning

### 5. Code Execution System
- **Docker Containers**: Isolated execution environment for each code run
- **Resource Management**: Memory and CPU limits to prevent abuse
- **Security**: No network access, temporary containers, automatic cleanup
- **Fallback Support**: Local execution when Docker is unavailable
- **Real-time Results**: Immediate feedback with proper error handling
- Code sharing and download capabilities

### 5. Progress Tracking
- Granular progress tracking at topic, module, and path levels
- Time spent tracking for analytics
- Completion status with timestamps
- Learning streak calculation

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices with hooks
- Implement proper error handling
- Use consistent naming conventions

### State Management
- React Context for global state (Auth, Learning)
- Local state for component-specific data
- Proper state updates with immutability

### API Design
- RESTful API design principles
- Consistent error response format
- Proper HTTP status codes
- Request validation and sanitization

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Docker-based code execution sandboxing
- Resource limits and timeouts
- Input validation and sanitization
- CORS configuration
- Rate limiting (recommended for production)

## Deployment

### Production Environment Variables
```env
# Server
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-tutor
JWT_SECRET=your-production-jwt-secret
OPENROUTER_API_KEY=your-openrouter-api-key

# Client
VITE_API_URL=https://your-api-domain.com/api
```

### Deployment Steps
1. Build the frontend: `npm run build` in client directory
2. Deploy backend to your preferred platform (Heroku, AWS, etc.)
3. Deploy frontend to static hosting (Vercel, Netlify, etc.)
4. Configure environment variables
5. Set up MongoDB Atlas or your preferred database hosting
6. Set up Docker environment for code execution

## Testing

### Docker Execution Test
Test the Docker-based code execution system:

```bash
# Install test dependencies
npm install axios

# Run the test script
node test-docker-execution.js

# With authentication token
TEST_TOKEN=your_jwt_token node test-docker-execution.js

# Test against different server
SERVER_URL=http://localhost:3000 node test-docker-execution.js
```

The test script will verify:
- ✅ Docker system status and availability
- ✅ Supported programming languages
- ✅ Code execution in multiple languages
- ✅ AI features (code explanation, suggestions, review)
- ✅ Security and resource limits

### Manual Testing
1. **Code Playground**: Navigate to `/playground` and test code execution
2. **AI Features**: Use the AI assistance buttons in the playground
3. **Templates**: Try different code templates for various languages
4. **Error Handling**: Test with invalid code to verify error messages
5. **Resource Limits**: Test with infinite loops to verify timeouts

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Test system status
curl http://localhost:3001/api/code/system/status

# Test code execution
curl -X POST http://localhost:3001/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{"language": "javascript", "code": "console.log(\"Hello World!\");"}'

# Test AI code explanation
curl -X POST http://localhost:3001/api/ai/explain-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"code": "function hello() { return \"world\"; }", "language": "javascript"}'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.