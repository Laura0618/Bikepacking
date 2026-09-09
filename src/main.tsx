import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AppDataProvider } from './store/AppDataProvider';
import './index.css';

registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('No se encontro el elemento #root.');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
