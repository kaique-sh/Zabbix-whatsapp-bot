#!/usr/bin/env node
/**
 * Script de teste específico para servidor 10.168.217.43
 * Executa: node scripts/test-server.js
 */

require('dotenv').config();
const http = require('http');

const SERVER_IP = '10.168.217.43';
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN;

const testPayload = {
  subject: 'Teste de Conectividade - Servidor',
  message: `Teste realizado em ${new Date().toLocaleString('pt-BR')}\n\nServidor: ${SERVER_IP}\nPorta: ${PORT}\n\nTeste de conectividade e envio de alertas do Zabbix WhatsApp Bot.`
};

function makeRequest(host = SERVER_IP) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testPayload);
    
    const options = {
      hostname: host,
      port: PORT,
      path: '/zabbix',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` })
      },
      timeout: 30000 // 30 segundos de timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function testHealthCheck(host = SERVER_IP) {
  console.log(`🏥 Testando healthcheck em ${host}:${PORT}...`);
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get(`http://${host}:${PORT}/health`, {
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
    });

    if (response.statusCode === 200) {
      const health = JSON.parse(response.body);
      console.log('✅ Healthcheck OK:', health);
      return health;
    } else {
      console.log('❌ Healthcheck falhou:', response.statusCode, response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no healthcheck:', error.message);
    return false;
  }
}

async function testZabbixEndpoint(host = SERVER_IP) {
  console.log(`📨 Testando endpoint /zabbix em ${host}:${PORT}...`);
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await makeRequest(host);
    
    console.log(`Status: ${response.statusCode}`);
    console.log('Response:', response.body);
    
    if (response.statusCode === 200) {
      console.log('✅ Teste do endpoint /zabbix passou!');
      return true;
    } else {
      console.log('❌ Teste do endpoint /zabbix falhou!');
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar endpoint:', error.message);
    return false;
  }
}

async function testNetworkConnectivity() {
  console.log('🌐 Testando conectividade de rede...');
  
  // Teste localhost
  console.log('\n📍 Testando localhost...');
  const localhostHealth = await testHealthCheck('localhost');
  const localhostZabbix = await testZabbixEndpoint('localhost');
  
  // Teste IP do servidor
  console.log(`\n📍 Testando ${SERVER_IP}...`);
  const serverHealth = await testHealthCheck(SERVER_IP);
  const serverZabbix = await testZabbixEndpoint(SERVER_IP);
  
  return {
    localhost: { health: localhostHealth, zabbix: localhostZabbix },
    server: { health: serverHealth, zabbix: serverZabbix }
  };
}

async function main() {
  console.log('🧪 Iniciando testes do Zabbix WhatsApp Bot - Servidor\n');
  console.log(`🖥️  Servidor: ${SERVER_IP}:${PORT}`);
  console.log(`🔐 Token configurado: ${API_TOKEN ? 'SIM' : 'NÃO'}\n`);
  
  const results = await testNetworkConnectivity();
  
  console.log('\n📋 Resumo dos testes:');
  console.log('='.repeat(50));
  
  console.log('\n🏠 LOCALHOST:');
  console.log(`  Healthcheck: ${results.localhost.health ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`  Endpoint Zabbix: ${results.localhost.zabbix ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`  WhatsApp: ${results.localhost.health?.whatsapp ? '✅ CONECTADO' : '❌ DESCONECTADO'}`);
  
  console.log(`\n🖥️  SERVIDOR (${SERVER_IP}):`);
  console.log(`  Healthcheck: ${results.server.health ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`  Endpoint Zabbix: ${results.server.zabbix ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`  WhatsApp: ${results.server.health?.whatsapp ? '✅ CONECTADO' : '❌ DESCONECTADO'}`);
  
  if (!API_TOKEN) {
    console.log('\n⚠️  Aviso: API_TOKEN não configurado - endpoint desprotegido');
  }
  
  // Recomendações
  console.log('\n💡 Recomendações:');
  if (!results.localhost.health && !results.server.health) {
    console.log('❌ Serviço não está rodando. Execute: npm start');
  } else if (results.localhost.health && !results.server.health) {
    console.log('⚠️  Serviço roda local mas não é acessível externamente');
    console.log('   Verifique firewall e configuração de rede');
  } else if (!results.localhost.health?.whatsapp && !results.server.health?.whatsapp) {
    console.log('⚠️  WhatsApp não está conectado. Escaneie o QR Code');
  }
  
  const allPassed = (results.localhost.health && results.localhost.zabbix) || 
                   (results.server.health && results.server.zabbix);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
