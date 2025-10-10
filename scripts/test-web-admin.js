#!/usr/bin/env node
/**
 * Teste do painel web de administração
 */

const http = require('http');

const WEB_ADMIN_PORT = process.env.WEB_ADMIN_PORT || 4000;
const BASE_URL = `http://localhost:${WEB_ADMIN_PORT}`;

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Testes
async function testWebAdmin() {
  console.log('🧪 Teste do Painel Web de Administração');
  console.log('=' .repeat(50));
  console.log(`🌐 URL Base: ${BASE_URL}`);
  console.log('');

  const tests = [
    {
      name: 'Página de Login',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/`);
        return {
          success: response.statusCode === 200 && response.body.includes('Voetur Bot'),
          message: `Status: ${response.statusCode}`,
          details: response.body.includes('login') ? 'Página de login carregada' : 'Conteúdo inesperado'
        };
      }
    },
    {
      name: 'API de Login (credenciais inválidas)',
      test: async () => {
        try {
          const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: 'invalid',
              password: 'invalid'
            })
          });
          
          const data = JSON.parse(response.body);
          return {
            success: response.statusCode === 401 && !data.success,
            message: `Status: ${response.statusCode}`,
            details: data.message || 'Resposta da API'
          };
        } catch (error) {
          return {
            success: false,
            message: 'Erro na requisição',
            details: error.message
          };
        }
      }
    },
    {
      name: 'API de Login (credenciais válidas)',
      test: async () => {
        try {
          const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: 'admin',
              password: 'admin123'
            })
          });
          
          const data = JSON.parse(response.body);
          return {
            success: response.statusCode === 200 && data.success && data.token,
            message: `Status: ${response.statusCode}`,
            details: data.success ? 'Login realizado com sucesso' : data.message,
            token: data.token
          };
        } catch (error) {
          return {
            success: false,
            message: 'Erro na requisição',
            details: error.message
          };
        }
      }
    },
    {
      name: 'Dashboard (sem autenticação)',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/dashboard`);
        return {
          success: response.statusCode === 200 && response.body.includes('Dashboard'),
          message: `Status: ${response.statusCode}`,
          details: response.body.includes('Dashboard') ? 'Página de dashboard carregada' : 'Conteúdo inesperado'
        };
      }
    },
    {
      name: 'API Status do Bot (sem token)',
      test: async () => {
        try {
          const response = await makeRequest(`${BASE_URL}/api/bot/status`);
          const data = JSON.parse(response.body);
          return {
            success: response.statusCode === 401 && !data.success,
            message: `Status: ${response.statusCode}`,
            details: 'Proteção de autenticação funcionando'
          };
        } catch (error) {
          return {
            success: false,
            message: 'Erro na requisição',
            details: error.message
          };
        }
      }
    }
  ];

  let passedTests = 0;
  let token = null;

  for (const test of tests) {
    process.stdout.write(`${test.name.padEnd(40)} ... `);
    
    try {
      const result = await test.test();
      
      if (result.success) {
        console.log('✅ PASSOU');
        passedTests++;
        if (result.token) token = result.token;
      } else {
        console.log('❌ FALHOU');
      }
      
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    } catch (error) {
      console.log('❌ ERRO');
      console.log(`   ${error.message}`);
    }
    
    console.log('');
  }

  // Teste adicional com token válido
  if (token) {
    console.log('🔐 Testando APIs autenticadas...');
    
    try {
      const response = await makeRequest(`${BASE_URL}/api/bot/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = JSON.parse(response.body);
      console.log(`Status do Bot API ... ${data.success ? '✅ PASSOU' : '❌ FALHOU'}`);
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Resposta: ${data.message || 'API funcionando'}`);
    } catch (error) {
      console.log('Status do Bot API ... ❌ ERRO');
      console.log(`   ${error.message}`);
    }
  }

  console.log('');
  console.log('📊 Resumo dos Testes:');
  console.log(`✅ Passou: ${passedTests}/${tests.length}`);
  console.log(`❌ Falhou: ${tests.length - passedTests}/${tests.length}`);
  console.log(`📈 Taxa de Sucesso: ${Math.round(passedTests/tests.length*100)}%`);

  console.log('');
  console.log('💡 Como usar o painel:');
  console.log('1. Acesse: http://localhost:4000');
  console.log('2. Login: admin / admin123');
  console.log('3. Altere a senha padrão');
  console.log('4. Use o dashboard para gerenciar o bot');

  console.log('');
  console.log('🔧 Comandos úteis:');
  console.log('• npm run web:start  # Iniciar painel');
  console.log('• npm run web:dev    # Modo desenvolvimento');
  console.log('• npm start          # Iniciar bot');

  return passedTests === tests.length;
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    await makeRequest(`${BASE_URL}/`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Executar testes
async function main() {
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.log('❌ Painel web não está rodando');
    console.log('💡 Inicie com: npm run web:start');
    console.log(`🌐 Ou acesse: ${BASE_URL}`);
    process.exit(1);
  }

  const success = await testWebAdmin();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
