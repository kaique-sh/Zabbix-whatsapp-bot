#!/usr/bin/env node
/**
 * Teste das diferentes APIs de CNPJ
 */

const https = require('https');

// APIs para testar
const apis = [
  {
    name: 'cnpj.ws',
    url: 'https://www.cnpj.ws/pt-BR/cnpj/33000167000001'
  },
  {
    name: 'receitaws',
    url: 'https://www.receitaws.com.br/v1/cnpj/33000167000001'
  }
];

function testAPI(api) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testando ${api.name}:`);
    console.log(`URL: ${api.url}`);
    
    const startTime = Date.now();
    
    const req = https.get(api.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Voetur-WhatsApp-Bot/1.0',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`Status: ${res.statusCode}`);
        console.log(`Tempo: ${duration}ms`);
        
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('✅ Sucesso!');
            console.log('Dados recebidos:');
            
            // Mostrar campos principais
            const fields = [
              'razao_social', 'nome', 'company_name',
              'nome_fantasia', 'fantasia', 'trade_name',
              'situacao_cadastral', 'situacao', 'status'
            ];
            
            fields.forEach(field => {
              if (json[field]) {
                console.log(`  ${field}: ${json[field]}`);
              }
            });
            
            resolve({ success: true, api: api.name, data: json });
          } catch (e) {
            console.log('❌ Erro ao parsear JSON');
            console.log('Resposta:', data.substring(0, 200));
            resolve({ success: false, api: api.name, error: 'JSON inválido' });
          }
        } else {
          console.log('❌ Erro HTTP');
          console.log('Resposta:', data.substring(0, 200));
          resolve({ success: false, api: api.name, error: `HTTP ${res.statusCode}` });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Erro de conexão:', error.message);
      resolve({ success: false, api: api.name, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Timeout');
      resolve({ success: false, api: api.name, error: 'Timeout' });
    });
  });
}

async function testAllAPIs() {
  console.log('🧪 Teste de APIs de CNPJ');
  console.log('=' .repeat(50));
  console.log('CNPJ de teste: 33000167000001 (Petrobras)');
  
  const results = [];
  
  for (const api of apis) {
    const result = await testAPI(api);
    results.push(result);
    
    // Aguardar entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📋 Resumo dos Testes:');
  console.log('=' .repeat(30));
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.api}: ${result.success ? 'OK' : result.error}`);
  });
  
  const workingAPIs = results.filter(r => r.success);
  
  if (workingAPIs.length > 0) {
    console.log(`\n🎉 ${workingAPIs.length} API(s) funcionando!`);
    console.log('💡 O sistema de fallback deve funcionar corretamente.');
  } else {
    console.log('\n❌ Nenhuma API funcionando!');
    console.log('💡 Pode ser problema temporário ou de conectividade.');
  }
}

testAllAPIs().catch(console.error);
