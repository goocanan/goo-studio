import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './utilities.css';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,   // Don't refetch when switching tabs/windows
      refetchOnReconnect: false,     // Don't refetch on network reconnect
      staleTime: 2 * 60 * 1000,     // Data stays fresh for 2 minutes
      retry: 1,                      // Only retry failed requests once
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
