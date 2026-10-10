const llmService = require('../services/llmService');

const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      return res.status(400).json({ error: 'Symptoms description is required in the request body.' });
    }

    const analysis = await llmService.analyzeSymptoms(symptoms.trim());

    return res.status(200).json(analysis);
  } catch (err) {
    console.error('Symptom Analysis Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze symptoms.' });
  }
};

module.exports = {
  analyzeSymptoms
};
