/**
 * Middleware de autenticação
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'voetur-whatsapp-bot-secret-2024';
const JWT_EXPIRES_IN = '24h';

/**
 * Gera token JWT
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifica token JWT
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware de autenticação
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acesso requerido' 
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido ou expirado' 
    });
  }

  req.user = decoded;
  next();
}

/**
 * Middleware para verificar se é admin
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores.' 
    });
  }
  next();
}

/**
 * Autentica usuário
 */
async function authenticateUser(username, password, ipAddress, userAgent) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.get(
      "SELECT * FROM users WHERE username = ? AND active = 1",
      [username],
      async (err, user) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }

        if (!user) {
          db.close();
          resolve({ success: false, message: 'Usuário não encontrado' });
          return;
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          // Log tentativa de login falhada
          db.run(
            "INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
            [user.id, 'LOGIN_FAILED', `Senha incorreta para ${username}`, ipAddress, userAgent]
          );
          
          db.close();
          resolve({ success: false, message: 'Senha incorreta' });
          return;
        }

        // Gerar token
        const token = generateToken(user);

        // Atualizar último login
        db.run(
          "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
          [user.id]
        );

        // Salvar sessão
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        db.run(
          "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
          [user.id, token, expiresAt.toISOString()]
        );

        // Log login bem-sucedido
        db.run(
          "INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
          [user.id, 'LOGIN_SUCCESS', `Login realizado com sucesso`, ipAddress, userAgent],
          () => {
            db.close();
            resolve({
              success: true,
              token,
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                last_login: user.last_login
              }
            });
          }
        );
      }
    );
  });
}

/**
 * Logout do usuário
 */
async function logoutUser(token, userId, ipAddress) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Remover sessão
    db.run(
      "DELETE FROM sessions WHERE token = ?",
      [token],
      (err) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }

        // Log logout
        db.run(
          "INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
          [userId, 'LOGOUT', 'Logout realizado', ipAddress],
          () => {
            db.close();
            resolve({ success: true, message: 'Logout realizado com sucesso' });
          }
        );
      }
    );
  });
}

/**
 * Verifica se sessão é válida
 */
async function validateSession(token) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.get(
      `SELECT s.*, u.username, u.role, u.active 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.active = 1`,
      [token],
      (err, session) => {
        db.close();
        
        if (err) {
          reject(err);
          return;
        }

        if (!session) {
          resolve({ valid: false, message: 'Sessão inválida ou expirada' });
          return;
        }

        resolve({
          valid: true,
          user: {
            id: session.user_id,
            username: session.username,
            role: session.role
          }
        });
      }
    );
  });
}

/**
 * Limpa sessões expiradas
 */
function cleanExpiredSessions() {
  const db = getDatabase();
  db.run(
    "DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP",
    (err) => {
      if (err) {
        console.error('Erro ao limpar sessões expiradas:', err);
      } else {
        console.log('✅ Sessões expiradas limpas');
      }
      db.close();
    }
  );
}

// Limpar sessões expiradas a cada hora
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin,
  authenticateUser,
  logoutUser,
  validateSession,
  cleanExpiredSessions
};
