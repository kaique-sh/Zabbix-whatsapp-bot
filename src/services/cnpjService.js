/**
 * Serviço de consulta CNPJ usando API pública cnpj.ws
 */

const https = require('https');
const logger = require('../config/logger');

// APIs disponíveis (fallback)
const CNPJ_APIS = [
  {
    name: 'cnpj.ws',
    baseUrl: 'https://www.cnpj.ws/pt-BR/cnpj',
    format: (cnpj) => `${cnpj}`
  },
  {
    name: 'receitaws',
    baseUrl: 'https://www.receitaws.com.br/v1/cnpj',
    format: (cnpj) => `${cnpj}`
  }
];

const REQUEST_TIMEOUT = 15000; // 15 segundos

/**
 * Valida formato do CNPJ
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} - True se válido
 */
function isValidCNPJFormat(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') return false;
  
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se não são todos números iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  return true;
}

/**
 * Valida dígitos verificadores do CNPJ
 * @param {string} cnpj - CNPJ limpo (apenas números)
 * @returns {boolean} - True se válido
 */
function validateCNPJDigits(cnpj) {
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  if (parseInt(cnpj[12]) !== digit1) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return parseInt(cnpj[13]) === digit2;
}

/**
 * Valida CNPJ completo (formato e dígitos)
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} - True se válido
 */
function isValidCNPJ(cnpj) {
  if (!isValidCNPJFormat(cnpj)) return false;
  
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return validateCNPJDigits(cleanCNPJ);
}

/**
 * Limpa e formata CNPJ
 * @param {string} cnpj - CNPJ a ser formatado
 * @returns {string} - CNPJ limpo (apenas números)
 */
function cleanCNPJ(cnpj) {
  return cnpj.replace(/\D/g, '');
}

/**
 * Formata CNPJ para exibição
 * @param {string} cnpj - CNPJ limpo
 * @returns {string} - CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
function formatCNPJ(cnpj) {
  const clean = cleanCNPJ(cnpj);
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Faz requisição para uma API específica
 * @param {string} cnpj - CNPJ limpo
 * @param {Object} api - Configuração da API
 * @param {number} maxRedirects - Número máximo de redirecionamentos
 * @returns {Promise<Object>} - Dados da empresa
 */
function fetchFromAPI(cnpj, api, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    const makeRequest = (url, redirectCount = 0) => {
      logger.info({ cnpj, url, redirectCount }, 'Consultando CNPJ na API');
      
      const req = https.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Voetur-WhatsApp-Bot/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const jsonData = JSON.parse(data);
              logger.info({ cnpj, status: res.statusCode }, 'CNPJ consultado com sucesso');
              resolve(jsonData);
            } else if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
              // Lidar com redirecionamentos
              if (redirectCount >= maxRedirects) {
                logger.error({ cnpj, status: res.statusCode, redirectCount }, 'Muitos redirecionamentos');
                reject(new Error('Muitos redirecionamentos'));
                return;
              }
              
              let redirectUrl = res.headers.location;
              if (!redirectUrl) {
                // Tentar extrair do corpo da resposta se não estiver no header
                try {
                  const responseData = JSON.parse(data);
                  if (responseData.redirect) {
                    redirectUrl = `https://www.cnpj.ws${responseData.redirect}`;
                  }
                } catch (e) {
                  logger.error({ cnpj, status: res.statusCode, data }, 'Redirecionamento sem URL válida');
                  reject(new Error('Redirecionamento inválido'));
                  return;
                }
              }
              
              if (redirectUrl) {
                // Se for URL relativa, tornar absoluta
                if (redirectUrl.startsWith('/')) {
                  redirectUrl = `https://www.cnpj.ws${redirectUrl}`;
                }
                
                logger.info({ cnpj, redirectUrl, redirectCount }, 'Seguindo redirecionamento');
                makeRequest(redirectUrl, redirectCount + 1);
              } else {
                logger.error({ cnpj, status: res.statusCode }, 'Redirecionamento sem URL');
                reject(new Error('Redirecionamento inválido'));
              }
            } else if (res.statusCode === 404) {
              logger.warn({ cnpj, status: res.statusCode }, 'CNPJ não encontrado');
              reject(new Error('CNPJ não encontrado na base de dados'));
            } else if (res.statusCode === 429) {
              logger.warn({ cnpj, status: res.statusCode }, 'Rate limit atingido');
              reject(new Error('Muitas consultas - tente novamente em alguns minutos'));
            } else {
              logger.error({ cnpj, status: res.statusCode, data }, 'Erro na consulta CNPJ');
              reject(new Error(`Erro na consulta: HTTP ${res.statusCode}`));
            }
          } catch (error) {
            logger.error({ cnpj, error: error.message, data }, 'Erro ao processar resposta da API');
            reject(new Error('Erro ao processar resposta da API'));
          }
        });
      });
      
      req.on('error', (error) => {
        logger.error({ cnpj, error: error.message }, 'Erro na requisição CNPJ');
        reject(new Error('Erro de conexão com a API'));
      });
      
      req.on('timeout', () => {
        req.destroy();
        logger.error({ cnpj }, 'Timeout na consulta CNPJ');
        reject(new Error('Timeout na consulta - tente novamente'));
      });
    };
    
    // Iniciar com a URL da API
    const initialUrl = `${api.baseUrl}/${api.format(cnpj)}`;
    makeRequest(initialUrl);
  });
}

/**
 * Faz requisição HTTP para API do CNPJ com fallback entre APIs
 * @param {string} cnpj - CNPJ limpo
 * @returns {Promise<Object>} - Dados da empresa
 */
async function fetchCNPJData(cnpj) {
  let lastError = null;
  
  // Tentar cada API disponível
  for (const api of CNPJ_APIS) {
    try {
      logger.info({ cnpj, apiName: api.name }, `Tentando API: ${api.name}`);
      const result = await fetchFromAPI(cnpj, api);
      logger.info({ cnpj, apiName: api.name }, `Sucesso na API: ${api.name}`);
      return result;
    } catch (error) {
      logger.warn({ cnpj, apiName: api.name, error: error.message }, `Falha na API: ${api.name}`);
      lastError = error;
      
      // Se for erro 404, tentar próxima API
      if (error.message.includes('não encontrado')) {
        continue;
      }
      
      // Para outros erros, aguardar um pouco antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Se todas as APIs falharam, lançar o último erro
  throw lastError || new Error('Todas as APIs falharam');
}

/**
 * Formata dados da empresa para exibição no WhatsApp
 * @param {Object} data - Dados da empresa da API
 * @param {string} cnpj - CNPJ consultado
 * @returns {string} - Mensagem formatada
 */
function formatCompanyData(data, cnpj) {
  const formattedCNPJ = formatCNPJ(cnpj);
  
  // Função auxiliar para tratar valores nulos/undefined
  const getValue = (value, defaultValue = 'Não informado') => {
    return value && value.trim() !== '' ? value : defaultValue;
  };
  
  // Normalizar dados (diferentes APIs podem ter campos diferentes)
  const normalizedData = {
    razao_social: data.razao_social || data.nome || data.company_name,
    nome_fantasia: data.nome_fantasia || data.fantasia || data.trade_name,
    situacao_cadastral: data.situacao_cadastral || data.situacao || data.status,
    data_situacao_cadastral: data.data_situacao_cadastral || data.data_situacao,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao || data.atividade_principal?.[0]?.text || data.main_activity,
    cnae_fiscal: data.cnae_fiscal || data.atividade_principal?.[0]?.code,
    logradouro: data.logradouro || data.endereco || data.address,
    numero: data.numero || data.number,
    complemento: data.complemento || data.complement,
    bairro: data.bairro || data.district,
    municipio: data.municipio || data.city,
    uf: data.uf || data.state,
    cep: data.cep || data.zip_code,
    ddd_telefone_1: data.ddd_telefone_1 || data.telefone || data.phone,
    email: data.email || data.email_address,
    capital_social: data.capital_social || data.capital,
    data_inicio_atividade: data.data_inicio_atividade || data.abertura || data.opening_date
  };

  // Formatar endereço
  const endereco = [];
  if (normalizedData.logradouro) endereco.push(normalizedData.logradouro);
  if (normalizedData.numero) endereco.push(`nº ${normalizedData.numero}`);
  if (normalizedData.complemento) endereco.push(normalizedData.complemento);
  if (normalizedData.bairro) endereco.push(normalizedData.bairro);
  if (normalizedData.municipio) endereco.push(normalizedData.municipio);
  if (normalizedData.uf) endereco.push(normalizedData.uf);
  if (normalizedData.cep) endereco.push(`CEP: ${normalizedData.cep}`);
  
  const enderecoCompleto = endereco.length > 0 ? endereco.join(', ') : 'Não informado';
  
  // Formatar situação cadastral
  const situacao = normalizedData.situacao_cadastral || 'Não informado';
  const dataSituacao = normalizedData.data_situacao_cadastral ? 
    ` (desde ${normalizedData.data_situacao_cadastral})` : '';
  
  // Formatar CNAE
  const cnaeDescricao = normalizedData.cnae_fiscal_descricao || 'Não informado';
  const cnaeCodigo = normalizedData.cnae_fiscal ? ` (${normalizedData.cnae_fiscal})` : '';
  
  return `🏢 *CONSULTA CNPJ*

📋 *CNPJ*: ${formattedCNPJ}

🏛️ *Razão Social*:
${getValue(normalizedData.razao_social)}

🏪 *Nome Fantasia*:
${getValue(normalizedData.nome_fantasia)}

📊 *Situação Cadastral*:
${situacao}${dataSituacao}

🏭 *CNAE Principal*:
${cnaeDescricao}${cnaeCodigo}

📍 *Endereço*:
${enderecoCompleto}

📞 *Telefone*:
${getValue(normalizedData.ddd_telefone_1)}

📧 *Email*:
${getValue(normalizedData.email)}

💰 *Capital Social*:
${normalizedData.capital_social ? `R$ ${parseFloat(normalizedData.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}

📅 *Data de Abertura*:
${getValue(normalizedData.data_inicio_atividade)}

---
🤖 *Voetur Assistente* - Consulta CNPJ`;
}

/**
 * Consulta CNPJ completa
 * @param {string} cnpj - CNPJ a ser consultado
 * @returns {Promise<string>} - Mensagem formatada ou erro
 */
async function consultarCNPJ(cnpj) {
  try {
    // Validar formato
    if (!isValidCNPJFormat(cnpj)) {
      return '❌ *CNPJ Inválido*\n\nO CNPJ deve conter 14 dígitos.\n\n💡 *Exemplo*: !cnpj 27865757000102';
    }
    
    const cleanedCNPJ = cleanCNPJ(cnpj);
    
    // Validar dígitos verificadores
    if (!validateCNPJDigits(cleanedCNPJ)) {
      return '❌ *CNPJ Inválido*\n\nOs dígitos verificadores do CNPJ estão incorretos.\n\n💡 *Exemplo*: !cnpj 27865757000102';
    }
    
    // Consultar API
    const data = await fetchCNPJData(cleanedCNPJ);
    
    // Formatar resposta
    return formatCompanyData(data, cleanedCNPJ);
    
  } catch (error) {
    logger.error({ cnpj, error: error.message }, 'Erro na consulta CNPJ');
    
    if (error.message.includes('não encontrado')) {
      return '❌ *CNPJ Não Encontrado*\n\nEste CNPJ não foi encontrado na base de dados da Receita Federal.\n\n💡 Verifique se o número está correto.';
    } else if (error.message.includes('Timeout')) {
      return '⏰ *Timeout na Consulta*\n\nA consulta demorou mais que o esperado.\n\n💡 Tente novamente em alguns instantes.';
    } else if (error.message.includes('Muitas consultas')) {
      return '🚫 *Limite de Consultas Atingido*\n\nMuitas consultas foram realizadas recentemente.\n\n💡 Aguarde alguns minutos e tente novamente.';
    } else if (error.message.includes('redirecionamento')) {
      return '🔄 *Erro de Redirecionamento*\n\nProblema na comunicação com a API.\n\n💡 Tente novamente em alguns instantes.';
    } else if (error.message.includes('Todas as APIs falharam')) {
      return '🌐 *APIs Indisponíveis*\n\nTodas as fontes de consulta estão temporariamente indisponíveis.\n\n💡 Tente novamente em alguns minutos.';
    } else {
      return '❌ *Erro na Consulta*\n\nOcorreu um erro ao consultar o CNPJ.\n\n💡 Tente novamente mais tarde ou verifique se o CNPJ está correto.';
    }
  }
}

module.exports = {
  consultarCNPJ,
  isValidCNPJ,
  formatCNPJ,
  cleanCNPJ
};
