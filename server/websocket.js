const { v4: uuidv4 } = require('uuid');
const http = require('http');
const server = http.createServer();
const io = require('socket.io')(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

class CollaborationServer {
    constructor(port = 8080) {
        this.clients = new Map(); // Map of client ID to socket connection
        this.documents = new Map(); // Map of document path to content
        this.setupSocketServer();
        server.listen(port, () => {
            console.log(`Collaboration server running on port ${port}`);
        });
    }

    setupSocketServer() {
        io.on('connection', (socket) => {
            const clientId = uuidv4();
            this.clients.set(clientId, socket);

            // Send client their ID
            socket.emit('init', { clientId });

            socket.on('message', (data) => {
                try {
                    this.handleMessage(clientId, data);
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            socket.on('disconnect', () => {
                this.clients.delete(clientId);
                this.broadcastUserList();
            });

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
            const socket = this.clients.get(clientId);
            socket.emit('file_content', {
                path,
                content: document.content,
                version: document.version
            });
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
        this.clients.forEach((socket, clientId) => {
            if (clientId !== senderId) {
                socket.emit('message', data);
            }
        });
    }

    broadcastUserList() {
        const users = Array.from(this.clients.keys());
        io.emit('user_list', { users });
    }
}

const collaborationServer = new CollaborationServer();
console.log('Collaboration server running on port 8080');