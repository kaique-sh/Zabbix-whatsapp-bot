#!/usr/bin/env node
/*  /home/kaiqueadm/zabbix-whatsapp-bot/index.js  */

/* 1. variáveis de ambiente PRIMEIRO */
require('dotenv').config();

/* 2. imports */
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('express');

const { handleFirstMessage } = require('./firstMessage');
const { handleMenuCommand }   = require('./menu/menuCommand');
const { handleButtonResponse }= require('./menu/menuButtons');

const GROUP_ID = process.env.GROUP_ID;
const PORT     = process.env.PORT || 3000;

/* 3. WhatsApp client */
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './wwebjs_auth' }),
  puppeteer: {
    headless: false,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox'
    ],
    executablePath: process.env.PUPPETEER_EXEC || '/usr/bin/google-chrome-stable'
  }
});

/* 4. eventos do WhatsApp */
client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => {
  console.log('[WPP] BOT conectado!');
  // desativa auto-leitura por enquanto (evita crash)
  // setInterval(markAllAsRead, 30000);
});
client.on('disconnected', reason => console.log('[WPP] Desconectado:', reason));

/* 5. handler ÚNICO de mensagens */
client.on('message', async message => {
  try {
    if (message.from === 'status@broadcast') return;

    /* primeira mensagem do usuário */
    await handleFirstMessage(message, client);

    const body = (message.body || '').trim();

    /* comando !menu */
    if (body.toLowerCase() === '!menu') {
      await handleMenuCommand(message, client);
      return;
    }

    /* cliques em ListMessage (botões) */
    if (message.type === 'list_response') {
      const foiBotao = await handleButtonResponse(message, client);
      if (foiBotao) return;
    }

    /* continue seus comandos aqui... */

  } catch (err) {
    console.error('[MESSAGE]', err);
  }
});

/* 6. API do Zabbix */
const app = express();
app.use(bodyParser.json());

app.post('/zabbix', async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).send('Campos subject e message são obrigatórios');

    const text = `🚨 *${subject}*\n${message}`;
    await client.sendMessage(GROUP_ID, text);
    res.send('OK');
  } catch (e) {
    console.error('[API]', e.message);
    res.status(500).send('Erro interno');
  }
});

/* 7. start */
client.initialize();
app.listen(PORT, '0.0.0.0', () => console.log(`[API] escutando em 0.0.0.0:${PORT}`));