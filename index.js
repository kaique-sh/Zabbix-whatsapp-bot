#!/usr/bin/env node
/**
 * Zabbix WhatsApp Bot - Arquivo principal
 * Bot para envio de alertas do Zabbix via WhatsApp
 */

/* 1. Carregamento de variáveis de ambiente */
require('dotenv').config();

/* 2. Imports */
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

// Configurações centralizadas
const logger = require('./src/config/logger');
const { CONFIG, validateRequiredConfig } = require('./src/config/constants');
const { formatZabbixAlert, retryWithBackoff } = require('./src/utils/helpers');

// Handlers de mensagem
const { handleFirstMessage } = require('./firstMessage');
const { handleMenuCommand } = require('./menu/menuCommand');
const { handleButtonResponse } = require('./menu/menuButtons');

/* 3. Validação de configuração */
try {
  validateRequiredConfig();
} catch (error) {
  logger.error({ error: error.message }, 'Erro na configuração');
  process.exit(1);
}

/* 4. WhatsApp client */
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: CONFIG.AUTH_DATA_PATH }),
  puppeteer: {
    headless: CONFIG.HEADLESS,
    args: CONFIG.PUPPETEER_ARGS,
    executablePath: CONFIG.PUPPETEER_EXEC
  }
});

/* 5. Eventos do WhatsApp */
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  logger.info('QR Code gerado - escaneie para conectar');
});

let isReady = false;
client.on('ready', () => {
  isReady = true;
  logger.info('WhatsApp BOT conectado com sucesso');
  // desativa auto-leitura por enquanto (evita crash)
  // setInterval(markAllAsRead, 30000);
});

client.on('disconnected', reason => {
  isReady = false;
  logger.warn({ reason }, 'WhatsApp desconectado');
});

client.on('auth_failure', msg => {
  logger.error({ msg }, 'Falha na autenticação do WhatsApp');
});

/* 6. Handler único de mensagens */
client.on('message', async message => {
  try {
    if (message.from === 'status@broadcast') return;

    /* primeira mensagem do usuário */
    await handleFirstMessage(message, client);

    const body = (message.body || '').trim();

    /* comando do menu */
    if (body.toLowerCase() === CONFIG.MENU_COMMAND.toLowerCase()) {
      logger.info({ from: message.from }, `Comando ${CONFIG.MENU_COMMAND} recebido`);
      await handleMenuCommand(message, client);
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

/* 7. API REST do Zabbix */
const app = express();
app.use(express.json());

// Middleware de autenticação
function authenticate(req, res, next) {
  if (!CONFIG.API_TOKEN) {
    logger.warn('API_TOKEN não configurado - endpoint desprotegido');
    return next();
  }
  
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== CONFIG.API_TOKEN) {
    logger.warn({ ip: req.ip }, 'Tentativa de acesso não autorizado');
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', whatsapp: isReady });
});

app.post('/zabbix', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    if (!CONFIG.GROUP_ID) {
      logger.error('GROUP_ID não configurado');
      return res.status(500).json({ error: 'GROUP_ID não configurado' });
    }
    if (!isReady) {
      logger.warn('Cliente WhatsApp não está pronto');
      return res.status(503).json({ error: 'Cliente WhatsApp não está pronto' });
    }

    const { subject, message } = req.body || {};
    if (!subject || !message) {
      logger.warn({ body: req.body }, 'Payload inválido');
      return res.status(400).json({ 
        error: 'Campos subject e message são obrigatórios',
        received: req.body 
      });
    }

    const text = formatZabbixAlert(subject, message);
    await retryWithBackoff(
      () => client.sendMessage(CONFIG.GROUP_ID, text),
      CONFIG.MAX_RETRIES
    );
    
    const duration = Date.now() - startTime;
    logger.info({ subject, duration }, 'Alerta Zabbix enviado com sucesso');
    res.json({ status: 'success', message: 'Alerta enviado', duration });
  } catch (e) {
    const duration = Date.now() - startTime;
    logger.error({ err: e, duration }, 'Erro ao enviar alerta Zabbix');
    res.status(500).json({ error: 'Erro interno', duration });
  }
});

/* 8. Inicialização */
logger.info('Inicializando WhatsApp client...');
client.initialize();

app.listen(CONFIG.PORT, '0.0.0.0', () => {
  logger.info({ 
    port: CONFIG.PORT, 
    auth: !!CONFIG.API_TOKEN,
    company: CONFIG.COMPANY_NAME 
  }, `API REST escutando em 0.0.0.0:${CONFIG.PORT}`);
  
  if (!CONFIG.API_TOKEN) {
    logger.warn('⚠️  API_TOKEN não definido - considere proteger o endpoint /zabbix');
  }
});