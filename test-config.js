console.log('🧪 Testando configuração Freshservice...');

const FreshserviceIntegration = require('./src/integrations/freshservice.js');

async function testConfig() {
  const freshservice = new FreshserviceIntegration({});

  console.log('✅ Integração habilitada:', freshservice.isEnabled());
  console.log('📍 Domínio:', freshservice.domain);
  console.log('🔑 API Key configurada:', !!freshservice.apiKey);
  console.log('🏢 Workspace ID:', freshservice.workspaceId);

  if (freshservice.isEnabled()) {
    console.log('🚀 Executando teste de monitoramento...');
    const result = await freshservice.monitorTicketStatusChanges();
    console.log('📊 Resultado:', result);
  }
}

testConfig().catch(console.error);
