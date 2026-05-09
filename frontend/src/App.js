import React, { useState } from "react";
import axios from "axios";

console.log("deploy atualizado");

// 🔥 URL DO BACKEND VIA .ENV
const API_URL = "";
const ASSUNTOS = {
  fundamental: [
    "Números naturais",
    "Frações",
    "Decimais",
    "Porcentagem",
    "Razão e proporção",
    "Regra de três",
    "Expressões numéricas"
  ],

  fundamental2: [
    "Equações do 1º grau",
    "Sistemas de equações",
    "Potenciação",
    "Radiciação",
    "Geometria plana",
    "Probabilidade"
  ],

  medio: [
    "Função afim",
    "Função quadrática",
    "Exponencial",
    "Logaritmos",
    "Trigonometria",
    "Estatística",
    "Análise combinatória"
  ]
};

function App() {

  // 🔥 ESTADOS
  const [page, setPage] = useState("home");

  const [questao, setQuestao] = useState(null);

  const [assunto, setAssunto] = useState("");
  const [serie, setSerie] = useState("");
  const [nivel, setNivel] = useState("");

  const [respostaSelecionada, setRespostaSelecionada] = useState(null);

  const [mostrarResolucao, setMostrarResolucao] = useState(false);

  const [loading, setLoading] = useState(false);

  // 🔥 GERAR QUESTÃO
  const gerarQuestao = async () => {

    if (!assunto || !serie || !nivel) {
      alert("Selecione assunto, série e nível primeiro");
      return;
    }

    setLoading(true);

    try {

      const response = await axios.post(
  "/api/generate-question",
  {
    subject: assunto,
    level: serie,
    difficulty: nivel
  }
);

      // 🔥 DADOS CORRETOS
      const data = response.data.data;

      // 🔥 VALIDAÇÃO
      if (
        !data?.enunciado ||
        !data?.alternativas ||
        !data?.resposta ||
        !data?.resolucao
      ) {
        alert("A IA retornou uma questão inválida.");
        return;
      }

      setQuestao(data);

      setRespostaSelecionada(null);

      setMostrarResolucao(false);

    } catch (error) {

      console.log("ERRO:", error);

      alert(
        error.response?.data?.message ||
        "Erro ao conectar com backend"
      );

    } finally {

      setLoading(false);

    }
  };

  // 🔥 SELECIONAR RESPOSTA
  const selecionarResposta = (letra) => {

    if (respostaSelecionada) return;

    setRespostaSelecionada(letra);

    setMostrarResolucao(true);
  };

  // 🔥 COR DOS BOTÕES
  const getCorBotao = (letra) => {

    if (!respostaSelecionada) return "#fff";

    if (letra === questao.resposta) {
      return "#4CAF50";
    }

    if (letra === respostaSelecionada) {
      return "#f44336";
    }

    return "#fff";
  };

  // 🔥 LOGIN
  if (page === "login") {

    return (

      <div style={styles.container}>

        <h1>Login</h1>

        <input
          placeholder="Email"
          style={styles.input}
        />

        <input
          placeholder="Senha"
          type="password"
          style={styles.input}
        />

        <button style={styles.buttonPrimary}>
          Entrar
        </button>

        <br /><br />

        <button
          onClick={() => {

            setPage("home");

            setQuestao(null);

            setRespostaSelecionada(null);

            setMostrarResolucao(false);

          }}

          style={styles.buttonSecondary}
        >
          Voltar
        </button>

      </div>
    );
  }

  // 🔥 TREINO
  if (page === "treino") {

    return (

      <div
        style={{
          ...styles.container,
          overflowY: "auto",
          padding: "20px"
        }}
      >

        <h1>Área de Treino</h1>

        {/* ASSUNTO */}

        <select
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          style={styles.input}
        >

          <option value="">
            Escolha o assunto
          </option>

          <optgroup label="Ensino Fundamental">

            {ASSUNTOS.fundamental.map((a) => (
              <option key={a}>{a}</option>
            ))}

          </optgroup>

          <optgroup label="Fundamental II">

            {ASSUNTOS.fundamental2.map((a) => (
              <option key={a}>{a}</option>
            ))}

          </optgroup>

          <optgroup label="Ensino Médio">

            {ASSUNTOS.medio.map((a) => (
              <option key={a}>{a}</option>
            ))}

          </optgroup>

        </select>

        {/* SÉRIE */}

        <select
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
          style={styles.input}
        >

          <option value="">
            Escolha a série
          </option>

          <option>6º ano</option>
          <option>7º ano</option>
          <option>8º ano</option>
          <option>9º ano</option>
          <option>Ensino Médio</option>

        </select>

        {/* DIFICULDADE */}

        <select
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          style={styles.input}
        >

          <option value="">
            Escolha a dificuldade
          </option>

          <option>Fácil</option>
          <option>Médio</option>
          <option>Difícil</option>

        </select>

        {/* BOTÃO */}

        <button
          style={{
            ...styles.buttonPrimary,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}

          onClick={gerarQuestao}

          disabled={loading}
        >
          {loading
            ? "Gerando questão..."
            : "Gerar questão"}
        </button>

        {/* QUESTÃO */}

        {questao && (

          <div
            style={{
              marginTop: 30,
              width: "100%"
            }}
          >

            <h3
              style={{
                color: "white",
                maxWidth: "800px",
                margin: "0 auto",
                lineHeight: "1.6"
              }}
            >
              {questao.enunciado}
            </h3>

            {/* ALTERNATIVAS */}

            <div style={{ marginTop: 20 }}>

              {Object.entries(questao.alternativas)
                .map(([letra, texto]) => (

                <button
                  key={letra}

                  onClick={() =>
                    selecionarResposta(letra)
                  }

                  style={{
                    ...styles.alternativa,
                    backgroundColor:
                      getCorBotao(letra)
                  }}
                >

                  {letra}) {texto}

                </button>

              ))}

            </div>

            {/* RESULTADO */}

            {respostaSelecionada && (

              <div style={{ marginTop: 20 }}>

                {respostaSelecionada ===
                questao.resposta ? (

                  <h3 style={{ color: "green" }}>
                    ✔ Acertou!
                  </h3>

                ) : (

                  <h3 style={{ color: "red" }}>
                    ❌ Errou! Resposta correta:
                    {" "}
                    {questao.resposta}
                  </h3>

                )}

              </div>
            )}

            {/* RESOLUÇÃO */}

            {mostrarResolucao && (

              <div
                style={{
                  marginTop: 20,
                  backgroundColor:
                    "rgba(0,0,0,0.6)",
                  padding: "15px",
                  borderRadius: "10px",
                  maxWidth: "700px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  textAlign: "center"
                }}
              >

                <strong
                  style={{ color: "white" }}
                >
                  Resolução:
                </strong>

                <p
                  style={{
                    color: "white",
                    lineHeight: "1.7",
                    marginTop: "10px",
                    textAlign: "center"
                  }}
                >
                  {questao.resolucao}
                </p>

              </div>
            )}

          </div>
        )}

        <br /><br />

        {/* VOLTAR */}

        <button
          onClick={() => {

            setPage("home");

            setQuestao(null);

            setRespostaSelecionada(null);

            setMostrarResolucao(false);

            setAssunto("");

            setSerie("");

            setNivel("");

          }}

          style={styles.buttonSecondary}
        >
          Voltar
        </button>

      </div>
    );
  }

  // 🔥 HOME
  return (

    <div style={styles.container}>

      <div style={styles.overlay}></div>

      <div style={styles.content}>

        <img
          src="/foto.png"
          alt="Prof. Xande"
          style={styles.foto}
        />

        <h1>
          Matemática com Propósito
        </h1>

        <h2>
          Prof. Xande
        </h2>

        <button
          style={styles.buttonPrimary}
          onClick={() => setPage("treino")}
        >
          Começar treino
        </button>

        <button
          style={styles.buttonSecondary}
          onClick={() => setPage("login")}
        >
          Login
        </button>

      </div>

    </div>
  );
}

// 🔥 ESTILOS
const styles = {

  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "white",
    backgroundImage: "url('/fundo.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative"
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)"
  },

  content: {
    position: "relative",
    zIndex: 2,
    textAlign: "center"
  },

  foto: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    marginBottom: "20px",
    border: "3px solid white"
  },

  buttonPrimary: {
    padding: "10px 20px",
    backgroundColor: "#1a365d",
    color: "white",
    border: "none",
    borderRadius: "8px",
    margin: "5px"
  },

  buttonSecondary: {
    padding: "10px 20px",
    backgroundColor: "#ffd700",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    margin: "5px"
  },

  input: {
    display: "block",
    margin: "10px auto",
    padding: "10px",
    width: "220px"
  },

  alternativa: {
    display: "block",
    margin: "8px auto",
    padding: "10px",
    width: "320px",
    cursor: "pointer",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontWeight: "bold"
  }
};

export default App;