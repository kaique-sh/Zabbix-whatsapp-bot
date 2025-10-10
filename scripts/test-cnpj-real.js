#!/usr/bin/env node
/**
 * Teste com CNPJs reais conhecidos
 */

const { consultarCNPJ } = require('../src/services/cnpjService');

// CNPJs públicos conhecidos (empresas grandes)
const realCNPJs = [
  '33000167000001', // Petrobras
  '60746948000112', // Banco do Brasil
  '02558157000162', // Embraer
  '33592510000154', // Magazine Luiza
  '47508411000156'  // Mercado Livre
];

async function testRealCNPJs() {
  console.log('🧪 Teste com CNPJs Reais');
  console.log('=' .repeat(50));
  
  for (let i = 0; i < realCNPJs.length; i++) {
    const cnpj = realCNPJs[i];
    console.log(`\n${i + 1}. Testando CNPJ: ${cnpj}`);
    console.log('Aguarde...');
    
    try {
      const resultado = await consultarCNPJ(cnpj);
      
      if (resultado.includes('❌')) {
        console.log('❌ Não encontrado ou erro');
        console.log(resultado.split('\n')[0]); // Primeira linha do erro
      } else {
        console.log('✅ SUCESSO!');
        // Extrair apenas o nome da empresa
        const lines = resultado.split('\n');
        const razaoSocial = lines.find(line => line.includes('Razão Social'));
        if (razaoSocial) {
          console.log(razaoSocial);
        }
      }
    } catch (error) {
      console.log('❌ ERRO:', error.message);
    }
    
    // Aguardar entre requisições para não sobrecarregar a API
    if (i < realCNPJs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 Teste concluído!');
  console.log('\n💡 Se algum CNPJ funcionou, a integração está OK!');
  console.log('   Teste no WhatsApp com: !cnpj [número que funcionou]');
}

testRealCNPJs().catch(console.error);
