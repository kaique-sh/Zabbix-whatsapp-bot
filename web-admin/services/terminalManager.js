/**
 * Terminal Manager - NextBot Solutions
 * Gerencia sessões de terminal PTY dedicadas por usuário
 */

const pty = require('node-pty');
const os = require('os');
const path = require('path');
const fs = require('fs');

class TerminalManager {
    constructor() {
        // Armazena sessões ativas: { userId: { sessionId: { pty, lastActivity, cwd } } }
        this.sessions = new Map();
        
        // Configurações padrão
        this.config = {
            shell: process.env.SHELL || '/bin/bash',
            defaultCwd: process.env.HOME || os.homedir(),
            maxSessionsPerUser: 5,
            sessionTimeout: 30 * 60 * 1000, // 30 minutos
            cleanupInterval: 5 * 60 * 1000, // 5 minutos
        };

        // Iniciar limpeza automática de sessões inativas
        this.startCleanupTimer();
    }

    /**
     * Cria uma nova sessão de terminal para um usuário
     */
    createSession(userId, options = {}) {
        try {
            // Verificar limite de sessões por usuário
            const userSessions = this.sessions.get(userId) || new Map();
            if (userSessions.size >= this.config.maxSessionsPerUser) {
                throw new Error(`Limite de ${this.config.maxSessionsPerUser} sessões atingido`);
            }

            // Gerar ID único para a sessão
            const sessionId = this.generateSessionId();

            // Configurar diretório de trabalho
            const cwd = options.cwd || this.config.defaultCwd;
            
            // Verificar se o diretório existe
            if (!fs.existsSync(cwd)) {
                fs.mkdirSync(cwd, { recursive: true });
            }

            // Criar PTY (pseudo-terminal)
            const ptyProcess = pty.spawn(this.config.shell, [], {
                name: 'xterm-256color',
                cols: options.cols || 80,
                rows: options.rows || 24,
                cwd: cwd,
                env: {
                    ...process.env,
                    TERM: 'xterm-256color',
                    COLORTERM: 'truecolor',
                    HOME: process.env.HOME || os.homedir(),
                    USER: process.env.USER || 'nextbot',
                    SHELL: this.config.shell,
                    PATH: process.env.PATH,
                    LANG: 'en_US.UTF-8',
                    LC_ALL: 'en_US.UTF-8'
                }
            });

            // Armazenar sessão
            const session = {
                pty: ptyProcess,
                sessionId: sessionId,
                userId: userId,
                cwd: cwd,
                createdAt: Date.now(),
                lastActivity: Date.now(),
                cols: options.cols || 80,
                rows: options.rows || 24,
                history: []
            };

            // Adicionar ao mapa de sessões do usuário
            if (!this.sessions.has(userId)) {
                this.sessions.set(userId, new Map());
            }
            this.sessions.get(userId).set(sessionId, session);

            console.log(`[TerminalManager] Sessão criada: ${sessionId} para usuário ${userId}`);

            return {
                sessionId,
                pid: ptyProcess.pid,
                cwd: cwd
            };

        } catch (error) {
            console.error('[TerminalManager] Erro ao criar sessão:', error);
            throw error;
        }
    }

    /**
     * Obtém uma sessão existente
     */
    getSession(userId, sessionId) {
        const userSessions = this.sessions.get(userId);
        if (!userSessions) {
            return null;
        }
        return userSessions.get(sessionId);
    }

    /**
     * Escreve dados no terminal
     */
    writeToSession(userId, sessionId, data) {
        const session = this.getSession(userId, sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada');
        }

        session.pty.write(data);
        session.lastActivity = Date.now();
    }

    /**
     * Redimensiona o terminal
     */
    resizeSession(userId, sessionId, cols, rows) {
        const session = this.getSession(userId, sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada');
        }

        session.pty.resize(cols, rows);
        session.cols = cols;
        session.rows = rows;
        session.lastActivity = Date.now();
    }

    /**
     * Destrói uma sessão específica
     */
    destroySession(userId, sessionId) {
        const userSessions = this.sessions.get(userId);
        if (!userSessions) {
            return false;
        }

        const session = userSessions.get(sessionId);
        if (!session) {
            return false;
        }

        try {
            // Matar processo PTY
            session.pty.kill();
            
            // Remover do mapa
            userSessions.delete(sessionId);
            
            // Se não há mais sessões, remover usuário
            if (userSessions.size === 0) {
                this.sessions.delete(userId);
            }

            console.log(`[TerminalManager] Sessão destruída: ${sessionId}`);
            return true;

        } catch (error) {
            console.error('[TerminalManager] Erro ao destruir sessão:', error);
            return false;
        }
    }

    /**
     * Destrói todas as sessões de um usuário
     */
    destroyUserSessions(userId) {
        const userSessions = this.sessions.get(userId);
        if (!userSessions) {
            return 0;
        }

        let count = 0;
        for (const [sessionId] of userSessions) {
            if (this.destroySession(userId, sessionId)) {
                count++;
            }
        }

        return count;
    }

    /**
     * Lista todas as sessões de um usuário
     */
    listUserSessions(userId) {
        const userSessions = this.sessions.get(userId);
        if (!userSessions) {
            return [];
        }

        const sessions = [];
        for (const [sessionId, session] of userSessions) {
            sessions.push({
                sessionId: sessionId,
                pid: session.pty.pid,
                cwd: session.cwd,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                cols: session.cols,
                rows: session.rows
            });
        }

        return sessions;
    }

    /**
     * Limpa sessões inativas
     */
    cleanupInactiveSessions() {
        const now = Date.now();
        let cleaned = 0;

        for (const [userId, userSessions] of this.sessions) {
            const sessionsToRemove = [];

            for (const [sessionId, session] of userSessions) {
                const inactiveTime = now - session.lastActivity;
                
                if (inactiveTime > this.config.sessionTimeout) {
                    sessionsToRemove.push(sessionId);
                }
            }

            // Remover sessões inativas
            for (const sessionId of sessionsToRemove) {
                if (this.destroySession(userId, sessionId)) {
                    cleaned++;
                }
            }
        }

        if (cleaned > 0) {
            console.log(`[TerminalManager] ${cleaned} sessões inativas removidas`);
        }

        return cleaned;
    }

    /**
     * Inicia timer de limpeza automática
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, this.config.cleanupInterval);

        console.log('[TerminalManager] Timer de limpeza iniciado');
    }

    /**
     * Gera ID único para sessão
     */
    generateSessionId() {
        return `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtém estatísticas do gerenciador
     */
    getStats() {
        let totalSessions = 0;
        const userStats = [];

        for (const [userId, userSessions] of this.sessions) {
            totalSessions += userSessions.size;
            userStats.push({
                userId,
                sessionCount: userSessions.size
            });
        }

        return {
            totalUsers: this.sessions.size,
            totalSessions,
            maxSessionsPerUser: this.config.maxSessionsPerUser,
            sessionTimeout: this.config.sessionTimeout,
            userStats
        };
    }

    /**
     * Destrói todas as sessões (cleanup geral)
     */
    destroyAll() {
        let count = 0;
        
        for (const [userId] of this.sessions) {
            count += this.destroyUserSessions(userId);
        }

        console.log(`[TerminalManager] Todas as sessões destruídas: ${count}`);
        return count;
    }
}

// Exportar instância singleton
module.exports = new TerminalManager();
