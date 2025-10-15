/**
 * App Component
 * Root application component
 */

import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
