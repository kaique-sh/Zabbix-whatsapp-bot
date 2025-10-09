#!/usr/bin/env node
/**
 * Validador de configuração do Zabbix WhatsApp Bot
 * Executa: node validate-config.js
 */

require('dotenv').config();

const validations = [
  {
    key: 'GROUP_ID',
    required: true,
    validate: (value) => value && value.includes('@g.us'),
    message: 'GROUP_ID deve estar no formato: 5511999999999-1234567890@g.us'
  },
  {
    key: 'API_TOKEN',
    required: false,
    validate: (value) => !value || value.length >= 8,
    message: 'API_TOKEN deve ter pelo menos 8 caracteres (recomendado para segurança)'
  },
  {
    key: 'PORT',
    required: false,
    validate: (value) => !value || (!isNaN(value) && value > 0 && value < 65536),
    message: 'PORT deve ser um número entre 1 e 65535'
  },
  {
    key: 'HEADLESS',
    required: false,
    validate: (value) => !value || ['true', 'false'].includes(value),
    message: 'HEADLESS deve ser "true" ou "false"'
  },
  {
    key: 'NODE_ENV',
    required: false,
    validate: (value) => !value || ['development', 'production'].includes(value),
    message: 'NODE_ENV deve ser "development" ou "production"'
  }
];

function validateConfig() {
  console.log('🔍 Validando configuração...\n');
  
  let hasErrors = false;
  let hasWarnings = false;

  validations.forEach(({ key, required, validate, message }) => {
    const value = process.env[key];
    
    if (required && !value) {
      console.log(`❌ ${key}: OBRIGATÓRIO - ${message}`);
      hasErrors = true;
    } else if (value && !validate(value)) {
      console.log(`❌ ${key}: INVÁLIDO - ${message}`);
      hasErrors = true;
    } else if (value) {
      console.log(`✅ ${key}: OK`);
    } else {
      console.log(`⚠️  ${key}: Não definido (usando padrão)`);
      hasWarnings = true;
    }
  });

  // Validações especiais
  if (!process.env.API_TOKEN) {
    console.log(`⚠️  API_TOKEN: Não definido - endpoint /zabbix ficará desprotegido`);
    hasWarnings = true;
  }

  console.log('\n📋 Resumo:');
  
  if (hasErrors) {
    console.log('❌ Configuração inválida! Corrija os erros acima.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Configuração válida com avisos. Considere definir as variáveis opcionais.');
  } else {
    console.log('✅ Configuração perfeita!');
  }

  console.log('\n🚀 Para iniciar:');
  console.log('npm start          # Desenvolvimento');
  console.log('npm run pm2:start  # Produção com PM2');
}

if (require.main === module) {
  validateConfig();
}

module.exports = { validateConfig };
