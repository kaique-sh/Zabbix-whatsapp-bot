/**
 * Menu principal do assistente - apresentável e informativo
 */
const logger = require('../src/config/logger');
const { CONFIG } = require('../src/config/constants');

async function handleMenuCommand(message, client) {
  const menuPrincipal = `*🟢 ${CONFIG.ASSISTANT_DISPLAY_NAME}*

*Olá!* 👋 Sou o assistente virtual da ${CONFIG.COMPANY_NAME}!

📋 *MENU PRINCIPAL*

Escolha uma das opções digitando o número:

*1️⃣ Serviços*
• Abertura de chamados
• Consulta CNPJ
• Suporte técnico

*2️⃣ Contatos*
• Analistas de Infraestrutura
• Analistas de Sistemas
• Contatos de emergência

*3️⃣ Comandos*
• Lista de comandos disponíveis
• Como usar o bot
• Exemplos práticos

*4️⃣ Ajuda*
• Como usar este menu
• Dicas e informações

---
💡 *Digite o número da opção desejada*
Exemplo: *1* para Serviços

🤖 *${CONFIG.ASSISTANT_DISPLAY_NAME}* - Sempre aqui para ajudar!`;

  try {
    await client.sendMessage(message.from, menuPrincipal);
    logger.info({ from: message.from }, 'Menu principal enviado com sucesso');
  } catch (err) {
    logger.error({ err, from: message.from }, 'Erro ao enviar menu principal');
    throw err;
  }
}

module.exports = { handleMenuCommand };