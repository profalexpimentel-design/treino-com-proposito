import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Use POST"
      });
    }

    const { subject, level, difficulty } = req.body || {};

    if (!subject || !level || !difficulty) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios faltando"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY não configurada no Vercel"
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Gere uma questão de matemática para ${level}
sobre "${subject}" com dificuldade "${difficulty}".

Retorne SOMENTE JSON:
{
  "enunciado": "",
  "alternativas": {"A":"","B":"","C":"","D":"","E":""},
  "resposta": "",
  "resolucao": ""
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 800,
    });

    const text = completion.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(500).json({
        success: false,
        message: "Resposta vazia da OpenAI"
      });
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "IA não retornou JSON válido",
        raw: text
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message
    });
  }
}
