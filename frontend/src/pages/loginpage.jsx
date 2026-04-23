// src/pages/LoginPage.jsx
// ─────────────────────────────────────────────────────────────
// Login page with:
//   - Email + password form
//   - Form validation
//   - Error handling
//   - Loading state
//   - Redirect after login based on role
//   - Link to register page
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  // ── Form state ────────────────────────────────────────────
  const [formData, setFormData] = useState({
    email:    '',
    password: '',
  });
  const [errors,      setErrors]      = useState({});
  const [apiError,    setApiError]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [showPassword,setShowPassword]= useState(false);

  // ── Handlers ──────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      // login() is from AuthContext
      // It calls POST /api/auth/login/ and stores tokens
      const user = await login(formData.email, formData.password);

      // Redirect based on role after successful login
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      // Show error from API response
      const msg = err.response?.data?.non_field_errors?.[0]
               || err.response?.data?.detail
               || err.response?.data?.error
               || 'Login failed. Please check your credentials.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.logoIcon}>💼</div>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>
            Log in to your JobPortal account
          </p>
        </div>

        {/* ── API Error Banner ── */}
        {apiError && (
          <div style={styles.errorBanner}>
            <span>⚠️</span> {apiError}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={{
                ...styles.input,
                borderColor: errors.email ? '#ef4444' : '#d1d5db',
              }}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <span style={styles.fieldError}>{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div style={styles.field}>
            <div style={styles.labelRow}>
              <label style={styles.label} htmlFor="password">
                Password
              </label>
              <span
                style={styles.forgotLink}
                onClick={() => alert('Forgot password feature coming soon!')}
              >
                Forgot password?
              </span>
            </div>
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                style={{
                  ...styles.input,
                  borderColor: errors.password ? '#ef4444' : '#d1d5db',
                  paddingRight: '44px',
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <span style={styles.fieldError}>{errors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor:  loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.btnInner}>
                <span style={styles.spinner} /> Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>

        </form>

        {/* ── Divider ── */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* ── Demo Accounts ── */}
        <div style={styles.demoSection}>
          <p style={styles.demoTitle}>Try a demo account:</p>
          <div style={styles.demoButtons}>
            <button
              style={styles.demoBtn}
              onClick={() => {
                setFormData({
                  email:    'seeker@demo.com',
                  password: 'demo1234',
                });
                setErrors({});
                setApiError('');
              }}
            >
              👤 Job Seeker
            </button>
            <button
              style={styles.demoBtn}
              onClick={() => {
                setFormData({
                  email:    'recruiter@demo.com',
                  password: 'demo1234',
                });
                setErrors({});
                setApiError('');
              }}
            >
              🏢 Recruiter
            </button>
            <button
              style={styles.demoBtn}
              onClick={() => {
                setFormData({
                  email:    'admin@demo.com',
                  password: 'demo1234',
                });
                setErrors({});
                setApiError('');
              }}
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {/* ── Register Link ── */}
        <p style={styles.registerText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.registerLink}>
            Sign up for free
          </Link>
        </p>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight:       'calc(100vh - 64px)',
    backgroundColor: '#f9fafb',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '40px 20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius:    '16px',
    border:          '1px solid #e5e7eb',
    boxShadow:       '0 4px 24px rgba(0,0,0,0.07)',
    padding:         '40px',
    width:           '100%',
    maxWidth:        '440px',
  },
  header: {
    textAlign:    'center',
    marginBottom: '28px',
  },
  logoIcon: {
    fontSize:        '36px',
    marginBottom:    '12px',
    display:         'block',
  },
  title: {
    fontSize:    '26px',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'6px',
  },
  subtitle: {
    fontSize: '14px',
    color:    '#6b7280',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    padding:         '12px 16px',
    color:           '#dc2626',
    fontSize:        '14px',
    marginBottom:    '20px',
    display:         'flex',
    alignItems:      'center',
    gap:             '8px',
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '20px',
  },
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  labelRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  label: {
    fontSize:   '14px',
    fontWeight: '600',
    color:      '#374151',
  },
  forgotLink: {
    fontSize:   '13px',
    color:      '#2563eb',
    cursor:     'pointer',
    fontWeight: '500',
  },
  input: {
    padding:      '11px 14px',
    borderRadius: '8px',
    border:       '1px solid #d1d5db',
    fontSize:     '14px',
    color:        '#111827',
    outline:      'none',
    width:        '100%',
    transition:   'border-color 0.15s',
    backgroundColor: '#ffffff',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position:        'absolute',
    right:           '12px',
    top:             '50%',
    transform:       'translateY(-50%)',
    background:      'none',
    border:          'none',
    cursor:          'pointer',
    fontSize:        '16px',
    padding:         '0',
    lineHeight:      '1',
  },
  fieldError: {
    fontSize: '12px',
    color:    '#ef4444',
    marginTop:'2px',
  },
  submitBtn: {
    padding:         '13px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '15px',
    fontWeight:      '700',
    cursor:          'pointer',
    transition:      'background 0.2s',
    marginTop:       '4px',
  },
  btnInner: {
    display:    'flex',
    alignItems: 'center',
    justifyContent:'center',
    gap:        '8px',
  },
  spinner: {
    display:      'inline-block',
    width:        '16px',
    height:       '16px',
    border:       '2px solid rgba(255,255,255,0.4)',
    borderTop:    '2px solid #ffffff',
    borderRadius: '50%',
    animation:    'spin 0.7s linear infinite',
  },
  divider: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    margin:     '24px 0',
  },
  dividerLine: {
    flex:            1,
    height:          '1px',
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    color:    '#9ca3af',
    fontSize: '13px',
  },
  demoSection: {
    marginBottom: '24px',
  },
  demoTitle: {
    fontSize:    '13px',
    color:       '#6b7280',
    textAlign:   'center',
    marginBottom:'10px',
  },
  demoButtons: {
    display:   'flex',
    gap:       '8px',
    justifyContent: 'center',
  },
  demoBtn: {
    flex:            1,
    padding:         '8px 4px',
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '12px',
    fontWeight:      '500',
    color:           '#374151',
    cursor:          'pointer',
    transition:      'all 0.15s',
  },
  registerText: {
    textAlign: 'center',
    fontSize:  '14px',
    color:     '#6b7280',
  },
  registerLink: {
    color:      '#2563eb',
    fontWeight: '600',
    textDecoration: 'none',
  },
};