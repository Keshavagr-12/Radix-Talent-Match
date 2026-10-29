import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AppRouter } from './app/router';

const ThemedToaster: React.FC = () => {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme}
      richColors
      closeButton
    />
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <AppRouter />
            <ThemedToaster />
          </WorkspaceProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

