console.log('🧪 Teste RÁPIDO do sistema de notificações...');

const FreshserviceIntegration = require('./src/integrations/freshservice.js');

async function testRealtime() {
  const freshservice = new FreshserviceIntegration({});

  if (!freshservice.isEnabled()) {
    console.log('❌ Freshservice não habilitado - verifique .env');
    console.log('💡 Adicione: FRESHSERVICE_DOMAIN=voetur1.freshservice.com');
    console.log('💡 Adicione: FRESHSERVICE_API_KEY=mOIDpHLZY1EITgT0Rfnh');
    return;
  }

  console.log('✅ Freshservice habilitado');
  console.log('🔍 Executando monitoramento...');

  const result = await freshservice.monitorTicketStatusChanges();
  console.log('📊 Resultado:', result);
}

testRealtime().catch(console.error);
