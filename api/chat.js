const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API Key is not configured on Vercel.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are a professional medical assistant (Med-Consult AI) for American Wellness.
      You are assisting a healthcare provider (APRN/MD).
      
      Patient Document Context:
      ${context || 'No document context provided.'}

      User Query:
      ${query}

      Provide a concise, professional, and clinically accurate response. 
      Focus on cardiovascular health, metabolic markers, regenerative protocols, and medical coding if relevant.
      Always include a disclaimer that this is for clinical support and not a final diagnosis.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ response: text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to generate response from AI.' });
    }
};
