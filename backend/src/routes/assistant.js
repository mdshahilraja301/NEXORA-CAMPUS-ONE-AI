const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

router.post('/chat', async (req, res) => {
  try {
    const message = String(req.body.message || '').trim().toLowerCase();
    if (!message) {
      return res.status(400).json({ message: 'Type a message first.' });
    }

    // Clean API key
    const apiKey = String(process.env.GEMINI_API_KEY || '').trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const systemInstruction = 
      "You are One AI, the smart campus assistant for 'NEXØRA Campus One AI' at Mewar University. " +
      "You help students with campus complaints, weekly mess menu, and campus map. " +
      "Keep responses concise, helpful, and polite.";

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash', // Updated to the correct model required by Google API[cite: 1]
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });

    let reply = response.text || 'I am here to help you with your smart campus needs at Mewar University.';
    let actionType = null;
    let actionPayload = null;

    // Smart Intent Detection for App Navigation Buttons
    if (message.includes('mess') || message.includes('food') || message.includes('menu') || message.includes('khaana')) {
      actionType = 'NAVIGATE_MESS';
      actionPayload = { screen: 'Mess', label: 'View Mess Menu' };
    } else if (message.includes('complaint') || message.includes('issue') || message.includes('problem') || message.includes('shikayat')) {
      actionType = 'NAVIGATE_COMPLAINTS';
      actionPayload = { screen: 'Complaints', label: 'Go to Complaints' };
    } else if (message.includes('map') || message.includes('location') || message.includes('direction') || message.includes('kahan hai')) {
      actionType = 'NAVIGATE_MAP';
      actionPayload = { screen: 'Map', label: 'Open Campus Map' };
    }

    res.json({ 
      reply, 
      assistant: 'One AI', 
      mode: 'gemini-ai',
      actionType,
      actionPayload
    });

  } catch (error) {
    console.error('Gemini AI Assistant Error:', error);
    res.status(500).json({ 
      reply: 'Sorry, I am having trouble connecting to One AI right now. Please check your API key configuration.', 
      assistant: 'One AI', 
      mode: 'error' 
    });
  }
});

module.exports = router;