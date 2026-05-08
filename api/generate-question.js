import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Use POST"
    });
  }

  const { subject, level, difficulty } = req.body;

  if (!subject || !level || !difficulty) {
    return res.status(400).json({
      success: false,
      message: "Campos obrigatórios faltando"
    });
  }

  const prompt = `
Gere uma questão de matemática para ${level}
sobre "${subject}" com dificuldade "${difficulty}".

Retorne SOMENTE JSON:

{
  "enunciado": "",
  "alternativas": {
    "A": "",
    "B": "",
    "C": "",
    "D": "",
    "E": ""
  },
  "resposta": "",
  "resolucao": ""
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 800
    });

    const text = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      data: JSON.parse(text)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro na IA",
      error: error.message
    });
  }
}
