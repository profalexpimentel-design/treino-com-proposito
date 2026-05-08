export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Só aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Use POST"
    });
  }

  try {
    const body =
  typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body;

const { subject, level, difficulty } = body;

    return res.status(200).json({
      success: true,
      received: {
        subject,
        level,
        difficulty
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Erro interno"
    });
  }
}
