/**
 * Terminal Client - NextBot Solutions
 * Cliente JavaScript para gerenciar sessões de terminal PTY via WebSocket
 */

class TerminalClient {
    constructor() {
        this.socket = null;
        this.currentSession = null;
        this.connected = false;
        this.callbacks = {
            onOutput: null,
            onExit: null,
            onError: null,
            onConnect: null,
            onDisconnect: null
        };
    }

    /**
     * Conecta ao servidor WebSocket
     */
    async connect(authToken, user) {
        return new Promise((resolve, reject) => {
            try {
                // Conectar ao namespace /terminal
                this.socket = io('/terminal', {
                    auth: {
                        token: authToken,
                        user: user
                    },
                    transports: ['websocket', 'polling']
                });

                this.socket.on('connect', () => {
                    console.log('[Terminal Client] Conectado ao servidor');
                    this.connected = true;
                    
                    if (this.callbacks.onConnect) {
                        this.callbacks.onConnect();
                    }
                    
                    resolve();
                });

                this.socket.on('disconnect', () => {
                    console.log('[Terminal Client] Desconectado do servidor');
                    this.connected = false;
                    
                    if (this.callbacks.onDisconnect) {
                        this.callbacks.onDisconnect();
                    }
                });

                this.socket.on('connect_error', (error) => {
                    console.error('[Terminal Client] Erro de conexão:', error);
                    reject(error);
                });

                // Listener para saída do terminal
                this.socket.on('terminal-output', (data) => {
                    if (this.callbacks.onOutput) {
                        this.callbacks.onOutput(data);
                    }
                });

                // Listener para quando o terminal é encerrado
                this.socket.on('terminal-exit', (data) => {
                    console.log('[Terminal Client] Terminal encerrado:', data);
                    this.currentSession = null;
                    
                    if (this.callbacks.onExit) {
                        this.callbacks.onExit(data);
                    }
                });

                // Listener para erros
                this.socket.on('terminal-error', (data) => {
                    console.error('[Terminal Client] Erro:', data);
                    
                    if (this.callbacks.onError) {
                        this.callbacks.onError(data.error);
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Cria uma nova sessão de terminal
     */
    async createSession(options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                return reject(new Error('Não conectado ao servidor'));
            }

            this.socket.emit('create-session', {
                cols: options.cols || 80,
                rows: options.rows || 24,
                cwd: options.cwd
            }, (response) => {
                if (response.success) {
                    this.currentSession = response.session;
                    console.log('[Terminal Client] Sessão criada:', this.currentSession);
                    resolve(response.session);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    /**
     * Conecta a uma sessão existente
     */
    async attachSession(sessionId) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                return reject(new Error('Não conectado ao servidor'));
            }

            this.socket.emit('attach-session', {
                sessionId: sessionId
            }, (response) => {
                if (response.success) {
                    this.currentSession = response.session;
                    console.log('[Terminal Client] Conectado à sessão:', this.currentSession);
                    resolve(response.session);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    /**
     * Envia dados para o terminal
     */
    write(data) {
        if (!this.connected || !this.currentSession) {
            console.warn('[Terminal Client] Sem sessão ativa');
            return;
        }

        this.socket.emit('terminal-input', data);
    }

    /**
     * Redimensiona o terminal
     */
    resize(cols, rows) {
        if (!this.connected || !this.currentSession) {
            return;
        }

        this.socket.emit('terminal-resize', { cols, rows });
    }

    /**
     * Destrói a sessão atual
     */
    async destroySession(sessionId = null) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                return reject(new Error('Não conectado ao servidor'));
            }

            this.socket.emit('destroy-session', {
                sessionId: sessionId
            }, (response) => {
                if (response.success) {
                    if (!sessionId || sessionId === this.currentSession?.sessionId) {
                        this.currentSession = null;
                    }
                    resolve(response);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    /**
     * Lista todas as sessões do usuário
     */
    async listSessions() {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                return reject(new Error('Não conectado ao servidor'));
            }

            this.socket.emit('list-sessions', {}, (response) => {
                if (response.success) {
                    resolve(response.sessions);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    /**
     * Define callback para saída do terminal
     */
    onOutput(callback) {
        this.callbacks.onOutput = callback;
    }

    /**
     * Define callback para quando o terminal é encerrado
     */
    onExit(callback) {
        this.callbacks.onExit = callback;
    }

    /**
     * Define callback para erros
     */
    onError(callback) {
        this.callbacks.onError = callback;
    }

    /**
     * Define callback para conexão
     */
    onConnect(callback) {
        this.callbacks.onConnect = callback;
    }

    /**
     * Define callback para desconexão
     */
    onDisconnect(callback) {
        this.callbacks.onDisconnect = callback;
    }

    /**
     * Desconecta do servidor
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.currentSession = null;
        }
    }

    /**
     * Obtém informações da sessão atual
     */
    getCurrentSession() {
        return this.currentSession;
    }

    /**
     * Verifica se está conectado
     */
    isConnected() {
        return this.connected;
    }
}

// Exportar para uso global
window.TerminalClient = TerminalClient;
