const Conversation = require('../models/Conversation');

// @desc    Create a new conversation
// @route   POST /api/chats
// @access  Private
const createConversation = async (req, res) => {
  try {
    const { title, initialMessage } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User authentication failed' });
    }
    
    // Create new conversation with initial message if provided
    const conversation = new Conversation({
      userId: req.user._id,
      title: title || 'New Conversation',
      messages: initialMessage ? [{
        sender: 'user',
        content: initialMessage
      }] : []
    });

    // If initial message is provided, add bot response
    if (initialMessage) {
      // Simulate bot response - in a real app, this would call an AI service
      conversation.messages.push({
        sender: 'bot',
        content: `Hello! I'm your chat assistant. How can I help you today?`
      });
    }

    const savedConversation = await conversation.save();
    
    if (!savedConversation) {
      return res.status(500).json({ message: 'Failed to save conversation' });
    }
    
    console.log('Conversation saved successfully:', savedConversation._id);
    res.status(201).json(savedConversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all conversations for a user
// @route   GET /api/chats
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 }); // Sort by most recent
    
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single conversation by ID
// @route   GET /api/chats/:id
// @access  Private
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a message to a conversation
// @route   POST /api/chats/:id/messages
// @access  Private
const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User authentication failed' });
    }
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Add user message
    conversation.messages.push({
      sender: 'user',
      content
    });
    
    // Simulate bot response - in a real app, this would call an AI service
    conversation.messages.push({
      sender: 'bot',
      content: `I received your message: "${content}". This is a simulated response.`
    });
    
    const updatedConversation = await conversation.save();
    
    if (!updatedConversation) {
      return res.status(500).json({ message: 'Failed to save message' });
    }
    
    console.log('Message added successfully to conversation:', updatedConversation._id);
    res.json(updatedConversation);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update conversation title
// @route   PUT /api/chats/:id
// @access  Private
const updateConversation = async (req, res) => {
  try {
    const { title } = req.body;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    conversation.title = title || conversation.title;
    
    const updatedConversation = await conversation.save();
    res.json(updatedConversation);
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/chats/:id
// @access  Private
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  addMessage,
  updateConversation,
  deleteConversation
};