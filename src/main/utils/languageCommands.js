const LANGUAGE_COMMANDS = {
    'js': {
        run: 'node',
        compile: null,
        extension: '.js'
    },
    'ts': {
        run: 'ts-node',
        compile: 'tsc',
        extension: '.ts'
    },
    'py': {
        run: 'python',
        compile: null,
        extension: '.py'
    },
    'java': {
        run: 'java',
        compile: 'javac',
        extension: '.java'
    },
    'cpp': {
        run: process.platform === 'win32' ? './' : './',
        compile: process.platform === 'win32' ? 'g++' : 'g++',
        extension: '.cpp',
        outputExt: process.platform === 'win32' ? '.exe' : ''
    },
    'c': {
        run: process.platform === 'win32' ? './' : './',
        compile: process.platform === 'win32' ? 'gcc' : 'gcc',
        extension: '.c',
        outputExt: process.platform === 'win32' ? '.exe' : ''
    },
    'jsx': {
        run: 'node',
        compile: null,
        extension: '.jsx'
    },
    'html': {
        run: process.platform === 'win32' ? 'start' : 'open',
        compile: null,
        extension: '.html'
    },
    'php': {
        run: 'php',
        compile: null,
        extension: '.php'
    },
    'rb': {
        run: 'ruby',
        compile: null,
        extension: '.rb'
    },
    'go': {
        run: 'go run',
        compile: 'go build',
        extension: '.go'
    }
};

function getFileLanguage(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const found = Object.entries(LANGUAGE_COMMANDS).find(([_, config]) =>
        config.extension.slice(1) === ext
    );
    return found ? found[0] : null;
}

function getCompileCommand(filePath) {
    const lang = getFileLanguage(filePath);
    if (!lang || !LANGUAGE_COMMANDS[lang].compile) return null;

    const command = LANGUAGE_COMMANDS[lang].compile;
    const outputExt = LANGUAGE_COMMANDS[lang].outputExt || '';

    // Special handling for different languages
    switch (lang) {
        case 'cpp':
        case 'c':
            const outputFile = filePath.replace(LANGUAGE_COMMANDS[lang].extension, outputExt);
            return `${command} "${filePath}" -o "${outputFile}"`;
        case 'java':
            return `${command} "${filePath}"`;
        default:
            return `${command} "${filePath}"`;
    }
}

function getRunCommand(filePath) {
    const lang = getFileLanguage(filePath);
    if (!lang) return null;

    const command = LANGUAGE_COMMANDS[lang].run;
    const outputExt = LANGUAGE_COMMANDS[lang].outputExt || '';

    // Special handling for different languages
    switch (lang) {
        case 'cpp':
        case 'c':
            const outputFile = filePath.replace(LANGUAGE_COMMANDS[lang].extension, outputExt);
            return `"${outputFile}"`;
        case 'java':
            const className = filePath.split(/[/\\]/).pop().replace('.java', '');
            return `${command} ${className}`;
        case 'html':
            return `${command} "${filePath}"`;
        default:
            return `${command} "${filePath}"`;
    }
}

export {
    LANGUAGE_COMMANDS,
    getFileLanguage,
    getCompileCommand,
    getRunCommand
};