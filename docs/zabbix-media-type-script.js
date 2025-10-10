/**
 * Zabbix Media Type Script - WhatsApp Bot
 * 
 * Configuração no Zabbix:
 * 1. Administration → Media Types → Create Media Type
 * 2. Name: WhatsApp Bot
 * 3. Type: Webhook
 * 4. Script: Cole este código
 * 
 * Parameters:
 * - HTTPProxy: (opcional)
 * - Message: {ALERT.MESSAGE}
 * - Subject: {ALERT.SUBJECT}  
 * - To: {ALERT.SENDTO}
 * - URL: http://10.168.217.43:3000/zabbix
 * - Token: SEU_TOKEN_AQUI
 */

var WhatsApp = {
    url: null,
    token: null,
    HTTPProxy: null,

    sendMessage: function (subject, message) {
        var params = {
            'subject': subject,
            'message': message
        },
        data,
        response,
        request = new CurlHttpRequest(),
        url = this.url;

        // Configurar proxy se fornecido
        if (typeof this.HTTPProxy === 'string' && this.HTTPProxy.trim() !== '') {
            request.setProxy(this.HTTPProxy);
        }

        // Headers obrigatórios
        request.addHeader('Content-Type: application/json');
        request.addHeader('User-Agent: Zabbix-WhatsApp-Bot/1.0');
        
        // Token de autenticação
        if (typeof this.token === 'string' && this.token.trim() !== '') {
            request.addHeader('Authorization: Bearer ' + this.token);
        }

        // Timeout de 30 segundos
        request.setTimeout(30);

        data = JSON.stringify(params);

        // Logs para debugging
        Zabbix.Log(4, '[WhatsApp Webhook] URL: ' + url);
        Zabbix.Log(4, '[WhatsApp Webhook] Subject: ' + subject);
        Zabbix.Log(4, '[WhatsApp Webhook] Data length: ' + data.length);
        
        // Enviar requisição
        response = request.post(url, data);

        Zabbix.Log(4, '[WhatsApp Webhook] HTTP Status: ' + request.getStatus());
        Zabbix.Log(4, '[WhatsApp Webhook] Response: ' + response);

        // Verificar status HTTP
        if (request.getStatus() !== 200) {
            var errorMsg = 'HTTP Error ' + request.getStatus();
            if (request.getStatus() === 401) {
                errorMsg += ' - Token inválido ou não fornecido';
            } else if (request.getStatus() === 503) {
                errorMsg += ' - WhatsApp não está conectado';
            } else if (request.getStatus() === 500) {
                errorMsg += ' - Erro interno do servidor';
            }
            throw errorMsg + '. Response: ' + response;
        }

        // Parse da resposta
        if (response !== null && response !== '') {
            try {
                response = JSON.parse(response);
            } catch (error) {
                Zabbix.Log(3, '[WhatsApp Webhook] Response parse error: ' + error);
                throw 'Resposta inválida do servidor: ' + response;
            }
        } else {
            throw 'Resposta vazia do servidor';
        }

        // Verificar se o envio foi bem-sucedido
        if (typeof response !== 'object' || response.status !== 'success') {
            throw 'Falha no envio da mensagem: ' + JSON.stringify(response);
        }

        Zabbix.Log(4, '[WhatsApp Webhook] Mensagem enviada com sucesso');
        return response;
    }
};

try {
    var params = JSON.parse(value);

    // Validar URL obrigatória
    if (typeof params.URL === 'undefined' || params.URL.trim() === '') {
        throw 'URL do webhook não fornecida';
    }

    // Validar Subject e Message
    if (typeof params.Subject === 'undefined' || params.Subject.trim() === '') {
        throw 'Subject não pode estar vazio';
    }

    if (typeof params.Message === 'undefined' || params.Message.trim() === '') {
        throw 'Message não pode estar vazia';
    }

    // Configurar parâmetros
    WhatsApp.url = params.URL.trim();
    
    if (typeof params.HTTPProxy !== 'undefined') {
        WhatsApp.HTTPProxy = params.HTTPProxy;
    }
    
    if (typeof params.Token !== 'undefined') {
        WhatsApp.token = params.Token.trim();
    }

    // Enviar mensagem
    var result = WhatsApp.sendMessage(params.Subject, params.Message);
    
    return 'Mensagem enviada com sucesso. Duration: ' + (result.duration || 'N/A') + 'ms';

} catch (error) {
    Zabbix.Log(3, '[WhatsApp Webhook] Erro: ' + error);
    throw 'WhatsApp notification failed: ' + error;
}
