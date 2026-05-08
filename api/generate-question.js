export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 👇 ESSA PARTE É ESSENCIAL
  if (req.method === "OPTIONS") {
    return res.status(200).end();
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
        message: "OPENAI_API_KEY não configurada"
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 800
      })
    });

    const data = await response.json();

    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.status(500).json({
        success: false,
        message: "Resposta vazia da OpenAI",
        raw: data
      });
    }

    return res.status(200).json({
      success: true,
      data: JSON.parse(text)
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
