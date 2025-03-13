// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import EditorArea from './components/EditorArea';
import FileExplorer from './components/FileExp';
import './assets/main.css';
import Navbar from './components/nav';
import TerminalComponent from './components/Terminal';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import { io } from 'socket.io-client';

const WEBSOCKET_URL = 'ws://127.0.0.1:8080';
const SOCKETIO_URL = 'http://127.0.0.1:8080';

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
    const [wsConnected, setWsConnected] = useState(false);
    const fileExplorerRef = useRef(null);
    const socketRef = useRef(null);
    const documentVersion = useRef(Date.now());

    useEffect(() => {
        const connectSocket = () => {
            try {
                const socket = io(SOCKETIO_URL, {
                    withCredentials: true,
                    transports: ['websocket', 'polling']
                });

                socket.on('connect', () => {
                    console.log('Connected to Socket.IO server');
                    setWsConnected(true);
                });

                socket.on('disconnect', () => {
                    console.log('Disconnected from Socket.IO server');
                    setWsConnected(false);
                    setTimeout(connectSocket, 3000);
                });

                socket.on('init', (data) => {
                    setClientId(data.clientId);
                });

                socket.on('user_list', (data) => {
                    setConnectedUsers(data.users);
                });

                socket.on('message', (data) => {
                    handleSocketMessage(data);
                });

                socket.on('file_content', (data) => {
                    if (selectedFile && data.path === selectedFile.path) {
                        setContent(prev => ({
                            ...prev,
                            content: data.content
                        }));
                        documentVersion.current = data.version;
                    }
                });

                socket.on('error', (error) => {
                    console.error('Socket.IO error:', error);
                    setWsConnected(false);
                });

                socketRef.current = socket;
            } catch (error) {
                console.error('Error connecting to Socket.IO server:', error);
                setWsConnected(false);
                setTimeout(connectSocket, 3000);
            }
        };

        connectSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const handleSocketMessage = (data) => {
        switch (data.type) {
            case 'code_change':
                if (data.clientId !== clientId && selectedFile && data.path === selectedFile.path) {
                    setContent(prev => ({
                        ...prev,
                        content: data.content
                    }));
                    documentVersion.current = data.version;
                }
                break;
            default:
                break;
        }
    };

    const broadcastCodeChange = (newContent) => {
        if (socketRef.current && socketRef.current.connected && selectedFile) {
            documentVersion.current = Date.now();
            socketRef.current.emit('message', {
                type: 'code_change',
                path: selectedFile.path,
                content: newContent,
                version: documentVersion.current
            });
        }
    };

    useEffect(() => {
        if (content.content) {
            setLineCount(content.content.split('\n').length);
        }

        if (content.name) {
            setSelectedFile({ name: content.name });
        }
    }, [content]);

    useEffect(() => {
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

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('new-file', handleNewFile);
        window.addEventListener('open-file', handleOpenFile);
        window.addEventListener('open-folder', handleOpenFolder);
        window.addEventListener('save-file', handleSaveFile);
        window.addEventListener('save-file-as', handleSaveFileAs);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('new-file', handleNewFile);
            window.removeEventListener('open-file', handleOpenFile);
            window.removeEventListener('open-folder', handleOpenFolder);
            window.removeEventListener('save-file', handleSaveFile);
            window.removeEventListener('save-file-as', handleSaveFileAs);
        };
    }, []);

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

            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('message', {
                    type: 'file_open',
                    path: filePath
                });
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
                defaultPath: selectedFile && selectedFile.path,
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
            default:
                console.log('Unknown command:', commandId);
                break;
        }
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
            wsConnected = { wsConnected }
            /> {
            isCommandPaletteOpen && ( <
                CommandPalette isOpen = { isCommandPaletteOpen }
                onClose = {
                    () => setIsCommandPaletteOpen(false)
                }
                onCommandSelect = { handleCommandExecution }
                />
            )
        } <
        /div>
);
};

export default App;