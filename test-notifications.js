const FreshserviceIntegration = require('./src/integrations/freshservice.js');

async function testNotificationSystem() {
  console.log('🧪 Testando sistema de notificações...');

  try {
    // Criar instância da integração
    const freshservice = new FreshserviceIntegration({});

    if (!freshservice.isEnabled()) {
      console.log('❌ Freshservice não configurado');
      return;
    }

    console.log('✅ Integração Freshservice funcionando');

    // Testar monitoramento manualmente
    console.log('🔍 Executando monitoramento manual...');
    const result = await freshservice.monitorTicketStatusChanges();

    console.log('📊 Resultado do monitoramento:', result);

    if (result.success) {
      console.log(`✅ Monitoramento executado com sucesso! Processados: ${result.processed} tickets`);
    } else {
      console.log(`❌ Erro no monitoramento: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testNotificationSystem().catch(console.error);
