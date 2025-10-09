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
 * Retry com backoff exponencial
 * @param {Function} fn - Função a ser executada
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} baseDelay - Delay base em ms
 * @returns {Promise} - Resultado da função ou erro
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      await delay(delayMs);
    }
  }
}

module.exports = {
  sanitizeText,
  formatZabbixAlert,
  isValidGroupId,
  getFormattedTimestamp,
  delay,
  retryWithBackoff
};
