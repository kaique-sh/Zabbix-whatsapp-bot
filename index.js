#!/usr/bin/env node
/*  /home/kaiqueadm/zabbix-whatsapp-bot/index.js  */

/* 1. variáveis de ambiente PRIMEIRO */
require('dotenv').config();


/* 2. imports */
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const pino = require('pino');

const logger = pino({
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  } : undefined
});

const { handleFirstMessage } = require('./firstMessage');
const { handleMenuCommand }   = require('./menu/menuCommand');
const { handleButtonResponse }= require('./menu/menuButtons');

const GROUP_ID = process.env.GROUP_ID;
const PORT     = process.env.PORT || 3000;
const HEADLESS = process.env.HEADLESS !== 'false';
const PUPPETEER_EXEC = process.env.PUPPETEER_EXEC || undefined;
const API_TOKEN = process.env.API_TOKEN;

/* 3. WhatsApp client */
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './wwebjs_auth' }),
  puppeteer: {
    headless: HEADLESS,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox'
    ],
    executablePath: PUPPETEER_EXEC
  }
});

/* 4. eventos do WhatsApp */
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

/* 5. handler ÚNICO de mensagens */
client.on('message', async message => {
  try {
    if (message.from === 'status@broadcast') return;

    /* primeira mensagem do usuário */
    await handleFirstMessage(message, client);

    const body = (message.body || '').trim();

    /* comando !menu */
    if (body.toLowerCase() === '!menu') {
      logger.info({ from: message.from }, 'Comando !menu recebido');
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

/* 6. API do Zabbix */
const app = express();
app.use(express.json());

// Middleware de autenticação
function authenticate(req, res, next) {
  if (!API_TOKEN) {
    logger.warn('API_TOKEN não configurado - endpoint desprotegido');
    return next();
  }
  
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== API_TOKEN) {
    logger.warn({ ip: req.ip }, 'Tentativa de acesso não autorizado');
    return res.status(401).send('Não autorizado');
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', whatsapp: isReady });
});

app.post('/zabbix', authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    if (!GROUP_ID) {
      logger.error('GROUP_ID não configurado');
      return res.status(500).send('GROUP_ID não configurado');
    }
    if (!isReady) {
      logger.warn('Cliente WhatsApp não está pronto');
      return res.status(503).send('Cliente WhatsApp não está pronto');
    }

    const { subject, message } = req.body || {};
    if (!subject || !message) {
      logger.warn({ body: req.body }, 'Payload inválido');
      return res.status(400).send('Campos subject e message são obrigatórios');
    }

    const text = `🚨 *${subject}*\n${message}`;
    await client.sendMessage(GROUP_ID, text);
    
    const duration = Date.now() - startTime;
    logger.info({ subject, duration }, 'Alerta Zabbix enviado com sucesso');
    res.send('OK');
  } catch (e) {
    const duration = Date.now() - startTime;
    logger.error({ err: e, duration }, 'Erro ao enviar alerta Zabbix');
    res.status(500).send('Erro interno');
  }
});

/* 7. start */
logger.info('Inicializando WhatsApp client...');
client.initialize();

app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT, auth: !!API_TOKEN }, `API REST escutando em 0.0.0.0:${PORT}`);
  if (!API_TOKEN) {
    logger.warn('⚠️  API_TOKEN não definido - considere proteger o endpoint /zabbix');
  }
});