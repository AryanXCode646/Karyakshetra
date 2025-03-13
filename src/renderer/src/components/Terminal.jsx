import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import 'xterm/css/xterm.css';
import { FaTerminal, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const TerminalComponent = ({ setIsVisible, isVisible }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(300);
    const terminalRef = useRef(null);
    const terminal = useRef(null);
    const fitAddon = useRef(null);
    const resizeRef = useRef(null);
    const isResizing = useRef(false);
    const commandHistory = useRef([]);
    const historyIndex = useRef(-1);
    const currentInput = useRef('');
    const [isInitialized, setIsInitialized] = useState(false);

    const initializeTerminal = () => {
        if (!terminalRef.current) return;

        if (terminal.current) {
            terminal.current.dispose();
        }

        // Clear the terminal container
        terminalRef.current.innerHTML = '';

        // Create a new terminal instance
        terminal.current = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Consolas, monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4'
            },
            rows: 20,
            scrollback: 1000,
            convertEol: true
        });

        // Create and attach addons
        fitAddon.current = new FitAddon();
        terminal.current.loadAddon(fitAddon.current);
        terminal.current.loadAddon(new WebLinksAddon());
        terminal.current.loadAddon(new SearchAddon());

        // Open terminal in the container
        terminal.current.open(terminalRef.current);

        // Set up event handlers
        terminal.current.onData(handleTerminalInput);
        terminal.current.onKey(handleKeyPress);

        // Initial terminal text
        terminal.current.write('\r\n\x1b[1;36mKaryakshetra Terminal\x1b[0m\r\n$ ');

        // Fit terminal to container
        setTimeout(() => {
            if (fitAddon.current) {
                fitAddon.current.fit();
            }
        }, 0);

        setIsInitialized(true);
    };

    const writePrompt = () => {
        if (terminal.current) {
            terminal.current.write('\r\n$ ');
        }
    };

    const handleTerminalInput = (data) => {
        if (!terminal.current) return;

        switch (data) {
            case '\r': // Enter
                const command = currentInput.current.trim();
                if (command) {
                    commandHistory.current.push(command);
                    historyIndex.current = commandHistory.current.length;
                    terminal.current.write('\r\n');
                    executeCommand(command);
                }
                currentInput.current = '';
                writePrompt();
                break;
            case '\u007F': // Backspace
                if (currentInput.current.length > 0) {
                    currentInput.current = currentInput.current.slice(0, -1);
                    terminal.current.write('\b \b');
                }
                break;
            default:
                currentInput.current += data;
                terminal.current.write(data);
        }
    };

    const handleKeyPress = (e) => {
        if (!terminal.current) return;

        const ev = e.domEvent;
        const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

        if (ev.keyCode === 38) { // Up arrow
            ev.preventDefault();
            if (historyIndex.current > 0) {
                historyIndex.current--;
                showHistoryCommand();
            }
        } else if (ev.keyCode === 40) { // Down arrow
            ev.preventDefault();
            if (historyIndex.current < commandHistory.current.length) {
                historyIndex.current++;
                showHistoryCommand();
            }
        }
    };

    const showHistoryCommand = () => {
        if (!terminal.current) return;

        const command = historyIndex.current < commandHistory.current.length ?
            commandHistory.current[historyIndex.current] :
            '';

        terminal.current.write('\r$ ' + ' '.repeat(currentInput.current.length) + '\r$ ' + command);
        currentInput.current = command;
    };

    const executeCommand = (command) => {
        if (!terminal.current) return;
        terminal.current.write(`Command not found: ${command}\r\n`);
    };

    // Initialize terminal when component mounts or becomes visible
    useEffect(() => {
        if (isVisible && !isInitialized) {
            initializeTerminal();
        }

        if (isVisible && terminal.current && fitAddon.current) {
            setTimeout(() => {
                fitAddon.current.fit();
            }, 100);
        }
    }, [isVisible, isInitialized]);

    // Handle terminal visibility changes
    useEffect(() => {
        if (isVisible && isInitialized && !isCollapsed && fitAddon.current) {
            setTimeout(() => {
                fitAddon.current.fit();
            }, 100);
        }
    }, [isVisible, isInitialized, isCollapsed]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (fitAddon.current && !isCollapsed) {
                fitAddon.current.fit();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCollapsed]);

    const startResize = (e) => {
        isResizing.current = true;
        document.body.style.cursor = 'ns-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight >= 100 && newHeight <= window.innerHeight * 0.8) {
                setTerminalHeight(newHeight);
                if (fitAddon.current) {
                    setTimeout(() => fitAddon.current.fit(), 0);
                }
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    if (!isVisible) return null;

    return ( <
        div className = { `fixed bottom-0 left-0 right-0 bg-gray-900 text-white transition-all duration-300 ease-in-out ${
                isCollapsed ? 'h-10' : ''
            }` }
        style = {
            { height: isCollapsed ? '40px' : `${terminalHeight}px` }
        } >
        <
        div ref = { resizeRef }
        className = "absolute top-0 left-0 right-0 h-1 bg-gray-700 cursor-ns-resize"
        onMouseDown = { startResize }
        /> <
        div className = "flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700" >
        <
        div className = "flex items-center space-x-2" >
        <
        FaTerminal className = "text-green-500" / >
        <
        span className = "font-semibold" > Terminal < /span> < /
        div > <
        div className = "flex items-center space-x-2" >
        <
        button onClick = { toggleCollapse }
        className = "p-1 hover:bg-gray-700 rounded" > { isCollapsed ? < FaChevronUp / > : < FaChevronDown / > } <
        /button> <
        button onClick = {
            () => setIsVisible(false)
        }
        className = "p-1 hover:bg-gray-700 rounded" >
        <
        FaTimes / >
        <
        /button> < /
        div > <
        /div> <
        div ref = { terminalRef }
        className = { `h-[calc(100%-40px)] ${isCollapsed ? 'hidden' : ''}` }
        style = {
            { display: isCollapsed ? 'none' : 'block' }
        }
        /> < /
        div >
    );
};

export default TerminalComponent;