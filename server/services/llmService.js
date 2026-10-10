const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Active models with automatic fallback support
const MODELS = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b'
];

/**
 * Creates chat completion with fallback across available models
 */
async function createChatCompletionWithFallback(options) {
    let lastError = null;
    for (const model of MODELS) {
        try {
            const response = await groq.chat.completions.create({
                ...options,
                model
            });
            return response;
        } catch (err) {
            console.warn(`Groq completion attempt with model '${model}' failed:`, err.message);
            lastError = err;
        }
    }
    throw lastError || new Error('All LLM models failed.');
}

/**
 * Analyzes patient symptoms and provides potential conditions, recommended specialty, and urgency.
 * @param {string} symptoms - The symptoms described by the user.
 * @returns {Promise<Object>} JSON containing condition analysis.
 */
async function analyzeSymptoms(symptoms) {
    const prompt = `You are a medical triage assistant.
Your task is to analyze user input for medical symptoms.

First, determine if the input actually describes valid medical symptoms or health issues.
If the input is NOT related to medical symptoms (e.g., if it is a random word, a greeting, a name, an object, or non-medical text), you MUST return exactly this JSON and nothing else:
{
  "error": "The provided input does not appear to describe valid medical symptoms. Please provide clear medical symptoms for analysis."
}

If the input DOES describe valid medical symptoms, analyze them and return exactly this JSON structure:
{
  "department": "Recommended medical department",
  "severity": "Low, Medium, or High",
  "possible_diseases": ["Disease 1", "Disease 2"]
}
Do not include any other text, return ONLY valid JSON.

Input to analyze: "${symptoms}"`;

    try {
        const chatCompletion = await createChatCompletionWithFallback({
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        });

        const content = chatCompletion.choices[0]?.message?.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("Error in analyzeSymptoms:", error);
        throw new Error("Failed to analyze symptoms using LLM: " + error.message);
    }
}

/**
 * Extracts structured search parameters from a natural language hospital search query.
 * @param {string} query - Natural language search query.
 * @returns {Promise<Object>} JSON containing extracted parameters.
 */
async function extractHospitalQuery(query) {
    const prompt = `Extract hospital search parameters from the following user query.

User Query: "${query}"

You must respond in valid JSON format containing exactly these keys:
- "location": (string or null) The city, neighborhood, or area mentioned. Null if not mentioned.
- "specialty": (string or null) The requested medical specialty or department mentioned. Null if not mentioned.
- "facilities": (array of strings) Any specific facilities requested (e.g., ["ICU", "24/7 Emergency"]). Empty array if none.
- "intent": (string) The core intent or summary of the request.`;

    try {
        const chatCompletion = await createChatCompletionWithFallback({
            messages: [
                { role: "system", content: "You are an intelligent query parsing assistant that strictly outputs JSON only. Do not wrap JSON in markdown blocks or include any other text." },
                { role: "user", content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' },
        });

        const content = chatCompletion.choices[0]?.message?.content;
        return JSON.parse(content);
    } catch (error) {
        console.error("Error in extractHospitalQuery:", error);
        throw new Error("Failed to extract query parameters using LLM: " + error.message);
    }
}

module.exports = {
    analyzeSymptoms,
    extractHospitalQuery
};
