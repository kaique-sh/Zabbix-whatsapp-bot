/**
 * Terminal PTY Routes - NextBot Solutions
 * Rotas para gerenciamento de sessões de terminal PTY dedicadas
 */

const express = require('express');
const router = express.Router();
const terminalManager = require('../services/terminalManager');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/terminal-pty/create
 * Criar nova sessão de terminal
 */
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { cols, rows, cwd } = req.body;

        const session = terminalManager.createSession(userId, {
            cols: cols || 80,
            rows: rows || 24,
            cwd: cwd
        });

        res.json({
            success: true,
            session: session
        });

    } catch (error) {
        console.error('[Terminal PTY] Erro ao criar sessão:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/terminal-pty/sessions
 * Listar sessões ativas do usuário
 */
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = terminalManager.listUserSessions(userId);

        res.json({
            success: true,
            sessions: sessions
        });

    } catch (error) {
        console.error('[Terminal PTY] Erro ao listar sessões:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/terminal-pty/resize
 * Redimensionar terminal
 */
router.post('/resize', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId, cols, rows } = req.body;

        if (!sessionId || !cols || !rows) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros inválidos'
            });
        }

        terminalManager.resizeSession(userId, sessionId, cols, rows);

        res.json({
            success: true,
            message: 'Terminal redimensionado'
        });

    } catch (error) {
        console.error('[Terminal PTY] Erro ao redimensionar:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/terminal-pty/session/:sessionId
 * Destruir sessão específica
 */
router.delete('/session/:sessionId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const destroyed = terminalManager.destroySession(userId, sessionId);

        res.json({
            success: destroyed,
            message: destroyed ? 'Sessão destruída' : 'Sessão não encontrada'
        });

    } catch (error) {
        console.error('[Terminal PTY] Erro ao destruir sessão:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/terminal-pty/sessions
 * Destruir todas as sessões do usuário
 */
router.delete('/sessions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = terminalManager.destroyUserSessions(userId);

        res.json({
            success: true,
            message: `${count} sessões destruídas`
        });

    } catch (error) {
        console.error('[Terminal PTY] Erro ao destruir sessões:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/terminal-pty/stats
 * Obter estatísticas do gerenciador (admin only)
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // Verificar se é admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado'
            });
        }

        const stats = terminalManager.getStats();

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('[Terminal PTY] Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
