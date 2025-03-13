const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class CollaborationServer {
    constructor(port = 8080) {
        this.wss = new WebSocket.Server({ port });
        this.clients = new Map(); // Map of client ID to WebSocket connection
        this.documents = new Map(); // Map of document path to content
        this.setupWebSocketServer();
    }

    setupWebSocketServer() {
        this.wss.on('connection', (ws) => {
            const clientId = uuidv4();
            this.clients.set(clientId, ws);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(clientId, data);
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            ws.on('close', () => {
                this.clients.delete(clientId);
                this.broadcastUserList();
            });

            // Send client their ID
            ws.send(JSON.stringify({
                type: 'init',
                clientId
            }));

            this.broadcastUserList();
        });
    }

    handleMessage(clientId, data) {
        switch (data.type) {
            case 'code_change':
                this.handleCodeChange(clientId, data);
                break;
            case 'cursor_move':
                this.handleCursorMove(clientId, data);
                break;
            case 'file_open':
                this.handleFileOpen(clientId, data);
                break;
            case 'file_save':
                this.handleFileSave(clientId, data);
                break;
        }
    }

    handleCodeChange(clientId, data) {
        const { path, content, version } = data;
        this.documents.set(path, { content, version });

        // Broadcast to all other clients
        this.broadcast(clientId, {
            type: 'code_change',
            path,
            content,
            version,
            clientId
        });
    }

    handleCursorMove(clientId, data) {
        const { path, position } = data;

        // Broadcast cursor position to all other clients
        this.broadcast(clientId, {
            type: 'cursor_move',
            path,
            position,
            clientId
        });
    }

    handleFileOpen(clientId, data) {
        const { path } = data;
        const document = this.documents.get(path);

        if (document) {
            const ws = this.clients.get(clientId);
            ws.send(JSON.stringify({
                type: 'file_content',
                path,
                content: document.content,
                version: document.version
            }));
        }
    }

    handleFileSave(clientId, data) {
        const { path, content } = data;
        this.documents.set(path, { content, version: Date.now() });

        // Broadcast save event to all clients
        this.broadcast(clientId, {
            type: 'file_saved',
            path,
            clientId
        });
    }

    broadcast(senderId, data) {
        this.clients.forEach((ws, clientId) => {
            if (clientId !== senderId && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        });
    }

    broadcastUserList() {
        const users = Array.from(this.clients.keys());
        const data = {
            type: 'user_list',
            users
        };

        this.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        });
    }
}

const server = new CollaborationServer();
console.log('Collaboration server running on port 8080');