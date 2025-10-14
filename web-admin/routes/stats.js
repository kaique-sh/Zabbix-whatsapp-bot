/**
 * Rotas de Estatísticas
 * Fornece dados estatísticos para o painel administrativo
 */

const express = require('express');
const router = express.Router();
const { getBotStats, getFreshserviceStats } = require('../services/statsService');
const { authenticateToken } = require('../middleware/auth');

/**
 * Obtém estatísticas gerais do bot
 * GET /api/stats/bot?days=7
 */
router.get('/bot', authenticateToken, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const stats = await getBotStats(days);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas do bot:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Obtém estatísticas específicas do Freshservice
 * GET /api/stats/freshservice
 */
router.get('/freshservice', authenticateToken, async (req, res) => {
    try {
        const stats = await getFreshserviceStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas do Freshservice:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * Dashboard resumido com principais métricas
 * GET /api/stats/dashboard
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const [botStats, freshserviceStats] = await Promise.all([
            getBotStats(1), // Apenas hoje
            getFreshserviceStats()
        ]);

        // Dados do dia atual
        const todayData = botStats.daily[0] || {};

        const dashboard = {
            today: {
                tickets_created: todayData.freshservice_tickets || 0,
                messages_sent: todayData.messages_sent || 0,
                messages_received: todayData.messages_received || 0,
                commands_executed: todayData.commands_executed || 0,
                cnpj_queries: todayData.cnpj_queries || 0,
                unique_users: todayData.unique_users || 0
            },
            totals: {
                tickets_created: freshserviceStats.total || 0,
                tickets_last_7_days: freshserviceStats.last7days || 0
            },
            summary: {
                total_tickets: freshserviceStats.total || 0,
                tickets_today: todayData.freshservice_tickets || 0,
                avg_tickets_per_day: Math.round((freshserviceStats.last7days || 0) / 7),
                total_messages: botStats.totals.total_messages || 0,
                unique_users: todayData.unique_users || 0
            }
        };

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        console.error('Erro ao obter dados do dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
