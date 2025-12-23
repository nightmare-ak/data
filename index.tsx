
import React from 'react';
import ReactDOM from 'react-dom/client';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { ErrorBoundary } from './components/ErrorBoundary';
import { Suspense, lazy } from 'react';

// Lazy load App to isolate crashes
const App = lazy(() => import('./App'));

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-400 font-black uppercase tracking-widest animate-pulse">
          Initializing Guardian Protocol...
        </div>
      }>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
