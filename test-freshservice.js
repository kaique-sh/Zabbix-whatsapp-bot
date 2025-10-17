#!/usr/bin/env node
/**
 * Script de diagnóstico para Freshservice
 * Testa a integração e identifica problemas de validação
 */

require('dotenv').config();
const FreshserviceIntegration = require('./src/integrations/freshservice');
const logger = require('./src/config/logger');

async function testFreshserviceIntegration() {
    console.log('🔧 Testando integração Freshservice...\n');

    // Verificar se as variáveis estão configuradas
    const domain = process.env.FRESHSERVICE_DOMAIN;
    const apiKey = process.env.FRESHSERVICE_API_KEY;

    console.log('📋 Configuração atual:');
    console.log(`   Domain: ${domain ? '✅ ' + domain : '❌ Não configurado'}`);
    console.log(`   API Key: ${apiKey ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`   Workspace ID: ${process.env.FRESHSERVICE_WORKSPACE_ID || 'Não configurado (opcional)'}`);
    console.log(`   Group ID: ${process.env.FRESHSERVICE_DEFAULT_GROUP_ID || 'Não configurado (opcional)'}`);

    if (!domain || !apiKey) {
        console.log('\n❌ Freshservice não está configurado no arquivo .env');
        console.log('📚 Consulte o arquivo .env.freshservice.example para ver como configurar');
        return;
    }

    // Inicializar integração
    const freshservice = new FreshserviceIntegration({});

    if (!freshservice.isEnabled()) {
        console.log('\n❌ Integração não habilitada devido a configuração incompleta');
        return;
    }

    console.log('\n✅ Integração habilitada, testando conectividade...');

    // Dados de teste
    const testData = {
        subject: 'Teste - Diagnóstico de Integração',
        description: 'Este é um ticket de teste criado pelo script de diagnóstico para verificar se a integração está funcionando corretamente.',
        phone: '5511999999999',
        email: 'teste+5511999999999@nextbot.com',
        priority: 2,
        source: 4,
        status: 2
    };

    try {
        console.log('\n📤 Enviando requisição de teste...');
        const result = await freshservice.createTicket(testData);

        if (result.success) {
            console.log('\n✅ Ticket criado com sucesso!');
            console.log(`   ID: ${result.ticketId}`);
            console.log(`   URL: ${result.ticketUrl}`);
            console.log(`   Número: ${result.ticketNumber}`);

            // Limpar ticket de teste (opcional)
            console.log('\n🧹 Você pode excluir este ticket de teste manualmente se desejar');
        } else {
            console.log('\n❌ Falha na criação do ticket');
            console.log(`   Erro: ${result.error}`);

            if (result.errorDetails) {
                console.log('\n📋 Detalhes do erro:');
                console.log(JSON.stringify(result.errorDetails, null, 2));
            }

            // Análise de possíveis causas
            console.log('\n🔍 Possíveis causas do erro:');
            if (result.error.includes('Validation failed')) {
                console.log('   • Campos obrigatórios ausentes ou inválidos');
                console.log('   • Formato de email inválido');
                console.log('   • Workspace ID ou Group ID inválidos');
            }
            if (result.error.includes('Unauthorized') || result.error.includes('401')) {
                console.log('   • API Key inválida');
                console.log('   • Domínio incorreto');
            }
            if (result.error.includes('403') || result.error.includes('Forbidden')) {
                console.log('   • API Key sem permissões suficientes');
                console.log('   • Workspace ID incorreto (para MSP)');
            }
            if (result.error.includes('404')) {
                console.log('   • Domínio não encontrado');
                console.log('   • URL da API incorreta');
            }
        }
    } catch (error) {
        console.log('\n💥 Erro inesperado:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Dados:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Executar teste
testFreshserviceIntegration().then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
}).catch(error => {
    console.error('Erro no script:', error);
    process.exit(1);
});
