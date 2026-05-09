import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Somente POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Use POST",
    });
  }
function App() { 
  try {
    const body = req.body || {};

    const subject = body.subject || "frações";
    const level = body.level || "6º ano";
    const difficulty = body.difficulty || "média";

    const prompt = `
Gere uma questão de matemática para ${level}
sobre o assunto "${subject}"
com dificuldade "${difficulty}".

Retorne SOMENTE um JSON válido no formato:

{
  "enunciado": "texto da questão",
  "alternativas": {
    "A": "texto",
    "B": "texto",
    "C": "texto",
    "D": "texto",
    "E": "texto"
  },
  "resposta": "A",
  "resolucao": "explicação completa"
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const text = completion.choices[0].message.content;
    const parsed = JSON.parse(text);

    return res.status(200).json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      fullError: String(error),
    });
  }
}
