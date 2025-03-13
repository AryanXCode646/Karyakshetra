import { contextBridge, ipcRenderer } from 'electron'
import path from 'path'
import fs from 'fs'

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
    path: {
        join: (...args) => path.join(...args),
        basename: (filePath, ext) => path.basename(filePath, ext)
    },
    fileExists: (filePath) => {
        try {
            return fs.existsSync(filePath);
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    },
    onTerminalOutput: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('terminal-output', listener);
        return () => ipcRenderer.removeListener('terminal-output', listener);
    },
    onTerminalError: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('terminal-error', listener);
        return () => ipcRenderer.removeListener('terminal-error', listener);
    },
    onTerminalExit: (callback) => {
        const listener = (event, code) => callback(code);
        ipcRenderer.on('terminal-exit', listener);
        return () => ipcRenderer.removeListener('terminal-exit', listener);
    }
}

const electronAPI = {
    ipcRenderer: {
        send: (channel, data) => {
            const validChannels = ['terminal-create', 'terminal-input'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        on: (channel, func) => {
            const validChannels = ['terminal-output', 'terminal-error'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, func);
            }
        },
        removeListener: (channel, func) => {
            const validChannels = ['terminal-output', 'terminal-error'];
            if (validChannels.includes(channel)) {
                ipcRenderer.removeListener(channel, func);
            }
        }
    }
};

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