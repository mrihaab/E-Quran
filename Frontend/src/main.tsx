import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { store, persistor } from './store/store';
import { logout } from './store/authSlice';
import { registerSessionExpiredHandler } from './api';
import App from './App.tsx';
import './index.css';

// When the API client detects an expired/revoked session it asks the
// app to clear redux state too, so we don't show stale user info on
// the next render.
registerSessionExpiredHandler(() => {
  store.dispatch(logout());
  persistor.purge();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
