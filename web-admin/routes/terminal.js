const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Middleware de autenticação
const { authenticateToken } = require('../middleware/auth');

// Lista de comandos permitidos (segurança)
const ALLOWED_COMMANDS = [
    'pm2', 'npm', 'node', 'ls', 'pwd', 'cat', 'echo', 'whoami',
    'df', 'free', 'uptime', 'ps', 'top', 'htop', 'git',
    'ifconfig', 'ip', 'ping', 'netstat', 'ss', 'curl', 'wget',
    'grep', 'find', 'which', 'whereis', 'locate', 'tail', 'head',
    'less', 'more', 'wc', 'sort', 'uniq', 'cut', 'awk', 'sed',
    'date', 'cal', 'hostname', 'uname', 'lsb_release',
    'du', 'stat', 'file', 'tree', 'env', 'printenv',
    'history', 'alias', 'clear', 'reset', 'man', 'help',
    'python', 'python3', 'pip', 'pip3', 'java', 'javac',
    'gcc', 'g++', 'make', 'cmake', 'docker', 'docker-compose',
    'systemctl', 'service', 'journalctl', 'dmesg',
    'tar', 'gzip', 'gunzip', 'zip', 'unzip', 'bzip2', 'xz',
    'chmod', 'chown', 'chgrp', 'mkdir', 'touch', 'cp', 'mv',
    'ln', 'readlink', 'basename', 'dirname',
    // Gerenciadores de pacotes
    'apt', 'apt-get', 'dpkg', 'snap', 'flatpak',
    'yum', 'dnf', 'pacman', 'zypper', 'pkg',
    'brew', 'port', 'nix', 'nix-env',
    // NPM e Yarn
    'yarn', 'pnpm', 'npx', 'nvm',
    // Python
    'pipenv', 'poetry', 'conda', 'virtualenv', 'venv',
    // Ruby
    'gem', 'bundle', 'bundler', 'rake', 'ruby',
    // Editores
    'nano', 'vi', 'vim', 'nvim', 'emacs', 'joe', 'pico',
    // Utilitários de desenvolvimento
    'code', 'subl', 'atom', 'gedit',
    // Controle de versão
    'svn', 'hg', 'bzr',
    // Compiladores e interpretadores
    'perl', 'php', 'lua', 'rust', 'cargo', 'go', 'kotlin',
    // Ferramentas de build
    'ant', 'maven', 'gradle', 'sbt', 'lein',
    // Utilitários de rede avançados
    'nslookup', 'dig', 'host', 'traceroute', 'mtr', 'nc', 'netcat',
    'telnet', 'ftp', 'sftp', 'scp', 'rsync',
    // Monitoramento
    'iotop', 'iftop', 'nethogs', 'vnstat', 'nmon',
    // Processamento de texto
    'jq', 'yq', 'xmllint', 'pandoc',
    // Compressão
    '7z', 'rar', 'unrar', 'lz4', 'zstd',
    // Sistema
    'lsof', 'strace', 'ltrace', 'watch', 'screen', 'tmux',
    'crontab', 'at', 'batch', 'sleep',
    // Informações do sistema
    'lscpu', 'lsblk', 'lsusb', 'lspci', 'dmidecode',
    'hwinfo', 'inxi', 'neofetch', 'screenfetch',
    // Outros
    'bc', 'expr', 'seq', 'yes', 'true', 'false', 'test',
    'xargs', 'parallel', 'tee', 'column', 'paste', 'join',
    'comm', 'diff', 'patch', 'cmp', 'md5sum', 'sha256sum',
    'base64', 'xxd', 'hexdump', 'od', 'strings',
    // Gerenciamento de arquivos e processos
    'rm', 'rmdir', 'kill', 'killall', 'pkill', 'pgrep'
];

// Comandos bloqueados (segurança - apenas os mais críticos)
const BLOCKED_COMMANDS = [
    'dd', 'mkfs', 'format', 'shutdown', 'reboot',
    'init', 'halt', 'poweroff'
];

// Validar comando
function isCommandAllowed(command) {
    const cmd = command.trim().split(' ')[0];
    
    // Verificar se está na lista de bloqueados
    if (BLOCKED_COMMANDS.some(blocked => cmd.includes(blocked))) {
        return { allowed: false, reason: 'Comando bloqueado por segurança' };
    }
    
    // Verificar se está na lista de permitidos
    if (!ALLOWED_COMMANDS.some(allowed => cmd.startsWith(allowed))) {
        return { allowed: false, reason: 'Comando não permitido' };
    }
    
    return { allowed: true };
}

// POST /api/terminal/execute - Executar comando
router.post('/execute', authenticateToken, async (req, res) => {
    try {
        const { command, botId } = req.body;
        
        if (!command) {
            return res.status(400).json({ error: 'Comando não fornecido' });
        }
        
        // Validar comando
        const validation = isCommandAllowed(command);
        if (!validation.allowed) {
            return res.status(403).json({ 
                error: validation.reason,
                command 
            });
        }
        
        // Determinar diretório de trabalho
        let cwd = process.cwd();
        
        if (botId) {
            // Se um bot foi selecionado, usar sua pasta
            const fs = require('fs').promises;
            const path = require('path');
            const BOTS_CONFIG_FILE = path.join(__dirname, '../database/bots.json');
            
            try {
                const data = await fs.readFile(BOTS_CONFIG_FILE, 'utf8');
                const bots = JSON.parse(data);
                const bot = bots.find(b => b.id === botId);
                
                if (bot && bot.path) {
                    cwd = bot.path;
                }
            } catch (error) {
                console.error('Erro ao buscar pasta do bot:', error);
            }
        }
        
        // Executar comando no diretório correto
        try {
            const { stdout, stderr } = await execPromise(command, {
                cwd: cwd,
                timeout: 30000, // 30 segundos de timeout
                maxBuffer: 1024 * 1024 // 1MB de buffer
            });
            
            res.json({
                success: true,
                output: stdout || stderr || 'Comando executado sem saída',
                command,
                cwd: cwd
            });
        } catch (execError) {
            // Erro na execução do comando
            res.status(200).json({
                success: false,
                error: execError.message,
                output: execError.stdout || execError.stderr || '',
                command,
                cwd: cwd
            });
        }
    } catch (error) {
        console.error('Erro ao executar comando:', error);
        res.status(500).json({ 
            error: 'Erro interno ao executar comando',
            details: error.message 
        });
    }
});

// GET /api/terminal/history - Obter histórico de comandos
router.get('/history', authenticateToken, async (req, res) => {
    try {
        // Implementar lógica de histórico se necessário
        res.json({ history: [] });
    } catch (error) {
        console.error('Erro ao obter histórico:', error);
        res.status(500).json({ error: 'Erro ao obter histórico' });
    }
});

// GET /api/terminal/allowed-commands - Listar comandos permitidos
router.get('/allowed-commands', authenticateToken, async (req, res) => {
    try {
        res.json({ 
            allowed: ALLOWED_COMMANDS,
            blocked: BLOCKED_COMMANDS
        });
    } catch (error) {
        console.error('Erro ao listar comandos:', error);
        res.status(500).json({ error: 'Erro ao listar comandos' });
    }
});

/**
 * GET /api/terminal/browse
 * Navegar por diretórios
 */
router.get('/browse', authenticateToken, async (req, res) => {
    try {
        const { path: dirPath } = req.query;
        const targetPath = dirPath || require('os').homedir();
        
        // Validar se o caminho existe
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            const stats = await fs.stat(targetPath);
            if (!stats.isDirectory()) {
                return res.status(400).json({ error: 'Caminho não é um diretório' });
            }
        } catch (error) {
            return res.status(404).json({ error: 'Diretório não encontrado' });
        }
        
        // Listar conteúdo do diretório
        const items = await fs.readdir(targetPath, { withFileTypes: true });
        
        const directories = [];
        const files = [];
        
        for (const item of items) {
            // Ignorar arquivos/pastas ocultos
            if (item.name.startsWith('.')) continue;
            
            const fullPath = path.join(targetPath, item.name);
            
            try {
                const stats = await fs.stat(fullPath);
                
                if (item.isDirectory()) {
                    directories.push({
                        name: item.name,
                        path: fullPath,
                        type: 'directory',
                        size: null
                    });
                } else {
                    files.push({
                        name: item.name,
                        path: fullPath,
                        type: 'file',
                        size: stats.size
                    });
                }
            } catch (error) {
                // Ignorar itens sem permissão
                continue;
            }
        }
        
        // Ordenar alfabeticamente
        directories.sort((a, b) => a.name.localeCompare(b.name));
        files.sort((a, b) => a.name.localeCompare(b.name));
        
        // Obter diretório pai
        const parentPath = path.dirname(targetPath);
        
        res.json({
            currentPath: targetPath,
            parentPath: parentPath !== targetPath ? parentPath : null,
            items: [...directories, ...files]
        });
        
    } catch (error) {
        console.error('Erro ao navegar diretórios:', error);
        res.status(500).json({ error: 'Erro ao navegar diretórios' });
    }
});

module.exports = router;
