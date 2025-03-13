import React, { useState } from 'react';
import '../assets/layout.css';
import logo from "../assets/logo.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faCog, faServer, faTimes } from '@fortawesome/free-solid-svg-icons';
import { io } from "socket.io-client";

const Navbar = () => {
        const [activeDropdown, setActiveDropdown] = useState(null);
        const [isServerDialogOpen, setIsServerDialogOpen] = useState(false);
        const [User, setUser] = useState('');
        const [Group, setGroup] = useState('');
        const socket = io('https://karyak.vercel.app/api/server');

        const handleDropdownClick = (menu) => {
            setActiveDropdown(activeDropdown === menu ? null : menu);
        };

        const handleServerConnect = (e) => {
            e.preventDefault();
            socket.emit('joinGroup', { userId: User, groupId: Group });
            setIsServerDialogOpen(false);
            setUser('');
            setGroup('');
        };

        const handleFileAction = async(action) => {
            try {
                switch (action) {
                    case 'new-file':
                        // This will be handled by the FileExplorer's addFile function
                        window.dispatchEvent(new CustomEvent('new-file'));
                        break;
                    case 'open-file':
                        const result = await window.api.showDialog({
                            title: 'Open File',
                            properties: ['openFile']
                        });
                        if (!result.canceled && result.filePaths.length > 0) {
                            const filePath = result.filePaths[0];
                            const fileName = filePath.split(/[/\\]/).pop();
                            window.dispatchEvent(new CustomEvent('open-file', {
                                detail: { path: filePath, name: fileName }
                            }));
                        }
                        break;
                    case 'open-folder':
                        const folderResult = await window.api.showDialog({
                            title: 'Open Folder',
                            properties: ['openDirectory']
                        });
                        if (!folderResult.canceled && folderResult.filePaths.length > 0) {
                            window.dispatchEvent(new CustomEvent('open-folder', {
                                detail: { path: folderResult.filePaths[0] }
                            }));
                        }
                        break;
                    case 'save':
                        window.dispatchEvent(new CustomEvent('save-file'));
                        break;
                    case 'save-as':
                        window.dispatchEvent(new CustomEvent('save-file-as'));
                        break;
                    default:
                        break;
                }
            } catch (error) {
                console.error('Error handling file action:', error);
            }
            setActiveDropdown(null);
        };

        const menuItems = {
            'File': [
                { label: 'New File', action: 'new-file', shortcut: 'Ctrl+N' },
                { label: 'Open File...', action: 'open-file', shortcut: 'Ctrl+O' },
                { label: 'Open Folder...', action: 'open-folder', shortcut: 'Ctrl+K Ctrl+O' },
                { type: 'separator' },
                { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
                { label: 'Save As...', action: 'save-as', shortcut: 'Ctrl+Shift+S' },
                { type: 'separator' },
                { label: 'Exit', action: 'exit', shortcut: 'Alt+F4' }
            ],
            'Edit': [
                { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
                { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
                { type: 'separator' },
                { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
                { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
                { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' }
            ],
            'View': [
                { label: 'Command Palette...', action: 'command-palette', shortcut: 'Ctrl+Shift+P' },
                { type: 'separator' },
                { label: 'Explorer', action: 'toggle-explorer', shortcut: 'Ctrl+Shift+E' },
                { label: 'Search', action: 'toggle-search', shortcut: 'Ctrl+Shift+F' },
                { label: 'Terminal', action: 'toggle-terminal', shortcut: 'Ctrl+`' }
            ],
            'Run': [
                { label: 'Run File', action: 'run-file', shortcut: 'Ctrl+F5' },
                { label: 'Stop', action: 'stop-run', shortcut: 'Shift+F5' }
            ],
            'Help': [
                { label: 'Documentation', action: 'show-docs' },
                { label: 'Check for Updates...', action: 'check-updates' },
                { type: 'separator' },
                { label: 'About', action: 'show-about' }
            ]
        };

        return ( <
            nav className = "navbar bg-[#1e1e1e] border-b border-[#3c3c3c] h-8 flex items-center px-2 relative" >
            <
            div className = "flex items-center space-x-2" >
            <
            img src = { logo }
            alt = "Logo"
            className = "h-6 w-6" / > {
                Object.keys(menuItems).map((menu) => ( <
                        div key = { menu }
                        className = "relative" >
                        <
                        button className = { `px-3 py-1 text-sm hover:bg-[#3c3c3c] ${
                                activeDropdown === menu ? 'bg-[#3c3c3c]' : ''
                            }` }
                        onClick = {
                            () => handleDropdownClick(menu)
                        } > { menu } <
                        /button> {
                        activeDropdown === menu && ( <
                            div className = "absolute top-full left-0 mt-1 bg-[#252526] border border-[#3c3c3c] shadow-lg rounded-sm min-w-[200px] z-50" > {
                                menuItems[menu].map((item, index) => (
                                    item.type === 'separator' ? ( <
                                        div key = { index }
                                        className = "border-t border-[#3c3c3c] my-1" > < /div>
                                    ) : ( <
                                        button key = { item.label }
                                        className = "w-full px-4 py-1.5 text-left text-sm hover:bg-[#04395e] flex justify-between items-center"
                                        onClick = {
                                            () => handleFileAction(item.action)
                                        } >
                                        <
                                        span > { item.label } < /span> {
                                        item.shortcut && ( <
                                            span className = "text-gray-500 text-xs" > { item.shortcut } < /span>
                                        )
                                    } <
                                    /button>
                                )))
                        } <
                        /div>
                    )
                } <
                /div>
            ))
    } <
    /div>

{ /* Server Connection Button */ } <
button onClick = {
    () => setIsServerDialogOpen(true)
}
className = "ml-auto px-3 py-1 text-sm hover:bg-[#3c3c3c] flex items-center gap-2"
title = "Connect to Server" >
    <
    FontAwesomeIcon icon = { faServer }
/> <
span > Connect < /span> < /
button >

    { /* Server Connection Dialog */ } {
        isServerDialogOpen && ( <
            div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" >
            <
            div className = "bg-[#1e1e1e] rounded-lg shadow-xl w-96" >
            <
            div className = "flex justify-between items-center p-4 border-b border-[#3c3c3c]" >
            <
            h3 className = "text-lg font-semibold" > Connect to Server < /h3> <
            button onClick = {
                () => setIsServerDialogOpen(false)
            }
            className = "text-gray-400 hover:text-white transition-colors" >
            <
            FontAwesomeIcon icon = { faTimes }
            /> < /
            button > <
            /div> <
            form onSubmit = { handleServerConnect }
            className = "p-4 space-y-4" >
            <
            div >
            <
            label className = "block text-sm font-medium mb-1" > User ID < /label> <
            input type = "text"
            value = { User }
            onChange = {
                (e) => setUser(e.target.value)
            }
            className = "w-full bg-[#2d2d2d] text-white border border-[#3c3c3c] rounded px-3 py-2 focus:border-blue-500 transition-colors"
            placeholder = "Enter your user ID" /
            >
            <
            /div> <
            div >
            <
            label className = "block text-sm font-medium mb-1" > Server ID < /label> <
            input type = "text"
            value = { Group }
            onChange = {
                (e) => setGroup(e.target.value)
            }
            className = "w-full bg-[#2d2d2d] text-white border border-[#3c3c3c] rounded px-3 py-2 focus:border-blue-500 transition-colors"
            placeholder = "Enter server ID" /
            >
            <
            /div> <
            div className = "flex justify-end pt-4" >
            <
            button type = "button"
            onClick = {
                () => setIsServerDialogOpen(false)
            }
            className = "mr-3 px-4 py-2 text-sm hover:bg-[#3c3c3c] rounded" >
            Cancel <
            /button> <
            button type = "submit"
            className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" >
            Connect <
            /button> < /
            div > <
            /form> < /
            div > <
            /div>
        )
    } <
    /nav>
);
};

export default Navbar;