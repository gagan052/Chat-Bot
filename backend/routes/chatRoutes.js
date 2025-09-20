const express = require('express');
const router = express.Router();
const { 
  createConversation,
  getConversations,
  getConversationById,
  addMessage,
  updateConversation,
  deleteConversation 
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes are protected
router.use(protect);

// Conversation routes
router.route('/')
  .post(createConversation)
  .get(getConversations);

router.route('/:id')
  .get(getConversationById)
  .put(updateConversation)
  .delete(deleteConversation);

// Message routes
router.post('/:id/messages', addMessage);

module.exports = router;
