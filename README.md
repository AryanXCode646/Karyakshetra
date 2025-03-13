# Karyakshetra

A modern, collaborative code editor built with Electron, React, and WebSocket technology. This application provides a VS Code-like interface with real-time collaboration capabilities.

## Features

- Modern VS Code-like interface
- Real-time collaboration with multiple users
- Integrated terminal
- File operations (create, edit, delete)
- Server connection management
- Keyboard shortcuts support

## Tech Stack

- Electron
- React
- WebSocket (for real-time collaboration)
- Node.js

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd karyakshetra
```

2. Install dependencies:
```bash
npm install
```

3. Start the WebSocket server:
```bash
cd server
node websocket.js
```

4. In a new terminal, start the application:
```bash
npm start
```

## Development

- The main application code is in the `src` directory
- WebSocket server code is in the `server` directory
- Electron configuration is in `electron` directory

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
