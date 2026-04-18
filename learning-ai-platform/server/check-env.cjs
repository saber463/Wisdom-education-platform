require('dotenv').config();
console.log('AI_API_KEY:', process.env.AI_API_KEY ? 'configured' : 'not configured');
console.log('CHATBOT_API_URL:', process.env.CHATBOT_API_URL || 'not configured');
