import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiRoutes = ['/pacientes', '/turnos', '/consultorios', '/obras-sociales', '/informes', '/evaluaciones', '/pagos', '/analytics', '/configuracion']

const apiProxy = {
  target: 'http://localhost:3000',
  changeOrigin: true,
  bypass(req) {
    // Solo proxear si el cliente espera JSON (fetch/XHR), no navegación del browser
    const accept = req.headers['accept'] || ''
    if (accept.includes('text/html')) return req.url
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(apiRoutes.map(r => [r, apiProxy]))
  }
})
