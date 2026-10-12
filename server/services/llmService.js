const path = require('path');
const Groq = require('groq-sdk');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

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

/**
 * Fallback response generator if LLM endpoint is temporarily unreachable
 */
function getLocalFallbackChatResponse(message) {
    const m = (message || '').toLowerCase();
    
    // 1. Triage Emergency Red Flags
    if (m.includes('chest pain') || m.includes('heart attack') || m.includes('cannot breathe') || m.includes('shortness of breath') || m.includes('unconscious') || m.includes('bleeding heavily') || m.includes('stroke')) {
        return {
            reply: `🚨 **EMERGENCY MEDICAL WARNING**\n\nYour symptoms may indicate a critical medical emergency. Please **do not wait**:\n\n1. **Call Emergency Services immediately**: Dial **108 / 112** (or local emergency dispatch).\n2. **Head to the nearest 24/7 Emergency & Trauma Hospital**.\n3. Keep the patient in a comfortable seated position with loosened clothing.\n\n*ArogyaConnect cannot replace emergency paramedic dispatch.*`,
            triage_level: 'EMERGENCY',
            suggested_actions: [
                { label: 'Find Nearest 24/7 ER', path: '/hospitals', icon: 'hospital' },
                { label: 'Compare Hospital Wait Times', path: '/compare-hospitals', icon: 'scale' }
            ],
            follow_ups: [
                'Which nearby hospitals have 24/7 ICU?',
                'Call emergency helpline 108',
                'What first aid steps can I take right now?'
            ]
        };
    }

    // 1. Basic Triage (fever, cough, stomach, headache, throat)
    if (m.includes('fever') || m.includes('cough') || m.includes('cold') || m.includes('headache') || m.includes('stomach') || m.includes('vomit') || m.includes('pain')) {
        return {
            reply: `### 🩺 Basic Triage Guidance\n\nThank you for sharing your symptoms. Based on your description:\n\n- **Likely Department**: **General Medicine / Internal Medicine**\n- **Recommended Next Steps**:\n  - Maintain good hydration (warm water, electrolytes).\n  - Take adequate rest and avoid heavy exertion.\n  - Monitor body temperature using a thermometer twice daily.\n\n⚠️ **When to seek immediate medical consultation**:\n- Fever exceeding 102°F (39°C) lasting over 48 hours.\n- Severe persistent vomiting or inability to keep fluids down.\n- Difficulty breathing or sudden severe pain.\n\nWould you like me to guide you to book a consultation or check nearest available clinics?`,
            triage_level: 'NORMAL',
            suggested_actions: [
                { label: 'Check in Symptom Checker', path: '/symptom-checker', icon: 'activity' },
                { label: 'Find Nearby Doctors', path: '/hospitals', icon: 'hospital' },
                { label: 'Compare Hospital OPD Fees', path: '/compare-hospitals', icon: 'scale' }
            ],
            follow_ups: [
                'What home remedies are safe for fever?',
                'Which doctor should I consult for this?',
                'How do I schedule an appointment?'
            ]
        };
    }

    // 2. Hospital Navigation
    if (m.includes('hospital') || m.includes('icu') || m.includes('emergency') || m.includes('near me') || m.includes('location') || m.includes('navigate') || m.includes('clinic')) {
        return {
            reply: `### 🏥 Hospital Navigation & Facilities\n\nArogyaConnect connects you to verified network hospitals in real-time:\n\n- **Live GPS Proximity**: Discover facilities closest to your location.\n- **Facility Filtering**: Find centers equipped with **24/7 ICU, 3T MRI, Blood Banks, and Ambulances**.\n- **Real-Time Wait Times**: View live OPD and emergency triage wait times.\n\nYou can also compare up to 4 hospitals side-by-side to review treatment costs and doctor experience!`,
            triage_level: 'NORMAL',
            suggested_actions: [
                { label: 'View Network Hospitals', path: '/hospitals', icon: 'hospital' },
                { label: 'Compare Hospital Facilities', path: '/compare-hospitals', icon: 'scale' }
            ],
            follow_ups: [
                'Which hospital has the shortest wait time?',
                'Do nearby hospitals support cashless insurance?',
                'How do I view hospitals on the map?'
            ]
        };
    }

    // 3. Appointment Guidance
    if (m.includes('appointment') || m.includes('book') || m.includes('schedule') || m.includes('doctor') || m.includes('slot')) {
        return {
            reply: `### 📅 How to Book an Appointment on ArogyaConnect\n\nBooking a doctor's visit is simple and fast:\n\n1. **Browse Hospitals**: Go to the **Hospitals** or **Compare Hospitals** page.\n2. **Select Facility**: Click the **'Book Visit'** button on your preferred hospital card.\n3. **Pick Date & Time**: Choose your preferred appointment date and time slot.\n4. **Add Notes**: Mention your symptoms or reason for visit.\n5. **Confirm**: Submit to receive immediate booking confirmation and an email notification.\n\n*Zero upfront deposit required for booking appointments.*`,
            triage_level: 'NORMAL',
            suggested_actions: [
                { label: 'Book at Nearby Hospital', path: '/hospitals', icon: 'hospital' },
                { label: 'View Dashboard Appointments', path: '/dashboard', icon: 'calendar' }
            ],
            follow_ups: [
                'Can I reschedule an appointment?',
                'Is doctor booking free on ArogyaConnect?',
                'What documents do I need to bring?'
            ]
        };
    }

    // 4. Health Recommendations & Wellness
    if (m.includes('health') || m.includes('diet') || m.includes('exercise') || m.includes('water') || m.includes('wellness') || m.includes('prevention') || m.includes('sleep') || m.includes('lifestyle')) {
        return {
            reply: `### 💡 Evidence-Based Health & Wellness Recommendations\n\nHere are core preventive health habits recommended by physicians:\n\n- 💧 **Optimal Hydration**: Drink 2.5–3 liters of water daily to support kidney function and energy levels.\n- 🥗 **Balanced Nutrition**: Prioritize fiber-rich vegetables, lean proteins, and minimize processed sugars.\n- 🚶‍♂️ **Daily Activity**: Aim for at least 30 minutes of moderate aerobic movement or brisk walking 5 days a week.\n- 😴 **Restorative Sleep**: Ensure 7–8 hours of consistent sleep for immune cellular repair.\n- 🩺 **Annual Screening**: Schedule regular lipid profiles, blood sugar, and blood pressure checks.\n\n*Note: These tips are for educational purposes. Consult a physician for individualized medical diets.*`,
            triage_level: 'NORMAL',
            suggested_actions: [
                { label: 'Find General Physicians', path: '/hospitals', icon: 'hospital' },
                { label: 'Check Symptoms', path: '/symptom-checker', icon: 'activity' }
            ],
            follow_ups: [
                'What are daily habits to lower high blood pressure?',
                'How often should I get full body checkups?',
                'What are healthy stress management tips?'
            ]
        };
    }

    // 5. FAQ Automation (Pricing, Insurance, Ayushman Bharat, Platform)
    if (m.includes('faq') || m.includes('cost') || m.includes('free') || m.includes('insurance') || m.includes('ayushman') || m.includes('cashless') || m.includes('transparency') || m.includes('password')) {
        return {
            reply: `### ❓ Frequently Asked Questions (ArogyaConnect FAQs)\n\n- **Is ArogyaConnect free to use?**\n  Yes! Searching hospitals, comparing treatment fees, and scheduling doctor appointments is 100% free for patients.\n\n- **Does ArogyaConnect support Cashless Insurance & Ayushman Bharat (PM-JAY)?**\n  Yes. Network hospitals feature verified Cashless TPA desks and accepted insurance badges (e.g. Star Health, HDFC ERGO, PMJAY).\n\n- **How does the Hospital Comparison tool work?**\n  Our Comparison engine analyzes real-time data on **Treatment Costs, Facilities, Ratings, Doctor Experience, and Wait Times** to calculate a transparent decision score.\n\n- **How do I reset my password?**\n  Click 'Forgot Password' on the login screen to receive a secure recovery link.`,
            triage_level: 'NORMAL',
            suggested_actions: [
                { label: 'Compare Network Hospitals', path: '/compare-hospitals', icon: 'scale' },
                { label: 'Explore Network', path: '/hospitals', icon: 'hospital' }
            ],
            follow_ups: [
                'How do I compare hospital treatment costs?',
                'How are real-time wait times measured?',
                'How do I contact customer support?'
            ]
        };
    }

    // Default general greeting / guidance
    return {
        reply: `Hello! I am your **ArogyaConnect AI Healthcare Navigator**.\n\nI am specially equipped to assist you with:\n\n1. 🩺 **Basic Triage Support**: Symptom assessment and specialist recommendation.\n2. 🏥 **Hospital Navigation**: Finding real-time facilities with ICU, MRI & 24/7 emergency.\n3. 📅 **Appointment Guidance**: Step-by-step assistance to book consultations.\n4. 💡 **Health Recommendations**: Safe preventive wellness and lifestyle advice.\n5. ❓ **FAQ Automation**: Instant answers on cashless insurance, costs, and platform tools.\n\nHow can I help you today? Feel free to describe your symptoms or ask any hospital question!`,
        triage_level: 'NORMAL',
        suggested_actions: [
            { label: 'Check Symptoms', path: '/symptom-checker', icon: 'activity' },
            { label: 'Compare Hospitals', path: '/compare-hospitals', icon: 'scale' },
            { label: 'Find Nearby Hospitals', path: '/hospitals', icon: 'hospital' }
        ],
        follow_ups: [
            'I want to check my symptoms',
            'Find nearest emergency hospital',
            'How do I compare hospital costs?'
        ]
    };
}

/**
 * Generates an intelligent, conversational response for the ArogyaConnect AI Chatbot
 * supporting: Basic triage, Hospital navigation, Appointment guidance, Health recommendations, and FAQs.
 */
async function generateChatResponse(userMessage, conversationHistory = []) {
    const systemPrompt = `You are "ArogyaConnect AI", a compassionate, professional, and knowledgeable healthcare navigator assistant specially built for the ArogyaConnect platform.

Your 5 Core Capabilities:
1. Basic Triage Support:
   - Carefully evaluate described symptoms.
   - Detect EMERGENCY red-flags (severe chest pain, shortness of breath, sudden numbness, uncontrolled bleeding). In emergencies, immediately advise calling 108/112 or visiting the nearest ER.
   - For non-emergencies, assess severity, suggest probable medical categories, and advise which department/specialist to consult (Cardiology, Orthopedics, Pediatrics, General Medicine, Dermatology, etc.).
2. Hospital Navigation:
   - Guide patients on finding hospitals by location, distance, wait time, or facilities (ICU, 24/7 Emergency, 3T MRI, Blood Bank, Cashless TPA).
   - Recommend using the ArogyaConnect Hospital Comparison tool (/compare-hospitals) to review side-by-side metrics.
3. Appointment Guidance:
   - Guide users through scheduling consultations on ArogyaConnect (/hospitals or /compare-hospitals), selecting dates/times, and reviewing visits in the Dashboard (/dashboard).
4. Health Recommendations:
   - Provide safe, evidence-based lifestyle tips, hydration, nutrition, and first-aid advice. Always include a brief disclaimer that advice is educational and does not replace in-person doctor consultation.
5. FAQ Automation:
   - Answer platform questions: 100% free booking, real-time wait times, cashless insurance (Star Health, HDFC ERGO, Ayushman Bharat/PM-JAY), and account assistance.

Formatting Guidelines:
- Respond in rich, friendly, clean GitHub-style Markdown (use bolding, bullet points, headers, or emojis where helpful).
- Keep responses concise, structured, and easy to read on mobile devices.
- Strictly output valid JSON matching this schema:
{
  "reply": "Markdown formatted reply message to the patient",
  "triage_level": "EMERGENCY" | "ELEVATED" | "NORMAL",
  "suggested_actions": [
    { "label": "Button text", "path": "/hospitals" | "/compare-hospitals" | "/symptom-checker" | "/dashboard" }
  ],
  "follow_ups": ["Question 1?", "Question 2?", "Question 3?"]
}
`;

    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    // Include recent history (up to last 6 messages)
    if (Array.isArray(conversationHistory)) {
        const recent = conversationHistory.slice(-6);
        for (const item of recent) {
            if (item.role && item.content) {
                messages.push({
                    role: item.role === 'assistant' ? 'assistant' : 'user',
                    content: String(item.content)
                });
            }
        }
    }

    messages.push({ role: 'user', content: userMessage });

    try {
        const chatCompletion = await createChatCompletionWithFallback({
            messages,
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const rawContent = chatCompletion.choices[0]?.message?.content;
        const parsed = JSON.parse(rawContent);

        // Ensure all required fields exist
        return {
            reply: parsed.reply || "I am here to help you navigate healthcare, triage symptoms, and find hospitals.",
            triage_level: parsed.triage_level || "NORMAL",
            suggested_actions: Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions : [
                { label: 'Find Nearby Hospitals', path: '/hospitals' },
                { label: 'Compare Hospitals', path: '/compare-hospitals' }
            ],
            follow_ups: Array.isArray(parsed.follow_ups) ? parsed.follow_ups : [
                'Check symptoms in triage',
                'Find hospitals near me',
                'How to book an appointment'
            ]
        };
    } catch (err) {
        console.warn('Groq LLM call failed, falling back to intelligent local triage generator:', err.message);
        return getLocalFallbackChatResponse(userMessage);
    }
}

module.exports = {
    analyzeSymptoms,
    extractHospitalQuery,
    generateChatResponse
};
