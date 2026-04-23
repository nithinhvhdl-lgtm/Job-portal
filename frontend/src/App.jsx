// src/App.jsx
// ─────────────────────────────────────────────────────────────
// Root component — sets up:
//   - Auth context (wraps everything)
//   - React Router (all routes)
//   - Navbar (shows on every page)
//   - Protected routes (role-based access)
// ─────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';

// Pages
import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import JobsPage        from './pages/JobsPage';
import JobDetailPage   from './pages/JobDetailPage';
import DashboardPage   from './pages/DashboardPage';
import PostJobPage     from './pages/PostJobPage';
import ProfilePage     from './pages/ProfilePage';
import AdminPage       from './pages/AdminPage';


// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTE COMPONENT
// Wraps any route that requires login
// Optional roles array — if provided, checks user role too
//
// Usage:
//   <ProtectedRoute>               → just needs login
//   <ProtectedRoute roles={['recruiter']}> → needs recruiter role
// ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();

  // Still checking if user is logged in — show nothing yet
  if (loading) {
    return (
      <div style={loadingStyles.wrapper}>
        <div style={loadingStyles.spinner} />
        <p style={loadingStyles.text}>Loading...</p>
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role — redirect to home
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // All checks passed — render the page
  return children;
}


// ─────────────────────────────────────────────────────────────
// GUEST ROUTE COMPONENT
// Redirects logged-in users away from login/register pages
// If already logged in, no point showing login page again
// ─────────────────────────────────────────────────────────────

function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={loadingStyles.wrapper}>
        <div style={loadingStyles.spinner} />
        <p style={loadingStyles.text}>Loading...</p>
      </div>
    );
  }

  // Already logged in — redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


// ─────────────────────────────────────────────────────────────
// MAIN APP ROUTES
// ─────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <>
      {/* Navbar shows on every single page */}
      <Navbar />

      {/* Page content below navbar */}
      <main>
        <Routes>

          {/* ── Public Routes — anyone can visit ── */}
          <Route
            path="/"
            element={<HomePage />}
          />
          <Route
            path="/jobs"
            element={<JobsPage />}
          />
          <Route
            path="/jobs/:id"
            element={<JobDetailPage />}
          />

          {/* ── Guest Routes — redirect if already logged in ── */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />

          {/* ── Protected Routes — must be logged in ── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ── Recruiter Only Routes ── */}
          <Route
            path="/post-job"
            element={
              <ProtectedRoute roles={['recruiter']}>
                <PostJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-job/edit/:id"
            element={
              <ProtectedRoute roles={['recruiter']}>
                <PostJobPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin Only Routes ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* ── 404 — catch all unknown routes ── */}
          <Route
            path="*"
            element={<NotFoundPage />}
          />

        </Routes>
      </main>
    </>
  );
}


// ─────────────────────────────────────────────────────────────
// 404 PAGE
// Simple inline component — no need for a separate file
// ─────────────────────────────────────────────────────────────

function NotFoundPage() {
  return (
    <div style={notFoundStyles.wrapper}>
      <div style={notFoundStyles.code}>404</div>
      <h1 style={notFoundStyles.title}>Page Not Found</h1>
      <p style={notFoundStyles.text}>
        The page you are looking for does not exist.
      </p>
      <a href="/" style={notFoundStyles.btn}>
        Go Back Home
      </a>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ROOT APP COMPONENT
// AuthProvider must wrap everything so all components
// can access the logged-in user via useAuth()
// ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}


// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const loadingStyles = {
  wrapper: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      '100vh',
    backgroundColor:'#f9fafb',
    gap:            '16px',
  },
  spinner: {
    width:           '40px',
    height:          '40px',
    border:          '4px solid #e5e7eb',
    borderTop:       '4px solid #2563eb',
    borderRadius:    '50%',
    animation:       'spin 0.8s linear infinite',
  },
  text: {
    color:     '#6b7280',
    fontSize:  '14px',
    fontWeight:'500',
  },
};

const notFoundStyles = {
  wrapper: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      'calc(100vh - 64px)',
    backgroundColor:'#f9fafb',
    textAlign:      'center',
    padding:        '40px 20px',
  },
  code: {
    fontSize:   '96px',
    fontWeight: '800',
    color:      '#e5e7eb',
    lineHeight: 1,
    marginBottom:'16px',
  },
  title: {
    fontSize:    '28px',
    fontWeight:  '700',
    color:       '#111827',
    marginBottom:'8px',
  },
  text: {
    fontSize:    '16px',
    color:       '#6b7280',
    marginBottom:'32px',
  },
  btn: {
    padding:        '12px 28px',
    backgroundColor:'#2563eb',
    color:          '#ffffff',
    textDecoration: 'none',
    borderRadius:   '8px',
    fontWeight:     '600',
    fontSize:       '15px',
    transition:     'background 0.2s',
  },
};