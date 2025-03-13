import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const EditorArea = ({ content, setContent, onContentChange }) => {
    const [editorContent, setEditorContent] = useState(content.content);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setEditorContent(content.content);
    }, [content]);

    const handleEditorChange = (value) => {
        if (value !== undefined) {
            setEditorContent(value);
            if (onContentChange) {
                onContentChange(value);
            }
        }
    };

    const handleEditorDidMount = (editor, monaco) => {
        try {
            setIsEditorReady(true);

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

            monaco.editor.setTheme('karyakshetraTheme');

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
        } catch (err) {
            console.error('Error initializing editor:', err);
            setError(err.message);
        }
    };

    const handleEditorWillMount = (monaco) => {
        try {
            monaco.editor.defineTheme('karyakshetraTheme', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#1e1e1e',
                    'editor.foreground': '#d4d4d4'
                }
            });
        } catch (err) {
            console.error('Error in editor willMount:', err);
            setError(err.message);
        }
    };

    const handleEditorValidation = (markers) => {
        markers.forEach((marker) => {
            console.log('Validation issue:', marker.message);
        });
    };

    const getLanguage = (filename) => {
        if (!filename) return 'plaintext';
        const parts = filename.split('.');
        const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascriptreact',
            'ts': 'typescript',
            'tsx': 'typescriptreact',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'cpp': 'cpp',
            'c': 'cpp',
            'java': 'java'
        };

        return languageMap[ext] || 'plaintext';
    };

    if (error) {
        return ( <
            div className = "h-full w-full flex items-center justify-center bg-gray-900 text-red-500 p-4" >
            <
            div >
            <
            h3 className = "font-bold mb-2" > Error initializing editor: < /h3> <
            p > { error } < /p> < /
            div > <
            /div>
        );
    }

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
        language = { getLanguage(content.name) }
        theme = "karyakshetraTheme"
        value = { editorContent }
        onChange = { handleEditorChange }
        beforeMount = { handleEditorWillMount }
        onMount = { handleEditorDidMount }
        onValidate = { handleEditorValidation }
        loading = { <
            div className = "flex items-center justify-center h-full" >
            <
            div className = "text-gray-400" > Loading editor... < /div> < /
            div >
        }
        options = {
            {
                readOnly: false,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                }
            }
        }
        /> < /
        div >
    );
};

export default EditorArea;