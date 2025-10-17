const FreshserviceIntegration = require('./src/integrations/freshservice.js');

async function testMonitoring() {
  console.log('🔍 Testando monitoramento de tickets...');

  try {
    const freshservice = new FreshserviceIntegration({});

    if (!freshservice.isEnabled()) {
      console.log('❌ Freshservice não configurado');
      return;
    }

    console.log('✅ Freshservice configurado');

    const result = await freshservice.monitorTicketStatusChanges();
    console.log('📊 Resultado do monitoramento:', result);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMonitoring().catch(console.error);
