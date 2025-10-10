#!/usr/bin/env node
/**
 * Script de teste para funcionalidade de consulta CNPJ
 * Executa: node scripts/test-cnpj.js
 */

const { consultarCNPJ, isValidCNPJ, formatCNPJ, cleanCNPJ } = require('../src/services/cnpjService');

// CNPJs de teste (alguns válidos, alguns inválidos)
const testCNPJs = [
  '27865757000102', // CNPJ válido (exemplo)
  '11222333000181', // CNPJ válido (formato)
  '00000000000000', // CNPJ inválido (todos zeros)
  '12345678901234', // CNPJ inválido (dígitos incorretos)
  '27.865.757/0001-02', // CNPJ válido formatado
  '123', // CNPJ muito curto
  '', // CNPJ vazio
  null, // CNPJ nulo
  '27865757000103' // CNPJ com dígito verificador incorreto
];

async function testCNPJValidation() {
  console.log('🧪 Testando Validação de CNPJ');
  console.log('=' .repeat(40));
  
  testCNPJs.forEach((cnpj, index) => {
    const isValid = isValidCNPJ(cnpj);
    const status = isValid ? '✅' : '❌';
    console.log(`${status} Teste ${index + 1}: ${cnpj || 'null'} - ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
  });
  
  console.log('');
}

async function testCNPJFormatting() {
  console.log('🎨 Testando Formatação de CNPJ');
  console.log('=' .repeat(40));
  
  const validCNPJs = ['27865757000102', '11222333000181'];
  
  validCNPJs.forEach(cnpj => {
    const cleaned = cleanCNPJ(cnpj);
    const formatted = formatCNPJ(cnpj);
    console.log(`Original: ${cnpj}`);
    console.log(`Limpo: ${cleaned}`);
    console.log(`Formatado: ${formatted}`);
    console.log('');
  });
}

async function testCNPJAPI() {
  console.log('🌐 Testando API de Consulta CNPJ');
  console.log('=' .repeat(40));
  
  // Teste com CNPJ válido conhecido
  const testCNPJ = '12668623000116';
  
  console.log(`Consultando CNPJ: ${testCNPJ}`);
  console.log('Aguarde...\n');
  
  try {
    const resultado = await consultarCNPJ(testCNPJ);
    console.log('✅ Consulta realizada com sucesso!');
    console.log('Resultado:');
    console.log(resultado);
  } catch (error) {
    console.log('❌ Erro na consulta:', error.message);
  }
  
  console.log('\n' + '='.repeat(40));
  
  // Teste com CNPJ inválido
  const invalidCNPJ = '00000000000000';
  
  console.log(`Testando CNPJ inválido: ${invalidCNPJ}`);
  
  try {
    const resultado = await consultarCNPJ(invalidCNPJ);
    console.log('Resultado:');
    console.log(resultado);
  } catch (error) {
    console.log('❌ Erro esperado:', error.message);
  }
}

async function testCNPJNotFound() {
  console.log('\n🔍 Testando CNPJ Não Encontrado');
  console.log('=' .repeat(40));
  
  // CNPJ válido mas que provavelmente não existe
  const notFoundCNPJ = '11111111000111';
  
  console.log(`Consultando CNPJ inexistente: ${notFoundCNPJ}`);
  
  try {
    const resultado = await consultarCNPJ(notFoundCNPJ);
    console.log('Resultado:');
    console.log(resultado);
  } catch (error) {
    console.log('❌ Erro esperado:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Teste Completo da Funcionalidade CNPJ');
  console.log('=' .repeat(50));
  console.log('');
  
  // Teste 1: Validação
  await testCNPJValidation();
  
  // Teste 2: Formatação
  await testCNPJFormatting();
  
  // Teste 3: API - CNPJ válido
  await testCNPJAPI();
  
  // Teste 4: API - CNPJ não encontrado
  await testCNPJNotFound();
  
  console.log('\n🎉 Todos os testes concluídos!');
  console.log('');
  console.log('💡 Para testar no WhatsApp:');
  console.log('   1. Inicie o bot: npm start');
  console.log('   2. Envie: !cnpj 27865757000102');
  console.log('   3. Ou envie: !cnpj (para ver a ajuda)');
}

// Executar testes
runAllTests().catch(console.error);
