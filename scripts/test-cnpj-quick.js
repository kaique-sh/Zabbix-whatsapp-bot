#!/usr/bin/env node
/**
 * Teste rápido da correção do CNPJ
 */

const { consultarCNPJ } = require('../src/services/cnpjService');

async function testQuick() {
  console.log('🧪 Teste Rápido - Correção CNPJ');
  console.log('=' .repeat(40));
  
  const cnpj = '11222333000181'; // CNPJ válido para teste
  console.log(`Testando CNPJ: ${cnpj}`);
  console.log('Aguarde...\n');
  
  try {
    const resultado = await consultarCNPJ(cnpj);
    console.log('✅ SUCESSO!');
    console.log('Resultado:');
    console.log(resultado);
  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

testQuick().catch(console.error);
