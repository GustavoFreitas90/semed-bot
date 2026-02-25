const express = require("express");

const app = express();
app.use(express.json());

// Render injeta a porta via variável de ambiente PORT
const PORT = process.env.PORT || 3000;

// Rota raiz (resolve o "Cannot GET /")
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "semed-bot",
    message: "Online. Use /healthz para status e /webhook para o Chatwoot.",
  });
});

// Health check (pode usar no Render: /healthz)
app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

// Webhook do Chatwoot (por enquanto só confirma recebimento)
app.post("/webhook", (req, res) => {
  // Aqui depois nós vamos ler o evento e responder no Chatwoot.
  // Por ora, só registramos e respondemos 200.
  console.log("Webhook recebido:", JSON.stringify(req.body).slice(0, 2000));
  res.json({ ok: true, received: true });
});

app.listen(PORT, () => {
  console.log(`semed-bot rodando na porta ${PORT}`);
});
