#!/usr/bin/env node
/**
 * Script de teste para endpoint do Zabbix
 * Executa: npm run test:zabbix
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN;
const HOST = 'localhost';

const testPayload = {
  subject: 'Teste de Alerta',
  message: `Teste realizado em ${new Date().toLocaleString('pt-BR')}\n\nEste é um teste do sistema de alertas do Zabbix WhatsApp Bot.`
};

function makeRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testPayload);
    
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/zabbix',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` })
      }
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

    req.write(postData);
    req.end();
  });
}

async function testHealthCheck() {
  console.log('🏥 Testando healthcheck...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get(`http://${HOST}:${PORT}/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });
      req.on('error', reject);
    });

    if (response.statusCode === 200) {
      const health = JSON.parse(response.body);
      console.log('✅ Healthcheck OK:', health);
      return health.whatsapp;
    } else {
      console.log('❌ Healthcheck falhou:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no healthcheck:', error.message);
    return false;
  }
}

async function testZabbixEndpoint() {
  console.log('📨 Testando endpoint /zabbix...');
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await makeRequest();
    
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

async function main() {
  console.log('🧪 Iniciando testes do Zabbix WhatsApp Bot\n');
  
  // Teste 1: Healthcheck
  const isHealthy = await testHealthCheck();
  console.log('');
  
  // Teste 2: Endpoint Zabbix
  const isZabbixWorking = await testZabbixEndpoint();
  console.log('');
  
  // Resumo
  console.log('📋 Resumo dos testes:');
  console.log(`Healthcheck: ${isHealthy ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Endpoint Zabbix: ${isZabbixWorking ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`WhatsApp conectado: ${isHealthy ? '✅ SIM' : '❌ NÃO'}`);
  
  if (!API_TOKEN) {
    console.log('\n⚠️  Aviso: API_TOKEN não configurado - endpoint desprotegido');
  }
  
  process.exit(isHealthy && isZabbixWorking ? 0 : 1);
}

main().catch(console.error);
