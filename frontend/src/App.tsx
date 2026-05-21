import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Docker } from './pages/Docker';
import { Hosting } from './pages/Hosting';
import { Email } from './pages/Email';
import { DNS } from './pages/DNS';
import { BackupPage } from './pages/Backup';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/docker"
        element={
          <PrivateRoute>
            <Layout>
              <Docker />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/hosting"
        element={
          <PrivateRoute>
            <Layout>
              <Hosting />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/email"
        element={
          <PrivateRoute>
            <Layout>
              <Email />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dns"
        element={
          <PrivateRoute>
            <Layout>
              <DNS />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/backup"
        element={
          <PrivateRoute>
            <Layout>
              <BackupPage />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <Layout>
              <Users />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
