// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import EditorArea from './components/EditorArea';
import FileExplorer from './components/FileExp';
import './assets/main.css';
import Navbar from './components/nav';
import TerminalComponent from './components/Terminal';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';

const WEBSOCKET_URL = 'ws://localhost:8080';

const App = () => {
    const [content, setContent] = useState({
        name: "karyakshetra.txt",
        content: "welcome to karyakshetra",
    });
    const [isTerminalVisible, setIsTerminalVisible] = useState(true);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [lineCount, setLineCount] = useState(0);
    const [errorCount] = useState(0);
    const [warningCount] = useState(0);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [clientId, setClientId] = useState(null);
    const fileExplorerRef = useRef(null);
    const wsRef = useRef(null);
    const documentVersion = useRef(Date.now());

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const connectWebSocket = () => {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('Connected to collaboration server');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.onclose = () => {
            console.log('Disconnected from collaboration server');
            // Attempt to reconnect after 3 seconds
            setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
    };

    const handleWebSocketMessage = (data) => {
        switch (data.type) {
            case 'init':
                setClientId(data.clientId);
                break;
            case 'user_list':
                setConnectedUsers(data.users);
                break;
            case 'code_change':
                if (data.clientId !== clientId && data.path === (selectedFile && selectedFile.path)) {
                    setContent(prev => ({
                        ...prev,
                        content: data.content
                    }));
                    documentVersion.current = data.version;
                }
                break;
            case 'cursor_move':
                // Handle other users' cursor positions
                break;
            case 'file_content':
                if (data.path === (selectedFile && selectedFile.path)) {
                    setContent(prev => ({
                        ...prev,
                        content: data.content
                    }));
                    documentVersion.current = data.version;
                }
                break;
        }
    };

    const broadcastCodeChange = (newContent) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedFile) {
            documentVersion.current = Date.now();
            wsRef.current.send(JSON.stringify({
                type: 'code_change',
                path: selectedFile.path,
                content: newContent,
                version: documentVersion.current
            }));
        }
    };

    useEffect(() => {
        if (content.content) {
            setLineCount(content.content.split('\n').length);
        }

        if (content.name) {
            setSelectedFile({ name: content.name });
        }

        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                setIsCommandPaletteOpen(true);
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleSaveFile();
            } else if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                handleNewFile();
            } else if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                setIsTerminalVisible(prev => !prev);
            }
        };

        const handleNewFileEvent = () => {
            if (fileExplorerRef.current) {
                fileExplorerRef.current.addFile();
            }
        };

        const handleOpenFileEvent = (event) => {
            const { path, name } = event.detail;
            handleFileOpen(path, name);
        };

        const handleOpenFolderEvent = (event) => {
            const { path } = event.detail;
            if (fileExplorerRef.current) {
                fileExplorerRef.current.handleDirectoryClick(path);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('new-file', handleNewFileEvent);
        window.addEventListener('open-file', handleOpenFileEvent);
        window.addEventListener('open-folder', handleOpenFolderEvent);
        window.addEventListener('save-file', handleSaveFile);
        window.addEventListener('save-file-as', handleSaveFileAs);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('new-file', handleNewFileEvent);
            window.removeEventListener('open-file', handleOpenFileEvent);
            window.removeEventListener('open-folder', handleOpenFolderEvent);
            window.removeEventListener('save-file', handleSaveFile);
            window.removeEventListener('save-file-as', handleSaveFileAs);
        };
    }, [content]);

    const handleFileOpen = async(filePath, fileName) => {
        try {
            const data = await window.api.getContent(filePath);
            if (data.error) {
                console.error('Error reading file:', data.error);
                return;
            }
            setContent({
                name: fileName,
                content: data.content,
                path: filePath
            });
            setSelectedFile({ name: fileName, path: filePath });

            // Notify other clients about file open
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'file_open',
                    path: filePath
                }));
            }
        } catch (error) {
            console.error('Error opening file:', error);
        }
    };

    const handleSaveFile = async() => {
        if (!selectedFile || !selectedFile.path) {
            handleSaveFileAs();
            return;
        }

        try {
            await window.api.createFile({
                filePath: selectedFile.path,
                content: content.content
            });
        } catch (error) {
            console.error('Error saving file:', error);
        }
    };

    const handleSaveFileAs = async() => {
        try {
            const result = await window.api.showDialog({
                title: 'Save As',
                defaultPath: selectedFile ? selectedFile.path : undefined,
                filters: [{ name: 'All Files', extensions: ['*'] }],
                properties: ['showOverwriteConfirmation']
            });

            if (!result.canceled && result.filePath) {
                await window.api.createFile({
                    filePath: result.filePath,
                    content: content.content
                });
                const fileName = result.filePath.split(/[/\\]/).pop();
                setSelectedFile({ name: fileName, path: result.filePath });
                setContent(prev => ({...prev, name: fileName, path: result.filePath }));
            }
        } catch (error) {
            console.error('Error saving file:', error);
        }
    };

    const handleCommandExecution = (commandId) => {
        switch (commandId) {
            case 'new-file':
                handleNewFile();
                break;
            case 'open-file':
                handleOpenFile();
                break;
            case 'open-folder':
                handleOpenFolder();
                break;
            case 'save-file':
                handleSaveFile();
                break;
            case 'run-code':
                handleRunCode();
                break;
            case 'toggle-terminal':
                setIsTerminalVisible(prev => !prev);
                break;
            case 'format-code':
                handleFormatCode();
                break;
            case 'open-settings':
                handleOpenSettings();
                break;
            default:
                console.log('Unknown command:', commandId);
        }
    };

    const handleNewFile = () => {
        setContent({
            name: 'untitled',
            content: ''
        });
        setSelectedFile(null);
    };

    const handleOpenFile = () => {
        window.api.openFile();
    };

    const handleOpenFolder = () => {
        window.api.openFolder();
    };

    const handleRunCode = async() => {
        if (selectedFile) {
            try {
                await window.api.runCode(selectedFile.path);
            } catch (error) {
                console.error('Error running code:', error);
            }
        }
    };

    const handleFormatCode = () => {
        // Implement code formatting logic
    };

    const handleOpenSettings = () => {
        // Implement settings dialog
    };

    return ( <
            div className = "flex flex-col h-screen bg-gray-900 text-white overflow-hidden" >
            <
            Navbar onCommandExecution = { handleCommandExecution }
            isCommandPaletteOpen = { isCommandPaletteOpen }
            setIsCommandPaletteOpen = { setIsCommandPaletteOpen }
            /> <
            div className = "flex flex-1 overflow-hidden" >
            <
            div className = "w-64 border-r border-gray-700" >
            <
            FileExplorer ref = { fileExplorerRef }
            onFileOpen = { handleFileOpen }
            /> < /
            div > <
            div className = "flex-1 flex flex-col overflow-hidden" >
            <
            div className = "flex-1 overflow-hidden" >
            <
            EditorArea content = { content }
            setContent = { setContent }
            onContentChange = { broadcastCodeChange }
            /> < /
            div > {
                isTerminalVisible && ( <
                    TerminalComponent isVisible = { isTerminalVisible }
                    setIsVisible = { setIsTerminalVisible }
                    />
                )
            } <
            /div> < /
            div > <
            StatusBar lineCount = { lineCount }
            errorCount = { errorCount }
            warningCount = { warningCount }
            connectedUsers = { connectedUsers }
            /> {
            isCommandPaletteOpen && ( <
                CommandPalette isOpen = { isCommandPaletteOpen }
                onClose = {
                    () => setIsCommandPaletteOpen(false)
                }
                onExecuteCommand = { handleCommandExecution }
                />
            )
        } <
        /div>
);
};

export default App;