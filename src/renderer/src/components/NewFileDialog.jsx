import React, { useState } from 'react';
import path from 'path';

const LANGUAGE_TEMPLATES = {
    'JavaScript': { ext: '.js', template: '// JavaScript file\n\n' },
    'TypeScript': { ext: '.ts', template: '// TypeScript file\n\n' },
    'Python': { ext: '.py', template: '# Python file\n\n' },
    'Java': { ext: '.java', template: 'public class ClassName {\n    public static void main(String[] args) {\n        \n    }\n}\n' },
    'C++': { ext: '.cpp', template: '#include <iostream>\n\nint main() {\n    \n    return 0;\n}\n' },
    'HTML': { ext: '.html', template: '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Page</title>\n</head>\n<body>\n\n</body>\n</html>\n' },
    'CSS': { ext: '.css', template: '/* CSS file */\n\n' },
    'React': { ext: '.jsx', template: 'import React from "react";\n\nconst Component = () => {\n    return (\n        <div>\n            \n        </div>\n    );\n};\n\nexport default Component;\n' },
    'Markdown': { ext: '.md', template: '# Title\n\n' },
    'JSON': { ext: '.json', template: '{\n    \n}\n' },
    'Text': { ext: '.txt', template: '' }
};

const NewFileDialog = ({ isOpen, onClose, currentPath, onFileCreated }) => {
    const [fileName, setFileName] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const validateFileName = (name) => {
        if (!name) return 'Please enter a file name';
        if (name.includes('/') || name.includes('\\')) return 'File name cannot contain slashes';
        if (name.includes(':')) return 'File name cannot contain colons';
        return '';
    };

    const handleCreate = async() => {
        try {
            setError('');

            // Validate file name
            const validationError = validateFileName(fileName);
            if (validationError) {
                setError(validationError);
                return;
            }

            // Validate current path
            if (!currentPath) {
                setError('Please select a folder first');
                return;
            }

            const template = LANGUAGE_TEMPLATES[selectedLanguage];
            const fileNameWithExt = fileName.endsWith(template.ext) ? fileName : fileName + template.ext;
            const filePath = path.join(currentPath, fileNameWithExt);

            // Check if file already exists
            const fileExists = await window.api.fileExists(filePath);
            if (fileExists) {
                const confirmOverwrite = window.confirm('File already exists. Do you want to overwrite it?');
                if (!confirmOverwrite) return;
            }

            // Create the file
            const result = await window.api.createFile({
                filePath,
                content: template.template.replace('ClassName', path.basename(fileName, template.ext))
            });

            if (result.error) {
                setError(`Error creating file: ${result.error}`);
            } else {
                if (onFileCreated) {
                    onFileCreated();
                }
                setFileName('');
                setError('');
                onClose();
            }
        } catch (error) {
            setError(`Error creating file: ${error.message}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return ( <
        div className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" >
        <
        div className = "bg-[#1e1e1e] rounded-lg p-6 w-96" >
        <
        h2 className = "text-xl font-bold mb-4 text-white" > Create New File < /h2> <
        div className = "mb-4" >
        <
        label className = "block text-sm font-medium text-gray-300 mb-2" >
        File Name <
        /label> <
        input type = "text"
        value = { fileName }
        onChange = {
            (e) => setFileName(e.target.value)
        }
        onKeyDown = { handleKeyDown }
        className = "w-full px-3 py-2 bg-[#2d2d2d] rounded border border-gray-600 text-white focus:outline-none focus:border-blue-500"
        placeholder = "Enter file name"
        autoFocus /
        >
        <
        /div> <
        div className = "mb-4" >
        <
        label className = "block text-sm font-medium text-gray-300 mb-2" >
        Language <
        /label> <
        select value = { selectedLanguage }
        onChange = {
            (e) => setSelectedLanguage(e.target.value)
        }
        className = "w-full px-3 py-2 bg-[#2d2d2d] rounded border border-gray-600 text-white focus:outline-none focus:border-blue-500" > {
            Object.keys(LANGUAGE_TEMPLATES).map((lang) => ( <
                option key = { lang }
                value = { lang } > { lang } < /option>
            ))
        } <
        /select> < /
        div > {
            error && ( <
                div className = "mb-4 text-red-500 text-sm" > { error } < /div>
            )
        } <
        div className = "flex justify-end gap-2" >
        <
        button onClick = { onClose }
        className = "px-4 py-2 text-gray-300 hover:text-white" >
        Cancel <
        /button> <
        button onClick = { handleCreate }
        className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" >
        Create <
        /button> < /
        div > <
        /div> < /
        div >
    );
};

export default NewFileDialog;