const express = require("express");

const app = express();
app.use(express.json());

// Render injeta a porta via variável de ambiente PORT
const PORT = process.env.PORT || 3000;

// Rota raiz (teste rápido no navegador)
app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "semed-bot",
    message: "Servidor online. Use /health ou /healthz.",
  });
});

// Health check principal
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "semed-bot",
    path: "/health"
  });
});

// Health check alternativo (compatível com Render)
app.get("/healthz", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "semed-bot",
    path: "/healthz"
  });
});

// Webhook do Chatwoot
app.post("/webhook", (req, res) => {
  console.log("Webhook recebido:", JSON.stringify(req.body).slice(0, 2000));
  res.json({ ok: true, received: true });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`semed-bot rodando na porta ${PORT}`);
});
