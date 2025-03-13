import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import os from 'os';
import { getCompileCommand, getRunCommand } from './utils/languageCommands';

// Get user's home directory and project directory as root for file operations
const ROOT_DIR = app.getPath('home');
const PROJECT_DIR = process.cwd();
let currentTerminal = null;
let mainWindow = null;

// Add handler for getting current directory
ipcMain.handle('get-current-directory', () => {
    return PROJECT_DIR;
});

// Add handler for getting quick access paths
ipcMain.handle('getQuickAccessPaths', () => {
    const paths = [{
            name: 'Home',
            path: app.getPath('home'),
            icon: 'home'
        },
        {
            name: 'Desktop',
            path: app.getPath('desktop'),
            icon: 'desktop'
        },
        {
            name: 'Documents',
            path: app.getPath('documents'),
            icon: 'desktop'
        },
        {
            name: 'Downloads',
            path: app.getPath('downloads'),
            icon: 'desktop'
        }
    ];
    return paths;
});

// Add handler for showing system dialogs
ipcMain.handle('showDialog', async(event, options) => {
    const dialogOptions = {
        ...options,
        properties: options.properties || ['openFile']
    };

    // For directory creation
    if (options.properties.includes('createDirectory')) {
        try {
            const result = await dialog.showSaveDialog({
                ...dialogOptions,
                properties: ['createDirectory']
            });
            if (!result.canceled && result.filePath) {
                await fs.promises.mkdir(result.filePath, { recursive: true });
            }
            return result;
        } catch (error) {
            console.error('Error creating directory:', error);
            return { canceled: true, error: error.message };
        }
    }

    return dialog.showOpenDialog(dialogOptions);
});

// Add handler for creating new files
ipcMain.handle('create-file', async(event, { filePath, content = '' }) => {
    try {
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(ROOT_DIR) && !normalizedPath.startsWith(PROJECT_DIR)) {
            throw new Error('Access denied: Cannot create files outside user directory or project directory');
        }

        // Create parent directories if they don't exist
        await fs.promises.mkdir(path.dirname(normalizedPath), { recursive: true });

        // Create the file with initial content
        await fs.promises.writeFile(normalizedPath, content, 'utf8');
        return { success: true };
    } catch (error) {
        console.error('Error creating file:', error);
        return { error: error.message };
    }
});

// Add handler for executing code files
ipcMain.handle('execute-code', async(event, filePath) => {
    try {
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(ROOT_DIR) && !normalizedPath.startsWith(PROJECT_DIR)) {
            throw new Error('Access denied: Cannot execute files outside user directory or project directory');
        }

        const compileCommand = getCompileCommand(normalizedPath);
        const runCommand = getRunCommand(normalizedPath);

        if (!runCommand) {
            throw new Error('Unsupported file type for execution');
        }

        // If compilation is needed, compile first
        if (compileCommand) {
            await new Promise((resolve, reject) => {
                const compile = spawn(compileCommand, [], {
                    shell: true,
                    cwd: path.dirname(normalizedPath)
                });

                compile.stderr.on('data', (data) => {
                    event.sender.send('terminal-error', data.toString());
                });

                compile.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Compilation failed with code ${code}`));
                    }
                });
            });
        }

        // Run the code
        const run = spawn(runCommand, [], {
            shell: true,
            cwd: path.dirname(normalizedPath)
        });

        run.stdout.on('data', (data) => {
            event.sender.send('terminal-output', data.toString());
        });

        run.stderr.on('data', (data) => {
            event.sender.send('terminal-error', data.toString());
        });

        run.on('close', (code) => {
            event.sender.send('terminal-exit', code);
        });

        return { success: true };
    } catch (error) {
        console.error('Error executing code:', error);
        return { error: error.message };
    }
});

function createTerminalProcess() {
    if (currentTerminal) {
        try {
            currentTerminal.kill();
        } catch (e) {
            console.error('Error killing existing terminal:', e);
        }
        currentTerminal = null;
    }

    try {
        // Set PowerShell encoding to UTF8 and change directory
        const initCommand = `
            [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
            [Console]::InputEncoding = [System.Text.Encoding]::UTF8;
            Set-Location '${PROJECT_DIR.replace(/'/g, "''")}';
            Write-Host "[PowerShell]>";
        `;

        currentTerminal = spawn('powershell.exe', [
            '-NoLogo',
            '-NoExit',
            '-Command',
            initCommand
        ], {
            env: process.env,
            cwd: PROJECT_DIR,
            shell: false,
            windowsHide: false,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        currentTerminal.stdout.on('data', (data) => {
            console.log('Terminal output:', data.toString()); // Debug log
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('terminal-output', data.toString());
            }
        });

        currentTerminal.stderr.on('data', (data) => {
            console.error('Terminal error:', data.toString()); // Debug log
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('terminal-output', data.toString());
            }
        });

        currentTerminal.on('error', (error) => {
            console.error('Terminal process error:', error);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('terminal-output', `Error: ${error.message}\r\n`);
            }
        });

        currentTerminal.on('exit', (code) => {
            console.log('Terminal process exited with code:', code);
            currentTerminal = null;
            if (mainWindow && !mainWindow.isDestroyed()) {
                setTimeout(() => {
                    createTerminalProcess();
                }, 100);
            }
        });

        return currentTerminal;
    } catch (error) {
        console.error('Failed to create terminal process:', error);
        return null;
    }
}

// Handle terminal creation
ipcMain.on('terminal-create', (event) => {
    try {
        if (!currentTerminal) {
            currentTerminal = createTerminalProcess();
        }
        if (!currentTerminal) {
            event.sender.send('terminal-error', 'Failed to create terminal process\r\n');
        }
    } catch (error) {
        console.error('Error creating terminal:', error);
        event.sender.send('terminal-error', `Error creating terminal: ${error.message}\r\n`);
    }
});

// Handle terminal input
ipcMain.on('terminal-input', (event, data) => {
    if (!currentTerminal) {
        currentTerminal = createTerminalProcess();
        if (!currentTerminal) {
            event.reply('terminal-output', 'Error: Failed to create terminal\r\n');
            return;
        }
    }

    try {
        if (data.trim() === '\x03') { // Ctrl+C
            currentTerminal.kill('SIGINT');
            return;
        }

        // Ensure proper line ending for PowerShell
        const command = data.trim() + '\r\n';
        console.log('Sending command to terminal:', command); // Debug log

        if (!currentTerminal.stdin.write(command)) {
            console.error('Failed to write to terminal stdin');
            event.reply('terminal-output', 'Error: Failed to send command to terminal\r\n');
        }
    } catch (error) {
        console.error('Error writing to terminal:', error);
        event.reply('terminal-output', `Error: ${error.message}\r\n`);
    }
});

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            nodeIntegration: true,
            contextIsolation: true
        }
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    return mainWindow;
}

// Safe file operations within user's directory
ipcMain.handle('load-files', async(event, dirPath) => {
    try {
        const normalizedPath = path.normalize(dirPath);
        if (!normalizedPath.startsWith(ROOT_DIR) && !normalizedPath.startsWith(PROJECT_DIR)) {
            throw new Error('Access denied: Cannot access files outside user directory or project directory');
        }

        const files = await fs.promises.readdir(normalizedPath);
        const fileList = await Promise.all(files.map(async(fileName) => {
            const filePath = path.join(normalizedPath, fileName);
            try {
                const stats = await fs.promises.lstat(filePath);
                return {
                    name: fileName,
                    path: filePath,
                    isDirectory: stats.isDirectory(),
                    size: stats.size,
                    modifiedTime: stats.mtime
                };
            } catch (error) {
                console.error(`Skipping file: ${fileName} due to error: ${error.message}`);
                return null;
            }
        }));

        return fileList.filter(Boolean);
    } catch (error) {
        console.error('Error loading files:', error);
        return { error: error.message };
    }
});

ipcMain.handle('get-content', async(event, filePath) => {
    try {
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(ROOT_DIR) && !normalizedPath.startsWith(PROJECT_DIR)) {
            throw new Error('Access denied: Cannot access files outside user directory or project directory');
        }

        const data = await fs.promises.readFile(normalizedPath, 'utf8');
        return { content: data };
    } catch (error) {
        console.error('Error reading file:', error);
        return { error: error.message };
    }
});

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron');

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    createWindow();

    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Cleanup terminal process on app quit
app.on('before-quit', () => {
    if (currentTerminal) {
        currentTerminal.kill();
        currentTerminal = null;
    }
});