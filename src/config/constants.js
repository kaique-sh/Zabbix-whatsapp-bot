/**
 * Constantes e configurações centralizadas do projeto
 */

// Configurações do ambiente
const CONFIG = {
  // WhatsApp
  GROUP_ID: process.env.GROUP_ID,
  HEADLESS: process.env.HEADLESS !== 'false',
  PUPPETEER_EXEC: process.env.PUPPETEER_EXEC || undefined,
  
  // API
  PORT: process.env.PORT || 3000,
  API_TOKEN: process.env.API_TOKEN,
  
  // Personalização
  COMPANY_NAME: process.env.COMPANY_NAME || 'Voetur',
  ASSISTANT_DISPLAY_NAME: process.env.ASSISTANT_DISPLAY_NAME || 'VOETUR ASSISTENTE',
  MENU_COMMAND: process.env.MENU_COMMAND || '!menu',
  CONTACT_NAME: process.env.CONTACT_NAME || 'Voetur Assistente',
  
  // Arquivos
  FIRST_MESSAGES_PATH: process.env.FIRST_MESSAGES_PATH || './firstMessages.json',
  AUTH_DATA_PATH: './wwebjs_auth',
  
  // Timeouts e limites
  SAVE_TIMEOUT: 1000,
  MAX_RETRIES: 3,
  
  // Puppeteer args - Otimizado para servidor
  PUPPETEER_ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-default-apps',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--safebrowsing-disable-auto-update',
    '--enable-automation',
    '--password-store=basic',
    '--use-mock-keychain'
  ]
};

// Validação de configurações obrigatórias
function validateRequiredConfig() {
  const required = ['GROUP_ID'];
  const missing = required.filter(key => !CONFIG[key]);
  
  if (missing.length > 0) {
    throw new Error(`Configurações obrigatórias não encontradas: ${missing.join(', ')}`);
  }
}

module.exports = {
  CONFIG,
  validateRequiredConfig
};
