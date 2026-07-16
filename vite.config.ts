import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached forever once loaded
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Internationalisation
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Animation
          'vendor-framer': ['framer-motion'],
          // Heavy PDF / document tools (lazy-loaded features)
          'vendor-docs': ['pdfjs-dist', 'docx', 'mammoth'],
          // Payment
          'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          // Markdown rendering
          'vendor-markdown': ['react-markdown', 'remark-gfm', 'remark-breaks'],
        },
      },
    },
  },
})

