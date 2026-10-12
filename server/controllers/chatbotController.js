const llmService = require('../services/llmService');

const handleChatMessage = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const response = await llmService.generateChatResponse(message.trim(), history || []);
    return res.status(200).json({
      success: true,
      ...response
    });
  } catch (err) {
    console.error('Chatbot Controller Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to process chat message.',
      reply: 'I apologize, but I encountered a momentary issue processing your request. Please try again or explore our verified hospital directory.',
      triage_level: 'NORMAL',
      suggested_actions: [
        { label: 'Find Nearby Hospitals', path: '/hospitals' },
        { label: 'Compare Hospitals', path: '/compare-hospitals' }
      ]
    });
  }
};

const getChatStarters = (req, res) => {
  const starters = [
    {
      category: '1. Basic Triage Support',
      icon: 'stethoscope',
      title: 'Check Symptoms',
      prompt: 'I have a mild fever, body ache, and sore throat for 2 days. What should I do?'
    },
    {
      category: '2. Hospital Navigation',
      icon: 'hospital',
      title: 'Find Hospitals with ICU',
      prompt: 'Which nearby hospitals have 24/7 ICU and shortest wait time?'
    },
    {
      category: '3. Appointment Guidance',
      icon: 'calendar',
      title: 'Book an Appointment',
      prompt: 'How do I book an appointment with a specialist on ArogyaConnect?'
    },
    {
      category: '4. Health Recommendations',
      icon: 'heart-pulse',
      title: 'Preventive Health Tips',
      prompt: 'What are essential preventive health habits and daily hydration tips?'
    },
    {
      category: '5. FAQ Automation',
      icon: 'help-circle',
      title: 'Cashless Insurance & Pricing',
      prompt: 'Does ArogyaConnect support Cashless Insurance and Ayushman Bharat PM-JAY?'
    }
  ];

  return res.status(200).json({ starters });
};

module.exports = {
  handleChatMessage,
  getChatStarters
};
