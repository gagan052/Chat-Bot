const axios = require('axios');

const generateAIResponse = async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('AI generate request received:', { promptLength: typeof prompt === 'string' ? prompt.length : 0 });
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };

    const response = await axios.post(url, payload, { timeout: 10000 });
    const parts = response?.data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p?.text).filter(Boolean).join('\n');

    if (!text) {
      return res.status(502).json({ message: 'Empty response from AI service' });
    }

    console.log('AI generate response length:', typeof text === 'string' ? text.length : 0);
    res.json({ text });
  } catch (error) {
    console.error('Gemini generate error:', error?.response?.data || error.message);
    res.status(500).json({ message: 'AI generation failed', error: error?.response?.data || error.message });
  }
};

module.exports = { generateAIResponse };