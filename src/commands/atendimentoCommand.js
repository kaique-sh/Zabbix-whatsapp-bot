/**
 * Comando de Atendimento
 * Cria ticket automaticamente no Freshservice quando usuário solicita atendimento
 */

const logger = require('../config/logger');
const FreshserviceIntegration = require('../integrations/freshservice');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Inicializar integração Freshservice
const freshservice = new FreshserviceIntegration({});

// Caminho do banco de dados
const DB_PATH = path.join(__dirname, '../../web-admin/database/admin.db');

// Armazenar contexto de usuários aguardando descrição do problema
const userContext = new Map();

/**
 * Registrar estatísticas no banco de dados
 * @param {string} action - Tipo de ação (ticket_created)
 * @param {Object} data - Dados da ação
 */
async function recordStatistics(action, data = {}) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);

        if (action === 'ticket_created') {
            const today = new Date().toISOString().split('T')[0];

            // Verificar se já existe registro para hoje
            db.get("SELECT * FROM bot_stats WHERE date = ?", [today], (err, row) => {
                if (err) {
                    logger.error({ error: err.message }, 'Erro ao consultar estatísticas');
                    db.close();
                    reject(err);
                    return;
                }

                if (row) {
                    // Atualizar registro existente
                    const freshserviceTickets = (row.freshservice_tickets || 0) + 1;
                    const totalMessages = (row.total_messages || 0) + 1;
                    const commandsExecuted = (row.commands_executed || 0) + 1;

                    db.run(
                        "UPDATE bot_stats SET freshservice_tickets = ?, total_messages = ?, commands_executed = ? WHERE date = ?",
                        [freshserviceTickets, totalMessages, commandsExecuted, today],
                        (err) => {
                            if (err) {
                                logger.error({ error: err.message }, 'Erro ao atualizar estatísticas');
                                reject(err);
                            } else {
                                logger.info({ freshserviceTickets, date: today }, 'Estatísticas de ticket atualizadas');
                                resolve();
                            }
                            db.close();
                        }
                    );
                } else {
                    // Criar novo registro para hoje
                    db.run(
                        "INSERT INTO bot_stats (date, freshservice_tickets, total_messages, commands_executed) VALUES (?, 1, 1, 1)",
                        [today],
                        (err) => {
                            if (err) {
                                logger.error({ error: err.message }, 'Erro ao inserir estatísticas');
                                reject(err);
                            } else {
                                logger.info({ freshserviceTickets: 1, date: today }, 'Estatísticas de ticket registradas');
                                resolve();
                            }
                            db.close();
                        }
                    );
                }
            });
        } else {
            db.close();
            resolve();
        }
    });
}

/**
 * Handler do comando !atendimento
 * @param {Object} message - Mensagem do WhatsApp
 * @param {Object} client - Cliente do WhatsApp
 * @returns {Promise<boolean>} - True se processou o comando
 */
async function handleAtendimentoCommand(message, client) {
    const body = (message.body || '').trim();
    const from = message.from;

    // Verificar se é o comando !atendimento
    if (body.toLowerCase() === '!atendimento' || body.toLowerCase() === '!ticket') {
        if (!freshservice.isEnabled()) {
            // Modo simulação - sem Freshservice configurado
            await message.reply(
                '🎫 *Sistema de Atendimento (Modo Simulação)*\n\n' +
                '⚠️ O Freshservice não está configurado ainda.\n\n' +
                '📋 *Para configurar:*\n' +
                '1. Obtenha sua API Key do Freshservice\n' +
                '2. Edite o arquivo .env\n' +
                '3. Adicione FRESHSERVICE_DOMAIN e FRESHSERVICE_API_KEY\n' +
                '4. Reinicie o bot\n\n' +
                '📚 *Documentação:*\n' +
                'Veja CONFIGURAR_FRESHSERVICE.md\n\n' +
                '_Por enquanto, você pode descrever seu problema e ele será registrado localmente._'
            );

            // Solicitar descrição mesmo sem Freshservice
            userContext.set(from, {
                waitingForDescription: true,
                timestamp: Date.now(),
                simulationMode: true
            });
            return true;
        }

        // Solicitar descrição do problema
        await message.reply(
            '🎫 *Abertura de Chamado*\n\n' +
            'Por favor, descreva seu problema ou solicitação em uma mensagem.\n\n' +
            '_Exemplo: Preciso de ajuda para configurar meu email_'
        );

        // Armazenar contexto do usuário
        userContext.set(from, {
            waitingForDescription: true,
            timestamp: Date.now()
        });

        return true;
    }

    // Verificar se usuário está no contexto de atendimento
    const context = userContext.get(from);
    if (context && context.waitingForDescription) {
        // Verificar timeout (5 minutos)
        if (Date.now() - context.timestamp > 300000) {
            userContext.delete(from);
            await message.reply(
                '⏱️ *Tempo esgotado*\n\n' +
                'O tempo para descrever seu problema expirou.\n' +
                'Digite *!atendimento* novamente para abrir um novo chamado.'
            );
            return true;
        }

        // Usuário enviou a descrição do problema
        await createTicketFromMessage(message, client);
        userContext.delete(from);
        return true;
    }

    return false;
}

/**
 * Criar ticket no Freshservice a partir da mensagem
 * @param {Object} message - Mensagem do WhatsApp
 * @param {Object} client - Cliente do WhatsApp
 */
async function createTicketFromMessage(message, client) {
    try {
        // Obter informações do contato
        const contact = await message.getContact();
        const contactName = contact.pushname || contact.name || 'Usuário WhatsApp';
        const phoneNumber = message.from.replace('@c.us', '');

        // Verificar se está em modo simulação
        const context = userContext.get(message.from);
        if (context && context.simulationMode) {
            // Modo simulação - sem Freshservice
            const ticketNumber = Math.floor(Math.random() * 9000) + 1000;
            
            await message.reply(
                '✅ *Chamado registrado localmente!*\n\n' +
                `📋 *Número de Referência:* #${ticketNumber}\n` +
                `📝 *Descrição:* ${message.body}\n` +
                `👤 *Contato:* ${contactName}\n` +
                `📞 *Telefone:* ${phoneNumber}\n\n` +
                '⚠️ *MODO SIMULAÇÃO*\n' +
                'Este chamado foi registrado apenas localmente.\n' +
                'Para criar tickets reais no Freshservice, configure:\n' +
                '• FRESHSERVICE_DOMAIN\n' +
                '• FRESHSERVICE_API_KEY\n\n' +
                '📚 Veja: CONFIGURAR_FRESHSERVICE.md'
            );

            logger.info({
                simulationMode: true,
                ticketNumber: ticketNumber,
                from: message.from,
                contact: contactName,
                description: message.body
            }, 'Ticket simulado criado');

            return;
        }

        // Modo real - com Freshservice configurado
        await message.reply('⏳ Criando seu chamado...');

        // Preparar dados para o Freshservice
        const whatsappData = {
            from: message.from,
            name: contactName,
            message: message.body,
            priority: 2, // Média
            category: 'WhatsApp Support',
            customFields: {
                origem: 'WhatsApp Bot',
                numero_whatsapp: phoneNumber,
                data_solicitacao: new Date().toISOString()
            }
        };

        // Criar ticket
        const result = await freshservice.createTicketFromWhatsApp(whatsappData);

        if (result.success) {
            // Ticket criado com sucesso
            const responseMessage = 
                '✅ *Chamado criado com sucesso!*\n\n' +
                `📋 *Número do Chamado:* #${result.ticketNumber}\n` +
                `🔗 *Link:* ${result.ticketUrl}\n\n` +
                `📝 *Descrição:* ${message.body}\n\n` +
                '👨‍💼 *Próximos passos:*\n' +
                '• Seu chamado foi direcionado para a fila de atendimento\n' +
                '• Um analista entrará em contato em breve\n' +
                '• Você receberá atualizações por email\n\n' +
                `_Guarde o número do chamado (#${result.ticketNumber}) para referência futura._`;

            await message.reply(responseMessage);

            // Registrar estatísticas
            await recordStatistics('ticket_created', {
                ticketId: result.ticketId,
                from: message.from,
                contact: contactName
            });

            logger.info({
                ticketId: result.ticketId,
                from: message.from,
                contact: contactName
            }, 'Ticket criado via WhatsApp');

        } else {
            // Erro ao criar ticket
            await message.reply(
                '❌ *Erro ao criar chamado*\n\n' +
                'Não foi possível criar seu chamado no momento.\n' +
                `Erro: ${result.error}\n\n` +
                'Por favor, tente novamente mais tarde ou entre em contato diretamente com o suporte.'
            );

            logger.error({
                error: result.error,
                from: message.from
            }, 'Erro ao criar ticket via WhatsApp');
        }

    } catch (error) {
        logger.error({ error: error.message, from: message.from }, 'Erro ao processar atendimento');
        
        await message.reply(
            '❌ *Erro inesperado*\n\n' +
            'Ocorreu um erro ao processar sua solicitação.\n' +
            'Por favor, tente novamente ou entre em contato diretamente com o suporte.'
        );
    }
}

/**
 * Limpar contextos antigos (executar periodicamente)
 */
function cleanupOldContexts() {
    const now = Date.now();
    const timeout = 300000; // 5 minutos

    for (const [key, context] of userContext.entries()) {
        if (now - context.timestamp > timeout) {
            userContext.delete(key);
        }
    }
}

// Limpar contextos antigos a cada minuto
setInterval(cleanupOldContexts, 60000);

module.exports = {
    handleAtendimentoCommand
};
