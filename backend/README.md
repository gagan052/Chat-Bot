# Chat Bot Backend

This is the backend server for the Chat Bot application. It provides API endpoints for user authentication, chat conversations, and real-time messaging using Socket.io.

## Technologies Used

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Socket.io for real-time communication

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

3. Run the server:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

## API Endpoints

### User Routes

- **POST /api/users/register** - Register a new user
- **POST /api/users/login** - Login and get token
- **GET /api/users/profile** - Get user profile (protected)
- **PUT /api/users/profile** - Update user profile (protected)

### Chat Routes (All Protected)

- **POST /api/chats** - Create a new conversation
- **GET /api/chats** - Get all conversations for the logged-in user
- **GET /api/chats/:id** - Get a specific conversation by ID
- **PUT /api/chats/:id** - Update conversation title
- **DELETE /api/chats/:id** - Delete a conversation
- **POST /api/chats/:id/messages** - Add a message to a conversation

## Socket.io Events

- **join_room** - Join a specific chat room (conversation)
- **send_message** - Send a message to a room
- **receive_message** - Receive a message from a room

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```