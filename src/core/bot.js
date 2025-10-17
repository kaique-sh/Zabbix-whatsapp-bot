#!/usr/bin/env node
/**
 * Voetur WhatsApp Bot - Arquivo principal
 * Bot WhatsApp com painel web de administração
 */

/* 1. Carregamento de variáveis de ambiente */
require('dotenv').config();

/* 2. Imports */
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Configurações centralizadas
const logger = require('../config/logger');
const { CONFIG, validateRequiredConfig } = require('../config/constants');
const { sendMessageSafely, isClientReady } = require('../utils/helpers');
const { logMessageReceived } = require('../utils/statsLogger');

// Handlers de mensagem
const { handleFirstMessage } = require('./firstMessage');
const { handleMenuCommand } = require('./menu/menuCommand');
const { handleButtonResponse } = require('./menu/menuButtons');
const { handleMenuNavigation } = require('./menu/menuNavigation');
const { handleCNPJCommand } = require('../commands/cnpjCommand');
const { handleCustomCommand } = require('../commands/customCommands');
const { handleStickerCommand } = require('../commands/stickerCommand');
const { handleAtendimentoCommand } = require('../commands/atendimentoCommand');

/* 3. Validação de configuração */
try {
  validateRequiredConfig();
} catch (error) {
  logger.error({ error: error.message }, 'Erro na configuração');
  process.exit(1);
}

/* 4. WhatsApp client */
const client = new Client({
  authStrategy: new LocalAuth({ 
    dataPath: CONFIG.AUTH_DATA_PATH,
    clientId: 'voetur-whatsapp-bot'
  }),
  puppeteer: {
    headless: CONFIG.HEADLESS,
    args: CONFIG.PUPPETEER_ARGS,
    executablePath: CONFIG.PUPPETEER_EXEC,
    timeout: 60000,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  }
});

// Inicializar integração Freshservice APÓS definir o client
let freshservice;
try {
  const FreshserviceIntegration = require('./src/integrations/freshservice');
  freshservice = new FreshserviceIntegration({}, client);
  logger.info('✅ Integração Freshservice carregada');
} catch (error) {
  logger.warn({ error: error.message }, '⚠️ Integração Freshservice não carregou, bot funcionará sem ela');
  freshservice = null;
}

/* 5. Eventos do WhatsApp */
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  logger.info('QR Code gerado - escaneie para conectar');
});

let isReady = false;
client.on('ready', () => {
  isReady = true;
  logger.info('WhatsApp BOT conectado com sucesso');

  // Iniciar monitoramento de tickets resolvidos
  if (freshservice && freshservice.isEnabled()) {
    logger.info('Iniciando monitoramento de tickets resolvidos...');

    // Verificar a cada 10 segundos (tempo real para testes)
    const monitoringInterval = setInterval(async () => {
      try {
        const result = await freshservice.monitorTicketStatusChanges();
        if (result.success) {
          logger.info({ processed: result.processed }, 'Monitoramento de tickets concluído');
        } else {
          logger.error({ error: result.error }, 'Erro no monitoramento de tickets');
        }
      } catch (error) {
        logger.error({ error: error.message }, 'Erro crítico no monitoramento');
      }
    }, 10 * 1000); // 10 segundos

    // Verificação inicial imediata (para testes em tempo real)
    setTimeout(async () => {
      try {
        await freshservice.monitorTicketStatusChanges();
      } catch (error) {
        logger.error({ error: error.message }, 'Erro na verificação inicial');
      }
    }, 1000); // 1 segundo após iniciar

    logger.info('Sistema de monitoramento ativo');
  } else {
    logger.info('Sistema de monitoramento desabilitado (Freshservice não configurado)');
  }
});

client.on('disconnected', reason => {
  isReady = false;
  logger.warn({ reason }, 'WhatsApp desconectado');
});

client.on('auth_failure', msg => {
  logger.error({ msg }, 'Falha na autenticação do WhatsApp');
});

client.on('loading_screen', (percent, message) => {
  logger.info({ percent, message }, 'WhatsApp carregando');
});

client.on('authenticated', () => {
  logger.info('WhatsApp autenticado com sucesso');
});

client.on('change_state', state => {
  logger.info({ state }, 'Estado do WhatsApp alterado');
});

// Tratamento de erros críticos
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection detectado');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception detectado');
  // Não fazer exit imediatamente, tentar graceful shutdown
  setTimeout(() => process.exit(1), 5000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT recebido, encerrando graciosamente...');
  try {
    await client.destroy();
    logger.info('Cliente WhatsApp encerrado');
  } catch (error) {
    logger.error({ error }, 'Erro ao encerrar cliente WhatsApp');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando graciosamente...');
  try {
    await client.destroy();
    logger.info('Cliente WhatsApp encerrado');
  } catch (error) {
    logger.error({ error }, 'Erro ao encerrar cliente WhatsApp');
  }
  process.exit(0);
});

/* 6. Handler único de mensagens */
client.on('message', async message => {
  try {
    if (message.from === 'status@broadcast') return;

    // Registrar mensagem recebida
    logMessageReceived();

    /* primeira mensagem do usuário */
    await handleFirstMessage(message, client);

    const body = (message.body || '').trim();

    /* comando privado !figurinha (sempre responde em privado) */
    const processedSticker = await handleStickerCommand(message, client);
    if (processedSticker) {
      return;
    }

    /* comando do menu */
    if (body.toLowerCase() === CONFIG.MENU_COMMAND.toLowerCase()) {
      logger.info({ from: message.from }, `Comando ${CONFIG.MENU_COMMAND} recebido`);
      await handleMenuCommand(message, client);
      return;
    }

    /* comando !cnpj */
    if (body.toLowerCase().startsWith('!cnpj')) {
      const processedCNPJ = await handleCNPJCommand(message, client);
      if (processedCNPJ) {
        return;
      }
    }

    /* comando !atendimento ou palavra "chamado" - Criar ticket no Freshservice */
    const processedAtendimento = await handleAtendimentoCommand(message, client, freshservice);
    if (processedAtendimento) {
      return;
    }

    /* navegação do menu (números 1-4) */
    const processedNavigation = await handleMenuNavigation(message, client);
    if (processedNavigation) {
      return;
    }

    /* comandos customizados */
    const processedCustom = await handleCustomCommand(message, client);
    if (processedCustom) {
      return;
    }

    /* cliques em ListMessage (botões) */
    if (message.type === 'list_response') {
      const foiBotao = await handleButtonResponse(message, client);
      if (foiBotao) {
        logger.info({ from: message.from, type: 'list_response' }, 'Resposta de botão processada');
        return;
      }
    }

    /* continue seus comandos aqui... */
  } catch (err) {
    logger.error({ err, from: message.from }, 'Erro ao processar mensagem');
  }
});

/* 7. API REST */
const app = express();
app.use(express.json());

// Endpoint de health check
app.get('/health', (req, res) => {
  const isReady = isClientReady(client);
  res.json({ status: 'ok', whatsapp: isReady });
});

/* 8. Inicialização */
logger.info('Inicializando WhatsApp client...');
client.initialize();

app.listen(CONFIG.PORT, '0.0.0.0', () => {
  logger.info({ 
    port: CONFIG.PORT, 
    company: CONFIG.COMPANY_NAME 
  }, `API REST escutando em 0.0.0.0:${CONFIG.PORT}`);
});