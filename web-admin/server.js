/**
 * Servidor do painel de administração web
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Importar módulos locais
const { initDatabase } = require('./database/init');
const { authenticateToken } = require('./middleware/auth');

// Importar rotas
const authRoutes = require('./routes/auth');
const botControlRoutes = require('./routes/bot-control');
const settingsRoutes = require('./routes/settings');
const botsRoutes = require('./routes/bots');
const terminalRoutes = require('./routes/terminal');
const terminalPtyRoutes = require('./routes/terminalPty');
const statsRoutes = require('./routes/stats');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.WEB_ADMIN_PORT || 4000;

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https://cdnjs.cloudflare.com"]
    }
  }
}));

app.use(cors());

// Rate limiting geral (mais flexível)
const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 500, // máximo 500 requests por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para APIs de dados (mais permissivo)
const dataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por minuto
  message: {
    success: false,
    message: 'Muitas requisições de dados. Aguarde um momento.'
  }
});

// Rate limiting para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  }
});

// Aplicar rate limiting geral
app.use('/api', generalLimiter);

// Aplicar rate limiting específico para dados
app.use('/api/bot/stats', dataLimiter);
app.use('/api/bot/health', dataLimiter);
app.use('/api/bot/status', dataLimiter);

// Aplicar rate limiting para autenticação
app.use('/api/auth/login', authLimiter);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
console.log('📋 Registrando rotas da API...');
app.use('/api/auth', authRoutes);
console.log('✅ Rotas de auth registradas');
app.use('/api/bot', botControlRoutes);
console.log('✅ Rotas de bot registradas');
app.use('/api/settings', settingsRoutes);
console.log('✅ Rotas de settings registradas');
app.use('/api/bots', botsRoutes);
console.log('✅ Rotas de bots registradas');
app.use('/api/terminal', terminalRoutes);
console.log('✅ Rotas de terminal registradas');
app.use('/api/terminal-pty', terminalPtyRoutes);
console.log('✅ Rotas de terminal PTY registradas');
app.use('/api/stats', statsRoutes);
console.log('✅ Rotas de estatísticas registradas');

// Rota principal - servir o dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rotas para páginas do painel
app.get('/dashboard*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/users*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

app.get('/settings*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/terminal*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal.html'));
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// WebSocket para logs em tempo real
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Token requerido'));
  }

  // Verificar token (simplificado para o exemplo)
  // Em produção, usar a função verifyToken
  socket.userId = 1; // Placeholder
  next();
});

io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);
  
  socket.on('join-logs', () => {
    socket.join('logs');
    console.log(`Cliente ${socket.id} entrou na sala de logs`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// Função para enviar logs em tempo real
function broadcastLog(logData) {
  io.to('logs').emit('new-log', {
    timestamp: new Date().toISOString(),
    ...logData
  });
}

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar banco de dados
    await initDatabase();
    console.log('✅ Banco de dados inicializado');

    // Inicializar handler WebSocket para terminal
    const TerminalSocketHandler = require('./services/terminalSocket');
    new TerminalSocketHandler(io);
    console.log('✅ Terminal WebSocket inicializado');

    // Iniciar servidor
    server.listen(PORT, () => {
      console.log('🌐 Painel de Administração Web iniciado');
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔐 Login padrão: admin / admin123`);
      console.log('=' .repeat(50));
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Encerrando painel de administração...');
  
  // Destruir todas as sessões de terminal
  const terminalManager = require('./services/terminalManager');
  const count = terminalManager.destroyAll();
  console.log(`✅ ${count} sessões de terminal encerradas`);
  
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

// Exportar para uso em outros módulos
module.exports = {
  app,
  server,
  io,
  broadcastLog,
  startServer
};

// Iniciar se executado diretamente
if (require.main === module) {
  startServer();
}
