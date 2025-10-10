/**
 * Handler para comando !cnpj
 */

const logger = require('../config/logger');
const { consultarCNPJ } = require('../services/cnpjService');

/**
 * Processa comando !cnpj
 * @param {Object} message - Mensagem do WhatsApp
 * @param {Object} client - Cliente WhatsApp
 * @returns {Promise<boolean>} - True se comando foi processado
 */
async function handleCNPJCommand(message, client) {
  try {
    const messageBody = (message.body || '').trim();
    const parts = messageBody.split(/\s+/);
    
    // Verificar se é comando !cnpj
    if (parts[0].toLowerCase() !== '!cnpj') {
      return false;
    }
    
    logger.info({ from: message.from, command: messageBody }, 'Comando !cnpj recebido');
    
    // Verificar se CNPJ foi fornecido
    if (parts.length < 2 || !parts[1]) {
      const helpMessage = `❓ *Como usar o comando CNPJ*

📋 *Sintaxe*:
!cnpj [número do CNPJ]

💡 *Exemplos*:
• !cnpj 27865757000102
• !cnpj 27.865.757/0001-02

ℹ️ *Informações retornadas*:
• Razão Social
• Nome Fantasia  
• Situação Cadastral
• CNAE Principal
• Endereço Completo
• Telefone e Email
• Capital Social
• Data de Abertura

---
🤖 *Voetur Assistente* - Consulta CNPJ`;

      await client.sendMessage(message.from, helpMessage);
      logger.info({ from: message.from }, 'Ajuda do comando !cnpj enviada');
      return true;
    }
    
    const cnpj = parts[1];
    
    // Enviar mensagem de "processando"
    await client.sendMessage(message.from, '🔍 *Consultando CNPJ...*\n\nAguarde alguns instantes...');
    
    // Consultar CNPJ
    const resultado = await consultarCNPJ(cnpj);
    
    // Enviar resultado
    await client.sendMessage(message.from, resultado);
    
    logger.info({ 
      from: message.from, 
      cnpj: cnpj,
      success: !resultado.includes('❌')
    }, 'Consulta CNPJ processada');
    
    return true;
    
  } catch (error) {
    logger.error({ 
      error: error.message, 
      from: message.from,
      stack: error.stack 
    }, 'Erro ao processar comando !cnpj');
    
    try {
      await client.sendMessage(message.from, 
        '❌ *Erro Interno*\n\nOcorreu um erro ao processar sua solicitação.\n\n💡 Tente novamente mais tarde.'
      );
    } catch (sendError) {
      logger.error({ error: sendError.message }, 'Erro ao enviar mensagem de erro');
    }
    
    return true; // Retorna true pois o comando foi reconhecido, mesmo com erro
  }
}

module.exports = {
  handleCNPJCommand
};
