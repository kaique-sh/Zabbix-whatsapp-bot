const axios = require('axios');

async function checkRealTickets() {
  console.log('🔍 Verificando tickets reais no sistema...');

  try {
    const response = await axios.get('https://voetur1.freshservice.com/api/v2/tickets?workspace_id=18&per_page=20&order_by=updated_at&order_type=desc', {
      auth: { username: 'mOIDpHLZY1EITgT0Rfnh', password: 'X' },
      headers: { 'Content-Type': 'application/json' }
    });

    const tickets = response.data.tickets || [];
    const resolvedTickets = tickets.filter(t => t.status === 5);

    console.log(`📊 Total de tickets: ${tickets.length}`);
    console.log(`🎯 Tickets resolvidos: ${resolvedTickets.length}`);

    if (resolvedTickets.length > 0) {
      console.log('\n📋 Analisando primeiro ticket resolvido:');
      const ticket = resolvedTickets[0];
      console.log(`ID: ${ticket.id}, Status: ${ticket.status}, Atualizado: ${ticket.updated_at}`);

      // Buscar detalhes completos
      try {
        const detailsResponse = await axios.get(`https://voetur1.freshservice.com/api/v2/tickets/${ticket.id}`, {
          auth: { username: 'mOIDpHLZY1EITgT0Rfnh', password: 'X' },
          headers: { 'Content-Type': 'application/json' }
        });

        const fullTicket = detailsResponse.data.ticket;
        console.log(`📱 Phone: '${fullTicket.phone || 'Nenhum'}'`);
        console.log(`📧 Email: '${fullTicket.email || 'Nenhum'}'`);
        console.log(`👤 Requester: '${fullTicket.requester_name || 'Nenhum'}'`);

        console.log('\n📝 Verificando telefone na descrição:');
        const hasPhoneInDesc = fullTicket.description_text && fullTicket.description_text.includes('Telefone de contato:');
        console.log(`Contém telefone na descrição: ${hasPhoneInDesc ? '✅ Sim' : '❌ Não'}`);

        if (hasPhoneInDesc) {
          const phoneMatch = fullTicket.description_text.match(/Telefone de contato:\s*(\d+)/);
          if (phoneMatch) {
            console.log(`✅ Número encontrado: ${phoneMatch[1]}`);
          } else {
            console.log(`❌ Não conseguiu extrair número`);
          }
        }

      } catch (detailsError) {
        console.log(`❌ Erro ao buscar detalhes: ${detailsError.response?.data?.description || detailsError.message}`);
      }
    } else {
      console.log('❌ Nenhum ticket resolvido encontrado nas últimas 24h');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data?.description || error.message);
  }
}

checkRealTickets().catch(console.error);
