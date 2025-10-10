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
 * Middleware para verificar se o usuário é admin
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
    });
  }
  next();
}

/**
 * Middleware para verificar roles específicos
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado. Roles necessários: ${roles.join(', ')}`
      });
    }
    next();
  };
}

/**
 * Middleware para verificar se usuário está ativo
 */
function requireActive(req, res, next) {
  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Conta desativada. Entre em contato com o administrador.'
    });
  }
  next();
}

/**
 * Middleware combinado para autenticação completa
 */
function requireAuth(roles = null) {
  const middlewares = [authenticateToken, requireActive];
  
  if (roles) {
    middlewares.push(requireRole(roles));
  }
  
  return middlewares;
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireRole,
  requireActive,
  requireAuth
};
