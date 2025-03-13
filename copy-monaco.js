const fs = require('fs-extra');
const path = require('path');

const monacoPath = path.join(__dirname, 'node_modules', 'monaco-editor', 'min', 'vs');
const publicPath = path.join(__dirname, 'public', 'vs');

// Ensure the public directory exists
fs.ensureDirSync(path.join(__dirname, 'public'));

// Copy Monaco editor files to public directory
fs.copySync(monacoPath, publicPath, { overwrite: true });

console.log('Monaco editor files copied successfully!');