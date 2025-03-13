import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import 'xterm/css/xterm.css';

const TerminalComponent = ({ setIsVisible }) => {
    const terminalRef = useRef(null);
    const terminal = useRef(null);
    const commandHistory = useRef([]);
    const historyIndex = useRef(-1);
    const currentCommand = useRef('');
    const currentPosition = useRef(0);
    const isExecuting = useRef(false);
    const activityTimeout = useRef(null);

    const hideIfInactive = () => {
        if (!isExecuting.current && currentCommand.current === '') {
            setIsVisible(false);
        }
    };

    const resetActivityTimer = () => {
        if (activityTimeout.current) {
            clearTimeout(activityTimeout.current);
        }
        // Hide terminal after 10 seconds of inactivity if not executing and no command in progress
        activityTimeout.current = setTimeout(hideIfInactive, 10000);
    };

    useEffect(() => {
        // Initialize terminal
        terminal.current = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: 14,
            fontFamily: 'Consolas, monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#d4d4d4',
                selection: '#264f78',
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
            }
        });

        // Add fit addon
        const fitAddon = new FitAddon();
        terminal.current.loadAddon(fitAddon);

        // Add web links addon
        const webLinksAddon = new WebLinksAddon();
        terminal.current.loadAddon(webLinksAddon);

        // Add search addon
        const searchAddon = new SearchAddon();
        terminal.current.loadAddon(searchAddon);

        // Open terminal in container
        terminal.current.open(terminalRef.current);
        fitAddon.fit();

        // Write initial prompt
        terminal.current.write('\r\n\x1b[1;36mKaryakshetra Terminal\x1b[0m');
        terminal.current.write('\r\n$ ');

        // Handle window resize
        const handleResize = () => {
            fitAddon.fit();
        };
        window.addEventListener('resize', handleResize);

        const executeCommand = async(command) => {
            isExecuting.current = true;
            setIsVisible(true); // Show terminal when executing command
            resetActivityTimer(); // Reset inactivity timer

            if (command.startsWith('run ')) {
                const filePath = command.slice(4).trim().replace(/^"(.*)"$/, '$1');
                terminal.current.write(`\r\n\x1b[1;33mExecuting file: ${filePath}\x1b[0m\r\n`);

                try {
                    const result = await window.api.executeCode(filePath);
                    if (result.error) {
                        terminal.current.write(`\r\n\x1b[31mError: ${result.error}\x1b[0m\r\n`);
                    }
                } catch (error) {
                    terminal.current.write(`\r\n\x1b[31mError: ${error.message}\x1b[0m\r\n`);
                } finally {
                    isExecuting.current = false;
                    terminal.current.write('$ ');
                    resetActivityTimer();
                }
            } else {
                window.api.sendTerminalInput(command);
            }
        };

        // Handle terminal input
        terminal.current.onData(data => {
            resetActivityTimer(); // Reset inactivity timer on any input
            const code = data.charCodeAt(0);

            // Don't process input while executing code
            if (isExecuting.current && code !== 3) return;

            // Handle special keys
            if (code === 13) { // Enter
                const command = currentCommand.current.trim();
                if (command) {
                    commandHistory.current.push(command);
                    historyIndex.current = commandHistory.current.length;
                    executeCommand(command);
                } else {
                    terminal.current.write('\r\n$ ');
                }
                currentCommand.current = '';
                currentPosition.current = 0;
            } else if (code === 127) { // Backspace
                if (currentPosition.current > 0) {
                    currentCommand.current =
                        currentCommand.current.slice(0, currentPosition.current - 1) +
                        currentCommand.current.slice(currentPosition.current);
                    currentPosition.current--;
                    terminal.current.write('\b \b');
                }
            } else if (data === '\u001b[A') { // Up arrow
                if (historyIndex.current > 0) {
                    historyIndex.current--;
                    currentCommand.current = commandHistory.current[historyIndex.current];
                    terminal.current.write('\r\u001b[K$ ' + currentCommand.current);
                    currentPosition.current = currentCommand.current.length;
                }
            } else if (data === '\u001b[B') { // Down arrow
                if (historyIndex.current < commandHistory.current.length - 1) {
                    historyIndex.current++;
                    currentCommand.current = commandHistory.current[historyIndex.current];
                    terminal.current.write('\r\u001b[K$ ' + currentCommand.current);
                    currentPosition.current = currentCommand.current.length;
                } else if (historyIndex.current === commandHistory.current.length - 1) {
                    historyIndex.current++;
                    currentCommand.current = '';
                    terminal.current.write('\r\u001b[K$ ');
                    currentPosition.current = 0;
                }
            } else if (data === '\u001b[C') { // Right arrow
                if (currentPosition.current < currentCommand.current.length) {
                    currentPosition.current++;
                    terminal.current.write(data);
                }
            } else if (data === '\u001b[D') { // Left arrow
                if (currentPosition.current > 0) {
                    currentPosition.current--;
                    terminal.current.write(data);
                }
            } else if (code === 3) { // Ctrl+C
                isExecuting.current = false;
                terminal.current.write('^C\r\n$ ');
                currentCommand.current = '';
                currentPosition.current = 0;
                resetActivityTimer();
            } else if (code >= 32 && code <= 126) { // Printable characters
                currentCommand.current =
                    currentCommand.current.slice(0, currentPosition.current) +
                    data +
                    currentCommand.current.slice(currentPosition.current);
                currentPosition.current++;
                terminal.current.write(data);
            }
        });

        // Handle terminal output with color support
        window.api.onTerminalOutput((data) => {
            setIsVisible(true); // Show terminal when there's output
            resetActivityTimer(); // Reset inactivity timer
            if (data.includes('\x1b[')) {
                terminal.current.write(data);
            } else {
                terminal.current.write(data);
            }
            if (!isExecuting.current) {
                terminal.current.write('\r\n$ ');
            }
        });

        // Handle terminal error output
        window.api.onTerminalError((data) => {
            setIsVisible(true); // Show terminal when there's an error
            resetActivityTimer(); // Reset inactivity timer
            terminal.current.write(`\x1b[31m${data}\x1b[0m`);
            if (!isExecuting.current) {
                terminal.current.write('\r\n$ ');
            }
        });

        // Handle terminal exit
        window.api.onTerminalExit((code) => {
            const color = code === 0 ? '\x1b[32m' : '\x1b[31m';
            terminal.current.write(`\r\n${color}Process exited with code ${code}\x1b[0m\r\n$ `);
            isExecuting.current = false;
            resetActivityTimer(); // Reset inactivity timer
        });

        // Start initial inactivity timer
        resetActivityTimer();

        return () => {
            window.removeEventListener('resize', handleResize);
            terminal.current.dispose();
            window.api.onTerminalOutput(null);
            window.api.onTerminalError(null);
            window.api.onTerminalExit(null);
            if (activityTimeout.current) {
                clearTimeout(activityTimeout.current);
            }
        };
    }, [setIsVisible]);

    return ( <
        div ref = { terminalRef }
        style = {
            {
                height: '20vh',
                width: '100%',
                backgroundColor: '#1e1e1e',
                padding: '8px'
            }
        }
        />
    );
};

export default TerminalComponent;