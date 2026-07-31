// Servidor intermediario para el Juego de Preguntas con IA
const { GoogleGenAI } = require("@google/genai");

// Inicializamos la API de Google Gen AI usando la variable de entorno segura
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async (req, res) => {
    // Permitir conexiones desde cualquier lugar (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405.json({ error: "Solo se permite método POST" }));
    }

    try {
        const { tema } = req.body;
        if (!tema) {
            return res.status(400).json({ error: "Falta el parámetro 'tema'" });
        }

        // Prompt estructurado para que Gemini devuelva exactamente lo que necesitamos en JSON puro
        const prompt = `Crea 3 preguntas de tipo Multiple Choice (opción múltiple) sobre el tema: "${tema}".
        Debes responder ÚNICAMENTE en un formato JSON válido que sea un arreglo (array) de objetos, sin texto adicional ni marcas de código de markdown. 
        Cada objeto debe tener exactamente esta estructura:
        {
          "pregunta": "Texto de la pregunta",
          "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
          "correcta": 0
        }
        Donde "correcta" es el índice numérico (0, 1, 2 o 3) de la opción que es la respuesta correcta.`;

        // Llamamos al modelo Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let textoRespuesta = response.text.trim();
        
        // Limpiamos por si la IA llega a incluir bloques de código markdown como ```json ... ```
        textoRespuesta = textoRespuesta.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

        const preguntasJson = JSON.parse(textoRespuesta);

        return res.status(200).json(preguntasJson);

    } catch (error) {
        console.error("Error al generar preguntas:", error);
        return res.status(500).json({ error: "Error interno del servidor al hablar con la IA" });
    }
};
