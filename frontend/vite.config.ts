import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), viteStaticCopy({
    targets: [
      {
        src: '../node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
        dest: ''
      },
      {
        src: '../node_modules/@ricky0123/vad-web/dist/*.onnx',
        dest: ''
      },
      {
        src: '../node_modules/onnxruntime-web/dist/*.wasm',
        dest: ''
      }
    ]
  })],
  server: {
    open: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001'
      }
    }
  }
})
