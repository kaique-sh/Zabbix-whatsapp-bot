const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../web-admin/database/admin.db');

/**
 * Registrar estatística no banco de dados
 * @param {string} type - Tipo de estatística (message_sent, message_received, command, cnpj)
 */
function logStat(type) {
    try {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('[StatsLogger] Erro ao conectar ao banco:', err.message);
                return;
            }
        });
        
        const today = new Date().toISOString().split('T')[0];
        
        // Mapear tipo para coluna
        const columnMap = {
            'message_sent': 'messages_sent',
            'message_received': 'messages_received',
            'command': 'commands_executed',
            'cnpj': 'cnpj_queries'
        };
        
        const column = columnMap[type];
        if (!column) {
            console.error('[StatsLogger] Tipo de estatística inválido:', type);
            db.close();
            return;
        }
        
        // Verificar se já existe registro para hoje
        db.get(
            'SELECT * FROM bot_stats WHERE date = ?',
            [today],
            (err, row) => {
                if (err) {
                    console.error('[StatsLogger] Erro ao verificar estatísticas:', err.message);
                    db.close();
                    return;
                }
                
                if (row) {
                    // Atualizar registro existente
                    let updateQuery = '';
                    
                    if (type === 'message_sent') {
                        updateQuery = 'UPDATE bot_stats SET messages_sent = messages_sent + 1, total_messages = total_messages + 1 WHERE date = ?';
                    } else if (type === 'message_received') {
                        updateQuery = 'UPDATE bot_stats SET messages_received = messages_received + 1, total_messages = total_messages + 1 WHERE date = ?';
                    } else if (type === 'command') {
                        updateQuery = 'UPDATE bot_stats SET commands_executed = commands_executed + 1, total_messages = total_messages + 1 WHERE date = ?';
                    } else if (type === 'cnpj') {
                        updateQuery = 'UPDATE bot_stats SET cnpj_queries = cnpj_queries + 1, total_messages = total_messages + 1 WHERE date = ?';
                    }
                    
                    db.run(updateQuery, [today], (err) => {
                        if (err) {
                            console.error('[StatsLogger] Erro ao atualizar estatísticas:', err.message);
                        } else {
                            console.log(`[StatsLogger] ✅ ${type} registrado`);
                        }
                        db.close();
                    });
                } else {
                    // Criar novo registro
                    const insertQuery = `
                        INSERT INTO bot_stats (
                            date, 
                            messages_sent, 
                            messages_received, 
                            commands_executed, 
                            cnpj_queries, 
                            total_messages
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    
                    const values = [today, 0, 0, 0, 0, 1];
                    
                    // Definir valor correto para a coluna específica
                    if (column === 'messages_sent') values[1] = 1;
                    else if (column === 'messages_received') values[2] = 1;
                    else if (column === 'commands_executed') values[3] = 1;
                    else if (column === 'cnpj_queries') values[4] = 1;
                    
                    db.run(insertQuery, values, (err) => {
                        if (err) {
                            console.error('[StatsLogger] Erro ao inserir estatísticas:', err.message);
                        } else {
                            console.log(`[StatsLogger] ✅ ${type} registrado (novo registro)`);
                        }
                        db.close();
                    });
                }
            }
        );
    } catch (error) {
        console.error('[StatsLogger] Erro geral:', error.message);
    }
}

/**
 * Registrar mensagem enviada
 */
function logMessageSent() {
    logStat('message_sent');
}

/**
 * Registrar mensagem recebida
 */
function logMessageReceived() {
    logStat('message_received');
}

/**
 * Registrar comando executado
 */
function logCommand() {
    logStat('command');
}

/**
 * Registrar consulta CNPJ
 */
function logCnpjQuery() {
    logStat('cnpj');
}

module.exports = {
    logMessageSent,
    logMessageReceived,
    logCommand,
    logCnpjQuery
};
