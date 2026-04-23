// src/pages/RegisterPage.jsx
// ─────────────────────────────────────────────────────────────
// Register page with:
//   - Full name, email, password, confirm password
//   - Role selection (Job Seeker or Recruiter)
//   - Form validation
//   - Error handling
//   - Loading state
//   - Redirect after register
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function RegisterPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  // ── Form state ────────────────────────────────────────────
  const [formData, setFormData] = useState({
    full_name:        '',
    email:            '',
    password:         '',
    password2:        '',
    role:             'job_seeker',
  });
  const [errors,       setErrors]       = useState({});
  const [apiError,     setApiError]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // ── Handlers ──────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required.';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Name must be at least 2 characters.';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])|(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain letters and numbers.';
    }

    // Confirm password
    if (!formData.password2) {
      newErrors.password2 = 'Please confirm your password.';
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match.';
    }

    // Role
    if (!formData.role) {
      newErrors.role = 'Please select a role.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      // Call register API directly
      const res = await api.post('/auth/register/', formData);

      // Store tokens returned from register
      localStorage.setItem('access_token',  res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);

      // Redirect based on role
      const role = res.data.user.role;
      if (role === 'recruiter') {
        navigate('/post-job');
      } else {
        navigate('/jobs');
      }

    } catch (err) {
      // Handle field-level errors from Django
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            fieldErrors[key] = data[key][0];
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          return;
        }
      }
      setApiError(
        data?.error ||
        data?.detail ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Password strength ─────────────────────────────────────

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8)              score++;
    if (/[A-Z]/.test(p))            score++;
    if (/[0-9]/.test(p))            score++;
    if (/[^A-Za-z0-9]/.test(p))     score++;

    if (score <= 1) return { label: 'Weak',   color: '#ef4444', width: '25%'  };
    if (score === 2) return { label: 'Fair',   color: '#f59e0b', width: '50%'  };
    if (score === 3) return { label: 'Good',   color: '#3b82f6', width: '75%'  };
    return               { label: 'Strong', color: '#10b981', width: '100%' };
  };

  const strength = getPasswordStrength();

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.logoIcon}>💼</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>
            Join thousands of job seekers and recruiters
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

          {/* ── Role Selection ── */}
          <div style={styles.field}>
            <label style={styles.label}>I am a</label>
            <div style={styles.roleGrid}>

              <div
                style={{
                  ...styles.roleCard,
                  borderColor:     formData.role === 'job_seeker' ? '#2563eb' : '#e5e7eb',
                  backgroundColor: formData.role === 'job_seeker' ? '#eff6ff' : '#ffffff',
                }}
                onClick={() => handleRoleSelect('job_seeker')}
              >
                <div style={styles.roleIcon}>👤</div>
                <div style={styles.roleLabel}>Job Seeker</div>
                <div style={styles.roleDesc}>
                  Looking for jobs and opportunities
                </div>
                <div style={styles.radioCircle}>
                  {formData.role === 'job_seeker' && (
                    <div style={styles.radioFill} />
                  )}
                </div>
              </div>

              <div
                style={{
                  ...styles.roleCard,
                  borderColor:     formData.role === 'recruiter' ? '#2563eb' : '#e5e7eb',
                  backgroundColor: formData.role === 'recruiter' ? '#eff6ff' : '#ffffff',
                }}
                onClick={() => handleRoleSelect('recruiter')}
              >
                <div style={styles.roleIcon}>🏢</div>
                <div style={styles.roleLabel}>Recruiter</div>
                <div style={styles.roleDesc}>
                  Hiring talent for my company
                </div>
                <div style={styles.radioCircle}>
                  {formData.role === 'recruiter' && (
                    <div style={styles.radioFill} />
                  )}
                </div>
              </div>

            </div>
            {errors.role && (
              <span style={styles.fieldError}>{errors.role}</span>
            )}
          </div>

          {/* ── Full Name ── */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="full_name">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Smith"
              style={{
                ...styles.input,
                borderColor: errors.full_name ? '#ef4444' : '#d1d5db',
              }}
              autoComplete="name"
              autoFocus
            />
            {errors.full_name && (
              <span style={styles.fieldError}>{errors.full_name}</span>
            )}
          </div>

          {/* ── Email ── */}
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
            />
            {errors.email && (
              <span style={styles.fieldError}>{errors.email}</span>
            )}
          </div>

          {/* ── Password ── */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                style={{
                  ...styles.input,
                  borderColor:  errors.password ? '#ef4444' : '#d1d5db',
                  paddingRight: '44px',
                }}
                autoComplete="new-password"
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

            {/* Password strength bar */}
            {strength && (
              <div style={styles.strengthWrapper}>
                <div style={styles.strengthBar}>
                  <div style={{
                    ...styles.strengthFill,
                    width:           strength.width,
                    backgroundColor: strength.color,
                  }} />
                </div>
                <span style={{ ...styles.strengthLabel, color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}

            {errors.password && (
              <span style={styles.fieldError}>{errors.password}</span>
            )}
          </div>

          {/* ── Confirm Password ── */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="password2">
              Confirm Password
            </label>
            <div style={styles.passwordWrapper}>
              <input
                id="password2"
                name="password2"
                type={showConfirm ? 'text' : 'password'}
                value={formData.password2}
                onChange={handleChange}
                placeholder="Repeat your password"
                style={{
                  ...styles.input,
                  borderColor:  errors.password2 ? '#ef4444' : '#d1d5db',
                  paddingRight: '44px',
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Match indicator */}
            {formData.password2 && (
              <span style={{
                fontSize: '12px',
                color: formData.password === formData.password2
                  ? '#10b981'
                  : '#ef4444',
              }}>
                {formData.password === formData.password2
                  ? '✅ Passwords match'
                  : '❌ Passwords do not match'}
              </span>
            )}

            {errors.password2 && (
              <span style={styles.fieldError}>{errors.password2}</span>
            )}
          </div>

          {/* ── Terms ── */}
          <p style={styles.terms}>
            By creating an account you agree to our{' '}
            <span style={styles.termsLink}>Terms of Service</span>
            {' '}and{' '}
            <span style={styles.termsLink}>Privacy Policy</span>.
          </p>

          {/* ── Submit Button ── */}
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
                <span style={styles.spinner} /> Creating account...
              </span>
            ) : (
              `Create ${formData.role === 'recruiter' ? 'Recruiter' : 'Job Seeker'} Account`
            )}
          </button>

        </form>

        {/* ── Login Link ── */}
        <p style={styles.loginText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.loginLink}>
            Log in here
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
    maxWidth:        '480px',
  },
  header: {
    textAlign:    'center',
    marginBottom: '28px',
  },
  logoIcon: {
    fontSize:     '36px',
    marginBottom: '12px',
    display:      'block',
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
    gap:           '18px',
  },
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  label: {
    fontSize:   '14px',
    fontWeight: '600',
    color:      '#374151',
  },
  input: {
    padding:         '11px 14px',
    borderRadius:    '8px',
    border:          '1px solid #d1d5db',
    fontSize:        '14px',
    color:           '#111827',
    outline:         'none',
    width:           '100%',
    transition:      'border-color 0.15s',
    backgroundColor: '#ffffff',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position:   'absolute',
    right:      '12px',
    top:        '50%',
    transform:  'translateY(-50%)',
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    fontSize:   '16px',
    padding:    '0',
    lineHeight: '1',
  },
  fieldError: {
    fontSize: '12px',
    color:    '#ef4444',
    marginTop:'2px',
  },
  strengthWrapper: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    marginTop:  '6px',
  },
  strengthBar: {
    flex:            1,
    height:          '4px',
    backgroundColor: '#e5e7eb',
    borderRadius:    '2px',
    overflow:        'hidden',
  },
  strengthFill: {
    height:       '100%',
    borderRadius: '2px',
    transition:   'width 0.3s, background-color 0.3s',
  },
  strengthLabel: {
    fontSize:   '12px',
    fontWeight: '600',
    minWidth:   '44px',
  },
  roleGrid: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '12px',
  },
  roleCard: {
    border:       '2px solid #e5e7eb',
    borderRadius: '10px',
    padding:      '16px',
    cursor:       'pointer',
    transition:   'all 0.15s',
    position:     'relative',
    textAlign:    'center',
  },
  roleIcon: {
    fontSize:     '28px',
    marginBottom: '6px',
  },
  roleLabel: {
    fontWeight:   '700',
    fontSize:     '14px',
    color:        '#111827',
    marginBottom: '4px',
  },
  roleDesc: {
    fontSize: '12px',
    color:    '#6b7280',
    lineHeight:'1.4',
  },
  radioCircle: {
    position:        'absolute',
    top:             '10px',
    right:           '10px',
    width:           '16px',
    height:          '16px',
    borderRadius:    '50%',
    border:          '2px solid #d1d5db',
    backgroundColor: '#ffffff',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
  },
  radioFill: {
    width:           '8px',
    height:          '8px',
    borderRadius:    '50%',
    backgroundColor: '#2563eb',
  },
  terms: {
    fontSize:  '12px',
    color:     '#9ca3af',
    textAlign: 'center',
    lineHeight:'1.5',
  },
  termsLink: {
    color:  '#2563eb',
    cursor: 'pointer',
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
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
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
  loginText: {
    textAlign:  'center',
    fontSize:   '14px',
    color:      '#6b7280',
    marginTop:  '24px',
  },
  loginLink: {
    color:          '#2563eb',
    fontWeight:     '600',
    textDecoration: 'none',
  },
};