/* ListMessage – ainda funcional */
const pino = require('pino');

const logger = pino({
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  } : undefined
});

function buildMenuList(recipient) {
  logger.info(`Building menu list for ${recipient}`);
  return {
    type: 'list',
    header: { type: 'text', text: 'Menu de Opções' },
    body: 'Escolha uma das opções abaixo:',
    buttonText: 'Abrir menu',
    sections: [
      {
        title: 'Opções',
        rows: [
          { id: 'menu_chamado',  title: '🔗 Abrir chamado' },
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
  const id = message.selectedRowId;
  if (id && menuAnswers[id]) {
    try {
      await client.sendMessage(message.from, menuAnswers[id]);
      logger.info({ from: message.from, buttonId: id }, 'Resposta de botão enviada');
      return true;
    } catch (err) {
      logger.error({ err, from: message.from, buttonId: id }, 'Erro ao enviar resposta de botão');
      throw err;
    }
  }
  logger.debug({ from: message.from, buttonId: id }, 'Botão não reconhecido');
  return false;
}

module.exports = { buildMenuList, handleButtonResponse };