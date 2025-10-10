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
const commandsRoutes = require('./routes/commands');
const settingsRoutes = require('./routes/settings');

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
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cors());

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  }
});

app.use('/api', generalLimiter);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/bot', botControlRoutes);
app.use('/api/commands', commandsRoutes);
app.use('/api/settings', settingsRoutes);

// Rota principal - servir o dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rotas para páginas do painel
app.get('/dashboard*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/commands*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'commands.html'));
});

app.get('/settings*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
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
