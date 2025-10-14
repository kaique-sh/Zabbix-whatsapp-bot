/**
 * Sistema de navegação do menu estruturado
 */

const logger = require('../src/config/logger');
const { CONFIG } = require('../src/config/constants');

// Definir os submenus
const subMenus = {
  '1': {
    title: '🛠️ SERVIÇOS',
    content: `*🛠️ SERVIÇOS DISPONÍVEIS*

*🎫 Abertura de Chamados*
• Digite: *!atendimento*
• Exemplo: !atendimento
• Cria ticket automaticamente no Freshservice
• Grupo: VTCLOG - TI

*🏢 Consulta CNPJ*
• Digite: *!cnpj [número]*
• Exemplo: !cnpj 27865757000102
• Informações completas da empresa

*🔧 Suporte Técnico*
• Problemas de infraestrutura
• Questões de sistemas
• Emergências técnicas

*💡 Comandos Disponíveis*
• *!atendimento* - Criar chamado
• *!cnpj* - Consultar empresa
• *!menu* - Voltar ao menu

---
💡 *Digite !menu para voltar ao menu principal*

🤖 *${CONFIG.ASSISTANT_DISPLAY_NAME}* - Serviços`
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
• Cria chamado automaticamente
• Grupo: VTCLOG - TI
• Exemplo: !atendimento

*🏢 Consulta CNPJ*
• *!cnpj 27865757000102*
• *!cnpj 27.865.757/0001-02*
• *!cnpj* (para ajuda)

*💡 Exemplos Práticos*
• Digite *!atendimento* para suporte
• Digite *!cnpj 33000167000001* (Petrobras)
• Digite *1* para ver serviços

*🔧 Dicas de Uso*
• Use números sem formatação no CNPJ
• Comandos não são case-sensitive
• Sempre digite ! antes dos comandos

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
• Contatos da equipe técnica
• Suporte 24 horas

*💡 Dicas Importantes*
• Mantenha o número salvo
• Use comandos com !
• Consulte CNPJ sem formatação
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
