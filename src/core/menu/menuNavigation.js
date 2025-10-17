/**
 * Sistema de navegação do menu estruturado
 */

const logger = require('../../config/logger');
const { CONFIG } = require('../../config/constants');

// Definir os submenus
const subMenus = {
  '1': {
    title: '🛠️ SERVIÇOS',
    content: `*🛠️ O que posso fazer por você?*

*🎫 PRECISANDO DE AJUDA?*
• Apenas diga: *chamado*
• Ou digite: *!atendimento*
• Criamos seu ticket automaticamente!

*🏢 CONSULTA DE EMPRESA*
• Digite: *!cnpj 27865757000102*
• Veja informações completas da empresa

*📞 PRECISA FALAR COM ALGUÉM?*
• Digite *2* para ver contatos da equipe
• Analistas especializados disponíveis

---
💡 *Dicas rápidas:*
• Diga *"chamado"* para abrir ticket
• Use *"!cnpj"* seguido do número
• Digite *"2"* para contatos

🤖 *${CONFIG.ASSISTANT_DISPLAY_NAME}* - Pronto para ajudar!`
  },

  '2': {
    title: '📞 CONTATOS',
    content: `*📞 CONTATOS DA EQUIPE*

*🔧 ANALISTAS DE INFRAESTRUTURA*
• Kaique: *(61) 9261-9515*
• Eron: *(21) 99200-7701*
• João: *(61) 9265-9920*
• Carlos (Not): *(11) 91335-6282*
• Ricardo: *(11) 98449-4387*

*💻 ANALISTAS DE SISTEMAS*
• Nicolas: *(11) 96302-5383*
• Erick: *(31) 8301-3495*
• Henrique: *(11) 96310-7511*

*🚨 EMERGÊNCIAS*
• Plantão 24h: *(61) 9261-9515*
• Backup: *(21) 99200-7701*

---
💡 *Digite !menu para voltar ao menu principal*

🤖 *${CONFIG.ASSISTANT_DISPLAY_NAME}* - Contatos`
  },

  '3': {
    title: '⚡ COMANDOS',
    content: `*⚡ COMANDOS DISPONÍVEIS*

*📋 Comandos Básicos*
• *!menu* - Exibir menu principal
• *!atendimento* - Criar chamado no Freshservice
• *!cnpj [número]* - Consultar CNPJ
• *1, 2, 3, 4* - Navegar no menu

*🎫 Comando de Atendimento*
• *!atendimento* - Inicia criação de ticket
• *chamado* - Apenas diga "chamado" (mais fácil!)
• *quero um chamado* - Ou use esta frase
• Cria chamado automaticamente
• Grupo: VTCLOG - TI
• Exemplo: !atendimento ou apenas "chamado"

*🏢 Consulta CNPJ*
• *!cnpj 27865757000102*
• *!cnpj 27.865.757/0001-02*
• *!cnpj* (para ajuda)

*💡 Exemplos Práticos*
• Digite *!atendimento* ou *chamado* para suporte
• Digite *!cnpj 33000167000001* (Petrobras)
• Digite *1* para ver serviços

*🔧 Dicas de Uso*
• Use números sem formatação no CNPJ
• Comandos não são case-sensitive
• Apenas diga *chamado* para abrir ticket
• Sempre digite ! antes dos comandos tradicionais

---
💡 *Digite !menu para voltar ao menu principal*

🤖 *${CONFIG.ASSISTANT_DISPLAY_NAME}* - Comandos`
  },

  '4': {
    title: '❓ AJUDA',
    content: `*❓ AJUDA E INFORMAÇÕES*

*🚀 Como Usar Este Bot*
1. Digite *!menu* para ver opções
2. Escolha um número (1, 2, 3, 4)
3. Use os comandos disponíveis

*📱 Salvando o Contato*
• Salve como: *"${CONFIG.CONTACT_NAME}"*
• Adicione aos favoritos
• Use sempre que precisar

*🔍 Funcionalidades*
• Consulta CNPJ em tempo real
• Abertura automática de chamados
• Apenas diga *chamado* para abrir ticket
• Contatos da equipe técnica
• Suporte 24 horas

*💡 Dicas Importantes*
• Mantenha o número salvo
• Use comandos com ! ou apenas diga "chamado"
• Consulte CNPJ sem formatação
• Para atendimento, diga "chamado" ou use !atendimento
• Atendimento 24h disponível

*🆘 Precisa de Ajuda?*
• Ligue: (61) 9261-9515
• Email: suporte@voetur.com.br
• Site: https://suporte.voetur.com.br

---
💡 *Digite !menu para voltar ao menu principal*

🤖 *${CONFIG.ASSISTANT_DISPLAY_NAME}* - Ajuda`
  }
};

/**
 * Verifica se a mensagem é uma navegação do menu
 * @param {Object} message - Mensagem do WhatsApp
 * @param {Object} client - Cliente WhatsApp
 * @returns {Promise<boolean>} - True se foi processado
 */
async function handleMenuNavigation(message, client) {
  const body = (message.body || '').trim();
  
  // Verificar se é um número de 1 a 4
  if (!['1', '2', '3', '4'].includes(body)) {
    return false;
  }
  
  logger.info({ from: message.from, option: body }, 'Navegação do menu recebida');
  
  try {
    const submenu = subMenus[body];
    if (submenu) {
      await client.sendMessage(message.from, submenu.content);
      logger.info({ from: message.from, option: body, title: submenu.title }, 'Submenu enviado com sucesso');
      return true;
    }
    return false;
  } catch (error) {
    logger.error({ error: error.message, from: message.from, option: body }, 'Erro ao enviar submenu');
    
    try {
      await client.sendMessage(message.from, 
        '❌ *Erro Interno*\n\nOcorreu um erro ao processar sua solicitação.\n\n💡 Digite *!menu* para tentar novamente.'
      );
    } catch (sendError) {
      logger.error({ error: sendError.message }, 'Erro ao enviar mensagem de erro');
    }
    
    return true; // Retorna true pois o comando foi reconhecido
  }
}

/**
 * Obtém informações sobre os submenus disponíveis
 * @returns {Object} - Informações dos submenus
 */
function getMenuInfo() {
  return {
    totalMenus: Object.keys(subMenus).length,
    availableOptions: Object.keys(subMenus),
    menuTitles: Object.entries(subMenus).map(([key, value]) => ({
      option: key,
      title: value.title
    }))
  };
}

module.exports = {
  handleMenuNavigation,
  getMenuInfo
};
