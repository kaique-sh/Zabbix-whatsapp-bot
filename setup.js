#!/usr/bin/env node
/**
 * Script de configuração automatizada do Voetur WhatsApp Bot
 * Executa: node setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function setup() {
  console.log('🤖 Configuração do Voetur WhatsApp Bot\n');

  const config = {};

  // Configurações obrigatórias
  config.GROUP_ID = await question('📱 GROUP_ID do WhatsApp (ex: 5511999999999-1234567890@g.us): ');
  
  const useGeneratedToken = await question('🔐 Gerar token de segurança automaticamente? (s/n, padrão s): ');
  if (useGeneratedToken.toLowerCase() !== 'n') {
    config.API_TOKEN = generateSecureToken();
    console.log(`✅ Token gerado: ${config.API_TOKEN}`);
  } else {
    config.API_TOKEN = await question('🔐 Digite seu token de segurança personalizado: ');
  }
  
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

  // Adicionar configurações de arquivos
  config.FIRST_MESSAGES_PATH = './firstMessages.json';

  // Gerar arquivo .env com comentários
  const envContent = [
    '# Configuração do Voetur WhatsApp Bot',
    `GROUP_ID=${config.GROUP_ID}`,
    '',
    '# Configuração da API',
    `PORT=${config.PORT}`,
    `API_TOKEN=${config.API_TOKEN}`,
    '',
    '# Configuração do Puppeteer',
    `HEADLESS=${config.HEADLESS}`,
    `NODE_ENV=${config.NODE_ENV}`,
    '',
    '# Personalização do Bot',
    `COMPANY_NAME=${config.COMPANY_NAME}`,
    `ASSISTANT_DISPLAY_NAME=${config.ASSISTANT_DISPLAY_NAME}`,
    `MENU_COMMAND=${config.MENU_COMMAND}`,
    `CONTACT_NAME=${config.CONTACT_NAME}`,
    '',
    '# Configuração de Arquivos',
    `FIRST_MESSAGES_PATH=${config.FIRST_MESSAGES_PATH}`,
    ''
  ].join('\n');

  try {
    fs.writeFileSync('.env', envContent);
    console.log('\n✅ Arquivo .env criado com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao criar arquivo .env:', error.message);
    process.exit(1);
  }
  
  console.log('\n📋 Próximos passos:');
  console.log('1. npm install');
  console.log('2. npm run validate  # Validar configuração');
  console.log('3. npm start         # Iniciar bot');
  console.log('4. Escaneie o QR Code no WhatsApp');
  
  console.log('\n🔒 API Endpoints:');
  console.log(`🏥 Health: GET http://localhost:${config.PORT}/health`);
  console.log(`🌐 Painel: http://localhost:4000`);
  
  console.log('\n📝 Comandos disponíveis:');
  console.log('!menu - Menu principal');
  console.log('!cnpj [número] - Consulta CNPJ');

  rl.close();
}

setup().catch(console.error);
