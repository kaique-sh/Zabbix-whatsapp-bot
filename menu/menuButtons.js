/**
 * ListMessage - Menu interativo com botões
 * Funcionalidade ainda suportada pelo WhatsApp Web.js
 */
const logger = require('../src/config/logger');
const { CONFIG } = require('../src/config/constants');

function buildMenuList(recipient) {
  logger.info({ recipient }, 'Construindo menu interativo');
  return {
    type: 'list',
    header: { type: 'text', text: `${CONFIG.COMPANY_NAME} - Menu de Opções` },
    body: `Olá! Sou o ${CONFIG.ASSISTANT_DISPLAY_NAME}. Escolha uma das opções abaixo:`,
    buttonText: 'Ver opções',
    sections: [
      {
        title: 'Serviços Disponíveis',
        rows: [
          { id: 'menu_chamado',  title: '🔗 Abrir chamado' },
          { id: 'menu_cnpj',     title: '🏢 Consulta CNPJ' },
          { id: 'menu_infra',    title: '📞 Analistas de Infra' },
          { id: 'menu_sistemas', title: '💻 Analistas de Sistemas' }
        ]
      }
    ]
  };
}

const menuAnswers = {
  menu_chamado:
    'Aqui está o link para abrir um chamado:\nhttps://suporte.voetur.com.br/support/home',
  menu_cnpj:
    '🏢 *Consulta CNPJ*\n\n📋 *Como usar*:\nDigite: !cnpj [número do CNPJ]\n\n💡 *Exemplo*:\n!cnpj 27865757000102\n\nℹ️ *Informações retornadas*:\n• Razão Social\n• Nome Fantasia\n• Situação Cadastral\n• CNAE Principal\n• Endereço Completo\n• E muito mais!',
  menu_infra:
    'Aqui estão os números dos analistas de infraestrutura:\n' +
    '📞 Kaique: (61) 9261-9515\n' +
    '📞 Eron: (21) 99200-7701\n' +
    '📞 João: (61) 9265-9920\n' +
    '📞 Carlos (Not): (11) 91335-6282\n' +
    '📞 Ricardo: (11) 98449-4387',
  menu_sistemas:
    'Aqui estão os números dos analistas de sistemas:\n' +
    '📞 Nicolas: (11) 96302-5383\n' +
    '📞 Erick: (31) 8301-3495\n' +
    '📞 Henrique: (11) 96310-7511'
};

async function handleButtonResponse(message, client) {
  try {
    const id = message.selectedRowId;
    if (id && menuAnswers[id]) {
      await client.sendMessage(message.from, menuAnswers[id]);
      logger.info({ from: message.from, buttonId: id }, 'Resposta de botão enviada');
      return true;
    }
    logger.debug({ from: message.from, buttonId: id }, 'Botão não reconhecido');
    return false;
  } catch (err) {
    logger.error({ err, from: message.from }, 'Erro ao processar resposta de botão');
    return false;
  }
}

module.exports = { buildMenuList, handleButtonResponse };