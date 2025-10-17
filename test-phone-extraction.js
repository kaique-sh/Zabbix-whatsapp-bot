const FreshserviceIntegration = require('./src/integrations/freshservice.js');

async function testNotificationLogic() {
  console.log('🧪 Testando lógica de extração de telefone...');

  try {
    const freshservice = new FreshserviceIntegration({});

    // Simular dados de um ticket resolvido
    const mockTicket = {
      id: 155530,
      subject: '[WhatsApp] Atendimento - Teste',
      status: 5,
      updated_at: new Date().toISOString()
    };

    const mockFullTicket = {
      phone: null,
      requester_phone: null,
      email: null,
      custom_fields: {},
      requester_name: 'Teste Usuário',
      description_text: `Solicitação de atendimento via WhatsApp

Contato: Teste Usuário
Telefone: 551199999999

Mensagem:
Teste de notificação

---
Ticket criado automaticamente pelo bot WhatsApp
Telefone de contato: 551199999999`
    };

    // Mock do método getTicket para retornar dados simulados
    freshservice.getTicket = async (ticketId) => {
      return {
        success: true,
        ticket: mockFullTicket
      };
    };

    // Testar extração de informações
    const ticketInfo = await freshservice.getTicketInfo(mockTicket);

    console.log('📋 Resultado da extração:');
    console.log('   Phone:', ticketInfo.phone || 'Nenhum');
    console.log('   User Identifier:', ticketInfo.userIdentifier || 'Nenhum');
    console.log('   Has Phone:', !!ticketInfo.phone);

    if (ticketInfo.phone) {
      console.log('✅ Telefone encontrado! Notificação seria enviada para:', ticketInfo.phone);
    } else {
      console.log('❌ Telefone não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testNotificationLogic().catch(console.error);
