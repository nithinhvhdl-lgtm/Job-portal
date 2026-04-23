// src/pages/JobsPage.jsx
// ─────────────────────────────────────────────────────────────
// Jobs listing page with:
//   - Search bar
//   - Filters (job type, location, salary)
//   - Job cards grid
//   - Pagination
//   - Loading skeletons
//   - Empty state
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function JobsPage() {
  const { user }                        = useAuth();
  const navigate                        = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ─────────────────────────────────────────────────
  const [jobs,         setJobs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [totalJobs,    setTotalJobs]    = useState(0);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [showFilters,  setShowFilters]  = useState(false);

  // Search & filter state — read from URL params on load
  const [filters, setFilters] = useState({
    search:     searchParams.get('search')   || '',
    location:   searchParams.get('location') || '',
    job_type:   searchParams.get('job_type') || '',
    min_salary: searchParams.get('min_salary') || '',
    max_salary: searchParams.get('max_salary') || '',
    ordering:   searchParams.get('ordering') || '-created_at',
  });

  const [searchInput, setSearchInput] = useState(filters.search);

  // ── Fetch jobs ────────────────────────────────────────────

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search)     params.set('search',     filters.search);
      if (filters.location)   params.set('location',   filters.location);
      if (filters.job_type)   params.set('job_type',   filters.job_type);
      if (filters.min_salary) params.set('min_salary', filters.min_salary);
      if (filters.max_salary) params.set('max_salary', filters.max_salary);
      if (filters.ordering)   params.set('ordering',   filters.ordering);
      params.set('page', page);

      const res = await api.get(`/jobs/?${params.toString()}`);
      setJobs(res.data.results || []);
      setTotalJobs(res.data.count || 0);
      setTotalPages(Math.ceil((res.data.count || 0) / 10));
      setCurrentPage(page);

      // Sync URL params
      setSearchParams(params);

    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs(1);
  }, [filters]);

  // ── Handlers ──────────────────────────────────────────────

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search:     '',
      location:   '',
      job_type:   '',
      min_salary: '',
      max_salary: '',
      ordering:   '-created_at',
    });
    setSearchInput('');
  };

  const activeFilterCount = [
    filters.location,
    filters.job_type,
    filters.min_salary,
    filters.max_salary,
  ].filter(Boolean).length;

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* ── Page Header ── */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Browse Jobs</h1>
            <p style={styles.pageSubtitle}>
              {totalJobs > 0
                ? `${totalJobs.toLocaleString()} jobs available`
                : 'Find your next opportunity'}
            </p>
          </div>
          {user?.role === 'recruiter' && (
            <Link to="/post-job" style={styles.postJobBtn}>
              + Post a Job
            </Link>
          )}
        </div>

        {/* ── Search Bar ── */}
        <form onSubmit={handleSearchSubmit} style={styles.searchRow}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by title, skills, company..."
              style={styles.searchInput}
            />
            {searchInput && (
              <button
                type="button"
                style={styles.clearBtn}
                onClick={() => {
                  setSearchInput('');
                  setFilters(prev => ({ ...prev, search: '' }));
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" style={styles.searchBtn}>
            Search
          </button>
          <button
            type="button"
            style={{
              ...styles.filterToggleBtn,
              backgroundColor: showFilters || activeFilterCount > 0
                ? '#eff6ff' : '#f9fafb',
              borderColor: showFilters || activeFilterCount > 0
                ? '#2563eb' : '#e5e7eb',
              color: showFilters || activeFilterCount > 0
                ? '#2563eb' : '#374151',
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            🎛️ Filters
            {activeFilterCount > 0 && (
              <span style={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
        </form>

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div style={styles.filterPanel}>

            {/* Job Type */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Job Type</label>
              <div style={styles.filterChips}>
                {[
                  { value: '',           label: 'All Types'  },
                  { value: 'full_time',  label: 'Full Time'  },
                  { value: 'part_time',  label: 'Part Time'  },
                  { value: 'remote',     label: 'Remote'     },
                  { value: 'contract',   label: 'Contract'   },
                  { value: 'internship', label: 'Internship' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    style={{
                      ...styles.chip,
                      backgroundColor: filters.job_type === opt.value
                        ? '#2563eb' : '#f3f4f6',
                      color: filters.job_type === opt.value
                        ? '#ffffff' : '#374151',
                      borderColor: filters.job_type === opt.value
                        ? '#2563eb' : '#e5e7eb',
                    }}
                    onClick={() => handleFilterChange('job_type', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={e => handleFilterChange('location', e.target.value)}
                placeholder="City, country or Remote..."
                style={styles.filterInput}
              />
            </div>

            {/* Salary Range */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Salary Range (USD)</label>
              <div style={styles.salaryRow}>
                <input
                  type="number"
                  value={filters.min_salary}
                  onChange={e => handleFilterChange('min_salary', e.target.value)}
                  placeholder="Min salary"
                  style={styles.filterInput}
                  min="0"
                />
                <span style={styles.salaryDash}>—</span>
                <input
                  type="number"
                  value={filters.max_salary}
                  onChange={e => handleFilterChange('max_salary', e.target.value)}
                  placeholder="Max salary"
                  style={styles.filterInput}
                  min="0"
                />
              </div>
            </div>

            {/* Sort By */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Sort By</label>
              <select
                value={filters.ordering}
                onChange={e => handleFilterChange('ordering', e.target.value)}
                style={styles.filterSelect}
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="salary_min">Lowest Salary</option>
                <option value="-salary_min">Highest Salary</option>
              </select>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                style={styles.clearFiltersBtn}
              >
                Clear All Filters
              </button>
            )}

          </div>
        )}

        {/* ── Active Filter Tags ── */}
        {activeFilterCount > 0 && (
          <div style={styles.activeFilters}>
            {filters.job_type && (
              <span style={styles.activeTag}>
                {filters.job_type.replace('_', ' ')}
                <button
                  style={styles.removeTag}
                  onClick={() => handleFilterChange('job_type', '')}
                >✕</button>
              </span>
            )}
            {filters.location && (
              <span style={styles.activeTag}>
                📍 {filters.location}
                <button
                  style={styles.removeTag}
                  onClick={() => handleFilterChange('location', '')}
                >✕</button>
              </span>
            )}
            {filters.min_salary && (
              <span style={styles.activeTag}>
                Min ${Number(filters.min_salary).toLocaleString()}
                <button
                  style={styles.removeTag}
                  onClick={() => handleFilterChange('min_salary', '')}
                >✕</button>
              </span>
            )}
            {filters.max_salary && (
              <span style={styles.activeTag}>
                Max ${Number(filters.max_salary).toLocaleString()}
                <button
                  style={styles.removeTag}
                  onClick={() => handleFilterChange('max_salary', '')}
                >✕</button>
              </span>
            )}
            <button
              style={styles.clearAllTags}
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Jobs Grid ── */}
        {loading ? (
          <div style={styles.grid}>
            {[1,2,3,4,5,6].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <>
            <div style={styles.grid}>
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  user={user}
                  navigate={navigate}
                />
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage === 1 ? 0.4 : 1,
                  }}
                  onClick={() => fetchJobs(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) => (
                    p === '...'
                      ? <span key={`dots-${i}`} style={styles.pageDots}>...</span>
                      : <button
                          key={p}
                          style={{
                            ...styles.pageBtn,
                            backgroundColor: currentPage === p
                              ? '#2563eb' : '#ffffff',
                            color: currentPage === p
                              ? '#ffffff' : '#374151',
                            borderColor: currentPage === p
                              ? '#2563eb' : '#e5e7eb',
                          }}
                          onClick={() => fetchJobs(p)}
                        >
                          {p}
                        </button>
                  ))
                }

                <button
                  style={{
                    ...styles.pageBtn,
                    opacity: currentPage === totalPages ? 0.4 : 1,
                  }}
                  onClick={() => fetchJobs(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          // Empty state
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🔍</div>
            <h3 style={styles.emptyTitle}>No jobs found</h3>
            <p style={styles.emptyText}>
              {filters.search || activeFilterCount > 0
                ? 'Try adjusting your search or filters.'
                : 'No active jobs right now. Check back soon!'}
            </p>
            {(filters.search || activeFilterCount > 0) && (
              <button
                style={styles.emptyBtn}
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// JOB CARD COMPONENT
// ─────────────────────────────────────────────────────────────

function JobCard({ job, user, navigate }) {

  const typeColors = {
    full_time:  { bg: '#dcfce7', color: '#16a34a' },
    part_time:  { bg: '#fef9c3', color: '#a16207' },
    remote:     { bg: '#dbeafe', color: '#1d4ed8' },
    contract:   { bg: '#fde8d8', color: '#c2410c' },
    internship: { bg: '#f3e8ff', color: '#6d28d9' },
  };

  const typeStyle = typeColors[job.job_type] || typeColors.full_time;

  const daysAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7)  return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div
      style={{
        ...cardStyles.card,
        outline: job.has_applied ? '2px solid #10b981' : 'none',
      }}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      {/* Applied badge */}
      {job.has_applied && (
        <div style={cardStyles.appliedBadge}>
          ✅ Applied
        </div>
      )}

      {/* Top row */}
      <div style={cardStyles.top}>
        <div style={cardStyles.companyRow}>
          <div style={cardStyles.avatar}>
            {job.company?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={cardStyles.company}>{job.company}</div>
            <div style={cardStyles.location}>📍 {job.location}</div>
          </div>
        </div>
        <div style={cardStyles.rightCol}>
          <span style={{
            ...cardStyles.typeBadge,
            backgroundColor: typeStyle.bg,
            color:           typeStyle.color,
          }}>
            {job.job_type?.replace('_', ' ')}
          </span>
          {job.is_saved && (
            <span style={cardStyles.savedBadge}>🔖</span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 style={cardStyles.title}>{job.title}</h3>

      {/* Description */}
      <p style={cardStyles.desc}>
        {job.description?.slice(0, 120)}
        {job.description?.length > 120 ? '...' : ''}
      </p>

      {/* Bottom row */}
      <div style={cardStyles.bottom}>
        <div style={cardStyles.bottomLeft}>
          {job.salary_min ? (
            <span style={cardStyles.salary}>
              💰 ${job.salary_min.toLocaleString()}
              {job.salary_max
                ? ` — $${job.salary_max.toLocaleString()}`
                : '+'}
            </span>
          ) : (
            <span style={cardStyles.noSalary}>Salary not specified</span>
          )}
        </div>
        <div style={cardStyles.bottomRight}>
          <span style={cardStyles.meta}>
            👥 {job.total_applicants || 0}
          </span>
          <span style={cardStyles.meta}>
            🕐 {daysAgo(job.created_at)}
          </span>
        </div>
      </div>

      {/* Deadline warning */}
      {job.deadline && (() => {
        const daysLeft = Math.ceil(
          (new Date(job.deadline) - Date.now()) / (1000*60*60*24)
        );
        if (daysLeft <= 7 && daysLeft > 0) {
          return (
            <div style={cardStyles.deadline}>
              ⚠️ Closes in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
            </div>
          );
        }
        if (daysLeft <= 0) {
          return (
            <div style={{ ...cardStyles.deadline, backgroundColor: '#fef2f2', color: '#dc2626' }}>
              ❌ Deadline passed
            </div>
          );
        }
        return null;
      })()}

    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// SKELETON CARD (loading placeholder)
// ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={skeletonStyles.card}>
      <div style={skeletonStyles.row}>
        <div style={skeletonStyles.avatar} />
        <div style={skeletonStyles.lines}>
          <div style={{ ...skeletonStyles.line, width: '60%' }} />
          <div style={{ ...skeletonStyles.line, width: '40%', height: '10px' }} />
        </div>
      </div>
      <div style={{ ...skeletonStyles.line, width: '80%', height: '20px', marginTop: '16px' }} />
      <div style={{ ...skeletonStyles.line, width: '100%', marginTop: '10px' }} />
      <div style={{ ...skeletonStyles.line, width: '90%',  marginTop: '6px'  }} />
      <div style={{ ...skeletonStyles.line, width: '50%',  marginTop: '16px' }} />
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
    padding:         '32px 24px',
  },
  inner: {
    maxWidth: '1100px',
    margin:   '0 auto',
  },
  pageHeader: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   '24px',
    flexWrap:       'wrap',
    gap:            '12px',
  },
  pageTitle: {
    fontSize:    '28px',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color:    '#6b7280',
  },
  postJobBtn: {
    padding:         '10px 20px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    borderRadius:    '8px',
    fontWeight:      '600',
    fontSize:        '14px',
    textDecoration:  'none',
    border:          'none',
    cursor:          'pointer',
  },

  // Search
  searchRow: {
    display:      'flex',
    gap:          '10px',
    marginBottom: '16px',
    flexWrap:     'wrap',
  },
  searchWrapper: {
    flex:            1,
    minWidth:        '200px',
    display:         'flex',
    alignItems:      'center',
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    padding:         '0 14px',
    gap:             '8px',
  },
  searchIcon: {
    fontSize:   '16px',
    flexShrink: 0,
  },
  searchInput: {
    flex:            1,
    border:          'none',
    outline:         'none',
    fontSize:        '14px',
    color:           '#111827',
    padding:         '12px 0',
    backgroundColor: 'transparent',
  },
  clearBtn: {
    background:  'none',
    border:      'none',
    color:       '#9ca3af',
    cursor:      'pointer',
    fontSize:    '14px',
    padding:     '0',
    flexShrink:  0,
  },
  searchBtn: {
    padding:         '12px 24px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    cursor:          'pointer',
    whiteSpace:      'nowrap',
  },
  filterToggleBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          '6px',
    padding:      '12px 16px',
    border:       '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize:     '14px',
    fontWeight:   '600',
    cursor:       'pointer',
    whiteSpace:   'nowrap',
    transition:   'all 0.15s',
  },
  filterBadge: {
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    borderRadius:    '50%',
    width:           '18px',
    height:          '18px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontSize:        '11px',
    fontWeight:      '700',
  },

  // Filter panel
  filterPanel: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
    marginBottom:    '16px',
    display:         'flex',
    flexWrap:        'wrap',
    gap:             '20px',
    alignItems:      'flex-end',
  },
  filterGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
    flex:          1,
    minWidth:      '180px',
  },
  filterLabel: {
    fontSize:   '13px',
    fontWeight: '600',
    color:      '#374151',
  },
  filterChips: {
    display:  'flex',
    flexWrap: 'wrap',
    gap:      '6px',
  },
  chip: {
    padding:      '5px 12px',
    borderRadius: '20px',
    border:       '1px solid #e5e7eb',
    fontSize:     '13px',
    fontWeight:   '500',
    cursor:       'pointer',
    transition:   'all 0.15s',
  },
  filterInput: {
    padding:         '9px 12px',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    color:           '#111827',
    outline:         'none',
    backgroundColor: '#ffffff',
    width:           '100%',
  },
  filterSelect: {
    padding:         '9px 12px',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    color:           '#111827',
    outline:         'none',
    backgroundColor: '#ffffff',
    cursor:          'pointer',
    width:           '100%',
  },
  salaryRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  salaryDash: {
    color:     '#9ca3af',
    flexShrink:0,
  },
  clearFiltersBtn: {
    padding:         '9px 16px',
    backgroundColor: '#fef2f2',
    color:           '#dc2626',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    fontSize:        '13px',
    fontWeight:      '600',
    cursor:          'pointer',
    alignSelf:       'flex-end',
    whiteSpace:      'nowrap',
  },

  // Active filter tags
  activeFilters: {
    display:      'flex',
    flexWrap:     'wrap',
    gap:          '8px',
    marginBottom: '16px',
    alignItems:   'center',
  },
  activeTag: {
    display:         'flex',
    alignItems:      'center',
    gap:             '6px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    border:          '1px solid #bfdbfe',
    borderRadius:    '20px',
    padding:         '4px 10px',
    fontSize:        '13px',
    fontWeight:      '500',
  },
  removeTag: {
    background:  'none',
    border:      'none',
    color:       '#2563eb',
    cursor:      'pointer',
    fontSize:    '12px',
    padding:     '0',
    lineHeight:  '1',
  },
  clearAllTags: {
    background:     'none',
    border:         'none',
    color:          '#6b7280',
    cursor:         'pointer',
    fontSize:       '13px',
    textDecoration: 'underline',
    padding:        '0',
  },

  // Jobs grid
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap:                 '16px',
    marginBottom:        '32px',
  },

  // Pagination
  pagination: {
    display:        'flex',
    justifyContent: 'center',
    alignItems:     'center',
    gap:            '6px',
    marginTop:      '16px',
    flexWrap:       'wrap',
  },
  pageBtn: {
    padding:         '8px 14px',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    backgroundColor: '#ffffff',
    color:           '#374151',
    fontSize:        '14px',
    fontWeight:      '500',
    cursor:          'pointer',
    transition:      'all 0.15s',
  },
  pageDots: {
    padding:  '8px 4px',
    color:    '#9ca3af',
    fontSize: '14px',
  },

  // Empty state
  empty: {
    textAlign:    'center',
    padding:      '80px 24px',
    color:        '#9ca3af',
  },
  emptyIcon: {
    fontSize:     '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize:    '20px',
    fontWeight:  '700',
    color:       '#374151',
    marginBottom:'8px',
  },
  emptyText: {
    fontSize:    '15px',
    color:       '#6b7280',
    marginBottom:'24px',
  },
  emptyBtn: {
    padding:         '10px 24px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
};

// Job Card styles
const cardStyles = {
  card: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
    cursor:          'pointer',
    transition:      'all 0.2s',
    position:        'relative',
    boxShadow:       '0 1px 3px rgba(0,0,0,0.04)',
  },
  appliedBadge: {
    position:        'absolute',
    top:             '12px',
    right:           '12px',
    backgroundColor: '#f0fdf4',
    color:           '#16a34a',
    border:          '1px solid #bbf7d0',
    borderRadius:    '20px',
    padding:         '3px 10px',
    fontSize:        '11px',
    fontWeight:      '700',
  },
  top: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   '12px',
  },
  companyRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  avatar: {
    width:           '40px',
    height:          '40px',
    borderRadius:    '10px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '800',
    fontSize:        '18px',
    flexShrink:      0,
  },
  company: {
    fontWeight:   '600',
    fontSize:     '13px',
    color:        '#374151',
    marginBottom: '2px',
  },
  location: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
  rightCol: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
  },
  typeBadge: {
    fontSize:     '11px',
    fontWeight:   '600',
    padding:      '3px 10px',
    borderRadius: '20px',
    whiteSpace:   'nowrap',
    textTransform:'capitalize',
  },
  savedBadge: {
    fontSize: '16px',
  },
  title: {
    fontSize:     '16px',
    fontWeight:   '700',
    color:        '#111827',
    marginBottom: '8px',
    lineHeight:   '1.3',
  },
  desc: {
    fontSize:     '13px',
    color:        '#6b7280',
    lineHeight:   '1.6',
    marginBottom: '14px',
  },
  bottom: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    flexWrap:       'wrap',
    gap:            '6px',
  },
  bottomLeft: {},
  bottomRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  salary: {
    fontSize:   '13px',
    fontWeight: '600',
    color:      '#16a34a',
  },
  noSalary: {
    fontSize: '12px',
    color:    '#d1d5db',
  },
  meta: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
  deadline: {
    marginTop:       '12px',
    padding:         '6px 10px',
    backgroundColor: '#fffbeb',
    color:           '#d97706',
    borderRadius:    '6px',
    fontSize:        '12px',
    fontWeight:      '600',
  },
};

// Skeleton styles
const skeletonStyles = {
  card: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
  },
  row: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  avatar: {
    width:           '40px',
    height:          '40px',
    borderRadius:    '10px',
    backgroundColor: '#f3f4f6',
    flexShrink:      0,
  },
  lines: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  line: {
    height:          '14px',
    backgroundColor: '#f3f4f6',
    borderRadius:    '4px',
    animation:       'pulse 1.5s ease-in-out infinite',
  },
};