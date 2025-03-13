import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer

//todo 
// add apis for save open folder and add file and folder

const api = {
    loadFiles: (dirPath) => ipcRenderer.invoke('load-files', dirPath),
    getContent: (filePath) => ipcRenderer.invoke('get-content', filePath),
    getCurrentDirectory: () => ipcRenderer.invoke('get-current-directory'),
    createFile: (options) => ipcRenderer.invoke('create-file', options),
    executeCode: (filePath) => ipcRenderer.invoke('execute-code', filePath),
    createTerminal: () => ipcRenderer.send('terminal-create'),
    sendTerminalInput: (input) => ipcRenderer.send('terminal-input', input),
    showDialog: (options) => ipcRenderer.invoke('showDialog', options),
    getQuickAccessPaths: () => ipcRenderer.invoke('getQuickAccessPaths'),
    onTerminalOutput: (callback) => {
        if (callback) {
            // Remove any existing listeners
            ipcRenderer.removeAllListeners('terminal-output');
            // Add new listener
            ipcRenderer.on('terminal-output', (_, data) => callback(data));
            return () => ipcRenderer.removeAllListeners('terminal-output');
        }
    },
    onTerminalError: (callback) => {
        if (callback) {
            // Remove any existing listeners
            ipcRenderer.removeAllListeners('terminal-error');
            // Add new listener
            ipcRenderer.on('terminal-error', (_, data) => callback(data));
            return () => ipcRenderer.removeAllListeners('terminal-error');
        }
    },
    onTerminalExit: (callback) => {
        if (callback) {
            // Remove any existing listeners
            ipcRenderer.removeAllListeners('terminal-exit');
            // Add new listener
            ipcRenderer.on('terminal-exit', (_, code) => callback(code));
            return () => ipcRenderer.removeAllListeners('terminal-exit');
        }
    },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    window.electron = electronAPI
    window.api = api
}