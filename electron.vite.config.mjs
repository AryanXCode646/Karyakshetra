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
        'monaco-editor': 'monaco-editor/min/vs',
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
