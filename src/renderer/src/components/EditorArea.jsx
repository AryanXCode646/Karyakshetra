import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const WEBSOCKET_URL = 'ws://localhost:8080';

const EditorArea = ({ content, setContent, onContentChange }) => {
    const [editorContent, setEditorContent] = useState(content.content);
    const [isEditorReady, setIsEditorReady] = useState(false);

    useEffect(() => {
        setEditorContent(content.content);
    }, [content]);

    const handleEditorChange = (value) => {
        setEditorContent(value);
        if (onContentChange) {
            onContentChange(value);
        }
    };

    const lang = (name) => {
        if (!name) return 'plaintext';
        let split = name.split('.');
        const ext = split[split.length - 1];

        switch (ext.toLowerCase()) {
            case 'js':
                return 'javascript';
            case 'jsx':
                return 'javascriptreact';
            case 'ts':
                return 'typescript';
            case 'tsx':
                return 'typescriptreact';
            case 'html':
                return 'html';
            case 'cpp':
            case 'c':
                return 'cpp';
            case 'py':
                return 'python';
            case 'css':
                return 'css';
            case 'json':
                return 'json';
            case 'md':
                return 'markdown';
            default:
                return 'plaintext';
        }
    };

    const handleEditorDidMount = (editor, monaco) => {
        setIsEditorReady(true);

        // Define a custom theme
        monaco.editor.defineTheme('karyakshetraTheme', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#d4d4d4',
                'editor.lineHighlightBackground': '#2a2a2a',
                'editor.selectionBackground': '#264f78',
                'editor.inactiveSelectionBackground': '#3a3d41'
            }
        });

        // Set the theme
        monaco.editor.setTheme('karyakshetraTheme');

        // Configure editor
        editor.updateOptions({
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            quickSuggestions: true,
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            tabSize: 4,
            lineNumbers: 'on',
            wordWrap: 'on',
            folding: true,
            links: true,
            contextmenu: true
        });
    };

    return ( <
        div className = "h-full w-full overflow-hidden" > {!isEditorReady && ( <
                div className = "flex items-center justify-center h-full" >
                <
                div className = "text-gray-400" > Loading editor... < /div> < /
                div >
            )
        } <
        Editor height = "100%"
        defaultLanguage = "plaintext"
        language = { lang(content.name) }
        theme = "karyakshetraTheme"
        value = { editorContent }
        onChange = { handleEditorChange }
        onMount = { handleEditorDidMount }
        options = {
            {
                readOnly: false,
                automaticLayout: true
            }
        }
        /> < /
        div >
    );
};

export default EditorArea;