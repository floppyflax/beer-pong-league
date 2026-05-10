import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initShared, storageFromLocalStorage } from '@elofight/shared'

const origin =
  typeof window !== 'undefined' && window.location
    ? window.location.origin
    : ''

initShared({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublicKey: import.meta.env.VITE_SUPABASE_PUBLIC_KEY ?? '',
  isDev: !!import.meta.env.DEV,
  stripe:
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
    import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID
      ? {
          publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
          premiumPriceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID,
        }
      : null,
  urls: {
    authCallback: `${origin}/auth/callback`,
    paymentSuccess: `${origin}/payment-success`,
    paymentCancel: `${origin}/payment-cancel`,
  },
  storage: storageFromLocalStorage(window.localStorage),
  detectSessionInUrl: true,
})

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Register service worker for PWA support
registerSW({ 
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, please refresh.')
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)



