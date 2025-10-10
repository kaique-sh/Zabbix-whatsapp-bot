/**
 * Sistema de comandos customizados
 */

const logger = require('../config/logger');
const http = require('http');

// Cache dos comandos customizados
let customCommandsCache = {};
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Carrega comandos customizados da API do painel web
 */
async function loadCustomCommands() {
  return new Promise((resolve, reject) => {
    const WEB_ADMIN_PORT = process.env.WEB_ADMIN_PORT || 4000;
    const url = `http://localhost:${WEB_ADMIN_PORT}/api/commands/active`;

    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            if (response.success) {
              customCommandsCache = response.commands || {};
              lastCacheUpdate = Date.now();
              logger.info({ count: response.count }, 'Comandos customizados carregados');
              resolve(customCommandsCache);
            } else {
              logger.warn('Falha ao carregar comandos customizados da API');
              resolve({});
            }
          } else {
            logger.warn({ status: res.statusCode }, 'API de comandos customizados indisponível');
            resolve({});
          }
        } catch (error) {
          logger.error({ error: error.message }, 'Erro ao processar comandos customizados');
          resolve({});
        }
      });
    });

    req.on('error', (error) => {
      logger.warn({ error: error.message }, 'Erro ao conectar com API de comandos customizados');
      resolve({});
    });

    req.on('timeout', () => {
      req.destroy();
      logger.warn('Timeout ao carregar comandos customizados');
      resolve({});
    });
  });
}

/**
 * Obtém comandos customizados (com cache)
 */
async function getCustomCommands() {
  const now = Date.now();
  
  // Verificar se o cache ainda é válido
  if (now - lastCacheUpdate < CACHE_DURATION && Object.keys(customCommandsCache).length > 0) {
    return customCommandsCache;
  }
  
  // Recarregar comandos
  return await loadCustomCommands();
}

/**
 * Processa comando customizado
 * @param {Object} message - Mensagem do WhatsApp
 * @param {Object} client - Cliente WhatsApp
 * @returns {Promise<boolean>} - True se comando foi processado
 */
async function handleCustomCommand(message, client) {
  try {
    const messageBody = (message.body || '').trim().toLowerCase();
    
    // Verificar se é um comando (começa com !)
    if (!messageBody.startsWith('!')) {
      return false;
    }

    // Extrair o comando (primeira palavra)
    const command = messageBody.split(' ')[0];
    
    // Obter comandos customizados
    const customCommands = await getCustomCommands();
    
    // Verificar se o comando existe
    if (!customCommands[command]) {
      return false;
    }

    logger.info({ 
      from: message.from, 
      command: command 
    }, 'Comando customizado recebido');

    // Processar variáveis na resposta
    const response = processCommandVariables(customCommands[command], message);
    
    // Enviar resposta
    await client.sendMessage(message.from, response);
    
    logger.info({ 
      from: message.from, 
      command: command,
      success: true 
    }, 'Comando customizado processado');
    
    // Atualizar estatísticas (se disponível)
    updateCommandStats(command);
    
    return true;
    
  } catch (error) {
    logger.error({ 
      error: error.message, 
      from: message.from,
      stack: error.stack 
    }, 'Erro ao processar comando customizado');
    
    try {
      await client.sendMessage(message.from, 
        '❌ *Erro Interno*\n\nOcorreu um erro ao processar o comando.\n\n💡 Tente novamente mais tarde.'
      );
    } catch (sendError) {
      logger.error({ error: sendError.message }, 'Erro ao enviar mensagem de erro');
    }
    
    return true; // Retorna true pois o comando foi reconhecido
  }
}

/**
 * Processa variáveis na resposta do comando
 * @param {string} response - Resposta do comando
 * @param {Object} message - Mensagem original
 * @returns {string} - Resposta processada
 */
function processCommandVariables(response, message) {
  let processedResponse = response;
  
  // Variáveis disponíveis
  const variables = {
    '{USER}': message.from.split('@')[0], // Número do usuário
    '{TIME}': new Date().toLocaleTimeString('pt-BR'),
    '{DATE}': new Date().toLocaleDateString('pt-BR'),
    '{DATETIME}': new Date().toLocaleString('pt-BR'),
    '{TIMESTAMP}': Date.now().toString(),
    '{RANDOM}': Math.floor(Math.random() * 1000).toString()
  };
  
  // Substituir variáveis
  Object.entries(variables).forEach(([variable, value]) => {
    processedResponse = processedResponse.replace(new RegExp(variable, 'g'), value);
  });
  
  return processedResponse;
}

/**
 * Atualiza estatísticas de uso de comandos
 * @param {string} command - Comando executado
 */
function updateCommandStats(command) {
  // Implementação futura para estatísticas
  // Por enquanto, apenas log
  logger.debug({ command }, 'Estatística de comando customizado');
}

/**
 * Força recarregamento do cache de comandos
 */
async function reloadCustomCommands() {
  logger.info('Recarregando comandos customizados...');
  customCommandsCache = {};
  lastCacheUpdate = 0;
  return await loadCustomCommands();
}

/**
 * Lista comandos customizados disponíveis
 * @returns {Array} - Lista de comandos
 */
async function listCustomCommands() {
  const commands = await getCustomCommands();
  return Object.keys(commands).map(command => ({
    command,
    response: commands[command]
  }));
}

/**
 * Verifica se um comando customizado existe
 * @param {string} command - Comando a verificar
 * @returns {Promise<boolean>} - True se existe
 */
async function hasCustomCommand(command) {
  const commands = await getCustomCommands();
  return command.toLowerCase() in commands;
}

/**
 * Obtém resposta de um comando customizado
 * @param {string} command - Comando
 * @returns {Promise<string|null>} - Resposta ou null se não existe
 */
async function getCustomCommandResponse(command) {
  const commands = await getCustomCommands();
  return commands[command.toLowerCase()] || null;
}

// Carregar comandos na inicialização
loadCustomCommands().catch(error => {
  logger.warn({ error: error.message }, 'Falha ao carregar comandos customizados na inicialização');
});

// Recarregar comandos a cada 5 minutos
setInterval(() => {
  loadCustomCommands().catch(error => {
    logger.warn({ error: error.message }, 'Falha ao recarregar comandos customizados');
  });
}, CACHE_DURATION);

module.exports = {
  handleCustomCommand,
  reloadCustomCommands,
  listCustomCommands,
  hasCustomCommand,
  getCustomCommandResponse,
  getCustomCommands
};
