import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiBase = env.VITE_API_BASE_URL || 'http://localhost:5000';

    return {
        plugins: [react()],

        // Dev server — proxy /api to backend
        server: {
            port: 3000,
            open: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:5000',
                    changeOrigin: true
                }
            }
        },

        // Production build settings
        build: {
            outDir: 'dist',
            sourcemap: false,          // no sourcemaps in production (smaller)
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    // Split vendor libs into a separate chunk for better caching
                    manualChunks: {
                        vendor: ['react', 'react-dom'],
                        charts: ['chart.js', 'react-chartjs-2'],
                        toast: ['react-toastify']
                    }
                }
            }
        },

        // Inject VITE_API_BASE_URL so api.js can reference it at runtime
        define: {
            __API_BASE__: JSON.stringify(apiBase)
        }
    };
});
