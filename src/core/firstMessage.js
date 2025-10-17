/**
 * Detecta e responde à PRIMEIRA mensagem de qualquer usuário – SEM FLOOD
 * Mantém controle de usuários que já receberam mensagem de boas-vindas
 */
const fs = require('fs');
const logger = require('../config/logger');
const { CONFIG } = require('../config/constants');

// Carrega lista de quem já recebeu (persiste em arquivo)
let firstMessages = new Set();
try {
  const data = fs.readFileSync(CONFIG.FIRST_MESSAGES_PATH, 'utf8');
  const parsed = JSON.parse(data);
  if (Array.isArray(parsed)) {
    firstMessages = new Set(parsed);
    logger.info({ count: parsed.length }, 'Lista de primeiras mensagens carregada');
  }
} catch (err) {
  logger.warn({ path: CONFIG.FIRST_MESSAGES_PATH }, 'Arquivo de primeiras mensagens não encontrado - iniciando vazio');
}

let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(CONFIG.FIRST_MESSAGES_PATH, JSON.stringify([...firstMessages], null, 2));
      logger.debug({ count: firstMessages.size }, 'Primeiras mensagens salvas');
    } catch (err) {
      logger.error({ err, path: CONFIG.FIRST_MESSAGES_PATH }, 'Erro ao salvar primeiras mensagens');
    }
    saveTimeout = null;
  }, CONFIG.SAVE_TIMEOUT);
}

// Salva dados ao encerrar o processo
process.on('exit', () => {
  try {
    fs.writeFileSync(CONFIG.FIRST_MESSAGES_PATH, JSON.stringify([...firstMessages], null, 2));
  } catch (err) {
    logger.error({ err }, 'Erro ao salvar no exit');
  }
});

async function handleFirstMessage(message, client) {
  try {
    if (message.fromMe) return; // evita eco
    const userId = message.author || message.from; // grupo ou privado

    if (firstMessages.has(userId)) return; // já apresentou

    const apresentacao =
      `*${CONFIG.ASSISTANT_DISPLAY_NAME}*\n\n` +
      `*Olá!* 👋 Sou o assistente virtual da ${CONFIG.COMPANY_NAME}!\n\n` +
      `*Como posso te ajudar hoje?*\n\n` +
      `• Digite *${CONFIG.MENU_COMMAND}* e veja nossas opções rápidas.\n` +
      `• Apenas diga *chamado* para abrir um ticket de atendimento.\n` +
      `• Salve meu contato como *"${CONFIG.CONTACT_NAME}"* e use sempre que precisar! 😊\n\n` +
      `*Atendimento 24h – ${CONFIG.COMPANY_NAME} ${CONFIG.ASSISTANT_DISPLAY_NAME}*`;

    await client.sendMessage(message.from, apresentacao);
    logger.info({ userId, from: message.from }, 'Primeira mensagem enviada');

    firstMessages.add(userId);
    scheduleSave();
  } catch (error) {
    logger.error({ error, from: message.from }, 'Erro ao enviar primeira mensagem');
  }
}

module.exports = { handleFirstMessage };