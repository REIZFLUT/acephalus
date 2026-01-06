import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/css/preview.css',
                'resources/js/app.tsx',
                'resources/js/preview.js',
            ],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    build: {
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Group CodeMirror packages
                    if (id.includes('node_modules/@codemirror') || id.includes('node_modules/@lezer')) {
                        return 'vendor-codemirror';
                    }
                    // Group TipTap packages
                    if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror') || id.includes('node_modules/lowlight')) {
                        return 'vendor-tiptap';
                    }
                    // Group KaTeX and markdown
                    if (id.includes('node_modules/katex') || id.includes('node_modules/react-markdown') || id.includes('node_modules/rehype') || id.includes('node_modules/remark')) {
                        return 'vendor-markdown';
                    }
                }
            }
        }
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
