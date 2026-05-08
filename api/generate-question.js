export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Use POST" });
  }

  const { subject, level, difficulty } = req.body || {};

  if (!subject || !level || !difficulty) {
    return res.status(400).json({
      success: false,
      message: "Campos obrigatórios faltando"
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Gere uma questão de matemática para ${level} sobre ${subject} com dificuldade ${difficulty}. Retorne JSON.`
          }
        ],
        temperature: 0.5,
        max_tokens: 700
      })
    });

    const data = await response.json();

    const text = data?.choices?.[0]?.message?.content;

    return res.status(200).json({
      success: true,
      data: JSON.parse(text)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro interno",
      error: error.message
    });
  }
}
