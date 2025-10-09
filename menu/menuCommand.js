/**
 * Menu principal do assistente - apresentável e informativo
 */
const logger = require('../src/config/logger');
const { CONFIG } = require('../src/config/constants');

async function handleMenuCommand(message, client) {
  const texto =
    `*🟢 ${CONFIG.ASSISTANT_DISPLAY_NAME}*\n\n` +
    `*Olá!* 👋 Sou o assistente virtual da ${CONFIG.COMPANY_NAME}!\n` +
    `*Vamos lá?* Vou te mostrar alguns assuntos para ajudar. 😊\n\n` +
    `*🔗 ABERTURA DE CHAMADO*\n` +
    `• Acesse nosso suporte:\n` +
    `https://suporte.voetur.com.br/support/home\n\n` +
    `*📞 ANALISTAS DE INFRAESTRUTURA*\n` +
    `• Kaique: *(61) 9261-9515*\n` +
    `• Eron: *(21) 99200-7701*\n` +
    `• João: *(61) 9265-9920*\n` +
    `• Carlos (Not): *(11) 91335-6282*\n` +
    `• Ricardo: *(11) 98449-4387*\n\n` +
    `*💻 ANALISTAS DE SISTEMAS*\n` +
    `• Nicolas: *(11) 96302-5383*\n` +
    `• Erick: *(31) 8301-3495*\n` +
    `• Henrique: *(11) 96310-7511*\n\n` +
    `*💡 DICA:*\n` +
    `Salve este contato como *"${CONFIG.CONTACT_NAME}"* e use sempre que precisar! ✅\n\n` +
    `*Atendimento 24h – ${CONFIG.COMPANY_NAME} 🟢*`;

  try {
    await client.sendMessage(message.from, texto);
    logger.info({ from: message.from }, 'Menu enviado com sucesso');
  } catch (err) {
    logger.error({ err, from: message.from }, 'Erro ao enviar menu');
    throw err;
  }
}

module.exports = { handleMenuCommand };