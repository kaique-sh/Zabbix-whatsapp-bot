console.log('⏰ Hora atual:', new Date().toLocaleString());

const FreshserviceIntegration = require('./src/integrations/freshservice.js');

async function manualMonitoring() {
  console.log('🔍 Executando monitoramento manual...');

  const freshservice = new FreshserviceIntegration({});

  if (!freshservice.isEnabled()) {
    console.log('❌ Freshservice não habilitado no ambiente de teste');
    return;
  }

  console.log('✅ Freshservice habilitado');

  const result = await freshservice.monitorTicketStatusChanges();
  console.log('📊 Resultado:', result);
}

manualMonitoring().catch(console.error);
