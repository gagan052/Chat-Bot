const express = require('express');
const router = express.Router();
const { generateAIResponse } = require('../controllers/aiController');

router.post('/generate', generateAIResponse);

module.exports = router;