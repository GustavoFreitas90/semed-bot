const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// Variáveis de ambiente (vamos configurar no Render depois)
const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL; // ex: https://chatwoot.seudominio.com
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID; // ex: 1
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN; // token de acesso (NUNCA colocar no código)

function mustHaveEnv() {
  const missing = [];
  if (!CHATWOOT_BASE_URL) missing.push("CHATWOOT_BASE_URL");
  if (!CHATWOOT_ACCOUNT_ID) missing.push("CHATWOOT_ACCOUNT_ID");
  if (!CHATWOOT_API_TOKEN) missing.push("CHATWOOT_API_TOKEN");
  return missing;
}

app.get("/health", (req, res) => {
  const missing = mustHaveEnv();
  res.status(200).json({
    ok: true,
    service: "semed-bot",
    missing_env: missing,
  });
});

app.post("/webhook", async (req, res) => {
  // Responde 200 rápido para o Chatwoot não repetir webhook
  res.status(200).json({ received: true });

  try {
    const missing = mustHaveEnv();
    if (missing.length) {
      console.warn("Env faltando:", missing);
      return;
    }

    const payload = req.body || {};
    const event = payload.event;
    const conversation = payload.conversation;
    const message = payload.message;

    // Queremos responder apenas a criação de mensagem
    if (event !== "message_created") return;
    if (!conversation || !message) return;

    // Evitar loop: só responde quando a mensagem veio do contato (inbound)
    // Dependendo da instalação, isso pode vir como message_type ou direction.
    const messageType = message.message_type; // normalmente: "incoming" ou 0/1
    const direction = message.direction; // às vezes: "incoming"/"outgoing"

    const isIncoming =
      messageType === "incoming" ||
      messageType === 0 ||
      direction === "incoming";

    if (!isIncoming) return;

    const conversationId = conversation.id;
    const content = (message.content || "").trim().toLowerCase();

    // MVP: resposta padrão + gatilho simples para "inventário"
    let replyText =
      "Olá! Sou o Assistente de Documentos da SEMED/DPDF. Para agilizar seu atendimento, posso enviar a lista de documentos conforme o tipo de demanda (ex.: inventário). Digite: INVENTARIO para receber o checklist.";

    if (content.includes("inventario") || content.includes("inventário")) {
      replyText =
        "INVENTÁRIO — checklist inicial (responda: 1) já tenho 2) providenciando 3) não tenho).\n\n" +
        "A) Requerentes: RG + CPF, comprovante de residência, CTPS (mesmo sem registro), extratos bancários últimos 3 meses.\n" +
        "B) Falecido: certidão de óbito (atualizada), certidão de nascimento/casamento (atualizada).\n" +
        "C) Herdeiros: RG e CPF de todos (inclusive menores) + certidões atualizadas.\n\n" +
        "Observação: prefira documentos digitalizados (PDF). Se precisar que a Defensoria digitalize, traga cópias simples.";
    }

    // Enviar mensagem para a conversa via API do Chatwoot
    const url = `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`;

    await axios.post(
      url,
      { content: replyText },
      {
        headers: {
          api_access_token: CHATWOOT_API_TOKEN,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    console.log("Resposta enviada para conversa:", conversationId);
  } catch (err) {
    console.error("Erro no webhook:", err?.response?.data || err.message);
  }
});

app.listen(PORT, () => {
  console.log(`semed-bot rodando na porta ${PORT}`);
});
