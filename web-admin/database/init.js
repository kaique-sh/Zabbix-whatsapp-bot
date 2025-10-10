/**
 * Inicialização do banco de dados SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'admin.db');

/**
 * Inicializa o banco de dados
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    // Criar diretório se não existir
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar com o banco:', err);
        reject(err);
        return;
      }
      console.log('✅ Banco de dados conectado');
    });

    // Criar tabelas
    db.serialize(() => {
      // Tabela de usuários
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        active INTEGER DEFAULT 1
      )`);

      // Tabela de sessões
      db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Tabela de comandos customizados
      db.run(`CREATE TABLE IF NOT EXISTS custom_commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        command TEXT UNIQUE NOT NULL,
        response TEXT NOT NULL,
        description TEXT,
        active INTEGER DEFAULT 1,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`);

      // Tabela de configurações
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        FOREIGN KEY (updated_by) REFERENCES users (id)
      )`);

      // Tabela de logs de atividade
      db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Tabela de estatísticas do bot
      db.run(`CREATE TABLE IF NOT EXISTS bot_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        messages_sent INTEGER DEFAULT 0,
        messages_received INTEGER DEFAULT 0,
        commands_executed INTEGER DEFAULT 0,
        cnpj_queries INTEGER DEFAULT 0,
        zabbix_alerts INTEGER DEFAULT 0,
        unique_users INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Verificar se já existe usuário admin
      db.get("SELECT COUNT(*) as count FROM users WHERE username = 'admin'", (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count === 0) {
          // Criar usuário admin padrão
          const defaultPassword = 'admin123';
          const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

          db.run(
            "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
            ['admin', hashedPassword, 'admin@voetur.com.br', 'admin'],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              console.log('✅ Usuário admin criado (admin/admin123)');
              
              // Inserir configurações padrão
              const defaultSettings = [
                ['bot_name', 'Voetur Assistente', 'Nome do bot'],
                ['company_name', 'Voetur', 'Nome da empresa'],
                ['max_login_attempts', '5', 'Máximo de tentativas de login'],
                ['session_timeout', '24', 'Timeout da sessão em horas'],
                ['enable_logs', 'true', 'Habilitar logs detalhados'],
                ['maintenance_mode', 'false', 'Modo manutenção']
              ];

              const stmt = db.prepare("INSERT OR IGNORE INTO settings (key, value, description, updated_by) VALUES (?, ?, ?, ?)");
              defaultSettings.forEach(setting => {
                stmt.run([setting[0], setting[1], setting[2], 1]);
              });
              stmt.finalize();

              console.log('✅ Configurações padrão inseridas');
              
              // Inserir dados de exemplo para estatísticas
              const sampleStats = [
                [new Date().toISOString().split('T')[0], 25, 18, 12, 5, 3, 8], // Hoje
                [new Date(Date.now() - 86400000).toISOString().split('T')[0], 32, 24, 15, 8, 2, 12], // Ontem
                [new Date(Date.now() - 172800000).toISOString().split('T')[0], 18, 15, 9, 3, 1, 6], // 2 dias atrás
                [new Date(Date.now() - 259200000).toISOString().split('T')[0], 41, 35, 22, 12, 4, 15], // 3 dias atrás
                [new Date(Date.now() - 345600000).toISOString().split('T')[0], 28, 21, 14, 7, 2, 9], // 4 dias atrás
              ];

              const statsStmt = db.prepare("INSERT OR IGNORE INTO bot_stats (date, messages_sent, messages_received, commands_executed, cnpj_queries, zabbix_alerts, unique_users) VALUES (?, ?, ?, ?, ?, ?, ?)");
              sampleStats.forEach(stat => {
                statsStmt.run(stat);
              });
              statsStmt.finalize();

              console.log('✅ Dados de exemplo para estatísticas inseridos');
              resolve(db);
            }
          );
        } else {
          console.log('✅ Usuário admin já existe');
          resolve(db);
        }
      });
    });
  });
}

/**
 * Obtém conexão com o banco
 */
function getDatabase() {
  return new sqlite3.Database(DB_PATH);
}

module.exports = {
  initDatabase,
  getDatabase,
  DB_PATH
};
