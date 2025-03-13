import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faCodeBranch,
    faCircle,
    faBug,
    faSync,
    faExclamationTriangle,
    faInfo
} from '@fortawesome/free-solid-svg-icons';

const StatusBar = ({
    selectedFile,
    lineCount = 0,
    errorCount = 0,
    warningCount = 0,
    gitBranch = 'main',
    encoding = 'UTF-8',
    lineEnding = 'LF',
    connectedUsers = []
}) => {
    return ( <
        div className = "flex items-center justify-between px-4 py-1 bg-gray-800 text-white text-sm" >
        <
        div className = "flex items-center space-x-4" >
        <
        span > { selectedFile ? selectedFile.name : 'No file selected' } < /span> <
        span > Lines: { lineCount } < /span> <
        span className = "text-red-400" > Errors: { errorCount } < /span> <
        span className = "text-yellow-400" > Warnings: { warningCount } < /span> < /
        div > <
        div className = "flex items-center space-x-2" >
        <
        span > Connected Users: { connectedUsers.length } < /span> <
        div className = "flex -space-x-2" > {
            connectedUsers.map((userId, index) => ( <
                div key = { userId }
                className = "w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs border-2 border-gray-800"
                title = { `User ${userId.slice(0, 8)}` } > { index + 1 } <
                /div>
            ))
        } <
        /div> < /
        div > <
        /div>
    );
};

export default StatusBar;