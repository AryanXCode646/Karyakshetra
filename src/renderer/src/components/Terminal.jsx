import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';
import { FaTerminal, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const Terminal = () => {
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(300);
    const currentLineRef = useRef('');
    const commandHistoryRef = useRef([]);
    const historyIndexRef = useRef(-1);

    useEffect(() => {
        if (!terminalRef.current || !isVisible || isCollapsed) return;

        const xterm = new XTerm({
            rows: 24,
            cols: 80,
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selection: '#5c5c5c',
                black: '#000000',
                red: '#cd3131',
                green: '#0dbc79',
                yellow: '#e5e510',
                blue: '#2472c8',
                magenta: '#bc3fbc',
                cyan: '#11a8cd',
                white: '#e5e5e5',
                brightBlack: '#666666',
                brightRed: '#f14c4c',
                brightGreen: '#23d18b',
                brightYellow: '#f5f543',
                brightBlue: '#3b8eea',
                brightMagenta: '#d670d6',
                brightCyan: '#29b8db',
                brightWhite: '#e5e5e5'
            },
            cursorBlink: true,
            cursorStyle: 'block',
            scrollback: 1000,
            fontFamily: 'Consolas, monospace',
            fontSize: 14,
            convertEol: true,
            windowsMode: true
        });

        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);
        xterm.loadAddon(new WebLinksAddon());

        xterm.open(terminalRef.current);
        fitAddon.fit();
        xterm.focus();

        xtermRef.current = xterm;

        window.electron.ipcRenderer.send('terminal-create');

        const handleData = (data) => {
            let handled = false;

            if (data === '\r') { // Enter
                const command = currentLineRef.current.trim();
                if (command) {
                    commandHistoryRef.current.push(command);
                    historyIndexRef.current = commandHistoryRef.current.length;
                    window.electron.ipcRenderer.send('terminal-input', command);
                } else {
                    xterm.write('\r\n');
                }
                currentLineRef.current = '';
                handled = true;
            } else if (data === '\u007F') { // Backspace
                if (currentLineRef.current.length > 0) {
                    currentLineRef.current = currentLineRef.current.slice(0, -1);
                    xterm.write('\b \b');
                }
                handled = true;
            } else if (data === '\u0003') { // Ctrl+C
                window.electron.ipcRenderer.send('terminal-input', '\x03');
                currentLineRef.current = '';
                handled = true;
            } else if (data === '\u001b[A') { // Up arrow
                if (historyIndexRef.current > 0) {
                    historyIndexRef.current--;
                    // Clear current line
                    while (currentLineRef.current.length > 0) {
                        xterm.write('\b \b');
                        currentLineRef.current = currentLineRef.current.slice(0, -1);
                    }
                    // Show command from history
                    currentLineRef.current = commandHistoryRef.current[historyIndexRef.current];
                    xterm.write(currentLineRef.current);
                }
                handled = true;
            } else if (data === '\u001b[B') { // Down arrow
                if (historyIndexRef.current < commandHistoryRef.current.length) {
                    historyIndexRef.current++;
                    // Clear current line
                    while (currentLineRef.current.length > 0) {
                        xterm.write('\b \b');
                        currentLineRef.current = currentLineRef.current.slice(0, -1);
                    }
                    // Show command from history or empty if at the end
                    currentLineRef.current = historyIndexRef.current < commandHistoryRef.current.length ?
                        commandHistoryRef.current[historyIndexRef.current] : '';
                    xterm.write(currentLineRef.current);
                }
                handled = true;
            }

            if (!handled && data >= String.fromCharCode(32) && data <= String.fromCharCode(126)) {
                currentLineRef.current += data;
                xterm.write(data);
            }
        };

        xterm.onData(handleData);

        const handleOutput = (_, data) => {
            if (xterm && !xterm.disposed) {
                xterm.write(data);
            }
        };

        const handleError = (_, error) => {
            if (xterm && !xterm.disposed) {
                xterm.write(`\x1b[31m${error}\x1b[0m`);
            }
        };

        window.electron.ipcRenderer.on('terminal-output', handleOutput);
        window.electron.ipcRenderer.on('terminal-error', handleError);

        const handleResize = () => {
            if (fitAddon && !xterm.disposed) {
                fitAddon.fit();
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.electron.ipcRenderer.removeListener('terminal-output', handleOutput);
            window.electron.ipcRenderer.removeListener('terminal-error', handleError);
            if (xterm && !xterm.disposed) {
                xterm.dispose();
            }
        };
    }, [isVisible, isCollapsed]);

    if (!isVisible) return null;

    return ( <
        div className = "fixed bottom-0 left-0 right-0 bg-gray-900 text-white transition-all duration-300 ease-in-out"
        style = {
            {
                height: isCollapsed ? '40px' : `${terminalHeight}px`,
                zIndex: 1000
            }
        } >
        <
        div className = "absolute top-0 left-0 right-0 h-1 bg-gray-700 cursor-ns-resize"
        onMouseDown = {
            (e) => {
                const startY = e.clientY;
                const startHeight = terminalHeight;

                const handleMouseMove = (moveEvent) => {
                    const delta = startY - moveEvent.clientY;
                    const newHeight = Math.min(Math.max(startHeight + delta, 100), window.innerHeight * 0.8);
                    setTerminalHeight(newHeight);
                };

                const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }
        }
        /> <
        div className = "flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700" >
        <
        div className = "flex items-center space-x-2" >
        <
        FaTerminal className = "text-green-500" / >
        <
        span className = "font-semibold" > Terminal < /span> <
        /div> <
        div className = "flex items-center space-x-2" >
        <
        button onClick = {
            () => setIsCollapsed(!isCollapsed) }
        className = "p-1 hover:bg-gray-700 rounded" >
        { isCollapsed ? < FaChevronUp / > : < FaChevronDown / > } <
        /button> <
        button onClick = {
            () => setIsVisible(false) }
        className = "p-1 hover:bg-gray-700 rounded" >
        <
        FaTimes / >
        <
        /button> <
        /div> <
        /div> <
        div ref = { terminalRef }
        className = "terminal-container"
        style = {
            {
                height: isCollapsed ? '0' : 'calc(100% - 40px)',
                width: '100%',
                padding: '8px',
                backgroundColor: '#1e1e1e',
                overflow: 'hidden',
                display: isCollapsed ? 'none' : 'block'
            }
        }
        onClick = {
            () => {
                if (xtermRef.current && !xtermRef.current.disposed) {
                    xtermRef.current.focus();
                }
            }
        }
        /> <
        style > { `
                .terminal-container {
                    display: flex;
                    flex-direction: column;
                }
                .terminal-container .xterm {
                    padding: 8px;
                    height: 100%;
                    width: 100%;
                }
                .terminal-container .xterm-viewport,
                .terminal-container .xterm-screen {
                    width: 100% !important;
                    height: 100% !important;
                }
            ` } < /style> <
        /div>
    );
};

export default Terminal;