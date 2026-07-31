import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405.0).json({ error: 'Método no permitido' });
    }

    try {
        const { tema } = req.body;
        
        if (!tema) {
            return res.status(400).json({ error: 'Falta el parámetro tema' });
        }

        const prompt = `Crea 3 preguntas de trivia sobre el tema: "${tema}". 
        Devuelve la respuesta EXCLUSIVAMENTE en formato JSON plano, con un array llamado "preguntas". 
        Cada pregunta debe tener: "pregunta", un array de 4 strings llamado "opciones", y "correcta" (que sea el número índice del 0 al 3 de la respuesta correcta). No agregues texto adicional ni formato markdown extra.`;

        // Llamamos al modelo utilizando el formato estándar compatible con la nueva SDK
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
        });

        let textoRespuesta = response.text.trim();
        
        // Limpiamos etiquetas markdown por si acaso
        textoRespuesta = textoRespuesta.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
        
        const preguntasJson = JSON.parse(textoRespuesta);
        return res.status(200).json(preguntasJson);

    } catch (error) {
        console.error("Error detallado al generar preguntas:", error);
        return res.status(500).json({ 
            error: "Error interno del servidor al hablar con la IA",
            detalle: error.message 
        });
    }
}
