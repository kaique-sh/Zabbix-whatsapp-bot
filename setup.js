#!/usr/bin/env node
/**
 * Script de configuração automatizada do Zabbix WhatsApp Bot
 * Executa: node setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function setup() {
  console.log('🤖 Configuração do Zabbix WhatsApp Bot - Voetur\n');

  const config = {};

  // Configurações obrigatórias
  config.GROUP_ID = await question('📱 GROUP_ID do WhatsApp (ex: 5511999999999-1234567890@g.us): ');
  config.API_TOKEN = await question('🔐 Token de segurança para API (gere um aleatório): ');
  
  // Configurações opcionais
  config.PORT = await question('🌐 Porta da API (padrão 3000): ') || '3000';
  config.HEADLESS = await question('👁️  Executar em modo headless? (true/false, padrão true): ') || 'true';
  
  // Personalização
  config.COMPANY_NAME = await question('🏢 Nome da empresa (padrão Voetur): ') || 'Voetur';
  config.ASSISTANT_DISPLAY_NAME = await question('🤖 Nome do assistente (padrão VOETUR ASSISTENTE): ') || 'VOETUR ASSISTENTE';
  config.MENU_COMMAND = await question('⚡ Comando do menu (padrão !menu): ') || '!menu';
  config.CONTACT_NAME = await question('📞 Nome para salvar contato (padrão Voetur Assistente): ') || 'Voetur Assistente';
  
  // Ambiente
  config.NODE_ENV = await question('🔧 Ambiente (development/production, padrão development): ') || 'development';

  // Gerar arquivo .env
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync('.env', envContent);
  
  console.log('\n✅ Arquivo .env criado com sucesso!');
  console.log('\n📋 Próximos passos:');
  console.log('1. npm install');
  console.log('2. npm start');
  console.log('3. Escaneie o QR Code no WhatsApp');
  console.log('\n🔒 Endpoint protegido:');
  console.log(`POST http://localhost:${config.PORT}/zabbix`);
  console.log(`Authorization: Bearer ${config.API_TOKEN}`);
  console.log('\n🏥 Healthcheck:');
  console.log(`GET http://localhost:${config.PORT}/health`);

  rl.close();
}

setup().catch(console.error);
