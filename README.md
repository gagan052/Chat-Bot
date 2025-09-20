# Chat Bot Application

A full-stack chat bot application with a React frontend and Node.js backend.

## Project Structure

```
chat-bot/
├── frontend/     # React frontend
└── backend/      # Node.js backend
```

## Technologies Used

### Frontend
- React
- Axios for API requests
- TailwindCSS for styling
- Socket.io client for real-time communication

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time communication

## Setup and Installation

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```

## Features

- User authentication (register, login, profile management)
- Create and manage chat conversations
- Real-time messaging with the chat bot
- Conversation history storage
- Responsive UI design

## API Endpoints

### User Routes
- POST /api/users/register - Register a new user
- POST /api/users/login - Login and get token
- GET /api/users/profile - Get user profile (protected)
- PUT /api/users/profile - Update user profile (protected)

### Chat Routes
- POST /api/chats - Create a new conversation
- GET /api/chats - Get all conversations for the logged-in user
- GET /api/chats/:id - Get a specific conversation by ID
- PUT /api/chats/:id - Update conversation title
- DELETE /api/chats/:id - Delete a conversation
- POST /api/chats/:id/messages - Add a message to a conversation

## Socket.io Events

- join_room - Join a specific chat room (conversation)
- send_message - Send a message to a room
- receive_message - Receive a message from a room