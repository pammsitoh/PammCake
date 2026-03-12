const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
require('colors');

class ToolConnect extends EventEmitter {
    constructor() {
        super();
        this.wss = null;
        this.clients = new Set();
    }

    /**
     * @description Inicia el servidor WebSocket en el puerto especificado.
     * @param {number} port 
     */
    startWSServer(port = 8080) {
        this.wss = new WebSocketServer({ port });
        console.log(`[PammCake] Servidor WebSocket iniciado en ws://localhost:${port}`.green);
        console.log(`[PammCake] Usa "/connect localhost:${port}" en Minecraft para conectarte.`.yellow);

        this.wss.on('connection', (ws) => {
            console.log('[PammCake] ¡Cliente de Minecraft conectado!'.cyan);
            this.clients.add(ws);
            this.emit('connection', ws);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(data, ws);
                } catch (error) {
                    console.error('[PammCake] Error al procesar mensaje:'.red, error.message);
                }
            });

            ws.on('close', () => {
                console.log('[PammCake] Cliente de Minecraft desconectado'.yellow);
                this.clients.delete(ws);
                this.emit('disconnect', ws);
            });
        });
    }

    /**
     * @description Envía un comando a Minecraft.
     * @param {string} command 
     */
    sendCommand(command) {
        const requestId = uuidv4();
        const payload = {
            header: {
                version: 1,
                requestId: requestId,
                messagePurpose: 'commandRequest',
                messageType: 'commandRequest'
            },
            body: {
                commandLine: command,
                version: 1
            }
        };

        this.broadcast(payload);
        return requestId;
    }

    /**
     * @description Se suscribe a un evento de Minecraft.
     * @param {string} eventName 
     */
    subscribe(eventName) {
        const requestId = uuidv4();
        const payload = {
            header: {
                version: 1,
                requestId: requestId,
                messagePurpose: 'subscribe',
                messageType: 'commandRequest'
            },
            body: {
                eventName: eventName
            }
        };

        this.broadcast(payload);
        return requestId;
    }

    /**
     * @description Envía un payload a todos los clientes conectados.
     * @param {object} payload 
     */
    broadcast(payload) {
        const data = JSON.stringify(payload);
        this.clients.forEach(ws => {
            if (ws.readyState === 1) { // 1 = OPEN
                ws.send(data);
            }
        });
    }

    /**
     * @description Maneja los mensajes recibidos de Minecraft.
     * @param {object} data 
     * @param {WebSocket} ws
     */
    handleMessage(data, ws) {
        const purpose = data.header.messagePurpose;
        this.emit('message', data, ws);

        if (purpose === 'event') {
            const eventName = data.body.eventName;
            this.emit('event', eventName, data.body, ws);
        } else if (purpose === 'commandResponse') {
            this.emit('response', data.header.requestId, data.body, ws);
        }
    }
}

const toolConnect = new ToolConnect();
module.exports = { toolConnect, ToolConnect };