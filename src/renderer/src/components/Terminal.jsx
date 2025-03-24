import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

const Terminal = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const terminalRef = useRef(null);
    const xterm = useRef(null);
    const currentLineRef = useRef('');
    const commandHistoryRef = useRef([]);
    const historyIndexRef = useRef(-1);

    useEffect(() => {
        if (!terminalRef.current || !isVisible || isCollapsed) return;

        const term = new XTerm({
            rows: 24,
            cols: 80,
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selection: '#5c5c5c'
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
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon());

        term.open(terminalRef.current);
        fitAddon.fit();
        term.focus();

        xterm.current = term;

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
                    term.write('\r\n');
                }
                currentLineRef.current = '';
                handled = true;
            } else if (data === '\u007F') { // Backspace
                if (currentLineRef.current.length > 0) {
                    currentLineRef.current = currentLineRef.current.slice(0, -1);
                    term.write('\b \b');
                }
                handled = true;
            } else if (data === '\u0003') { // Ctrl+C
                window.electron.ipcRenderer.send('terminal-input', '\x03');
                currentLineRef.current = '';
                handled = true;
            } else if (data === '\u001b[A') { // Up arrow
                if (historyIndexRef.current > 0) {
                    historyIndexRef.current--;
                    while (currentLineRef.current.length > 0) {
                        term.write('\b \b');
                        currentLineRef.current = currentLineRef.current.slice(0, -1);
                    }
                    currentLineRef.current = commandHistoryRef.current[historyIndexRef.current];
                    term.write(currentLineRef.current);
                }
                handled = true;
            } else if (data === '\u001b[B') { // Down arrow
                if (historyIndexRef.current < commandHistoryRef.current.length) {
                    historyIndexRef.current++;
                    while (currentLineRef.current.length > 0) {
                        term.write('\b \b');
                        currentLineRef.current = currentLineRef.current.slice(0, -1);
                    }
                    currentLineRef.current = historyIndexRef.current < commandHistoryRef.current.length ?
                        commandHistoryRef.current[historyIndexRef.current] : '';
                    term.write(currentLineRef.current);
                }
                handled = true;
            }

            if (!handled && data >= String.fromCharCode(32) && data <= String.fromCharCode(126)) {
                currentLineRef.current += data;
                term.write(data);
            }
        };

        term.onData(handleData);

        const handleOutput = (_, data) => {
            if (term && !term.disposed) {
                term.write(data);
            }
        };

        const handleError = (_, error) => {
            if (term && !term.disposed) {
                term.write(`\x1b[31m${error}\x1b[0m`);
            }
        };

        window.electron.ipcRenderer.on('terminal-output', handleOutput);
        window.electron.ipcRenderer.on('terminal-error', handleError);

        const handleResize = () => {
            if (fitAddon && !term.disposed) {
                fitAddon.fit();
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.electron.ipcRenderer.removeListener('terminal-output', handleOutput);
            window.electron.ipcRenderer.removeListener('terminal-error', handleError);
            if (term && !term.disposed) {
                term.dispose();
            }
        };
    }, [isVisible, isCollapsed]);

    if (!isVisible) return null;

    return ( <
        div style = {
            {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: isCollapsed ? '30px' : '200px',
                backgroundColor: '#1e1e1e',
                borderTop: '1px solid #333'
            }
        } >
        <
        div style = {
            {
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderBottom: '1px solid #333'
            }
        } >
        <
        button onClick = {
            () => setIsCollapsed(!isCollapsed)
        }
        style = {
            { marginRight: '8px' }
        } > { isCollapsed ? '▼' : '▲' } <
        /button> <
        button onClick = {
            () => setIsVisible(false)
        }
        style = {
            { marginLeft: 'auto' }
        } > ✕
        <
        /button> < /
        div > {!isCollapsed && ( <
                div ref = { terminalRef }
                style = {
                    { height: 'calc(100% - 34px)' }
                }
                />
            )
        } <
        /div>
    );
};

export default Terminal;