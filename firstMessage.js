/* detecta e responde à PRIMEIRA mensagem de qualquer usuário – SEM FLOOD */
const fs = require('fs');
const pino = require('pino');
const path = process.env.FIRST_MESSAGES_PATH || './firstMessages.json';

const logger = pino({
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  } : undefined
});

// carrega lista de quem já recebeu (persiste em arquivo)
let firstMessages = new Set();
try {
  const data = fs.readFileSync(path, 'utf8');
  const parsed = JSON.parse(data);
  if (Array.isArray(parsed)) {
    firstMessages = new Set(parsed);
    logger.info({ count: parsed.length }, 'Lista de primeiras mensagens carregada');
  }
} catch (err) {
  logger.warn({ path }, 'Arquivo de primeiras mensagens não encontrado - iniciando vazio');
}

let saveTimeout = null;
function scheduleSave() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(path, JSON.stringify([...firstMessages], null, 2));
      logger.debug({ count: firstMessages.size }, 'Primeiras mensagens salvas');
    } catch (err) {
      logger.error({ err, path }, 'Erro ao salvar primeiras mensagens');
    }
    saveTimeout = null;
  }, 1000);
}
process.on('exit', () => {
  try {
    fs.writeFileSync(path, JSON.stringify([...firstMessages], null, 2));
  } catch (err) {
    logger.error({ err }, 'Erro ao salvar no exit');
  }
});

async function handleFirstMessage(message, client) {
  if (message.fromMe) return; // evita eco
  const userId = message.author || message.from; // grupo ou privado

  if (firstMessages.has(userId)) return; // já apresentou

  const COMPANY = process.env.COMPANY_NAME || 'Voetur';
  const ASSISTANT = process.env.ASSISTANT_DISPLAY_NAME || 'VOETUR ASSISTENTE';
  const MENU_CMD = process.env.MENU_COMMAND || '!menu';
  const CONTACT_NAME = process.env.CONTACT_NAME || 'Voetur Assistente';

  const apresentacao =
    `*${ASSISTANT}*\n\n` +
    `*Olá!* 👋 Sou o assistente virtual da ${COMPANY}!\n\n` +
    `*Como posso te ajudar hoje?*\n\n` +
    `• Digite *${MENU_CMD}* e veja nossas opções rápidas.\n` +
    `• Salve meu contato como *"${CONTACT_NAME}"* e use sempre que precisar! 😊\n\n` +
    `*Atendimento 24h – ${COMPANY} ${ASSISTANT}*`;

  await client.sendMessage(message.from, apresentacao);
  logger.info({ userId, from: message.from }, 'Primeira mensagem enviada');

  firstMessages.add(userId);
  scheduleSave();
}

module.exports = { handleFirstMessage };