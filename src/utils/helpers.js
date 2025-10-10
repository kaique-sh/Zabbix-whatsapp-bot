/**
 * Funções utilitárias para o projeto
 */

/**
 * Sanitiza texto para WhatsApp (remove caracteres especiais que podem causar problemas)
 * @param {string} text - Texto a ser sanitizado
 * @returns {string} - Texto sanitizado
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
    .trim()
    .substring(0, 4096); // Limite do WhatsApp
}

/**
 * Formata mensagem de alerta do Zabbix
 * @param {string} subject - Assunto do alerta
 * @param {string} message - Mensagem do alerta
 * @returns {string} - Mensagem formatada
 */
function formatZabbixAlert(subject, message) {
  const sanitizedSubject = sanitizeText(subject);
  const sanitizedMessage = sanitizeText(message);
  
  return `🚨 *${sanitizedSubject}*\n\n${sanitizedMessage}`;
}

/**
 * Valida se um ID de grupo WhatsApp está no formato correto
 * @param {string} groupId - ID do grupo
 * @returns {boolean} - True se válido
 */
function isValidGroupId(groupId) {
  if (!groupId || typeof groupId !== 'string') return false;
  return groupId.includes('@g.us') && groupId.length > 10;
}

/**
 * Gera timestamp formatado para logs
 * @returns {string} - Timestamp formatado
 */
function getFormattedTimestamp() {
  return new Date().toISOString();
}

/**
 * Delay assíncrono
 * @param {number} ms - Milissegundos para aguardar
 * @returns {Promise} - Promise que resolve após o delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry com backoff exponencial - Melhorado para WhatsApp
 * @param {Function} fn - Função a ser executada
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} baseDelay - Delay base em ms
 * @returns {Promise} - Resultado da função ou erro
 */
async function retryWithBackoff(fn, maxRetries = 5, baseDelay = 2000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Log do erro para debugging
      console.log(`Tentativa ${attempt}/${maxRetries} falhou:`, error.message);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Backoff exponencial com jitter para evitar thundering herd
      const jitter = Math.random() * 1000;
      const delayMs = (baseDelay * Math.pow(2, attempt - 1)) + jitter;
      
      console.log(`Aguardando ${Math.round(delayMs)}ms antes da próxima tentativa...`);
      await delay(delayMs);
    }
  }
}

/**
 * Verifica se o cliente WhatsApp está pronto para enviar mensagens
 * @param {Client} client - Cliente WhatsApp
 * @returns {Promise<boolean>} - True se pronto
 */
async function isClientReady(client) {
  try {
    const state = await client.getState();
    return state === 'CONNECTED';
  } catch (error) {
    return false;
  }
}

/**
 * Envia mensagem com verificação de estado e retry
 * @param {Client} client - Cliente WhatsApp
 * @param {string} chatId - ID do chat
 * @param {string} message - Mensagem a ser enviada
 * @returns {Promise} - Resultado do envio
 */
async function sendMessageSafely(client, chatId, message) {
  return retryWithBackoff(async () => {
    // Verifica se o cliente está pronto
    const ready = await isClientReady(client);
    if (!ready) {
      throw new Error('Cliente WhatsApp não está conectado');
    }
    
    // Envia a mensagem
    return await client.sendMessage(chatId, message);
  }, 3, 3000);
}

module.exports = {
  sanitizeText,
  formatZabbixAlert,
  isValidGroupId,
  getFormattedTimestamp,
  delay,
  retryWithBackoff,
  isClientReady,
  sendMessageSafely
};
