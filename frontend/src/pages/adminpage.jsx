// src/pages/AdminPage.jsx
// ─────────────────────────────────────────────────────────────
// Admin dashboard with:
//   - Overview stats
//   - User management (list, search, toggle, delete)
//   - Jobs overview
//   - Applications overview
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function AdminPage() {
  const { user }                        = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab                      = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab]       = useState(initialTab);

  const handleTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.adminBadge}>🛡️ Admin Panel</div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>
              Manage users, jobs, and monitor platform activity
            </p>
          </div>
          <div style={styles.adminInfo}>
            <div style={styles.adminAvatar}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={styles.adminName}>{user?.full_name}</div>
              <div style={styles.adminRole}>Administrator</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={styles.tabs}>
          {[
            { key: 'overview',      label: '📊 Overview'      },
            { key: 'users',         label: '👥 Users'          },
            { key: 'jobs',          label: '💼 Jobs'           },
          ].map(tab => (
            <button
              key={tab.key}
              style={{
                ...styles.tab,
                borderBottom:    activeTab === tab.key
                  ? '2px solid #2563eb' : '2px solid transparent',
                color:           activeTab === tab.key ? '#2563eb' : '#6b7280',
                fontWeight:      activeTab === tab.key ? '700' : '500',
                backgroundColor: 'transparent',
              }}
              onClick={() => handleTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={styles.content}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users'    && <UsersTab />}
          {activeTab === 'jobs'     && <JobsTab />}
        </div>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB 1 — OVERVIEW
// ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/admin/dashboard/');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data)   return <ErrorState msg="Failed to load dashboard data." />;

  return (
    <div>

      {/* ── Big Stats ── */}
      <div style={tabStyles.bigStatRow}>
        {[
          { icon: '👥', label: 'Total Users',    value: data.users.total,        color: '#2563eb', bg: '#eff6ff' },
          { icon: '💼', label: 'Active Jobs',    value: data.jobs.active,         color: '#16a34a', bg: '#f0fdf4' },
          { icon: '📋', label: 'Applications',   value: data.applications.total,  color: '#8b5cf6', bg: '#faf5ff' },
          { icon: '✅', label: 'Hired',           value: data.applications.hired,  color: '#a16207', bg: '#fffbeb' },
        ].map((s, i) => (
          <div key={i} style={{ ...tabStyles.bigStatCard, borderTop: `3px solid ${s.color}` }}>
            <div style={{ ...tabStyles.bigStatIcon, backgroundColor: s.bg }}>
              {s.icon}
            </div>
            <div style={{ ...tabStyles.bigStatNum, color: s.color }}>{s.value}</div>
            <div style={tabStyles.bigStatLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Two column grid ── */}
      <div style={tabStyles.twoColGrid}>

        {/* Users breakdown */}
        <div style={tabStyles.card}>
          <h3 style={tabStyles.cardTitle}>👥 Users Breakdown</h3>
          {[
            { label: 'Job Seekers',  value: data.users.seekers,    color: '#16a34a', max: data.users.total },
            { label: 'Recruiters',   value: data.users.recruiters, color: '#2563eb', max: data.users.total },
            { label: 'Active',       value: data.users.active,     color: '#10b981', max: data.users.total },
            { label: 'Inactive',     value: data.users.inactive,   color: '#ef4444', max: data.users.total },
          ].map((item, i) => (
            <div key={i} style={tabStyles.barRow}>
              <div style={tabStyles.barLabel}>{item.label}</div>
              <div style={tabStyles.barTrack}>
                <div style={{
                  ...tabStyles.barFill,
                  width:           item.max > 0
                    ? `${(item.value / item.max) * 100}%` : '0%',
                  backgroundColor: item.color,
                }} />
              </div>
              <div style={tabStyles.barVal}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Jobs breakdown */}
        <div style={tabStyles.card}>
          <h3 style={tabStyles.cardTitle}>💼 Jobs Breakdown</h3>
          {[
            { label: 'Active',  value: data.jobs.active, color: '#16a34a', max: data.jobs.total },
            { label: 'Closed',  value: data.jobs.closed, color: '#dc2626', max: data.jobs.total },
            { label: 'Draft',   value: data.jobs.draft,  color: '#9ca3af', max: data.jobs.total },
          ].map((item, i) => (
            <div key={i} style={tabStyles.barRow}>
              <div style={tabStyles.barLabel}>{item.label}</div>
              <div style={tabStyles.barTrack}>
                <div style={{
                  ...tabStyles.barFill,
                  width:           item.max > 0
                    ? `${(item.value / item.max) * 100}%` : '0%',
                  backgroundColor: item.color,
                }} />
              </div>
              <div style={tabStyles.barVal}>{item.value}</div>
            </div>
          ))}

          <div style={tabStyles.divider} />

          <h3 style={{ ...tabStyles.cardTitle, marginTop: '8px' }}>
            📋 Applications Breakdown
          </h3>
          {[
            { label: 'Applied',     value: data.applications.applied,     color: '#6b7280' },
            { label: 'Shortlisted', value: data.applications.shortlisted, color: '#16a34a' },
            { label: 'Rejected',    value: data.applications.rejected,    color: '#dc2626' },
            { label: 'Hired',       value: data.applications.hired,       color: '#a16207' },
          ].map((item, i) => (
            <div key={i} style={tabStyles.barRow}>
              <div style={tabStyles.barLabel}>{item.label}</div>
              <div style={tabStyles.barTrack}>
                <div style={{
                  ...tabStyles.barFill,
                  width:           data.applications.total > 0
                    ? `${(item.value / data.applications.total) * 100}%` : '0%',
                  backgroundColor: item.color,
                }} />
              </div>
              <div style={tabStyles.barVal}>{item.value}</div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Top companies ── */}
      {data.top_companies?.length > 0 && (
        <div style={tabStyles.card}>
          <h3 style={tabStyles.cardTitle}>🏆 Top Companies by Jobs Posted</h3>
          <div style={tabStyles.companyGrid}>
            {data.top_companies.map((c, i) => (
              <div key={i} style={tabStyles.companyCard}>
                <div style={tabStyles.companyAvatar}>
                  {c.company?.charAt(0).toUpperCase()}
                </div>
                <div style={tabStyles.companyName}>{c.company}</div>
                <div style={tabStyles.companyCount}>{c.job_count} jobs</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent users ── */}
      {data.recent_users?.length > 0 && (
        <div style={tabStyles.card}>
          <div style={tabStyles.cardHeaderRow}>
            <h3 style={tabStyles.cardTitle}>🆕 Recent Users</h3>
            <button
              style={tabStyles.viewAllBtn}
              onClick={() => {}}
            >
              View All →
            </button>
          </div>
          <div style={tabStyles.recentUsersList}>
            {data.recent_users.map((u, i) => (
              <div key={i} style={tabStyles.recentUserRow}>
                <div style={tabStyles.recentUserAvatar}>
                  {u.full_name?.charAt(0).toUpperCase()}
                </div>
                <div style={tabStyles.recentUserInfo}>
                  <div style={tabStyles.recentUserName}>{u.full_name}</div>
                  <div style={tabStyles.recentUserEmail}>{u.email}</div>
                </div>
                <span style={{
                  ...tabStyles.roleBadge,
                  ...(u.role === 'recruiter'
                    ? tabStyles.recruiterBadge
                    : tabStyles.seekerBadge)
                }}>
                  {u.role?.replace('_', ' ')}
                </span>
                <span style={{
                  ...tabStyles.statusBadge,
                  backgroundColor: u.is_active ? '#f0fdf4' : '#fef2f2',
                  color:           u.is_active ? '#16a34a' : '#dc2626',
                }}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB 2 — USERS MANAGEMENT
// ─────────────────────────────────────────────────────────────

function UsersTab() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [total,      setTotal]      = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchUsers(); }, [search, roleFilter, activeFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set('search',    search);
      if (roleFilter)   params.set('role',      roleFilter);
      if (activeFilter) params.set('is_active', activeFilter);

      const res = await api.get(`/auth/admin/users/?${params.toString()}`);
      setUsers(res.data.users  || []);
      setTotal(res.data.total  || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (userId) => {
    setActionLoading(userId);
    try {
      const res = await api.put(`/auth/admin/users/${userId}/toggle/`);
      setUsers(prev =>
        prev.map(u => u.id === userId
          ? { ...u, is_active: res.data.is_active }
          : u
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId) => {
    setActionLoading(userId);
    try {
      await api.delete(`/auth/admin/users/${userId}/delete/`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setTotal(prev => prev - 1);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const roleColors = {
    job_seeker: { bg: '#dcfce7', color: '#16a34a' },
    recruiter:  { bg: '#dbeafe', color: '#1d4ed8' },
    admin:      { bg: '#fde8d8', color: '#c2410c' },
  };

  return (
    <div>

      {/* ── Search + filters ── */}
      <div style={tabStyles.filterBar}>
        <div style={tabStyles.searchBox}>
          <span style={tabStyles.searchIcon}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={tabStyles.searchInput}
          />
          {search && (
            <button
              style={tabStyles.clearSearch}
              onClick={() => setSearch('')}
            >✕</button>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={tabStyles.filterSelect}
        >
          <option value="">All Roles</option>
          <option value="job_seeker">Job Seekers</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value)}
          style={tabStyles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* ── Results count ── */}
      <div style={tabStyles.resultsCount}>
        Showing <strong>{users.length}</strong> of <strong>{total}</strong> users
      </div>

      {/* ── Users table ── */}
      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users found"
          text="Try adjusting your search or filters."
        />
      ) : (
        <div style={tabStyles.tableWrapper}>
          <table style={tabStyles.table}>
            <thead>
              <tr>
                {['User', 'Role', 'Applications', 'Jobs Posted', 'Status', 'Joined', 'Actions']
                  .map((h, i) => (
                    <th key={i} style={tabStyles.th}>{h}</th>
                  ))
                }
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const roleStyle = roleColors[u.role] || roleColors.job_seeker;
                return (
                  <tr key={u.id} style={tabStyles.tr}>

                    {/* User info */}
                    <td style={tabStyles.td}>
                      <div style={tabStyles.userCell}>
                        <div style={tabStyles.userAvatar}>
                          {u.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={tabStyles.userName}>{u.full_name}</div>
                          <div style={tabStyles.userEmail}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={tabStyles.td}>
                      <span style={{
                        ...tabStyles.badge,
                        backgroundColor: roleStyle.bg,
                        color:           roleStyle.color,
                      }}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Applications */}
                    <td style={{ ...tabStyles.td, textAlign: 'center' }}>
                      <span style={tabStyles.countBadge}>
                        {u.total_applications}
                      </span>
                    </td>

                    {/* Jobs posted */}
                    <td style={{ ...tabStyles.td, textAlign: 'center' }}>
                      <span style={tabStyles.countBadge}>
                        {u.total_jobs_posted}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={tabStyles.td}>
                      <span style={{
                        ...tabStyles.badge,
                        backgroundColor: u.is_active ? '#f0fdf4' : '#fef2f2',
                        color:           u.is_active ? '#16a34a' : '#dc2626',
                      }}>
                        {u.is_active ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={tabStyles.td}>
                      <span style={tabStyles.dateText}>
                        {new Date(u.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day:   'numeric',
                          year:  'numeric',
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={tabStyles.td}>
                      <div style={tabStyles.actionBtns}>
                        {/* Toggle active */}
                        <button
                          style={{
                            ...tabStyles.toggleBtn,
                            backgroundColor: u.is_active ? '#fef2f2' : '#f0fdf4',
                            color:           u.is_active ? '#dc2626' : '#16a34a',
                            borderColor:     u.is_active ? '#fecaca' : '#bbf7d0',
                            opacity: actionLoading === u.id ? 0.6 : 1,
                          }}
                          onClick={() => handleToggle(u.id)}
                          disabled={actionLoading === u.id}
                          title={u.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {actionLoading === u.id
                            ? '...'
                            : u.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        {/* Delete */}
                        <button
                          style={{
                            ...tabStyles.deleteBtn,
                            opacity: actionLoading === u.id ? 0.6 : 1,
                          }}
                          onClick={() => setConfirmDelete(u)}
                          disabled={actionLoading === u.id}
                          title="Delete user"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div style={tabStyles.modalOverlay}>
          <div style={tabStyles.modal}>
            <div style={tabStyles.modalIcon}>⚠️</div>
            <h3 style={tabStyles.modalTitle}>Delete User</h3>
            <p style={tabStyles.modalText}>
              Are you sure you want to permanently delete{' '}
              <strong>{confirmDelete.full_name}</strong>?
              This will also delete all their jobs and applications.
            </p>
            <div style={tabStyles.modalBtns}>
              <button
                style={tabStyles.modalCancel}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...tabStyles.modalDelete,
                  opacity: actionLoading === confirmDelete.id ? 0.6 : 1,
                }}
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={actionLoading === confirmDelete.id}
              >
                {actionLoading === confirmDelete.id
                  ? 'Deleting...'
                  : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB 3 — JOBS OVERVIEW
// ─────────────────────────────────────────────────────────────

function JobsTab() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');
  const [total,   setTotal]   = useState(0);

  useEffect(() => { fetchJobs(); }, [search, filter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filter) params.set('status', filter);

      const res = await api.get(`/jobs/?${params.toString()}`);
      setJobs(res.data.results || []);
      setTotal(res.data.count  || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    active: { bg: '#dcfce7', color: '#16a34a' },
    closed: { bg: '#fef2f2', color: '#dc2626' },
    draft:  { bg: '#f3f4f6', color: '#6b7280' },
  };

  const typeColors = {
    full_time:  { bg: '#dbeafe', color: '#1d4ed8' },
    part_time:  { bg: '#fef9c3', color: '#a16207' },
    remote:     { bg: '#f3e8ff', color: '#6d28d9' },
    contract:   { bg: '#fde8d8', color: '#c2410c' },
    internship: { bg: '#ecfdf5', color: '#059669' },
  };

  return (
    <div>

      {/* Search + filter */}
      <div style={tabStyles.filterBar}>
        <div style={tabStyles.searchBox}>
          <span style={tabStyles.searchIcon}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            style={tabStyles.searchInput}
          />
          {search && (
            <button
              style={tabStyles.clearSearch}
              onClick={() => setSearch('')}
            >✕</button>
          )}
        </div>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={tabStyles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div style={tabStyles.resultsCount}>
        Showing <strong>{jobs.length}</strong> of <strong>{total}</strong> jobs
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="💼"
          title="No jobs found"
          text="No jobs match your search."
        />
      ) : (
        <div style={tabStyles.tableWrapper}>
          <table style={tabStyles.table}>
            <thead>
              <tr>
                {['Job', 'Company', 'Type', 'Applicants', 'Status', 'Posted', 'Actions']
                  .map((h, i) => (
                    <th key={i} style={tabStyles.th}>{h}</th>
                  ))
                }
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => {
                const statusStyle = statusColors[job.status] || statusColors.active;
                const typeStyle   = typeColors[job.job_type]  || typeColors.full_time;
                return (
                  <tr key={job.id} style={tabStyles.tr}>

                    {/* Job title */}
                    <td style={tabStyles.td}>
                      <div style={tabStyles.jobTitleCell}>
                        <div style={tabStyles.jobAvatar}>
                          {job.company?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={tabStyles.jobTitle}>{job.title}</div>
                          <div style={tabStyles.jobLocation}>
                            📍 {job.location}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td style={tabStyles.td}>
                      <span style={tabStyles.companyText}>
                        {job.company}
                      </span>
                    </td>

                    {/* Type */}
                    <td style={tabStyles.td}>
                      <span style={{
                        ...tabStyles.badge,
                        backgroundColor: typeStyle.bg,
                        color:           typeStyle.color,
                      }}>
                        {job.job_type?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Applicants */}
                    <td style={{ ...tabStyles.td, textAlign: 'center' }}>
                      <span style={tabStyles.countBadge}>
                        {job.total_applicants || 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={tabStyles.td}>
                      <span style={{
                        ...tabStyles.badge,
                        backgroundColor: statusStyle.bg,
                        color:           statusStyle.color,
                      }}>
                        {job.status}
                      </span>
                    </td>

                    {/* Posted */}
                    <td style={tabStyles.td}>
                      <span style={tabStyles.dateText}>
                        {new Date(job.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day:   'numeric',
                          year:  'numeric',
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={tabStyles.td}>
                      <Link
                        to={`/jobs/${job.id}`}
                        style={tabStyles.viewBtn}
                      >
                        View →
                      </Link>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div style={sharedStyles.loadingWrapper}>
      <div style={sharedStyles.spinner} />
      <p style={sharedStyles.loadingText}>Loading...</p>
    </div>
  );
}

function ErrorState({ msg }) {
  return (
    <div style={sharedStyles.errorWrapper}>
      <div style={sharedStyles.errorIcon}>⚠️</div>
      <p style={sharedStyles.errorText}>{msg}</p>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div style={sharedStyles.emptyWrapper}>
      <div style={sharedStyles.emptyIcon}>{icon}</div>
      <h3 style={sharedStyles.emptyTitle}>{title}</h3>
      {text && <p style={sharedStyles.emptyText}>{text}</p>}
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
    maxWidth: '1200px',
    margin:   '0 auto',
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   '28px',
    flexWrap:       'wrap',
    gap:            '16px',
  },
  headerLeft: {},
  adminBadge: {
    display:         'inline-block',
    backgroundColor: '#fde8d8',
    color:           '#c2410c',
    border:          '1px solid #fed7aa',
    borderRadius:    '20px',
    padding:         '4px 14px',
    fontSize:        '12px',
    fontWeight:      '700',
    marginBottom:    '10px',
  },
  title: {
    fontSize:    '28px',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'4px',
  },
  subtitle: {
    fontSize: '14px',
    color:    '#6b7280',
  },
  adminInfo: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    backgroundColor: '#ffffff',
    border:     '1px solid #e5e7eb',
    borderRadius:'12px',
    padding:    '12px 16px',
  },
  adminAvatar: {
    width:           '40px',
    height:          '40px',
    borderRadius:    '50%',
    backgroundColor: '#c2410c',
    color:           '#ffffff',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '800',
    fontSize:        '16px',
    flexShrink:      0,
  },
  adminName: {
    fontWeight: '700',
    fontSize:   '14px',
    color:      '#111827',
  },
  adminRole: {
    fontSize: '12px',
    color:    '#6b7280',
  },
  tabs: {
    display:         'flex',
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    marginBottom:    '24px',
    padding:         '0 8px',
    overflowX:       'auto',
  },
  tab: {
    padding:    '14px 20px',
    border:     'none',
    cursor:     'pointer',
    fontSize:   '14px',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  content: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '24px',
  },
};

const tabStyles = {
  // Big stats
  bigStatRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap:                 '16px',
    marginBottom:        '24px',
  },
  bigStatCard: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
    textAlign:       'center',
  },
  bigStatIcon: {
    width:           '48px',
    height:          '48px',
    borderRadius:    '12px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontSize:        '22px',
    margin:          '0 auto 12px',
  },
  bigStatNum: {
    fontSize:    '32px',
    fontWeight:  '800',
    lineHeight:  '1',
    marginBottom:'6px',
  },
  bigStatLabel: {
    fontSize:  '13px',
    color:     '#6b7280',
    fontWeight:'500',
  },
  // Two col grid
  twoColGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap:                 '20px',
    marginBottom:        '20px',
  },
  // Card
  card: {
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
    marginBottom:    '20px',
  },
  cardTitle: {
    fontSize:    '15px',
    fontWeight:  '700',
    color:       '#111827',
    marginBottom:'16px',
  },
  cardHeaderRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '16px',
  },
  viewAllBtn: {
    background:     'none',
    border:         'none',
    color:          '#2563eb',
    fontSize:       '13px',
    fontWeight:     '600',
    cursor:         'pointer',
  },
  divider: {
    borderTop:   '1px solid #e5e7eb',
    margin:      '16px 0',
  },
  // Bar chart rows
  barRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    marginBottom:'10px',
  },
  barLabel: {
    fontSize:  '13px',
    color:     '#374151',
    width:     '90px',
    flexShrink:0,
  },
  barTrack: {
    flex:            1,
    height:          '8px',
    backgroundColor: '#e5e7eb',
    borderRadius:    '4px',
    overflow:        'hidden',
  },
  barFill: {
    height:       '100%',
    borderRadius: '4px',
    transition:   'width 0.5s',
  },
  barVal: {
    fontSize:   '13px',
    fontWeight: '700',
    color:      '#374151',
    width:      '28px',
    textAlign:  'right',
    flexShrink: 0,
  },
  // Companies
  companyGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap:                 '12px',
  },
  companyCard: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '10px',
    padding:         '14px',
    textAlign:       'center',
  },
  companyAvatar: {
    width:           '36px',
    height:          '36px',
    borderRadius:    '8px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '800',
    fontSize:        '16px',
    margin:          '0 auto 8px',
  },
  companyName: {
    fontSize:    '13px',
    fontWeight:  '700',
    color:       '#111827',
    marginBottom:'3px',
  },
  companyCount: {
    fontSize: '12px',
    color:    '#6b7280',
  },
  // Recent users
  recentUsersList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
  },
  recentUserRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    flexWrap:   'wrap',
  },
  recentUserAvatar: {
    width:           '36px',
    height:          '36px',
    borderRadius:    '50%',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '700',
    fontSize:        '14px',
    flexShrink:      0,
  },
  recentUserInfo: {
    flex: 1,
    minWidth: '160px',
  },
  recentUserName: {
    fontWeight: '600',
    fontSize:   '14px',
    color:      '#111827',
  },
  recentUserEmail: {
    fontSize: '12px',
    color:    '#6b7280',
  },
  roleBadge: {
    fontSize:     '11px',
    fontWeight:   '600',
    padding:      '3px 10px',
    borderRadius: '20px',
    textTransform:'capitalize',
    whiteSpace:   'nowrap',
  },
  recruiterBadge: {
    backgroundColor: '#dbeafe',
    color:           '#1d4ed8',
  },
  seekerBadge: {
    backgroundColor: '#dcfce7',
    color:           '#16a34a',
  },
  statusBadge: {
    fontSize:     '11px',
    fontWeight:   '600',
    padding:      '3px 10px',
    borderRadius: '20px',
    whiteSpace:   'nowrap',
  },
  // Filter bar
  filterBar: {
    display:      'flex',
    gap:          '10px',
    marginBottom: '16px',
    flexWrap:     'wrap',
  },
  searchBox: {
    flex:            1,
    minWidth:        '200px',
    display:         'flex',
    alignItems:      'center',
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    padding:         '0 12px',
    gap:             '8px',
  },
  searchIcon: {
    fontSize:   '14px',
    flexShrink: 0,
  },
  searchInput: {
    flex:            1,
    border:          'none',
    outline:         'none',
    fontSize:        '14px',
    color:           '#111827',
    padding:         '10px 0',
    backgroundColor: 'transparent',
    fontFamily:      'inherit',
  },
  clearSearch: {
    background:  'none',
    border:      'none',
    color:       '#9ca3af',
    cursor:      'pointer',
    fontSize:    '14px',
    padding:     '0',
    flexShrink:  0,
  },
  filterSelect: {
    padding:         '10px 12px',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    color:           '#374151',
    outline:         'none',
    backgroundColor: '#f9fafb',
    cursor:          'pointer',
    fontFamily:      'inherit',
  },
  resultsCount: {
    fontSize:    '13px',
    color:       '#6b7280',
    marginBottom:'12px',
  },
  // Table
  tableWrapper: {
    overflowX: 'auto',
    border:    '1px solid #e5e7eb',
    borderRadius:'10px',
  },
  table: {
    width:          '100%',
    borderCollapse: 'collapse',
    fontSize:       '13px',
  },
  th: {
    backgroundColor: '#f9fafb',
    padding:         '12px 14px',
    textAlign:       'left',
    fontWeight:      '600',
    color:           '#374151',
    borderBottom:    '1px solid #e5e7eb',
    whiteSpace:      'nowrap',
    fontSize:        '12px',
    textTransform:   'uppercase',
    letterSpacing:   '0.4px',
  },
  tr: {
    borderBottom:    '1px solid #f3f4f6',
    transition:      'background 0.1s',
  },
  td: {
    padding:    '14px',
    color:      '#374151',
    verticalAlign:'middle',
  },
  // User cell
  userCell: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  userAvatar: {
    width:           '34px',
    height:          '34px',
    borderRadius:    '50%',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '700',
    fontSize:        '13px',
    flexShrink:      0,
  },
  userName: {
    fontWeight:   '600',
    fontSize:     '13px',
    color:        '#111827',
    marginBottom: '2px',
  },
  userEmail: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
  badge: {
    fontSize:     '11px',
    fontWeight:   '600',
    padding:      '3px 10px',
    borderRadius: '20px',
    textTransform:'capitalize',
    whiteSpace:   'nowrap',
    display:      'inline-block',
  },
  countBadge: {
    display:         'inline-block',
    backgroundColor: '#f3f4f6',
    color:           '#374151',
    borderRadius:    '20px',
    padding:         '2px 10px',
    fontSize:        '13px',
    fontWeight:      '700',
  },
  dateText: {
    fontSize:  '12px',
    color:     '#9ca3af',
    whiteSpace:'nowrap',
  },
  // Action buttons
  actionBtns: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
  },
  toggleBtn: {
    padding:      '5px 10px',
    border:       '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize:     '12px',
    fontWeight:   '600',
    cursor:       'pointer',
    whiteSpace:   'nowrap',
    transition:   'all 0.15s',
  },
  deleteBtn: {
    padding:         '5px 8px',
    backgroundColor: '#fef2f2',
    color:           '#dc2626',
    border:          '1px solid #fecaca',
    borderRadius:    '6px',
    fontSize:        '13px',
    cursor:          'pointer',
    transition:      'all 0.15s',
  },
  // Jobs tab
  jobTitleCell: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
  },
  jobAvatar: {
    width:           '34px',
    height:          '34px',
    borderRadius:    '8px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '700',
    fontSize:        '13px',
    flexShrink:      0,
  },
  jobTitle: {
    fontWeight:   '600',
    fontSize:     '13px',
    color:        '#111827',
    marginBottom: '2px',
  },
  jobLocation: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
  companyText: {
    fontSize:   '13px',
    color:      '#374151',
    fontWeight: '500',
  },
  viewBtn: {
    padding:         '5px 12px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    border:          '1px solid #bfdbfe',
    borderRadius:    '6px',
    fontSize:        '12px',
    fontWeight:      '600',
    textDecoration:  'none',
    whiteSpace:      'nowrap',
  },
  // Modal
  modalOverlay: {
    position:        'fixed',
    inset:           0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          1000,
    padding:         '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius:    '16px',
    padding:         '32px',
    maxWidth:        '420px',
    width:           '100%',
    textAlign:       'center',
    boxShadow:       '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalIcon: {
    fontSize:     '48px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize:    '20px',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'10px',
  },
  modalText: {
    fontSize:    '14px',
    color:       '#6b7280',
    lineHeight:  '1.6',
    marginBottom:'24px',
  },
  modalBtns: {
    display: 'flex',
    gap:     '10px',
  },
  modalCancel: {
    flex:            1,
    padding:         '11px',
    backgroundColor: '#f9fafb',
    color:           '#374151',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
  modalDelete: {
    flex:            1,
    padding:         '11px',
    backgroundColor: '#dc2626',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '700',
    cursor:          'pointer',
  },
};

const sharedStyles = {
  loadingWrapper: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '60px 0',
    gap:            '12px',
  },
  spinner: {
    width:        '32px',
    height:       '32px',
    border:       '3px solid #e5e7eb',
    borderTop:    '3px solid #2563eb',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color:    '#6b7280',
  },
  errorWrapper: {
    textAlign: 'center',
    padding:   '40px',
  },
  errorIcon: {
    fontSize:     '36px',
    marginBottom: '10px',
  },
  errorText: {
    fontSize: '14px',
    color:    '#dc2626',
  },
  emptyWrapper: {
    textAlign: 'center',
    padding:   '60px 24px',
  },
  emptyIcon: {
    fontSize:     '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize:    '18px',
    fontWeight:  '700',
    color:       '#374151',
    marginBottom:'8px',
  },
  emptyText: {
    fontSize: '14px',
    color:    '#6b7280',
  },
};