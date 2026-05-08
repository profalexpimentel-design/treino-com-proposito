import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === "production";

/* =========================================
   HELMET
========================================= */

const helmetOptions = {
  contentSecurityPolicy: false,
};

if (isProd) {
  helmetOptions.contentSecurityPolicy = {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  };
}

app.use(helmet(helmetOptions));

/* =========================================
   CORS
========================================= */

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS não permitido"));
    },
    credentials: true,
  })
);

/* =========================================
   RATE LIMIT
========================================= */

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Muitas tentativas. Aguarde alguns minutos.",
  },
});

const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Muitas requisições para IA.",
  },
});

app.use(generalLimiter);

/* =========================================
   BODY PARSER
========================================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================
   OPENAI
========================================= */

let openaiClient = null;

if (!process.env.OPENAI_API_KEY) {
  console.log("❌ OPENAI_API_KEY não encontrada");
} else {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60000,
    maxRetries: 3,
  });

  console.log("✅ OpenAI configurada");
}

/* =========================================
   CACHE
========================================= */

const cache = new Map();

const CACHE_TTL = 10 * 60 * 1000;

function getCacheKey(subject, level, difficulty) {
  return `${subject}-${level}-${difficulty}`;
}

function getFromCache(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/* =========================================
   HEALTH
========================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Backend funcionando",
  });
});

/* =========================================
   IA ROUTER
========================================= */

const aiRouter = express.Router();

aiRouter.use(aiLimiter);

aiRouter.post("/generate-question", async (req, res, next) => {
  try {
    if (!openaiClient) {
      return res.status(503).json({
        success: false,
        message: "Serviço de IA indisponível",
      });
    }

    const { subject, level, difficulty } = req.body;

    if (!subject || !level || !difficulty) {
      return res.status(400).json({
        success: false,
        message: "subject, level e difficulty são obrigatórios",
      });
    }

    const cacheKey = getCacheKey(subject, level, difficulty);

    const cached = getFromCache(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        fromCache: true,
        data: cached,
      });
    }

    /* =========================================
       PROMPT
    ========================================= */

    const prompt = `
Gere uma questão de matemática para ${level}
sobre o assunto "${subject}"
com dificuldade "${difficulty}".

REGRAS OBRIGATÓRIAS:
- Retorne SOMENTE JSON válido
- NÃO escreva explicações fora do JSON
- A resposta correta DEVE bater com a resolução
- NÃO gere alternativas equivalentes
- NÃO gere alternativas duplicadas
- Deve existir apenas UMA resposta correta
- A resolução deve confirmar exatamente a alternativa correta

FORMATO OBRIGATÓRIO:

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

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    const text =
      completion?.choices?.[0]?.message?.content ?? null;

    if (!text) {
      return res.status(500).json({
        success: false,
        message: "Resposta vazia da IA",
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (error) {
      console.log("🚨 JSON inválido:", text);

      return res.status(500).json({
        success: false,
        message: "A IA retornou JSON inválido",
      });
    }

    /* =========================================
       VALIDAÇÃO
    ========================================= */

    if (
      !parsed.enunciado ||
      !parsed.alternativas ||
      !parsed.resposta ||
      !parsed.resolucao
    ) {
      return res.status(500).json({
        success: false,
        message: "Estrutura da questão inválida",
      });
    }

    setCache(cacheKey, parsed);

    return res.json({
      success: true,
      fromCache: false,
      data: parsed,
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/ai", aiRouter);

/* =========================================
   ERROR HANDLER
========================================= */

app.use((err, req, res, next) => {
  console.error("🚨 ERRO:", err);

  return res.status(500).json({
    success: false,
    message: "Erro interno do servidor",
  });
});

/* =========================================
   START SERVER
========================================= */

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});