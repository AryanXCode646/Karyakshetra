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
                },
                output: {
                    format: 'es',
                    chunkFileNames: 'assets/[name].js',
                    assetFileNames: 'assets/[name].[ext]'
                }
            }
        },
        optimizeDeps: {
            include: [
                '@monaco-editor/react',
                'monaco-editor/esm/vs/editor/editor.worker',
                'monaco-editor/esm/vs/language/json/json.worker',
                'monaco-editor/esm/vs/language/css/css.worker',
                'monaco-editor/esm/vs/language/html/html.worker',
                'monaco-editor/esm/vs/language/typescript/ts.worker'
            ]
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }
    }
})