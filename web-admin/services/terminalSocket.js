/**
 * Terminal WebSocket Handler - NextBot Solutions
 * Gerencia comunicação WebSocket para sessões de terminal PTY
 */

const terminalManager = require('./terminalManager');

class TerminalSocketHandler {
    constructor(io) {
        this.io = io;
        this.setupNamespace();
    }

    setupNamespace() {
        // Criar namespace dedicado para terminal
        const terminalNamespace = this.io.of('/terminal');

        terminalNamespace.on('connection', (socket) => {
            console.log(`[Terminal Socket] Cliente conectado: ${socket.id}`);

            // Verificar autenticação
            const user = socket.handshake.auth.user;
            if (!user || !user.id) {
                console.log('[Terminal Socket] Cliente não autenticado');
                socket.disconnect();
                return;
            }

            const userId = user.id;
            let currentSessionId = null;

            // Evento: Criar nova sessão
            socket.on('create-session', (data, callback) => {
                try {
                    const session = terminalManager.createSession(userId, {
                        cols: data.cols || 80,
                        rows: data.rows || 24,
                        cwd: data.cwd
                    });

                    currentSessionId = session.sessionId;

                    // Configurar listeners para saída do PTY
                    this.setupPtyListeners(userId, session.sessionId, socket);

                    callback({
                        success: true,
                        session: session
                    });

                } catch (error) {
                    console.error('[Terminal Socket] Erro ao criar sessão:', error);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });

            // Evento: Conectar a sessão existente
            socket.on('attach-session', (data, callback) => {
                try {
                    const { sessionId } = data;
                    const session = terminalManager.getSession(userId, sessionId);

                    if (!session) {
                        return callback({
                            success: false,
                            error: 'Sessão não encontrada'
                        });
                    }

                    currentSessionId = sessionId;

                    // Configurar listeners para saída do PTY
                    this.setupPtyListeners(userId, sessionId, socket);

                    callback({
                        success: true,
                        session: {
                            sessionId: session.sessionId,
                            pid: session.pty.pid,
                            cwd: session.cwd,
                            cols: session.cols,
                            rows: session.rows
                        }
                    });

                } catch (error) {
                    console.error('[Terminal Socket] Erro ao conectar sessão:', error);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });

            // Evento: Enviar dados para o terminal
            socket.on('terminal-input', (data) => {
                try {
                    if (!currentSessionId) {
                        return;
                    }

                    terminalManager.writeToSession(userId, currentSessionId, data);

                } catch (error) {
                    console.error('[Terminal Socket] Erro ao enviar dados:', error);
                    socket.emit('terminal-error', { error: error.message });
                }
            });

            // Evento: Redimensionar terminal
            socket.on('terminal-resize', (data) => {
                try {
                    if (!currentSessionId) {
                        return;
                    }

                    const { cols, rows } = data;
                    terminalManager.resizeSession(userId, currentSessionId, cols, rows);

                } catch (error) {
                    console.error('[Terminal Socket] Erro ao redimensionar:', error);
                    socket.emit('terminal-error', { error: error.message });
                }
            });

            // Evento: Destruir sessão
            socket.on('destroy-session', (data, callback) => {
                try {
                    const sessionId = data.sessionId || currentSessionId;
                    
                    if (!sessionId) {
                        return callback({
                            success: false,
                            error: 'Nenhuma sessão ativa'
                        });
                    }

                    const destroyed = terminalManager.destroySession(userId, sessionId);

                    if (sessionId === currentSessionId) {
                        currentSessionId = null;
                    }

                    callback({
                        success: destroyed,
                        message: destroyed ? 'Sessão destruída' : 'Sessão não encontrada'
                    });

                } catch (error) {
                    console.error('[Terminal Socket] Erro ao destruir sessão:', error);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });

            // Evento: Listar sessões
            socket.on('list-sessions', (data, callback) => {
                try {
                    const sessions = terminalManager.listUserSessions(userId);

                    callback({
                        success: true,
                        sessions: sessions
                    });

                } catch (error) {
                    console.error('[Terminal Socket] Erro ao listar sessões:', error);
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            });

            // Evento: Desconexão
            socket.on('disconnect', () => {
                console.log(`[Terminal Socket] Cliente desconectado: ${socket.id}`);
                // Nota: Não destruímos a sessão automaticamente para permitir reconexão
                // As sessões serão limpas pelo timeout de inatividade
            });
        });

        console.log('[Terminal Socket] Namespace /terminal configurado');
    }

    /**
     * Configura listeners para saída do PTY
     */
    setupPtyListeners(userId, sessionId, socket) {
        const session = terminalManager.getSession(userId, sessionId);
        
        if (!session) {
            return;
        }

        // Remover listeners anteriores se existirem
        session.pty.removeAllListeners('data');
        session.pty.removeAllListeners('exit');

        // Listener para dados de saída do terminal
        session.pty.on('data', (data) => {
            socket.emit('terminal-output', data);
        });

        // Listener para quando o processo termina
        session.pty.on('exit', (exitCode, signal) => {
            console.log(`[Terminal Socket] Processo PTY finalizado: ${sessionId} (code: ${exitCode}, signal: ${signal})`);
            
            socket.emit('terminal-exit', {
                sessionId: sessionId,
                exitCode: exitCode,
                signal: signal
            });

            // Limpar sessão
            terminalManager.destroySession(userId, sessionId);
        });
    }
}

module.exports = TerminalSocketHandler;
