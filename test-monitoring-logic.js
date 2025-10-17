const axios = require('axios');

async function testMonitoringLogic() {
  console.log('🧪 Testando lógica de monitoramento...');

  try {
    // Simular dados de resposta da API
    const mockTicketsResponse = {
      tickets: [
        {
          id: 155530,
          subject: '[WhatsApp] Atendimento - Teste',
          status: 5, // Resolvido
          updated_at: new Date().toISOString()
        },
        {
          id: 155529,
          subject: '[WhatsApp] Outro teste',
          status: 2, // Aberto
          updated_at: new Date().toISOString()
        }
      ]
    };

    const mockTicketDetails = {
      phone: null,
      email: null,
      requester_phone: null,
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

    // Simular busca de tickets
    const allTickets = mockTicketsResponse.tickets;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const resolvedTickets = allTickets.filter(ticket =>
      ticket.status === 5 && new Date(ticket.updated_at) >= since
    );

    console.log(`📊 Tickets analisados: ${allTickets.length}`);
    console.log(`🎯 Tickets resolvidos: ${resolvedTickets.length}`);

    for (const ticket of resolvedTickets) {
      console.log(`📋 Verificando ticket ${ticket.id}...`);

      // Simular busca de detalhes
      const fullTicket = mockTicketDetails;

      // Buscar telefone em múltiplos campos
      let phone = null;
      let userIdentifier = null;

      if (fullTicket.phone) {
        phone = fullTicket.phone;
        userIdentifier = `phone:${phone}`;
      } else if (fullTicket.requester_phone) {
        phone = fullTicket.requester_phone;
        userIdentifier = `requester_phone:${phone}`;
      } else if (fullTicket.email && fullTicket.email.includes('whatsapp+')) {
        const phoneMatch = fullTicket.email.match(/whatsapp\+(\d+)@/);
        if (phoneMatch) {
          phone = phoneMatch[1];
          userIdentifier = `email_phone:${phone}`;
        }
      }

      // Fallback: extrair telefone da descrição
      if (!phone && fullTicket.description_text) {
        const phoneMatch = fullTicket.description_text.match(/Telefone de contato:\s*(\d+)/);
        if (phoneMatch) {
          phone = phoneMatch[1];
          userIdentifier = `description_phone:${phone}`;
          console.log(`✅ Telefone encontrado na descrição: ${phone}`);
        }
      }

      if (phone) {
        console.log(`📱 Número encontrado: ${phone}`);
        console.log(`🔗 Identificador: ${userIdentifier}`);
        console.log(`✅ Notificação seria enviada para ${phone}`);
      } else {
        console.log(`❌ Telefone não encontrado`);
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testMonitoringLogic().catch(console.error);
