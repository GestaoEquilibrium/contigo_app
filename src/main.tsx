import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { prepararInstalacao } from './lib/instalacao';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/atkinson-hyperlegible/400-italic.css';
import '@fontsource-variable/fraunces/index.css';
import './estilo.css';

// A casca do app fica em cache e se atualiza sozinha quando sai versão nova.
registerSW({ immediate: true });
prepararInstalacao();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
