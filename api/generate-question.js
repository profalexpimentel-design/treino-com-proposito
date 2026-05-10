import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function tryParseJSON(text) {
  try {
    return { ok: true, parsed: JSON.parse(text) };
  } catch (e) {
    const match = text.match(/{[\s\S]*}/);
    if (match) {
      try {
        return { ok: true, parsed: JSON.parse(match[0]) };
      } catch (e2) {
        return { ok: false, error: e2.message, raw: text };
      }
    }
    return { ok: false, error: e.message, raw: text };
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Use POST",
    });
  }

  
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

const text = completion.choices?.[0]?.message?.content || "";


const result = tryParseJSON(text);

if (!result.ok) {
  return res.status(500).json({
    success: false,
    error: "Invalid JSON from model",
    details: result.error,
    modelText: result.raw,
  });
}

const parsed = result.parsed;

if (
  !parsed?.enunciado ||
  !parsed?.alternativas ||
  !parsed?.resposta ||
  !parsed?.resolucao
) {
  return res.status(500).json({
    success: false,
    error: "Parsed JSON missing required fields",
    parsed,
  });
}

return res.status(200).json({
  success: true,
  data: parsed,
});
  } catch (error) {
    console.error("HANDLER_ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      fullError: String(error),
    });
  }
}