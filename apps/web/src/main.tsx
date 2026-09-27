import CssBaseline from '@mui/material/CssBaseline';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createFavoritesClient } from './api/favorites';
import { App } from './app';
import { loadClientId } from './lib/client-id';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element #root not found in index.html');
}

const favoritesClient = createFavoritesClient(loadClientId(window.localStorage));

createRoot(rootElement).render(
  <StrictMode>
    <CssBaseline />
    <App favoritesClient={favoritesClient} />
  </StrictMode>,
);
