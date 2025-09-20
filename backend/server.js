const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL (Vite default)
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB with enhanced error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('MongoDB connected successfully');
  // Log the database name to verify connection to correct database
  console.log('Connected to database:', mongoose.connection.name);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit with failure
});

// Add MongoDB connection event listeners for better monitoring
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Chat Bot API is running');
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a chat room
  socket.on('join_room', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // Handle new message
  socket.on('send_message', (messageData) => {
    // Broadcast to everyone in the room except sender
    socket.to(messageData.conversationId).emit('receive_message', messageData);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});