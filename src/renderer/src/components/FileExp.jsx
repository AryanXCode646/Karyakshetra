import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { faArrowLeft, faSave, faFolderOpen, faPlus, faPlay, faHome, faDesktop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NewFileDialog from './NewFileDialog';

const FileExplorer = forwardRef(({ onFileOpen }, ref) => {
    const [files, setFiles] = useState([]);
    const [currentPath, setCurrentPath] = useState('');
    const [optionOpened, setoptionOpened] = useState(false);
    const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [quickAccess, setQuickAccess] = useState([]);

    useImperativeHandle(ref, () => ({
        addFile: () => {
            if (!currentPath) {
                alert('Please select a folder first');
                return;
            }
            setIsNewFileDialogOpen(true);
            setoptionOpened(false);
        },
        handleDirectoryClick: (dirPath) => {
            setCurrentPath(dirPath);
            setSelectedFile(null);
        }
    }));

    useEffect(() => {
        // Get initial path and quick access locations
        Promise.all([
            window.api.getCurrentDirectory(),
            window.api.getQuickAccessPaths()
        ]).then(([dir, paths]) => {
            setCurrentPath(dir);
            setQuickAccess(paths);
        });
    }, []);

    useEffect(() => {
        if (currentPath) {
            loadFiles(currentPath);
        }
    }, [currentPath]);

    const loadFiles = async(dirPath) => {
        const fileData = await window.api.loadFiles(dirPath);
        if (fileData.error) {
            console.error('Error loading files:', fileData.error);
        } else {
            setFiles(fileData);
        }
    };

    const handleDirectoryClick = (dirPath) => {
        setCurrentPath(dirPath);
        setSelectedFile(null);
    };

    const undoDir = () => {
        try {
            if (currentPath === '') return;
            const pathsplit = currentPath.split('\\');
            if (pathsplit.length <= 1) {
                setCurrentPath('');
            } else {
                setCurrentPath(pathsplit.slice(0, -1).join('\\'));
            }
            setSelectedFile(null);
        } catch (err) {
            console.log('error occurred while undo file:', err);
        }
    };

    const changeValue = async(file) => {
        if (onFileOpen) {
            onFileOpen(file.path, file.name);
        }
        setSelectedFile(file);
    };

    const openOption = () => {
        setoptionOpened(!optionOpened);
    };

    const addFolder = async() => {
        const result = await window.api.showDialog({
            title: 'Create New Folder',
            defaultPath: currentPath,
            buttonLabel: 'Create Folder',
            properties: ['createDirectory']
        });
        if (!result.canceled) {
            loadFiles(currentPath); // Refresh the file list
        }
        setoptionOpened(false);
    };

    const addFile = () => {
        if (!currentPath) {
            alert('Please select a folder first');
            return;
        }
        setIsNewFileDialogOpen(true);
        setoptionOpened(false);
    };

    const openFolder = async() => {
        const result = await window.api.showDialog({
            title: 'Open Folder',
            defaultPath: currentPath,
            buttonLabel: 'Open Folder',
            properties: ['openDirectory']
        });
        if (!result.canceled && result.filePaths.length > 0) {
            setCurrentPath(result.filePaths[0]);
        }
        setoptionOpened(false);
    };

    const openFile = async() => {
        const result = await window.api.showDialog({
            title: 'Open File',
            defaultPath: currentPath,
            buttonLabel: 'Open File',
            properties: ['openFile']
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            const fileName = filePath.split(/[/\\]/).pop();
            const file = { path: filePath, name: fileName };
            changeValue(file);
        }
    };

    const handleRunFile = async() => {
        if (!selectedFile || selectedFile.isDirectory) return;

        try {
            window.api.sendTerminalInput(`run "${selectedFile.path}"`);
        } catch (error) {
            console.error('Error executing file:', error);
            window.api.sendTerminalInput(`echo "\x1b[31mError executing file: ${error.message}\x1b[0m"`);
        }
    };

    const isExecutableFile = (file) => {
        if (!file || file.isDirectory) return false;
        const executableExtensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.rb', '.go', '.php'];
        return executableExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    };

    const goToQuickAccess = (path) => {
        setCurrentPath(path);
        setSelectedFile(null);
    };

    return ( <
            div className = "w-[20vw] h-[80vh] p-2 flex flex-col gap-2 border-b-[1px] border-[#6b98ab] resize-x" >
            <
            div className = "flex justify-between items-center" >
            <
            h3 className = "font-mono text-xl" > Karyakshetra Files < /h3> {
            selectedFile && isExecutableFile(selectedFile) && ( <
                button onClick = { handleRunFile }
                className = "run-button"
                title = "Run file" >
                <
                FontAwesomeIcon icon = { faPlay }
                />
                Run <
                /button>
            )
        } <
        /div>

    <
    div className = "flex flex-col gap-1 bg-[#1e1e1e] p-2 rounded" >
        <
        div className = "text-sm text-gray-400 mb-1" > Quick Access < /div> {
    quickAccess.map((path, index) => ( <
        button key = { index }
        onClick = {
            () => goToQuickAccess(path.path)
        }
        className = "flex items-center gap-2 text-sm hover:bg-[#2d2d2d] p-1 rounded text-left"
        title = { path.path } >
        <
        FontAwesomeIcon icon = { path.icon === 'home' ? faHome : faDesktop }
        /> { path.name } < /
        button >
    ))
} <
/div>

<
div className = "flex gap-4 relative" >
<
button onClick = { undoDir }
className = "cursor-pointer"
title = "Go Back" >
<
FontAwesomeIcon icon = { faArrowLeft }
/> < /
button > <
button onClick = { openFile }
className = "cursor-pointer"
title = "Open File" >
<
FontAwesomeIcon icon = { faSave }
/> < /
button > <
button onClick = { openOption }
className = "cursor-pointer"
title = "More Options" >
<
FontAwesomeIcon icon = { faFolderOpen }
/> < /
button > <
button onClick = { addFile }
className = "cursor-pointer"
title = "New File" >
<
FontAwesomeIcon icon = { faPlus }
/> < /
button > {
    optionOpened && ( <
        div className = "flex flex-col items-start justify-evenly bg-[#1e1e1e] p-2 rounded absolute top-8 right-0 z-10 min-w-[120px] shadow-lg" >
        <
        button onClick = { openFolder }
        className = "w-full text-left hover:bg-[#2d2d2d] p-1 rounded" >
        Open Folder <
        /button> <
        button onClick = { addFile }
        className = "w-full text-left hover:bg-[#2d2d2d] p-1 rounded" >
        New File <
        /button> <
        button onClick = { addFolder }
        className = "w-full text-left hover:bg-[#2d2d2d] p-1 rounded" >
        New Folder <
        /button> < /
        div >
    )
} <
/div>

<
div className = "text-sm bg-[#1e1e1e] p-2 rounded truncate"
title = { currentPath } > 📁{ currentPath || 'No folder opened' } <
/div>

<
div className = "flex-1 overflow-y-auto" > {
    files.map((file, index) => ( <
        div key = { index }
        className = { `flex items-center gap-2 p-1 cursor-pointer hover:bg-[#2d2d2d] rounded ${
                            selectedFile && selectedFile.path === file.path ? 'bg-[#2d2d2d]' : ''
                        }` }
        onClick = {
            () => (file.isDirectory ? handleDirectoryClick(file.path) : changeValue(file))
        } >
        <
        span > { file.isDirectory ? '📁' : '📄' } < /span> <
        span className = "truncate" > { file.name } < /span> < /
        div >
    ))
} <
/div>

<
NewFileDialog isOpen = { isNewFileDialogOpen }
onClose = {
    () => setIsNewFileDialogOpen(false)
}
currentPath = { currentPath }
onFileCreated = {
    () => {
        loadFiles(currentPath);
    }
}
/> < /
div >
);
});

FileExplorer.displayName = 'FileExplorer';
export default FileExplorer;