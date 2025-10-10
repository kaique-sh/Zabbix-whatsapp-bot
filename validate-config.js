#!/usr/bin/env node
/**
 * Validador de configuração do Voetur WhatsApp Bot
 * Executa: node validate-config.js
 */

require('dotenv').config();
const logger = require('./src/config/logger');

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
  logger.info('🔍 Validando configuração...');
  
  let hasErrors = false;
  let hasWarnings = false;
  const results = [];

  validations.forEach(({ key, required, validate, message }) => {
    const value = process.env[key];
    
    if (required && !value) {
      logger.error(`❌ ${key}: OBRIGATÓRIO - ${message}`);
      results.push({ key, status: 'error', message });
      hasErrors = true;
    } else if (value && !validate(value)) {
      logger.error(`❌ ${key}: INVÁLIDO - ${message}`);
      results.push({ key, status: 'error', message });
      hasErrors = true;
    } else if (value) {
      logger.info(`✅ ${key}: OK`);
      results.push({ key, status: 'ok', value: value.substring(0, 10) + '...' });
    } else {
      logger.warn(`⚠️  ${key}: Não definido (usando padrão)`);
      results.push({ key, status: 'warning', message: 'Usando valor padrão' });
      hasWarnings = true;
    }
  });

  // Validações especiais
  if (!process.env.API_TOKEN) {
    logger.warn(`⚠️  API_TOKEN: Não definido - APIs ficarão desprotegidas`);
    hasWarnings = true;
  }

  logger.info('📋 Resumo da validação:', { 
    errors: hasErrors, 
    warnings: hasWarnings,
    results 
  });
  
  if (hasErrors) {
    logger.error('❌ Configuração inválida! Corrija os erros acima.');
    process.exit(1);
  } else if (hasWarnings) {
    logger.warn('⚠️  Configuração válida com avisos. Considere definir as variáveis opcionais.');
  } else {
    logger.info('✅ Configuração perfeita!');
  }

  logger.info('🚀 Para iniciar: npm start (desenvolvimento) ou npm run pm2:start (produção)');
}

if (require.main === module) {
  validateConfig();
}

module.exports = { validateConfig };
