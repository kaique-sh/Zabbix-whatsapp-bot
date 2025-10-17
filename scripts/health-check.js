#!/usr/bin/env node
/**
 * Health Check - Verificação completa do sistema
 * Verifica se todos os componentes estão funcionando
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class HealthChecker {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            checks: {},
            overall: 'unknown'
        };
    }

    async check() {
        console.log('🏥 Iniciando verificação de saúde do sistema...\n');

        // Verificar ambiente
        await this.checkEnvironment();

        // Verificar arquivos críticos
        await this.checkCriticalFiles();

        // Verificar dependências
        await this.checkDependencies();

        // Verificar serviços
        await this.checkServices();

        // Verificar conectividade
        await this.checkConnectivity();

        this.generateReport();
        return this.results;
    }

    async checkEnvironment() {
        console.log('🔧 Verificando ambiente...');

        const checks = {
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            uptime: Math.round(process.uptime()) + 's'
        };

        // Verificar variáveis críticas
        const requiredEnvVars = [
            'FRESHSERVICE_DOMAIN',
            'FRESHSERVICE_API_KEY',
            'FRESHSERVICE_WORKSPACE_ID'
        ];

        checks.env_vars = {};
        for (const envVar of requiredEnvVars) {
            checks.env_vars[envVar] = process.env[envVar] ? '✅ Definida' : '❌ Não definida';
        }

        this.results.checks.environment = {
            status: Object.values(checks.env_vars).every(v => v === '✅ Definida') ? '✅ OK' : '⚠️ Problemas',
            details: checks
        };

        console.log(`   Node.js: ${checks.node_version}`);
        console.log(`   Memória: ${checks.memory}`);
        console.log(`   Ambiente: ${checks.env_vars.FRESHSERVICE_DOMAIN ? '✅' : '❌'} Freshservice`);
    }

    async checkCriticalFiles() {
        console.log('\n📁 Verificando arquivos críticos...');

        const criticalFiles = [
            'src/core/bot.js',
            'src/config/constants.js',
            'src/config/logger.js',
            'src/integrations/freshservice.js',
            'web-admin/server.js',
            'ecosystem.config.js',
            'package.json'
        ];

        const fileChecks = {};
        for (const file of criticalFiles) {
            const exists = fs.existsSync(path.join(process.cwd(), file));
            fileChecks[file] = exists ? '✅ Existe' : '❌ Faltando';
            console.log(`   ${file}: ${exists ? '✅' : '❌'}`);
        }

        this.results.checks.files = {
            status: Object.values(fileChecks).every(v => v === '✅ Existe') ? '✅ OK' : '❌ Problemas',
            details: fileChecks
        };
    }

    async checkDependencies() {
        console.log('\n📦 Verificando dependências...');

        try {
            // Verificar se consegue carregar módulos críticos
            const modules = [
                'whatsapp-web.js',
                'express',
                'axios',
                'sqlite3',
                'socket.io'
            ];

            const depChecks = {};
            for (const module of modules) {
                try {
                    require(module);
                    depChecks[module] = '✅ OK';
                } catch (error) {
                    depChecks[module] = '❌ Falha';
                }
            }

            this.results.checks.dependencies = {
                status: Object.values(depChecks).every(v => v === '✅ OK') ? '✅ OK' : '❌ Problemas',
                details: depChecks
            };

            Object.entries(depChecks).forEach(([module, status]) => {
                console.log(`   ${module}: ${status}`);
            });

        } catch (error) {
            console.log('   ❌ Erro ao verificar dependências:', error.message);
            this.results.checks.dependencies = {
                status: '❌ Erro',
                details: { error: error.message }
            };
        }
    }

    async checkServices() {
        console.log('\n🔗 Verificando serviços...');

        const services = [
            { name: 'Bot API', url: 'http://localhost:3000/health', port: 3000 },
            { name: 'Web Admin', url: 'http://localhost:4000', port: 4000 }
        ];

        const serviceChecks = {};

        for (const service of services) {
            try {
                const response = await axios.get(service.url, { timeout: 3000 });
                serviceChecks[service.name] = response.status === 200 ? '✅ Online' : '⚠️ Problemas';
                console.log(`   ${service.name}: ✅ Online (${response.status})`);
            } catch (error) {
                serviceChecks[service.name] = '❌ Offline';
                console.log(`   ${service.name}: ❌ Offline`);
            }
        }

        this.results.checks.services = {
            status: Object.values(serviceChecks).every(v => v === '✅ Online') ? '✅ OK' : '⚠️ Alguns offline',
            details: serviceChecks
        };
    }

    async checkConnectivity() {
        console.log('\n🌐 Verificando conectividade externa...');

        const endpoints = [
            { name: 'Freshservice API', url: 'https://voetur1.freshservice.com' },
            { name: 'WhatsApp Web', url: 'https://web.whatsapp.com' }
        ];

        const connChecks = {};

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint.url, {
                    timeout: 5000,
                    validateStatus: () => true // Aceitar qualquer status
                });
                connChecks[endpoint.name] = response.status < 400 ? '✅ Acessível' : '⚠️ Problemas';
                console.log(`   ${endpoint.name}: ✅ Acessível (${response.status})`);
            } catch (error) {
                connChecks[endpoint.name] = '❌ Inacessível';
                console.log(`   ${endpoint.name}: ❌ Inacessível`);
            }
        }

        this.results.checks.connectivity = {
            status: Object.values(connChecks).every(v => v === '✅ Acessível') ? '✅ OK' : '⚠️ Alguns problemas',
            details: connChecks
        };
    }

    generateReport() {
        const statusCount = {
            '✅ OK': 0,
            '⚠️ Problemas': 0,
            '❌ Erro': 0,
            '❌ Problemas': 0
        };

        Object.values(this.results.checks).forEach(check => {
            statusCount[check.status] = (statusCount[check.status] || 0) + 1;
        });

        const totalChecks = Object.keys(this.results.checks).length;
        const okChecks = statusCount['✅ OK'];

        this.results.overall = okChecks === totalChecks ? '✅ Saudável' :
                              statusCount['❌ Problemas'] > 0 || statusCount['❌ Erro'] > 0 ? '❌ Crítico' :
                              '⚠️ Atenção';

        console.log('\n📊 RELATÓRIO FINAL:');
        console.log(`   Status geral: ${this.results.overall}`);
        console.log(`   Verificações: ${okChecks}/${totalChecks} OK`);
        console.log(`   Timestamp: ${this.results.timestamp}`);

        if (this.results.overall !== '✅ Saudável') {
            console.log('\n⚠️  Problemas detectados:');
            Object.entries(this.results.checks).forEach(([checkName, check]) => {
                if (check.status !== '✅ OK') {
                    console.log(`   ${checkName}: ${check.status}`);
                }
            });
        }

        // Salvar relatório
        const reportPath = path.join(process.cwd(), 'logs', 'health-check.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Relatório salvo em: ${reportPath}`);
    }
}

// Executar verificação se chamado diretamente
if (require.main === module) {
    const checker = new HealthChecker();
    checker.check()
        .then(() => {
            process.exit(checker.results.overall === '✅ Saudável' ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Erro na verificação:', error);
            process.exit(1);
        });
}

module.exports = HealthChecker;
