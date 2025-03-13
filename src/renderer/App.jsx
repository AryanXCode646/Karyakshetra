import React, { useState, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import './App.css';

// Configure Monaco Editor loader
loader.config({
    paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
    }
});

function App() {
    const [theme, setTheme] = useState('dark');
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [editorContent, setEditorContent] = useState('// Start coding here...');

    useEffect(() => {
        // Ensure the editor container is properly sized
        const resizeEditor = () => {
            const editorContainer = document.querySelector('.editor-container');
            if (editorContainer) {
                editorContainer.style.height = `${window.innerHeight}px`;
            }
        };

        window.addEventListener('resize', resizeEditor);
        resizeEditor();

        return () => window.removeEventListener('resize', resizeEditor);
    }, []);

    const handleEditorDidMount = () => {
        setIsEditorReady(true);
    };

    const handleEditorChange = (value) => {
        setEditorContent(value);
    };

    return ( <
            div className = { `app-container theme-${theme}` } >
            <
            div className = "editor-container" > {!isEditorReady && < div className = "editor-loading" > Loading editor... < /div>} <
                Editor
                height = "100%"
                defaultLanguage = "javascript"
                theme = { theme === 'dark' ? 'vs-dark' : 'vs-light' }
                value = { editorContent }
                onChange = { handleEditorChange }
                onMount = { handleEditorDidMount }
                loading = { < div className = "editor-loading" > Loading editor... < /div>}
                    options = {
                        {
                            fontSize: 14,
                            minimap: { enabled: true },
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            formatOnPaste: true,
                            formatOnType: true,
                            automaticLayout: true
                        }
                    }
                    /> < /
                    div > <
                    /div>
                );
            }

            export default App;