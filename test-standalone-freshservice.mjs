import axios from "axios";

const freshConfig = {
  domain: "voetur1.freshservice.com",
  apiKey: "mOIDpHLZY1EITgT0Rfnh",
  workspaceId: 18,
  groupId: 21000569060,
  departmentId: 21000431906,
};

// Lista de empresas válidas (você pode usar lógica dinâmica aqui se quiser)
const validCompanies = [
  "VTC OPERADORA LOGÍSTICA (Matriz)",
  "VOETUR TURISMO (Matriz)",
  "VIP CARGAS BRASÍLIA (Matriz)",
  "VIP SERVICE CLUB MARINA (Matriz)",
  "VIP CARGAS RIO (MATRIZ)",
];

async function createTicket({ nome, telefone, mensagem, empresa }) {
  const api = axios.create({
    baseURL: `https://${freshConfig.domain}/api/v2`,
    auth: {
      username: freshConfig.apiKey,
      password: "X", // senha pode ser qualquer string
    },
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  // Se a empresa não for informada ou for inválida, define a padrão
  const empresaValida = validCompanies.includes(empresa)
    ? empresa
    : "VTC OPERADORA LOGÍSTICA (Matriz)";

  // Monta o payload do ticket
  const payload = {
    subject: `[WhatsApp] Atendimento - ${nome}`,
    description: `Solicitação de atendimento via WhatsApp\n\nContato: ${nome}\nTelefone: ${telefone}\nMensagem:\n${mensagem}\n\n---\nTicket criado automaticamente pelo bot WhatsApp`,
    email: `whatsapp+${telefone}@nextbot.com`,
    phone: telefone,
    status: 2,
    priority: 2,
    source: 4,
    group_id: freshConfig.groupId,
    workspace_id: freshConfig.workspaceId,
    department_id: freshConfig.departmentId,
    category: "SUPORTE TÉCNICO",
    sub_category: "Outros Atendimentos",
    type: "Case",
    // Removendo empresa - campo não reconhecido pelo ambiente
    // custom_fields: {
    //   empresa: empresaValida,
    // },
  };

  try {
    const res = await api.post("/tickets", payload);
    console.log("✅ Ticket criado com sucesso!");
    console.log("ID do ticket:", res.data.ticket.id);
    return {
      success: true,
      ticketId: res.data.ticket.id,
      ticket: res.data.ticket
    };
  } catch (err) {
    if (err.response) {
      console.error("❌ Erro ao criar ticket:");
      console.error(err.response.data);
      return {
        success: false,
        error: err.response.data?.description || err.message
      };
    } else {
      console.error("❌ Erro de rede ou timeout:", err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

// Script de teste
async function testTicketCreation() {
  console.log("🔧 Testando criação de ticket Freshservice...");

  const result = await createTicket({
    nome: "Teste Bot",
    telefone: "5511999999999",
    mensagem: "Teste de integração standalone",
    empresa: "VTC OPERADORA LOGÍSTICA (Matriz)"
  });

  console.log("🏁 Resultado do teste:", result);
}

// Executar teste se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testTicketCreation().catch(console.error);
}

export { createTicket, freshConfig, validCompanies };
