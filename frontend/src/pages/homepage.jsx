// src/pages/HomePage.jsx
// ─────────────────────────────────────────────────────────────
// Landing page with:
//   - Hero section with search bar
//   - Stats section
//   - Featured job categories
//   - How it works section
//   - CTA section
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function HomePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchLocation,setSearchLocation]= useState('');
  const [stats,         setStats]         = useState({
    total_jobs:  0,
    total_users: 0,
    companies:   0,
    hired:       0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loadingJobs,setLoadingJobs]= useState(true);

  // ── Fetch stats and recent jobs on mount ──────────────────

  useEffect(() => {
    fetchStats();
    fetchRecentJobs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/jobs/');
      setStats(prev => ({
        ...prev,
        total_jobs: res.data.count || 0,
      }));
    } catch {
      // silently fail — stats are not critical
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const res = await api.get('/jobs/?ordering=-created_at');
      setRecentJobs(res.data.results?.slice(0, 6) || []);
    } catch {
      setRecentJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim())    params.set('search',   searchQuery.trim());
    if (searchLocation.trim()) params.set('location', searchLocation.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  // ── Job categories ────────────────────────────────────────

  const categories = [
    { icon: '💻', label: 'Technology',     count: '1,240+', query: 'technology'  },
    { icon: '📊', label: 'Marketing',      count: '830+',   query: 'marketing'   },
    { icon: '🎨', label: 'Design',         count: '620+',   query: 'design'      },
    { icon: '💰', label: 'Finance',        count: '540+',   query: 'finance'     },
    { icon: '🏥', label: 'Healthcare',     count: '470+',   query: 'healthcare'  },
    { icon: '📚', label: 'Education',      count: '390+',   query: 'education'   },
    { icon: '⚙️', label: 'Engineering',   count: '710+',   query: 'engineering' },
    { icon: '🤝', label: 'Sales',          count: '580+',   query: 'sales'       },
  ];

  // ── How it works steps ────────────────────────────────────

  const steps = {
    seeker: [
      { icon: '📝', title: 'Create Profile',   desc: 'Sign up and build your profile with skills and upload your resume.'  },
      { icon: '🔍', title: 'Search Jobs',       desc: 'Browse thousands of jobs and filter by location, type and salary.'   },
      { icon: '🚀', title: 'Apply Instantly',   desc: 'One-click apply with your profile. Get an instant AI match score.'   },
      { icon: '🎉', title: 'Get Hired',         desc: 'Track your applications and get notified when status changes.'        },
    ],
    recruiter: [
      { icon: '🏢', title: 'Post a Job',        desc: 'Create a detailed job listing in minutes and reach thousands.'        },
      { icon: '🤖', title: 'AI Screening',      desc: 'Our AI automatically ranks applicants by how well they match.'        },
      { icon: '📋', title: 'Review Applicants', desc: 'Browse ranked candidates and shortlist the best matches.'             },
      { icon: '✅', title: 'Hire Fast',         desc: 'Contact candidates directly and close positions quickly.'             },
    ],
  };

  const [activeTab, setActiveTab] = useState('seeker');

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={styles.page}>

      {/* ════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                        */}
      {/* ════════════════════════════════════════════════════ */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>

          {/* Badge */}
          <div style={styles.heroBadge}>
            🚀 AI-Powered Job Matching
          </div>

          {/* Headline */}
          <h1 style={styles.heroTitle}>
            Find Your{' '}
            <span style={styles.heroHighlight}>Dream Job</span>
            <br />
            with AI Assistance
          </h1>

          <p style={styles.heroSubtitle}>
            Our AI matches your skills to the right opportunities.
            Join over 50,000 professionals who found their next role here.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={styles.searchForm}>
            <div style={styles.searchWrapper}>

              <div style={styles.searchField}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Job title, skills or keywords..."
                  style={styles.searchInput}
                />
              </div>

              <div style={styles.searchDivider} />

              <div style={styles.searchField}>
                <span style={styles.searchIcon}>📍</span>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)}
                  placeholder="Location or Remote..."
                  style={styles.searchInput}
                />
              </div>

              <button type="submit" style={styles.searchBtn}>
                Search Jobs
              </button>

            </div>
          </form>

          {/* Popular searches */}
          <div style={styles.popularWrapper}>
            <span style={styles.popularLabel}>Popular:</span>
            {['Python', 'React', 'Remote', 'Django', 'Full Stack'].map(term => (
              <button
                key={term}
                style={styles.popularTag}
                onClick={() => {
                  setSearchQuery(term);
                  navigate(`/jobs?search=${term}`);
                }}
              >
                {term}
              </button>
            ))}
          </div>

        </div>

        {/* Hero background blobs */}
        <div style={styles.blob1} />
        <div style={styles.blob2} />
      </section>

      {/* ════════════════════════════════════════════════════ */}
      {/* STATS SECTION                                       */}
      {/* ════════════════════════════════════════════════════ */}
      <section style={styles.stats}>
        <div style={styles.statsInner}>
          {[
            { value: '10,000+', label: 'Active Jobs'     },
            { value: '50,000+', label: 'Job Seekers'     },
            { value: '2,500+',  label: 'Companies'       },
            { value: '8,000+',  label: 'People Hired'    },
          ].map((stat, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ */}
      {/* CATEGORIES SECTION                                  */}
      {/* ════════════════════════════════════════════════════ */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Browse by Category</h2>
            <p style={styles.sectionSubtitle}>
              Explore thousands of jobs across all industries
            </p>
          </div>

          <div style={styles.categoryGrid}>
            {categories.map((cat, i) => (
              <div
                key={i}
                style={styles.categoryCard}
                onClick={() => navigate(`/jobs?search=${cat.query}`)}
              >
                <div style={styles.categoryIcon}>{cat.icon}</div>
                <div style={styles.categoryLabel}>{cat.label}</div>
                <div style={styles.categoryCount}>{cat.count} jobs</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════ */}
      {/* RECENT JOBS SECTION                                 */}
      {/* ════════════════════════════════════════════════════ */}
      <section style={{ ...styles.section, backgroundColor: '#f9fafb' }}>
        <div style={styles.sectionInner}>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Latest Job Openings</h2>
            <p style={styles.sectionSubtitle}>
              Fresh opportunities posted recently
            </p>
          </div>

          {loadingJobs ? (
            <div style={styles.loadingRow}>
              {[1,2,3].map(i => (
                <div key={i} style={styles.skeletonCard} />
              ))}
            </div>
          ) : recentJobs.length > 0 ? (
            <div style={styles.recentJobsGrid}>
              {recentJobs.map(job => (
                <RecentJobCard key={job.id} job={job} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div style={styles.emptyJobs}>
              <p>No jobs posted yet. Check back soon!</p>
            </div>
          )}

          <div style={styles.viewAllWrapper}>
            <Link to="/jobs" style={styles.viewAllBtn}>
              View All Jobs →
            </Link>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS SECTION                                */}
      {/* ════════════════════════════════════════════════════ */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>

          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>How It Works</h2>
            <p style={styles.sectionSubtitle}>
              Get started in minutes — whether you're hiring or job hunting
            </p>
          </div>

          {/* Tab switcher */}
          <div style={styles.tabWrapper}>
            <button
              style={{
                ...styles.tab,
                backgroundColor: activeTab === 'seeker' ? '#2563eb' : '#f3f4f6',
                color:           activeTab === 'seeker' ? '#ffffff'  : '#374151',
              }}
              onClick={() => setActiveTab('seeker')}
            >
              👤 For Job Seekers
            </button>
            <button
              style={{
                ...styles.tab,
                backgroundColor: activeTab === 'recruiter' ? '#2563eb' : '#f3f4f6',
                color:           activeTab === 'recruiter' ? '#ffffff'  : '#374151',
              }}
              onClick={() => setActiveTab('recruiter')}
            >
              🏢 For Recruiters
            </button>
          </div>

          {/* Steps */}
          <div style={styles.stepsGrid}>
            {steps[activeTab].map((step, i) => (
              <div key={i} style={styles.stepCard}>
                <div style={styles.stepNumber}>{i + 1}</div>
                <div style={styles.stepIcon}>{step.icon}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════ */}
      {/* AI FEATURE SECTION                                  */}
      {/* ════════════════════════════════════════════════════ */}
      <section style={{ ...styles.section, backgroundColor: '#eff6ff' }}>
        <div style={styles.sectionInner}>
          <div style={styles.aiFeature}>

            <div style={styles.aiLeft}>
              <div style={styles.aiBadge}>🤖 AI-Powered</div>
              <h2 style={styles.aiTitle}>
                Smart Resume Screening
              </h2>
              <p style={styles.aiDesc}>
                Our AI automatically analyzes resumes and matches candidates
                to job requirements using advanced keyword extraction and
                TF-IDF similarity scoring.
              </p>
              <ul style={styles.aiList}>
                {[
                  'Instant match score on every application',
                  'Skills gap analysis for job seekers',
                  'Ranked applicant list for recruiters',
                  'No manual screening required',
                ].map((item, i) => (
                  <li key={i} style={styles.aiListItem}>
                    <span style={styles.aiCheck}>✅</span> {item}
                  </li>
                ))}
              </ul>
              {!user && (
                <Link to="/register" style={styles.aiCta}>
                  Get Started Free →
                </Link>
              )}
            </div>

            <div style={styles.aiRight}>
              {/* AI Score Card Visual */}
              <div style={styles.aiCard}>
                <div style={styles.aiCardHeader}>
                  🤖 AI Match Analysis
                </div>
                <div style={styles.aiScoreRow}>
                  <span style={styles.aiScoreLabel}>Overall Match</span>
                  <span style={styles.aiScoreValue}>84%</span>
                </div>
                <div style={styles.aiScoreBar}>
                  <div style={{ ...styles.aiScoreFill, width: '84%' }} />
                </div>
                {[
                  { label: 'Technical Skills', score: 90, color: '#10b981' },
                  { label: 'Experience',        score: 75, color: '#3b82f6' },
                  { label: 'Keywords Match',    score: 88, color: '#8b5cf6' },
                ].map((item, i) => (
                  <div key={i} style={styles.aiSubScore}>
                    <div style={styles.aiSubScoreTop}>
                      <span style={styles.aiSubLabel}>{item.label}</span>
                      <span style={{ color: item.color, fontWeight: '700', fontSize: '13px' }}>
                        {item.score}%
                      </span>
                    </div>
                    <div style={styles.aiSubBar}>
                      <div style={{
                        ...styles.aiSubFill,
                        width:           `${item.score}%`,
                        backgroundColor: item.color,
                      }} />
                    </div>
                  </div>
                ))}
                <div style={styles.aiCardBadge}>
                  ✨ Excellent Match
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════ */}
      {/* CTA SECTION                                         */}
      {/* ════════════════════════════════════════════════════ */}
      {!user && (
        <section style={styles.cta}>
          <div style={styles.ctaInner}>
            <h2 style={styles.ctaTitle}>
              Ready to Find Your Next Opportunity?
            </h2>
            <p style={styles.ctaSubtitle}>
              Join thousands of professionals already using JobPortal
            </p>
            <div style={styles.ctaButtons}>
              <Link to="/register" style={styles.ctaPrimary}>
                🚀 Get Started Free
              </Link>
              <Link to="/jobs" style={styles.ctaSecondary}>
                Browse Jobs
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* FOOTER                                              */}
      {/* ════════════════════════════════════════════════════ */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerLogo}>
            💼 <strong>JobPortal</strong>
          </div>
          <p style={styles.footerText}>
            AI-Powered Job Portal — Built with React + Django
          </p>
          <div style={styles.footerLinks}>
            <Link to="/jobs"     style={styles.footerLink}>Browse Jobs</Link>
            <Link to="/register" style={styles.footerLink}>Sign Up</Link>
            <Link to="/login"    style={styles.footerLink}>Log In</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// RECENT JOB CARD — small inline component
// ─────────────────────────────────────────────────────────────

function RecentJobCard({ job, navigate }) {
  const typeColors = {
    full_time:  { bg: '#dcfce7', color: '#16a34a' },
    part_time:  { bg: '#fef9c3', color: '#a16207' },
    remote:     { bg: '#dbeafe', color: '#1d4ed8' },
    contract:   { bg: '#fde8d8', color: '#c2410c' },
    internship: { bg: '#f3e8ff', color: '#6d28d9' },
  };
  const typeStyle = typeColors[job.job_type] || typeColors.full_time;

  return (
    <div
      style={cardStyles.card}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <div style={cardStyles.top}>
        <div style={cardStyles.company}>
          <div style={cardStyles.companyIcon}>
            {job.company?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={cardStyles.companyName}>{job.company}</div>
            <div style={cardStyles.location}>📍 {job.location}</div>
          </div>
        </div>
        <span style={{
          ...cardStyles.badge,
          backgroundColor: typeStyle.bg,
          color:           typeStyle.color,
        }}>
          {job.job_type?.replace('_', ' ')}
        </span>
      </div>

      <h3 style={cardStyles.title}>{job.title}</h3>

      <p style={cardStyles.desc}>
        {job.description?.slice(0, 100)}...
      </p>

      <div style={cardStyles.bottom}>
        {job.salary_min && (
          <span style={cardStyles.salary}>
            💰 ${job.salary_min.toLocaleString()}
            {job.salary_max ? ` — $${job.salary_max.toLocaleString()}` : '+'}
          </span>
        )}
        <span style={cardStyles.applicants}>
          👥 {job.total_applicants || 0} applicants
        </span>
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
    backgroundColor: '#ffffff',
  },

  // Hero
  hero: {
    position:        'relative',
    backgroundColor: '#ffffff',
    padding:         '80px 24px 60px',
    textAlign:       'center',
    overflow:        'hidden',
    borderBottom:    '1px solid #f3f4f6',
  },
  heroInner: {
    maxWidth:  '720px',
    margin:    '0 auto',
    position:  'relative',
    zIndex:    1,
  },
  heroBadge: {
    display:         'inline-block',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    border:          '1px solid #bfdbfe',
    borderRadius:    '20px',
    padding:         '6px 16px',
    fontSize:        '13px',
    fontWeight:      '600',
    marginBottom:    '20px',
  },
  heroTitle: {
    fontSize:    'clamp(2rem, 5vw, 3.2rem)',
    fontWeight:  '800',
    color:       '#111827',
    lineHeight:  '1.15',
    marginBottom:'16px',
  },
  heroHighlight: {
    color: '#2563eb',
  },
  heroSubtitle: {
    fontSize:    '17px',
    color:       '#6b7280',
    marginBottom:'36px',
    lineHeight:  '1.6',
    maxWidth:    '560px',
    margin:      '0 auto 36px',
  },
  searchForm: {
    marginBottom: '20px',
  },
  searchWrapper: {
    display:         'flex',
    alignItems:      'center',
    backgroundColor: '#ffffff',
    border:          '2px solid #e5e7eb',
    borderRadius:    '12px',
    boxShadow:       '0 4px 20px rgba(0,0,0,0.08)',
    overflow:        'hidden',
    flexWrap:        'wrap',
  },
  searchField: {
    display:    'flex',
    alignItems: 'center',
    flex:       1,
    minWidth:   '200px',
    padding:    '0 16px',
  },
  searchIcon: {
    fontSize:    '16px',
    marginRight: '8px',
    flexShrink:  0,
  },
  searchInput: {
    flex:            1,
    border:          'none',
    outline:         'none',
    fontSize:        '15px',
    color:           '#111827',
    padding:         '16px 0',
    backgroundColor: 'transparent',
  },
  searchDivider: {
    width:           '1px',
    height:          '32px',
    backgroundColor: '#e5e7eb',
    flexShrink:      0,
  },
  searchBtn: {
    padding:         '0 28px',
    height:          '100%',
    minHeight:       '56px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    fontSize:        '15px',
    fontWeight:      '700',
    cursor:          'pointer',
    transition:      'background 0.2s',
    flexShrink:      0,
  },
  popularWrapper: {
    display:    'flex',
    alignItems: 'center',
    flexWrap:   'wrap',
    gap:        '8px',
    justifyContent: 'center',
    marginTop:  '16px',
  },
  popularLabel: {
    fontSize:   '13px',
    color:      '#9ca3af',
    fontWeight: '600',
  },
  popularTag: {
    padding:         '4px 12px',
    backgroundColor: '#f3f4f6',
    border:          '1px solid #e5e7eb',
    borderRadius:    '20px',
    fontSize:        '13px',
    color:           '#374151',
    cursor:          'pointer',
    transition:      'all 0.15s',
  },
  blob1: {
    position:        'absolute',
    top:             '-100px',
    right:           '-100px',
    width:           '400px',
    height:          '400px',
    borderRadius:    '50%',
    backgroundColor: '#eff6ff',
    opacity:         0.5,
    zIndex:          0,
  },
  blob2: {
    position:        'absolute',
    bottom:          '-80px',
    left:            '-80px',
    width:           '300px',
    height:          '300px',
    borderRadius:    '50%',
    backgroundColor: '#f0fdf4',
    opacity:         0.5,
    zIndex:          0,
  },

  // Stats
  stats: {
    backgroundColor: '#2563eb',
    padding:         '40px 24px',
  },
  statsInner: {
    maxWidth:            '1000px',
    margin:              '0 auto',
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap:                 '24px',
    textAlign:           'center',
  },
  statCard: {},
  statValue: {
    fontSize:    '2rem',
    fontWeight:  '800',
    color:       '#ffffff',
    marginBottom:'4px',
  },
  statLabel: {
    fontSize: '14px',
    color:    'rgba(255,255,255,0.8)',
  },

  // Sections
  section: {
    padding:         '72px 24px',
    backgroundColor: '#ffffff',
  },
  sectionInner: {
    maxWidth: '1100px',
    margin:   '0 auto',
  },
  sectionHeader: {
    textAlign:    'center',
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize:    '2rem',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'10px',
  },
  sectionSubtitle: {
    fontSize: '16px',
    color:    '#6b7280',
  },

  // Categories
  categoryGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap:                 '16px',
  },
  categoryCard: {
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '24px 20px',
    textAlign:       'center',
    cursor:          'pointer',
    transition:      'all 0.2s',
  },
  categoryIcon: {
    fontSize:     '32px',
    marginBottom: '10px',
  },
  categoryLabel: {
    fontWeight:   '700',
    fontSize:     '15px',
    color:        '#111827',
    marginBottom: '4px',
  },
  categoryCount: {
    fontSize: '13px',
    color:    '#6b7280',
  },

  // Recent jobs
  recentJobsGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap:                 '16px',
    marginBottom:        '32px',
  },
  loadingRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap:                 '16px',
    marginBottom:        '32px',
  },
  skeletonCard: {
    height:          '180px',
    backgroundColor: '#f3f4f6',
    borderRadius:    '12px',
    animation:       'pulse 1.5s infinite',
  },
  emptyJobs: {
    textAlign:    'center',
    padding:      '48px',
    color:        '#9ca3af',
    fontSize:     '16px',
  },
  viewAllWrapper: {
    textAlign: 'center',
  },
  viewAllBtn: {
    display:         'inline-block',
    padding:         '12px 32px',
    backgroundColor: '#ffffff',
    border:          '2px solid #2563eb',
    borderRadius:    '8px',
    color:           '#2563eb',
    fontWeight:      '700',
    fontSize:        '15px',
    textDecoration:  'none',
    transition:      'all 0.2s',
  },

  // How it works
  tabWrapper: {
    display:        'flex',
    gap:            '8px',
    justifyContent: 'center',
    marginBottom:   '40px',
  },
  tab: {
    padding:      '10px 24px',
    borderRadius: '8px',
    border:       'none',
    fontSize:     '14px',
    fontWeight:   '600',
    cursor:       'pointer',
    transition:   'all 0.2s',
  },
  stepsGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap:                 '24px',
  },
  stepCard: {
    textAlign:    'center',
    padding:      '28px 20px',
    borderRadius: '12px',
    border:       '1px solid #f3f4f6',
    position:     'relative',
  },
  stepNumber: {
    position:        'absolute',
    top:             '-14px',
    left:            '50%',
    transform:       'translateX(-50%)',
    width:           '28px',
    height:          '28px',
    borderRadius:    '50%',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    fontSize:        '13px',
    fontWeight:      '700',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
  },
  stepIcon: {
    fontSize:     '32px',
    marginBottom: '12px',
  },
  stepTitle: {
    fontSize:     '16px',
    fontWeight:   '700',
    color:        '#111827',
    marginBottom: '8px',
  },
  stepDesc: {
    fontSize:   '14px',
    color:      '#6b7280',
    lineHeight: '1.6',
  },

  // AI Feature
  aiFeature: {
    display:    'flex',
    gap:        '60px',
    alignItems: 'center',
    flexWrap:   'wrap',
  },
  aiLeft: {
    flex:     1,
    minWidth: '280px',
  },
  aiBadge: {
    display:         'inline-block',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    border:          '1px solid #bfdbfe',
    borderRadius:    '20px',
    padding:         '5px 14px',
    fontSize:        '12px',
    fontWeight:      '600',
    marginBottom:    '16px',
  },
  aiTitle: {
    fontSize:    '2rem',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'14px',
  },
  aiDesc: {
    fontSize:    '15px',
    color:       '#6b7280',
    lineHeight:  '1.7',
    marginBottom:'20px',
  },
  aiList: {
    listStyle:   'none',
    padding:     0,
    marginBottom:'28px',
  },
  aiListItem: {
    fontSize:    '14px',
    color:       '#374151',
    marginBottom:'10px',
    display:     'flex',
    gap:         '8px',
    alignItems:  'flex-start',
  },
  aiCheck: {
    flexShrink: 0,
  },
  aiCta: {
    display:         'inline-block',
    padding:         '12px 28px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    borderRadius:    '8px',
    fontWeight:      '700',
    fontSize:        '15px',
    textDecoration:  'none',
  },
  aiRight: {
    flex:     1,
    minWidth: '280px',
  },
  aiCard: {
    backgroundColor: '#ffffff',
    borderRadius:    '16px',
    border:          '1px solid #e5e7eb',
    boxShadow:       '0 8px 32px rgba(0,0,0,0.08)',
    padding:         '24px',
  },
  aiCardHeader: {
    fontSize:     '14px',
    fontWeight:   '700',
    color:        '#111827',
    marginBottom: '16px',
    paddingBottom:'12px',
    borderBottom: '1px solid #f3f4f6',
  },
  aiScoreRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '8px',
  },
  aiScoreLabel: {
    fontSize:   '13px',
    color:      '#6b7280',
    fontWeight: '600',
  },
  aiScoreValue: {
    fontSize:   '28px',
    fontWeight: '800',
    color:      '#10b981',
  },
  aiScoreBar: {
    height:          '8px',
    backgroundColor: '#f3f4f6',
    borderRadius:    '4px',
    overflow:        'hidden',
    marginBottom:    '20px',
  },
  aiScoreFill: {
    height:          '100%',
    backgroundColor: '#10b981',
    borderRadius:    '4px',
  },
  aiSubScore: {
    marginBottom: '12px',
  },
  aiSubScoreTop: {
    display:        'flex',
    justifyContent: 'space-between',
    marginBottom:   '4px',
  },
  aiSubLabel: {
    fontSize: '12px',
    color:    '#6b7280',
  },
  aiSubBar: {
    height:          '4px',
    backgroundColor: '#f3f4f6',
    borderRadius:    '2px',
    overflow:        'hidden',
  },
  aiSubFill: {
    height:       '100%',
    borderRadius: '2px',
  },
  aiCardBadge: {
    textAlign:       'center',
    marginTop:       '16px',
    padding:         '8px',
    backgroundColor: '#f0fdf4',
    borderRadius:    '8px',
    fontSize:        '13px',
    fontWeight:      '700',
    color:           '#16a34a',
  },

  // CTA
  cta: {
    backgroundColor: '#111827',
    padding:         '72px 24px',
    textAlign:       'center',
  },
  ctaInner: {
    maxWidth: '600px',
    margin:   '0 auto',
  },
  ctaTitle: {
    fontSize:    '2rem',
    fontWeight:  '800',
    color:       '#ffffff',
    marginBottom:'12px',
  },
  ctaSubtitle: {
    fontSize:    '16px',
    color:       'rgba(255,255,255,0.7)',
    marginBottom:'32px',
  },
  ctaButtons: {
    display:        'flex',
    gap:            '12px',
    justifyContent: 'center',
    flexWrap:       'wrap',
  },
  ctaPrimary: {
    padding:         '14px 32px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    borderRadius:    '8px',
    fontWeight:      '700',
    fontSize:        '15px',
    textDecoration:  'none',
  },
  ctaSecondary: {
    padding:         '14px 32px',
    backgroundColor: 'transparent',
    color:           '#ffffff',
    border:          '2px solid rgba(255,255,255,0.3)',
    borderRadius:    '8px',
    fontWeight:      '700',
    fontSize:        '15px',
    textDecoration:  'none',
  },

  // Footer
  footer: {
    backgroundColor: '#f9fafb',
    borderTop:       '1px solid #e5e7eb',
    padding:         '32px 24px',
    textAlign:       'center',
  },
  footerInner: {
    maxWidth: '800px',
    margin:   '0 auto',
  },
  footerLogo: {
    fontSize:     '20px',
    marginBottom: '8px',
    color:        '#111827',
  },
  footerText: {
    fontSize:     '13px',
    color:        '#9ca3af',
    marginBottom: '16px',
  },
  footerLinks: {
    display:        'flex',
    gap:            '24px',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize:       '13px',
    color:          '#6b7280',
    textDecoration: 'none',
  },
};

const cardStyles = {
  card: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
    cursor:          'pointer',
    transition:      'all 0.2s',
    boxShadow:       '0 1px 4px rgba(0,0,0,0.04)',
  },
  top: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   '12px',
  },
  company: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  companyIcon: {
    width:           '36px',
    height:          '36px',
    borderRadius:    '8px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '700',
    fontSize:        '16px',
    flexShrink:      0,
  },
  companyName: {
    fontWeight: '600',
    fontSize:   '13px',
    color:      '#374151',
  },
  location: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
  badge: {
    fontSize:     '11px',
    fontWeight:   '600',
    padding:      '3px 10px',
    borderRadius: '20px',
    whiteSpace:   'nowrap',
  },
  title: {
    fontSize:     '16px',
    fontWeight:   '700',
    color:        '#111827',
    marginBottom: '8px',
  },
  desc: {
    fontSize:     '13px',
    color:        '#6b7280',
    lineHeight:   '1.5',
    marginBottom: '14px',
  },
  bottom: {
    display:    'flex',
    alignItems: 'center',
    gap:        '16px',
    flexWrap:   'wrap',
  },
  salary: {
    fontSize:   '13px',
    color:      '#16a34a',
    fontWeight: '600',
  },
  applicants: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
};