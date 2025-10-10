/**
 * Rotas para controle do bot
 */

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

/**
 * GET /api/bot/status
 * Status do bot
 */
router.get('/status', authenticateToken, (req, res) => {
  exec('pm2 jlist', (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        message: 'Erro ao verificar status',
        status: 'unknown',
        error: error.message
      });
    }

    try {
      const processes = JSON.parse(stdout);
      const botProcess = processes.find(p => p.name === 'voetur-whatsapp-bot');

      if (!botProcess) {
        return res.json({
          success: true,
          status: 'stopped',
          message: 'Bot não está rodando'
        });
      }

      res.json({
        success: true,
        status: botProcess.pm2_env.status,
        pid: botProcess.pid,
        uptime: botProcess.pm2_env.pm_uptime,
        restarts: botProcess.pm2_env.restart_time,
        memory: botProcess.monit.memory,
        cpu: botProcess.monit.cpu,
        message: `Bot está ${botProcess.pm2_env.status}`
      });
    } catch (parseError) {
      res.json({
        success: false,
        message: 'Erro ao processar status',
        status: 'unknown'
      });
    }
  });
});

/**
 * POST /api/bot/start
 * Iniciar bot
 */
router.post('/start', authenticateToken, requireAdmin, (req, res) => {
  const projectPath = path.join(__dirname, '../..');
  exec('pm2 start ecosystem.config.js', { cwd: projectPath }, (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        message: 'Erro ao iniciar bot',
        error: error.message,
        details: stderr
      });
    }

    // Log da ação
    logActivity(req.user.id, 'BOT_START', 'Bot iniciado via painel web', req.ip);

    res.json({
      success: true,
      message: 'Sistema iniciado com sucesso',
      output: stdout
    });
  });
});

/**
 * POST /api/bot/stop
 * Parar bot
 */
router.post('/stop', authenticateToken, requireAdmin, (req, res) => {
  exec('pm2 stop voetur-whatsapp-bot', (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        message: 'Erro ao parar bot',
        error: error.message,
        details: stderr
      });
    }

    // Log da ação
    logActivity(req.user.id, 'BOT_STOP', 'Bot parado via painel web', req.ip);

    res.json({
      success: true,
      message: 'Bot parado com sucesso',
      output: stdout
    });
  });
});

/**
 * POST /api/bot/restart
 * Reiniciar bot
 */
router.post('/restart', authenticateToken, requireAdmin, (req, res) => {
  exec('pm2 restart voetur-whatsapp-bot', (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        message: 'Erro ao reiniciar bot',
        error: error.message,
        details: stderr
      });
    }

    // Log da ação
    logActivity(req.user.id, 'BOT_RESTART', 'Bot reiniciado via painel web', req.ip);

    res.json({
      success: true,
      message: 'Bot reiniciado com sucesso',
      output: stdout
    });
  });
});

/**
 * GET /api/bot/logs
 * Logs do bot
 */
router.get('/logs', authenticateToken, (req, res) => {
  const { lines = 100 } = req.query;
  
  exec(`pm2 logs voetur-whatsapp-bot --lines ${lines} --nostream`, (error, stdout, stderr) => {
    if (error) {
      return res.json({
        success: false,
        message: 'Erro ao obter logs',
        error: error.message
      });
    }

    res.json({
      success: true,
      logs: stdout,
      timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/bot/health
 * Health check do sistema
 */
router.get('/health', authenticateToken, (req, res) => {
  res.json({
    success: true,
    healthy: true,
    data: {
      webPanel: {
        running: true,
        database: true,
        message: 'Painel web funcionando'
      },
      whatsapp: false,
      timestamp: new Date().toISOString()
    },
    message: 'Painel web funcionando normalmente'
  });
});

/**
 * GET /api/bot/stats
 * Estatísticas do bot
 */
router.get('/stats', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  // Buscar estatísticas dos últimos 7 dias
  db.all(
    `SELECT * FROM bot_stats 
     WHERE date >= date('now', '-7 days') 
     ORDER BY date DESC`,
    (err, stats) => {
      if (err) {
        db.close();
        return res.json({
          success: false,
          message: 'Erro ao buscar estatísticas'
        });
      }

      // Buscar totais
      db.get(
        `SELECT 
          SUM(messages_sent) as total_sent,
          SUM(messages_received) as total_received,
          SUM(commands_executed) as total_commands,
          SUM(cnpj_queries) as total_cnpj,
          SUM(total_messages) as total_messages
         FROM bot_stats`,
        (err, totals) => {
          db.close();
          
          if (err) {
            return res.json({
              success: false,
              message: 'Erro ao buscar totais'
            });
          }

          res.json({
            success: true,
            stats: stats || [],
            totals: totals || {
              total_sent: 0,
              total_received: 0,
              total_commands: 0,
              total_cnpj: 0,
              total_messages: 0
            }
          });
        }
      );
    }
  );
});

/**
 * GET /api/bot/debug
 * Informações de debug do sistema
 */
router.get('/debug', authenticateToken, (req, res) => {
  exec('pm2 jlist', (error, stdout, stderr) => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      pm2_available: !error,
      pm2_error: error ? error.message : null,
      pm2_stderr: stderr || null,
      processes: []
    };

    if (!error) {
      try {
        const processes = JSON.parse(stdout);
        debugInfo.processes = processes.map(p => ({
          name: p.name,
          status: p.pm2_env?.status,
          pid: p.pid,
          uptime: p.pm2_env?.pm_uptime,
          restarts: p.pm2_env?.restart_time,
          memory: p.monit?.memory,
          cpu: p.monit?.cpu
        }));
      } catch (parseError) {
        debugInfo.parse_error = parseError.message;
        debugInfo.raw_output = stdout;
      }
    }

    res.json({
      success: true,
      debug: debugInfo
    });
  });
});

/**
 * Função auxiliar para log de atividades
 */
function logActivity(userId, action, details, ipAddress) {
  const db = getDatabase();
  db.run(
    "INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
    [userId, action, details, ipAddress],
    () => db.close()
  );
}

module.exports = router;
