#!/usr/bin/env node
/**
 * Script de teste para integração Zabbix-WhatsApp
 * Simula alertas reais do Zabbix
 * Executa: node scripts/test-zabbix-integration.js
 */

require('dotenv').config();
const http = require('http');

const WHATSAPP_BOT_IP = '10.168.217.43';
const ZABBIX_SERVER_IP = '10.1.50.31';
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN;

// Templates de alertas do Zabbix
const alertTemplates = {
  high_cpu: {
    subject: '🚨 HIGH: CPU Usage alto em servidor-web-01',
    message: `🔴 *PROBLEMA DETECTADO*

📊 *Host*: servidor-web-01
🏷️ *Item*: CPU Usage
⚠️ *Severidade*: HIGH
🕐 *Horário*: ${new Date().toLocaleString('pt-BR')}

📝 *Descrição*:
CPU usage acima de 90% por mais de 5 minutos

💡 *Valor Atual*: 95.2%

🔗 *Zabbix*: http://${ZABBIX_SERVER_IP}/zabbix`
  },

  disaster_disk: {
    subject: '🚨 DISASTER: Disco cheio em servidor-db-01',
    message: `🔴 *PROBLEMA CRÍTICO*

📊 *Host*: servidor-db-01
🏷️ *Item*: Disk Space /var
⚠️ *Severidade*: DISASTER
🕐 *Horário*: ${new Date().toLocaleString('pt-BR')}

📝 *Descrição*:
Espaço em disco menor que 5% disponível

💡 *Valor Atual*: 2.1% livre (850MB de 40GB)

🔗 *Zabbix*: http://${ZABBIX_SERVER_IP}/zabbix`
  },

  recovery_cpu: {
    subject: '✅ RESOLVIDO: CPU Usage em servidor-web-01',
    message: `✅ *PROBLEMA RESOLVIDO*

📊 *Host*: servidor-web-01
🏷️ *Item*: CPU Usage
🕐 *Resolvido em*: ${new Date().toLocaleString('pt-BR')}
⏱️ *Duração*: 00:12:34

💡 *Valor Atual*: 45.8%`
  },

  network_down: {
    subject: '🚨 DISASTER: Interface de rede down em switch-core-01',
    message: `🔴 *PROBLEMA CRÍTICO*

📊 *Host*: switch-core-01
🏷️ *Item*: Interface eth0 status
⚠️ *Severidade*: DISASTER
🕐 *Horário*: ${new Date().toLocaleString('pt-BR')}

📝 *Descrição*:
Interface principal de rede está down

💡 *Status*: DOWN
🌐 *Interface*: eth0 (192.168.1.1)

🔗 *Zabbix*: http://${ZABBIX_SERVER_IP}/zabbix`
  }
};

function sendAlert(alertType) {
  return new Promise((resolve, reject) => {
    const alert = alertTemplates[alertType];
    if (!alert) {
      reject(new Error(`Tipo de alerta '${alertType}' não encontrado`));
      return;
    }

    const postData = JSON.stringify(alert);
    
    const options = {
      hostname: WHATSAPP_BOT_IP,
      port: PORT,
      path: '/zabbix',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Zabbix/6.0',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` })
      },
      timeout: 30000
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
          body: data,
          alertType: alertType
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

async function testHealthCheck() {
  console.log(`🏥 Verificando saúde do WhatsApp Bot (${WHATSAPP_BOT_IP}:${PORT})...`);
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get(`http://${WHATSAPP_BOT_IP}:${PORT}/health`, {
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
      console.log('✅ WhatsApp Bot está funcionando:', health);
      return health;
    } else {
      console.log('❌ WhatsApp Bot com problemas:', response.statusCode, response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar WhatsApp Bot:', error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('🧪 Teste de Integração Zabbix-WhatsApp Bot');
  console.log('=' .repeat(50));
  console.log(`📡 Zabbix Server: ${ZABBIX_SERVER_IP}`);
  console.log(`🤖 WhatsApp Bot: ${WHATSAPP_BOT_IP}:${PORT}`);
  console.log(`🔐 Token configurado: ${API_TOKEN ? 'SIM' : 'NÃO'}`);
  console.log('');

  // 1. Verificar saúde do bot
  const health = await testHealthCheck();
  if (!health) {
    console.log('❌ WhatsApp Bot não está funcionando. Abortando testes.');
    process.exit(1);
  }

  if (!health.whatsapp) {
    console.log('⚠️  WhatsApp não está conectado. Alertas podem falhar.');
  }

  console.log('');

  // 2. Testar diferentes tipos de alerta
  const testResults = {};
  
  for (const [alertType, alert] of Object.entries(alertTemplates)) {
    console.log(`📨 Testando alerta: ${alertType.toUpperCase()}`);
    console.log(`   Assunto: ${alert.subject}`);
    
    try {
      const result = await sendAlert(alertType);
      
      if (result.statusCode === 200) {
        console.log(`   ✅ Sucesso (${result.statusCode})`);
        testResults[alertType] = 'SUCCESS';
      } else {
        console.log(`   ❌ Falhou (${result.statusCode}): ${result.body}`);
        testResults[alertType] = 'FAILED';
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      testResults[alertType] = 'ERROR';
    }
    
    // Aguardar entre testes para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 3. Resumo dos resultados
  console.log('\n📋 Resumo dos Testes:');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  let totalTests = Object.keys(testResults).length;
  
  for (const [alertType, result] of Object.entries(testResults)) {
    const status = result === 'SUCCESS' ? '✅' : '❌';
    console.log(`${status} ${alertType.padEnd(15)} - ${result}`);
    if (result === 'SUCCESS') successCount++;
  }
  
  console.log('');
  console.log(`📊 Taxa de Sucesso: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  
  // 4. Recomendações
  console.log('\n💡 Recomendações:');
  if (successCount === totalTests) {
    console.log('🎉 Todos os testes passaram! Integração funcionando perfeitamente.');
    console.log('📝 Configure o Zabbix conforme documentação em docs/zabbix-config.md');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique:');
    if (!API_TOKEN) {
      console.log('   - Configure API_TOKEN no arquivo .env');
    }
    if (!health.whatsapp) {
      console.log('   - Conecte o WhatsApp escaneando o QR Code');
    }
    console.log('   - Verifique conectividade de rede entre servidores');
    console.log('   - Consulte logs: npm run pm2:logs');
  }
  
  console.log('\n🔗 Links Úteis:');
  console.log(`   Health Check: http://${WHATSAPP_BOT_IP}:${PORT}/health`);
  console.log(`   Zabbix Server: http://${ZABBIX_SERVER_IP}/zabbix`);
  console.log('   Documentação: docs/zabbix-config.md');
  
  process.exit(successCount === totalTests ? 0 : 1);
}

// Executar testes
runIntegrationTests().catch(console.error);
