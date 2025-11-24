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
    origin: [
        "http://localhost:5173", 
        "https://chat-bot-6t1n.onrender.com",
      ], // Frontend URL (Vite default)
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

const tryConnect = async (uri) => {
  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};

tryConnect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB connected successfully');
  console.log('Connected to database:', mongoose.connection.name);
})
.catch(async (err) => {
  console.error('MongoDB connection error:', err);
  if (process.env.MONGO_URI_FALLBACK) {
    try {
      await tryConnect(process.env.MONGO_URI_FALLBACK);
      console.log('MongoDB connected using fallback URI');
      console.log('Connected to database:', mongoose.connection.name);
    } catch (e) {
      console.error('MongoDB fallback connection error:', e);
    }
  }
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
const aiRoutes = require('./routes/aiRoutes');

const dbHealthCheck = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database not connected' });
  }
  next();
};

// Use routes
app.use('/api/users', dbHealthCheck, userRoutes);
app.use('/api/chats', dbHealthCheck, chatRoutes);
app.use('/api/ai', aiRoutes);

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