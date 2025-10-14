/**
 * Script para listar grupos disponíveis no Freshservice
 */

require('dotenv').config();
const axios = require('axios');

const domain = process.env.FRESHSERVICE_DOMAIN;
const apiKey = process.env.FRESHSERVICE_API_KEY;

if (!domain || !apiKey) {
    console.error('❌ FRESHSERVICE_DOMAIN e FRESHSERVICE_API_KEY devem estar configurados no .env');
    process.exit(1);
}

const client = axios.create({
    baseURL: `https://${domain}/api/v2`,
    auth: {
        username: apiKey,
        password: 'X'
    },
    headers: {
        'Content-Type': 'application/json'
    }
});

async function listGroups() {
    try {
        console.log('🔍 Buscando grupos no Freshservice...\n');
        
        const response = await client.get('/groups');
        const groups = response.data.groups;

        console.log(`✅ Encontrados ${groups.length} grupos:\n`);
        console.log('═'.repeat(80));
        console.log('ID\t\tNome\t\t\t\tDescrição');
        console.log('═'.repeat(80));

        groups.forEach(group => {
            const name = (group.name || '').padEnd(30);
            const description = (group.description || 'Sem descrição').substring(0, 30);
            console.log(`${group.id}\t${name}\t${description}`);
        });

        console.log('═'.repeat(80));
        console.log('\n📋 Para usar um grupo, adicione ao .env:');
        console.log('FRESHSERVICE_DEFAULT_GROUP_ID=<ID_DO_GRUPO>');
        
    } catch (error) {
        console.error('❌ Erro ao buscar grupos:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function listAgents() {
    try {
        console.log('\n🔍 Buscando agentes no Freshservice...\n');
        
        const response = await client.get('/agents');
        const agents = response.data.agents;

        console.log(`✅ Encontrados ${agents.length} agentes:\n`);
        console.log('═'.repeat(80));
        console.log('ID\t\tNome\t\t\t\tEmail');
        console.log('═'.repeat(80));

        agents.forEach(agent => {
            const name = (`${agent.first_name} ${agent.last_name}`).padEnd(30);
            const email = (agent.email || '').substring(0, 30);
            console.log(`${agent.id}\t${name}\t${email}`);
        });

        console.log('═'.repeat(80));
        console.log('\n📋 Para usar um agente, adicione ao .env:');
        console.log('FRESHSERVICE_DEFAULT_AGENT_ID=<ID_DO_AGENTE>');
        
    } catch (error) {
        console.error('❌ Erro ao buscar agentes:', error.response?.data || error.message);
    }
}

async function main() {
    await listGroups();
    await listAgents();
}

main();
