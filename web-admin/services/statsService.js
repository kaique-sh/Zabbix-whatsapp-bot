/**
 * Serviço de Estatísticas do Bot
 * Fornece dados estatísticos para o painel administrativo
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../database/admin.db');

/**
 * Obtém estatísticas gerais do bot
 */
function getBotStats(days = 7) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);

        // Buscar dados dos últimos X dias
        const query = `
            SELECT
                date,
                COALESCE(freshservice_tickets, 0) as freshservice_tickets,
                COALESCE(messages_sent, 0) as messages_sent,
                COALESCE(messages_received, 0) as messages_received,
                COALESCE(commands_executed, 0) as commands_executed,
                COALESCE(cnpj_queries, 0) as cnpj_queries,
                COALESCE(total_messages, 0) as total_messages,
                COALESCE(unique_users, 0) as unique_users
            FROM bot_stats
            WHERE date >= date('now', '-${days} days')
            ORDER BY date DESC
        `;

        db.all(query, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                // Calcular totais
                const totals = rows.reduce((acc, row) => ({
                    freshservice_tickets: acc.freshservice_tickets + (row.freshservice_tickets || 0),
                    messages_sent: acc.messages_sent + (row.messages_sent || 0),
                    messages_received: acc.messages_received + (row.messages_received || 0),
                    commands_executed: acc.commands_executed + (row.commands_executed || 0),
                    cnpj_queries: acc.cnpj_queries + (row.cnpj_queries || 0),
                    total_messages: acc.total_messages + (row.total_messages || 0),
                    unique_users: Math.max(acc.unique_users, row.unique_users || 0)
                }), {
                    freshservice_tickets: 0,
                    messages_sent: 0,
                    messages_received: 0,
                    commands_executed: 0,
                    cnpj_queries: 0,
                    total_messages: 0,
                    unique_users: 0
                });

                resolve({
                    daily: rows,
                    totals: totals,
                    period: `${days} dias`
                });
            }
            db.close();
        });
    });
}

/**
 * Obtém estatísticas específicas de chamados do Freshservice
 */
function getFreshserviceStats() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);

        // Buscar dados de hoje e dos últimos 7 dias
        const queries = {
            today: `
                SELECT COALESCE(freshservice_tickets, 0) as tickets
                FROM bot_stats
                WHERE date = date('now')
            `,
            last7days: `
                SELECT COALESCE(SUM(freshservice_tickets), 0) as tickets
                FROM bot_stats
                WHERE date >= date('now', '-7 days')
            `,
            total: `
                SELECT COALESCE(SUM(freshservice_tickets), 0) as tickets
                FROM bot_stats
            `
        };

        const results = {};

        // Executar consultas em paralelo
        const promises = Object.entries(queries).map(([key, query]) => {
            return new Promise((resolveQuery, rejectQuery) => {
                db.get(query, (err, row) => {
                    if (err) {
                        rejectQuery(err);
                    } else {
                        results[key] = row ? row.tickets : 0;
                        resolveQuery();
                    }
                });
            });
        });

        Promise.all(promises)
            .then(() => {
                db.close();
                resolve(results);
            })
            .catch((err) => {
                db.close();
                reject(err);
            });
    });
}

/**
 * Registra uma nova estatística
 */
function recordStat(statType, value = 1) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);
        const today = new Date().toISOString().split('T')[0];

        // Primeiro verificar se já existe registro para hoje
        db.get("SELECT * FROM bot_stats WHERE date = ?", [today], (err, row) => {
            if (err) {
                reject(err);
                db.close();
                return;
            }

            if (row) {
                // Atualizar registro existente
                const updateQuery = `UPDATE bot_stats SET ${statType} = ${statType} + ? WHERE date = ?`;
                db.run(updateQuery, [value, today], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ updated: true, date: today });
                    }
                    db.close();
                });
            } else {
                // Criar novo registro
                const columns = ['date', statType].join(', ');
                const values = [today, value].join(', ');
                const query = `INSERT INTO bot_stats (${columns}) VALUES (?, ?)`;

                db.run(query, [today, value], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ created: true, date: today });
                    }
                    db.close();
                });
            }
        });
    });
}

module.exports = {
    getBotStats,
    getFreshserviceStats,
    recordStat
};
