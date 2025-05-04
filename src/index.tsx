import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NotificationProvider } from '@providers/NotificationProvider';
import { NotificationServiceComponent } from './services/NotificationServiceComponent';
import './styles/index.scss';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter basename={process.env.PUBLIC_URL || '/'}>
      <NotificationProvider>
        <NotificationServiceComponent />
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
