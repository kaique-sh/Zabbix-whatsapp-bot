#!/usr/bin/env node
/**
 * Script para analisar tickets existentes e entender estrutura de campos
 */

require('dotenv').config();
const FreshserviceIntegration = require('./src/integrations/freshservice');

async function analyzeExistingTickets() {
    console.log('🔍 Analisando tickets existentes para entender estrutura...\n');

    const freshservice = new FreshserviceIntegration({});

    if (!freshservice.isEnabled()) {
        console.log('❌ Freshservice não configurado');
        return;
    }

    // Usar o ID do ticket que sabemos que foi criado com sucesso
    const ticketId = 154303; // ID do ticket de sucesso que vimos antes

    console.log(`📋 Analisando ticket ${ticketId}...`);
    const analysisResult = await freshservice.analyzeTicketFields(ticketId);

    if (!analysisResult.success) {
        console.log('❌ Erro ao analisar ticket:', analysisResult.error);

        // Tentar outros IDs de ticket
        console.log('\n🔄 Tentando outros IDs de ticket...');
        const alternativeIds = [154303, 155405]; // IDs que vimos nos logs

        for (const altId of alternativeIds) {
            if (altId === ticketId) continue;

            console.log(`📋 Tentando ticket ${altId}...`);
            const altResult = await freshservice.analyzeTicketFields(altId);
            if (altResult.success) {
                console.log('✅ Ticket analisado com sucesso!');
                return;
            }
        }

        return;
    }

    console.log('\n💡 Baseado na análise do ticket de sucesso:');
    console.log('📋 Estrutura recomendada para novos tickets:');

    const ticket = analysisResult.ticket;

    // Gerar estrutura baseada no ticket de sucesso
    const recommendedStructure = {
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        source: ticket.source,
        group_id: ticket.group_id,
        workspace_id: ticket.workspace_id,
        department_id: ticket.department_id,
        custom_fields: ticket.custom_fields || {}
    };

    console.log('\n📝 Estrutura recomendada:');
    console.log(JSON.stringify(recommendedStructure, null, 2));

    // Verificar se há empresa no ticket de sucesso
    if (ticket.custom_fields && Object.keys(ticket.custom_fields).length > 0) {
        console.log('\n🏷️ Campos customizados encontrados no ticket de sucesso:');
        Object.entries(ticket.custom_fields).forEach(([key, value]) => {
            console.log(`   ${key}: ${JSON.stringify(value)}`);
        });
    } else {
        console.log('\n🏷️ Nenhum campo customizado encontrado no ticket de sucesso');
        console.log('💡 Isso sugere que o campo empresa pode não estar nos custom_fields');
    }

    // Sugerir próximos passos
    console.log('\n🎯 Próximos passos sugeridos:');
    console.log('1. Verificar se existe um campo "empresa" como campo direto (não custom_field)');
    console.log('2. Testar diferentes estruturas para o campo empresa');
    console.log('3. Contatar suporte Freshservice com essas informações');
}

// Executar análise
analyzeExistingTickets().then(() => {
    console.log('\n🏁 Análise concluída');
    process.exit(0);
}).catch(error => {
    console.error('Erro no script:', error);
    process.exit(1);
});
