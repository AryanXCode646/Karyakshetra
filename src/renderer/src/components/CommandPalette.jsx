import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faFile,
    faFolder,
    faCode,
    faCog,
    faTerminal,
    faPlay
} from '@fortawesome/free-solid-svg-icons';

const CommandPalette = ({ isOpen, onClose, onExecuteCommand }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    const commands = [
        { id: 'new-file', label: 'New File', icon: faFile, category: 'File' },
        { id: 'open-file', label: 'Open File', icon: faFile, category: 'File' },
        { id: 'open-folder', label: 'Open Folder', icon: faFolder, category: 'File' },
        { id: 'save-file', label: 'Save File', icon: faFile, category: 'File' },
        { id: 'run-code', label: 'Run Code', icon: faPlay, category: 'Run' },
        { id: 'toggle-terminal', label: 'Toggle Terminal', icon: faTerminal, category: 'View' },
        { id: 'format-code', label: 'Format Document', icon: faCode, category: 'Edit' },
        { id: 'settings', label: 'Open Settings', icon: faCog, category: 'Settings' },
    ];

    const filteredCommands = commands.filter(command =>
        command.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        command.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm]);

    const handleKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredCommands.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                break;
            case 'Enter':
                if (filteredCommands[selectedIndex]) {
                    onExecuteCommand(filteredCommands[selectedIndex].id);
                    onClose();
                }
                break;
            case 'Escape':
                onClose();
                break;
            default:
                break;
        }
    };

    if (!isOpen) return null;

    return ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50" >
        <
        div className = "w-[600px] bg-[#252526] rounded-lg shadow-lg overflow-hidden" >
        <
        div className = "p-2 border-b border-[#3c3c3c] flex items-center" >
        <
        FontAwesomeIcon icon = { faSearch }
        className = "text-gray-400 mr-2" / >
        <
        input ref = { inputRef }
        type = "text"
        value = { searchTerm }
        onChange = {
            (e) => setSearchTerm(e.target.value)
        }
        onKeyDown = { handleKeyDown }
        placeholder = "Type a command or search..."
        className = "w-full bg-transparent border-none outline-none text-white" /
        >
        <
        /div> <
        div className = "max-h-[400px] overflow-y-auto" > {
            filteredCommands.map((command, index) => ( <
                div key = { command.id }
                className = { `flex items-center px-4 py-2 cursor-pointer ${
                                index === selectedIndex ? 'bg-[#04395e]' : 'hover:bg-[#2a2d2e]'
                            }` }
                onClick = {
                    () => {
                        onExecuteCommand(command.id);
                        onClose();
                    }
                } >
                <
                FontAwesomeIcon icon = { command.icon }
                className = "text-gray-400 mr-3" /
                >
                <
                div >
                <
                div className = "text-white" > { command.label } < /div> <
                div className = "text-gray-500 text-sm" > { command.category } < /div> < /
                div > <
                /div>
            ))
        } <
        /div> < /
        div > <
        /div>
    );
};

export default CommandPalette;