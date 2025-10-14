/**
 * Integração com Freshservice
 * Cria tickets automaticamente quando usuários solicitam atendimento via WhatsApp
 */

const axios = require('axios');
const logger = require('../config/logger');

class FreshserviceIntegration {
    constructor(config) {
        this.domain = config.domain || process.env.FRESHSERVICE_DOMAIN;
        this.apiKey = config.apiKey || process.env.FRESHSERVICE_API_KEY;
        this.workspaceId = config.workspaceId || (process.env.FRESHSERVICE_WORKSPACE_ID ? parseInt(process.env.FRESHSERVICE_WORKSPACE_ID) : null);
        this.defaultPriority = config.defaultPriority || 2; // 1=Low, 2=Medium, 3=High, 4=Urgent
        this.defaultStatus = 2; // 2=Open
        this.defaultSource = 4; // 4=Chat (WhatsApp)
        this.defaultType = 'Incident';
        this.defaultEmpresa = config.defaultEmpresa || process.env.FRESHSERVICE_DEFAULT_EMPRESA || 'VTC OPERADORA LOGÍSTICA (Matriz)';
        this.defaultGroupId = config.defaultGroupId || (process.env.FRESHSERVICE_DEFAULT_GROUP_ID ? parseInt(process.env.FRESHSERVICE_DEFAULT_GROUP_ID) : null);
        this.defaultDepartmentId = config.defaultDepartmentId || (process.env.FRESHSERVICE_DEFAULT_DEPARTMENT_ID ? parseInt(process.env.FRESHSERVICE_DEFAULT_DEPARTMENT_ID) : null);
        this.defaultCategory = config.defaultCategory || process.env.FRESHSERVICE_DEFAULT_CATEGORY || null;
        this.defaultSubCategory = config.defaultSubCategory || process.env.FRESHSERVICE_DEFAULT_SUBCATEGORY || null;
        this.ccEmails = config.ccEmails || [];
        this.enabled = this.domain && this.apiKey;
        
        if (!this.enabled) {
            logger.warn('Freshservice não configurado. Defina FRESHSERVICE_DOMAIN e FRESHSERVICE_API_KEY no .env');
            return;
        }

        // Configurar axios com autenticação
        const headers = {
            'Content-Type': 'application/json'
        };
        
        this.client = axios.create({
            baseURL: `https://${this.domain}/api/v2`,
            auth: {
                username: this.apiKey,
                password: 'X'
            },
            headers: headers,
            timeout: 30000
        });

        logger.info({ domain: this.domain }, 'Freshservice integração inicializada');
    }

    /**
     * Verificar se a integração está habilitada
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Criar ticket no Freshservice (Incidente com apenas Assunto e Descrição)
     * @param {Object} ticketData - Dados do ticket
     * @returns {Promise<Object>} - Ticket criado
     */
    async createTicket(ticketData) {
        if (!this.enabled) {
            logger.warn('Tentativa de criar ticket com Freshservice desabilitado');
            return { success: false, error: 'Freshservice não configurado' };
        }

        try {
            // Payload com campos obrigatórios
            const payload = {
                subject: ticketData.subject,
                description: ticketData.description,
                email: ticketData.email || 'whatsapp@nextbot.com', // Email obrigatório
                phone: ticketData.phone || null, // Telefone do WhatsApp
                status: 2, // 2 = Open
                priority: ticketData.priority || this.defaultPriority,
                source: this.defaultSource // 4 = Chat
            };

            // Adicionar group_id se disponível (deve ser número)
            if (ticketData.group_id) {
                payload.group_id = typeof ticketData.group_id === 'number' ? ticketData.group_id : parseInt(ticketData.group_id);
            } else if (this.defaultGroupId) {
                payload.group_id = this.defaultGroupId;
            }

            // Adicionar workspace_id se disponível (deve ser número)
            if (this.workspaceId) {
                payload.workspace_id = typeof this.workspaceId === 'number' ? this.workspaceId : parseInt(this.workspaceId);
            }

            // Adicionar department_id se disponível
            if (ticketData.department_id) {
                payload.department_id = typeof ticketData.department_id === 'number' ? ticketData.department_id : parseInt(ticketData.department_id);
            } else if (this.defaultDepartmentId) {
                payload.department_id = this.defaultDepartmentId;
            }

            // Adicionar category e sub_category se disponíveis
            if (ticketData.category || this.defaultCategory) {
                payload.category = ticketData.category || this.defaultCategory;
            }

            if (ticketData.sub_category || this.defaultSubCategory) {
                payload.sub_category = ticketData.sub_category || this.defaultSubCategory;
            }

            // Adicionar workspace_id no header se for MSP
            const config = {};
            if (this.workspaceId) {
                config.headers = { 'X-Workspace-Id': this.workspaceId };
            }

            const response = await this.client.post('/tickets', payload, config);
            
            const ticket = response.data.ticket;
            const ticketUrl = `https://${this.domain}/helpdesk/tickets/${ticket.id}`;

            logger.info({ 
                ticketId: ticket.id, 
                ticketUrl,
                subject: ticket.subject 
            }, 'Incidente criado com sucesso no Freshservice');

            return {
                success: true,
                ticket: ticket,
                ticketId: ticket.id,
                ticketUrl: ticketUrl,
                ticketNumber: ticket.id
            };
        } catch (error) {
            logger.error({ 
                error: error.response?.data || error.message,
                status: error.response?.status
            }, 'Erro ao criar incidente no Freshservice');
            
            return {
                success: false,
                error: error.response?.data?.description || error.message,
                errorDetails: error.response?.data
            };
        }
    }

    /**
     * Criar ticket a partir de mensagem do WhatsApp
     * @param {Object} whatsappData - Dados da mensagem do WhatsApp
     * @returns {Promise<Object>} - Ticket criado
     */
    async createTicketFromWhatsApp(whatsappData) {
        const {
            from, // Número do WhatsApp
            name, // Nome do contato
            message // Mensagem do usuário
        } = whatsappData;

        // Formatar número de telefone
        const phone = from.replace('@c.us', '').replace('@g.us', '');

        // Criar descrição formatada
        const description = `Solicitação de atendimento via WhatsApp

Contato: ${name}
Telefone: ${phone}

Mensagem:
${message}

---
Ticket criado automaticamente pelo bot WhatsApp`;

        // Criar subject
        const subject = `[WhatsApp] Atendimento - ${name}`;

        // Montar dados do ticket com campos obrigatórios
        const ticketData = {
            subject: subject,
            description: description,
            phone: phone, // Telefone do WhatsApp
            email: `whatsapp+${phone}@nextbot.com`, // Email gerado a partir do telefone
            priority: whatsappData.priority || 2,
            empresa: whatsappData.empresa || 'VTC OPERADORA LOGÍSTICA (Matriz)' // Empresa padrão
        };

        return await this.createTicket(ticketData);
    }

    /**
     * Obter ticket por ID
     * @param {number} ticketId - ID do ticket
     * @returns {Promise<Object>} - Dados do ticket
     */
    async getTicket(ticketId) {
        if (!this.enabled) {
            return { success: false, error: 'Freshservice não configurado' };
        }

        try {
            const response = await this.client.get(`/tickets/${ticketId}`);
            return {
                success: true,
                ticket: response.data.ticket
            };
        } catch (error) {
            logger.error({ error: error.message, ticketId }, 'Erro ao buscar ticket');
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Adicionar nota ao ticket
     * @param {number} ticketId - ID do ticket
     * @param {string} note - Nota a ser adicionada
     * @returns {Promise<Object>} - Resultado
     */
    async addNoteToTicket(ticketId, note) {
        if (!this.enabled) {
            return { success: false, error: 'Freshservice não configurado' };
        }

        try {
            const response = await this.client.post(`/tickets/${ticketId}/notes`, {
                body: note,
                private: false
            });
            
            logger.info({ ticketId }, 'Nota adicionada ao ticket');
            
            return {
                success: true,
                note: response.data.note
            };
        } catch (error) {
            logger.error({ error: error.message, ticketId }, 'Erro ao adicionar nota');
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = FreshserviceIntegration;
