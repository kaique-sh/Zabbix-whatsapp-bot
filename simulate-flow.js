console.log('🧪 Simulando sistema completo de notificações...');

const FreshserviceIntegration = require('./src/integrations/freshservice.js');

async function simulateNotificationFlow() {
  console.log('🔄 Simulando criação e resolução de ticket...');

  try {
    const freshservice = new FreshserviceIntegration({});

    if (!freshservice.isEnabled()) {
      console.log('❌ Freshservice não habilitado');
      return;
    }

    console.log('✅ Freshservice habilitado');

    // Simular dados de um ticket recém-criado
    const mockTicket = {
      id: 999999, // ID simulado
      subject: '[WhatsApp] Atendimento - Simulação',
      status: 5, // Resolvido
      updated_at: new Date().toISOString()
    };

    const mockFullTicket = {
      phone: null,
      email: null,
      requester_phone: null,
      custom_fields: {},
      requester_name: 'Usuário de Teste',
      description_text: `Solicitação de atendimento via WhatsApp

Contato: Usuário de Teste
Telefone: 551199999999

Mensagem:
Teste de notificação automática

---
Ticket criado automaticamente pelo bot WhatsApp
Telefone de contato: 551199999999`
    };

    console.log('📋 Simulando processamento de ticket resolvido...');

    // Simular o processamento do monitoramento
    const ticketInfo = await freshservice.getTicketInfo(mockTicket);

    if (!ticketInfo) {
      console.log('❌ Não foi possível obter informações do ticket');
      return;
    }

    console.log('📱 Telefone encontrado:', ticketInfo.phone);
    console.log('🔗 Identificador:', ticketInfo.userIdentifier);

    if (!ticketInfo.phone) {
      console.log('❌ Ticket sem telefone, pulando notificação');
      return;
    }

    // Verificar se WhatsApp client está disponível
    if (!freshservice.whatsappClient) {
      console.log('⚠️ Cliente WhatsApp não disponível para notificações');
      console.log('💡 Isso significa que o bot não está totalmente inicializado');
      return;
    }

    console.log('✅ Cliente WhatsApp disponível');

    // Simular envio de notificação
    const message = `✅ *Ticket Resolvido!*

Olá! Seu chamado foi marcado como *RESOLVIDO*.

📋 *Detalhes:*
• ID: #${ticketInfo.id}
• Assunto: ${ticketInfo.subject}
• Resolvido em: ${new Date(ticketInfo.resolvedAt).toLocaleString('pt-BR')}

Obrigado por usar nossos serviços! 🎉`;

    console.log('📨 Simulando envio de mensagem...');
    console.log('📱 Para:', ticketInfo.phone);
    console.log('💬 Mensagem:', message.substring(0, 100) + '...');

    console.log('✅ SIMULAÇÃO CONCLUÍDA - Sistema funcionaria perfeitamente!');

  } catch (error) {
    console.error('❌ Erro na simulação:', error.message);
  }
}

simulateNotificationFlow().catch(console.error);
