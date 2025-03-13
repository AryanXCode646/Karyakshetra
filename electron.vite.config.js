import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()]
    },
    preload: {
        plugins: [externalizeDepsPlugin()]
    },
    renderer: {
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src')
            }
        },
        plugins: [react()],
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/renderer/index.html')
                }
            }
        },
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                '@monaco-editor/react',
                'monaco-editor'
            ],
            exclude: ['electron']
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }
    }
})