// src/components/Navbar.jsx
// ─────────────────────────────────────────────────────────────
// Responsive navbar with:
//   - Logo
//   - Navigation links (role-based)
//   - Login / Register buttons (when logged out)
//   - User menu dropdown (when logged in)
//   - Mobile hamburger menu
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ── Helpers ──────────────────────────────────────────────

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const closeAll = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  // ── Role-based nav links ──────────────────────────────────

  const getNavLinks = () => {
    // Always visible
    const common = [
      { label: 'Browse Jobs', path: '/jobs' },
    ];

    if (!user) return common;

    if (user.role === 'job_seeker') {
      return [
        ...common,
        { label: 'Dashboard',      path: '/dashboard' },
        { label: 'My Applications',path: '/dashboard?tab=applications' },
        { label: 'Saved Jobs',     path: '/dashboard?tab=saved' },
      ];
    }

    if (user.role === 'recruiter') {
      return [
        ...common,
        { label: 'Dashboard',  path: '/dashboard' },
        { label: 'My Jobs',    path: '/dashboard?tab=jobs' },
        { label: 'Post a Job', path: '/post-job' },
      ];
    }

    if (user.role === 'admin') {
      return [
        ...common,
        { label: 'Admin Panel', path: '/admin' },
        { label: 'All Users',   path: '/admin?tab=users' },
        { label: 'All Jobs',    path: '/admin?tab=jobs' },
      ];
    }

    return common;
  };

  // ── Role badge color ──────────────────────────────────────

  const getRoleBadge = () => {
    const styles = {
      job_seeker: { bg: '#dcfce7', color: '#16a34a', label: 'Job Seeker' },
      recruiter:  { bg: '#dbeafe', color: '#1d4ed8', label: 'Recruiter'  },
      admin:      { bg: '#fde8d8', color: '#c2410c', label: 'Admin'      },
    };
    return styles[user?.role] || null;
  };

  const navLinks  = getNavLinks();
  const roleBadge = getRoleBadge();

  // ── Styles ────────────────────────────────────────────────

  const styles = {
    nav: {
      position:        'sticky',
      top:             0,
      zIndex:          1000,
      backgroundColor: '#ffffff',
      borderBottom:    '1px solid #e5e7eb',
      boxShadow:       '0 1px 3px rgba(0,0,0,0.08)',
    },
    inner: {
      maxWidth:      '1200px',
      margin:        '0 auto',
      padding:       '0 24px',
      display:       'flex',
      alignItems:    'center',
      justifyContent:'space-between',
      height:        '64px',
    },
    logo: {
      display:        'flex',
      alignItems:     'center',
      gap:            '8px',
      textDecoration: 'none',
      fontWeight:     '800',
      fontSize:       '1.3rem',
      color:          '#111827',
    },
    logoIcon: {
      width:           '32px',
      height:          '32px',
      backgroundColor: '#2563eb',
      borderRadius:    '8px',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      color:           '#fff',
      fontSize:        '16px',
    },
    logoSpan: {
      color: '#2563eb',
    },
    desktopLinks: {
      display:    'flex',
      alignItems: 'center',
      gap:        '4px',
    },
    navLink: (active) => ({
      padding:        '6px 12px',
      borderRadius:   '6px',
      textDecoration: 'none',
      fontSize:       '14px',
      fontWeight:     active ? '600' : '500',
      color:          active ? '#2563eb' : '#4b5563',
      backgroundColor:active ? '#eff6ff' : 'transparent',
      transition:     'all 0.15s',
    }),
    authButtons: {
      display:    'flex',
      alignItems: 'center',
      gap:        '8px',
    },
    loginBtn: {
      padding:        '7px 16px',
      borderRadius:   '6px',
      textDecoration: 'none',
      fontSize:       '14px',
      fontWeight:     '500',
      color:          '#374151',
      border:         '1px solid #d1d5db',
      backgroundColor:'#ffffff',
      cursor:         'pointer',
      transition:     'all 0.15s',
    },
    registerBtn: {
      padding:        '7px 16px',
      borderRadius:   '6px',
      textDecoration: 'none',
      fontSize:       '14px',
      fontWeight:     '600',
      color:          '#ffffff',
      backgroundColor:'#2563eb',
      border:         '1px solid #2563eb',
      cursor:         'pointer',
      transition:     'all 0.15s',
    },
    userMenu: {
      position:   'relative',
      display:    'flex',
      alignItems: 'center',
      gap:        '8px',
    },
    avatar: {
      width:           '36px',
      height:          '36px',
      borderRadius:    '50%',
      backgroundColor: '#2563eb',
      color:           '#fff',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontWeight:      '700',
      fontSize:        '14px',
      cursor:          'pointer',
      border:          '2px solid #e5e7eb',
      flexShrink:      0,
    },
    userName: {
      fontSize:   '14px',
      fontWeight: '600',
      color:      '#111827',
      cursor:     'pointer',
      maxWidth:   '120px',
      overflow:   'hidden',
      textOverflow:'ellipsis',
      whiteSpace: 'nowrap',
    },
    roleBadge: (style) => ({
      fontSize:       '11px',
      fontWeight:     '600',
      padding:        '2px 8px',
      borderRadius:   '20px',
      backgroundColor: style.bg,
      color:           style.color,
    }),
    dropdown: {
      position:        'absolute',
      top:             '48px',
      right:           0,
      backgroundColor: '#ffffff',
      border:          '1px solid #e5e7eb',
      borderRadius:    '10px',
      boxShadow:       '0 10px 25px rgba(0,0,0,0.12)',
      minWidth:        '200px',
      overflow:        'hidden',
      zIndex:          200,
    },
    dropdownHeader: {
      padding:         '14px 16px',
      borderBottom:    '1px solid #f3f4f6',
      backgroundColor: '#f9fafb',
    },
    dropdownName: {
      fontWeight:  '700',
      fontSize:    '14px',
      color:       '#111827',
      marginBottom:'2px',
    },
    dropdownEmail: {
      fontSize: '12px',
      color:    '#6b7280',
    },
    dropdownItem: {
      display:        'flex',
      alignItems:     'center',
      gap:            '10px',
      padding:        '10px 16px',
      textDecoration: 'none',
      fontSize:       '14px',
      color:          '#374151',
      cursor:         'pointer',
      transition:     'background 0.1s',
      border:         'none',
      backgroundColor:'transparent',
      width:          '100%',
      textAlign:      'left',
    },
    dropdownDivider: {
      borderTop: '1px solid #f3f4f6',
      margin:    '4px 0',
    },
    logoutItem: {
      display:        'flex',
      alignItems:     'center',
      gap:            '10px',
      padding:        '10px 16px',
      fontSize:       '14px',
      color:          '#dc2626',
      cursor:         'pointer',
      border:         'none',
      backgroundColor:'transparent',
      width:          '100%',
      textAlign:      'left',
      transition:     'background 0.1s',
    },
    hamburger: {
      display:         'none',
      flexDirection:   'column',
      gap:             '5px',
      cursor:          'pointer',
      padding:         '4px',
      backgroundColor: 'transparent',
      border:          'none',
    },
    hamburgerLine: {
      width:           '22px',
      height:          '2px',
      backgroundColor: '#374151',
      borderRadius:    '2px',
      transition:      'all 0.2s',
    },
    mobileMenu: {
      backgroundColor: '#ffffff',
      borderTop:       '1px solid #e5e7eb',
      padding:         '12px 0',
    },
    mobileLink: (active) => ({
      display:         'block',
      padding:         '10px 24px',
      textDecoration:  'none',
      fontSize:        '15px',
      fontWeight:      active ? '600' : '500',
      color:           active ? '#2563eb' : '#374151',
      backgroundColor: active ? '#eff6ff' : 'transparent',
    }),
    mobileDivider: {
      borderTop: '1px solid #f3f4f6',
      margin:    '8px 0',
    },
  };

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.inner}>

          {/* ── Logo ── */}
          <Link to="/" style={styles.logo} onClick={closeAll}>
            <div style={styles.logoIcon}>💼</div>
            Job<span style={styles.logoSpan}>Portal</span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div style={styles.desktopLinks} className="desktop-nav">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                style={styles.navLink(isActive(link.path))}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right Side ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Not logged in */}
            {!user && (
              <div style={styles.authButtons} className="desktop-nav">
                <Link to="/login"    style={styles.loginBtn}>Log In</Link>
                <Link to="/register" style={styles.registerBtn}>Sign Up Free</Link>
              </div>
            )}

            {/* Logged in — user menu */}
            {user && (
              <div style={styles.userMenu} className="desktop-nav">
                {/* Role badge */}
                {roleBadge && (
                  <span style={styles.roleBadge(roleBadge)}>
                    {roleBadge.label}
                  </span>
                )}

                {/* Avatar + name */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div style={styles.avatar}>
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span style={styles.userName}>
                    {user.full_name?.split(' ')[0]}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {dropdownOpen ? '▲' : '▼'}
                  </span>
                </div>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div style={styles.dropdown}>

                    {/* Header */}
                    <div style={styles.dropdownHeader}>
                      <div style={styles.dropdownName}>{user.full_name}</div>
                      <div style={styles.dropdownEmail}>{user.email}</div>
                    </div>

                    {/* Links */}
                    <Link
                      to="/dashboard"
                      style={styles.dropdownItem}
                      onClick={closeAll}
                    >
                      📊 Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      style={styles.dropdownItem}
                      onClick={closeAll}
                    >
                      👤 My Profile
                    </Link>

                    {user.role === 'recruiter' && (
                      <Link
                        to="/post-job"
                        style={styles.dropdownItem}
                        onClick={closeAll}
                      >
                        ➕ Post a Job
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        style={styles.dropdownItem}
                        onClick={closeAll}
                      >
                        🛡️ Admin Panel
                      </Link>
                    )}

                    <div style={styles.dropdownDivider} />

                    {/* Logout */}
                    <button
                      style={styles.logoutItem}
                      onClick={handleLogout}
                    >
                      🚪 Log Out
                    </button>

                  </div>
                )}
              </div>
            )}

            {/* ── Hamburger (mobile) ── */}
            <button
              style={styles.hamburger}
              className="hamburger-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <div style={styles.hamburgerLine} />
              <div style={styles.hamburgerLine} />
              <div style={styles.hamburgerLine} />
            </button>

          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div style={styles.mobileMenu} className="mobile-menu">

            {/* Nav links */}
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                style={styles.mobileLink(isActive(link.path))}
                onClick={closeAll}
              >
                {link.label}
              </Link>
            ))}

            <div style={styles.mobileDivider} />

            {/* Not logged in */}
            {!user && (
              <>
                <Link
                  to="/login"
                  style={styles.mobileLink(false)}
                  onClick={closeAll}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  style={{ ...styles.mobileLink(false), color: '#2563eb', fontWeight: '600' }}
                  onClick={closeAll}
                >
                  Sign Up Free
                </Link>
              </>
            )}

            {/* Logged in */}
            {user && (
              <>
                {/* User info */}
                <div style={{ padding: '10px 24px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {user.email}
                  </div>
                  {roleBadge && (
                    <span style={{ ...styles.roleBadge(roleBadge), display: 'inline-block', marginTop: '6px' }}>
                      {roleBadge.label}
                    </span>
                  )}
                </div>

                <div style={styles.mobileDivider} />

                <Link
                  to="/profile"
                  style={styles.mobileLink(false)}
                  onClick={closeAll}
                >
                  👤 My Profile
                </Link>

                {user.role === 'recruiter' && (
                  <Link
                    to="/post-job"
                    style={styles.mobileLink(false)}
                    onClick={closeAll}
                  >
                    ➕ Post a Job
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    style={styles.mobileLink(false)}
                    onClick={closeAll}
                  >
                    🛡️ Admin Panel
                  </Link>
                )}

                <div style={styles.mobileDivider} />

                <button
                  style={{
                    ...styles.mobileLink(false),
                    color:           '#dc2626',
                    border:          'none',
                    backgroundColor: 'transparent',
                    cursor:          'pointer',
                    width:           '100%',
                    textAlign:       'left',
                    display:         'block',
                  }}
                  onClick={handleLogout}
                >
                  🚪 Log Out
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── Responsive CSS ── */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .hamburger-btn { display: none !important; }
          .mobile-menu { display: none !important; }
        }
        a:hover { opacity: 0.85; }
      `}</style>
    </>
  );
}