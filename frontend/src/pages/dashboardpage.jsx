// src/pages/DashboardPage.jsx
// ─────────────────────────────────────────────────────────────
// Dashboard page for all roles:
//   Job Seeker  → my applications, stats, saved jobs
//   Recruiter   → my jobs, applicants summary, stats
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function DashboardPage() {
  const { user }                        = useAuth();
  const navigate                        = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || (
    user?.role === 'recruiter' ? 'jobs' : 'applications'
  );

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (!user) return null;

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Welcome back, {user.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={styles.subtitle}>
              {user.role === 'recruiter'
                ? 'Manage your job postings and review applicants'
                : 'Track your applications and find new opportunities'}
            </p>
          </div>
          {user.role === 'recruiter' && (
            <Link to="/post-job" style={styles.postBtn}>
              + Post a Job
            </Link>
          )}
          {user.role === 'job_seeker' && (
            <Link to="/jobs" style={styles.postBtn}>
              Browse Jobs
            </Link>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={styles.tabs}>
          {user.role === 'job_seeker' && (
            <>
              <TabBtn label="📋 My Applications" tab="applications" active={activeTab} onClick={handleTab} />
              <TabBtn label="🔖 Saved Jobs"       tab="saved"        active={activeTab} onClick={handleTab} />
              <TabBtn label="📊 Stats"            tab="stats"        active={activeTab} onClick={handleTab} />
            </>
          )}
          {user.role === 'recruiter' && (
            <>
              <TabBtn label="💼 My Jobs"     tab="jobs"       active={activeTab} onClick={handleTab} />
              <TabBtn label="👥 Applicants"  tab="applicants" active={activeTab} onClick={handleTab} />
              <TabBtn label="📊 Stats"       tab="stats"      active={activeTab} onClick={handleTab} />
            </>
          )}
        </div>

        {/* ── Tab Content ── */}
        <div style={styles.content}>
          {user.role === 'job_seeker' && (
            <>
              {activeTab === 'applications' && <MyApplicationsTab />}
              {activeTab === 'saved'        && <SavedJobsTab navigate={navigate} />}
              {activeTab === 'stats'        && <SeekerStatsTab />}
            </>
          )}
          {user.role === 'recruiter' && (
            <>
              {activeTab === 'jobs'       && <MyJobsTab navigate={navigate} />}
              {activeTab === 'applicants' && <AllApplicantsTab navigate={navigate} />}
              {activeTab === 'stats'      && <RecruiterStatsTab />}
            </>
          )}
        </div>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB BUTTON
// ─────────────────────────────────────────────────────────────

function TabBtn({ label, tab, active, onClick }) {
  return (
    <button
      style={{
        ...styles.tab,
        borderBottom:    active === tab ? '2px solid #2563eb' : '2px solid transparent',
        color:           active === tab ? '#2563eb' : '#6b7280',
        fontWeight:      active === tab ? '700' : '500',
        backgroundColor: 'transparent',
      }}
      onClick={() => onClick(tab)}
    >
      {label}
    </button>
  );
}


// ─────────────────────────────────────────────────────────────
// MY APPLICATIONS TAB — Job Seeker
// ─────────────────────────────────────────────────────────────

function MyApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const navigate                        = useNavigate();

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/my/');
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  const statusColors = {
    applied:     { bg: '#f3f4f6', color: '#374151' },
    reviewed:    { bg: '#dbeafe', color: '#1d4ed8' },
    shortlisted: { bg: '#dcfce7', color: '#16a34a' },
    rejected:    { bg: '#fef2f2', color: '#dc2626' },
    hired:       { bg: '#fef9c3', color: '#a16207' },
  };

  const scoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#3b82f6';
    if (score >= 30) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Summary cards */}
      <div style={tabStyles.statRow}>
        {[
          { label: 'Total Applied', value: applications.length,                                      color: '#2563eb' },
          { label: 'Shortlisted',   value: applications.filter(a=>a.status==='shortlisted').length,  color: '#16a34a' },
          { label: 'Hired',         value: applications.filter(a=>a.status==='hired').length,         color: '#a16207' },
          { label: 'Rejected',      value: applications.filter(a=>a.status==='rejected').length,      color: '#dc2626' },
        ].map((s, i) => (
          <div key={i} style={tabStyles.statCard}>
            <div style={{ ...tabStyles.statNum, color: s.color }}>{s.value}</div>
            <div style={tabStyles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div style={tabStyles.filterRow}>
        {['all','applied','reviewed','shortlisted','rejected','hired'].map(f => (
          <button
            key={f}
            style={{
              ...tabStyles.chip,
              backgroundColor: filter === f ? '#2563eb' : '#f3f4f6',
              color:           filter === f ? '#ffffff' : '#374151',
              borderColor:     filter === f ? '#2563eb' : '#e5e7eb',
            }}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title={filter === 'all' ? "No applications yet" : `No ${filter} applications`}
          text={filter === 'all' ? "Start applying to jobs to track them here." : ""}
          btnText="Browse Jobs"
          btnLink="/jobs"
        />
      ) : (
        <div style={tabStyles.list}>
          {filtered.map(app => (
            <div
              key={app.id}
              style={tabStyles.appCard}
              onClick={() => navigate(`/jobs/${app.job?.id}`)}
            >
              {/* Left */}
              <div style={tabStyles.appLeft}>
                <div style={tabStyles.appAvatar}>
                  {app.job?.company?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={tabStyles.appTitle}>{app.job?.title}</div>
                  <div style={tabStyles.appCompany}>
                    🏢 {app.job?.company} · 📍 {app.job?.location}
                  </div>
                  <div style={tabStyles.appDate}>
                    Applied {new Date(app.applied_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Right */}
              <div style={tabStyles.appRight}>
                {/* AI Score */}
                <div style={tabStyles.aiScore}>
                  <span style={{
                    ...tabStyles.aiScoreNum,
                    color: scoreColor(parseFloat(app.ai_score)),
                  }}>
                    {parseFloat(app.ai_score).toFixed(0)}%
                  </span>
                  <span style={tabStyles.aiScoreLabel}>AI Match</span>
                </div>

                {/* Status badge */}
                <span style={{
                  ...tabStyles.statusBadge,
                  backgroundColor: statusColors[app.status]?.bg    || '#f3f4f6',
                  color:           statusColors[app.status]?.color  || '#374151',
                }}>
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// SAVED JOBS TAB — Job Seeker
// ─────────────────────────────────────────────────────────────

function SavedJobsTab({ navigate }) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { fetchSaved(); }, []);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs/saved/');
      setSavedJobs(res.data.saved_jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (e, jobId) => {
    e.stopPropagation();
    try {
      await api.post(`/jobs/${jobId}/save/`);
      setSavedJobs(prev => prev.filter(s => s.job.id !== jobId));
    } catch (err) {
      console.error(err);
    }
  };

  const typeColors = {
    full_time:  { bg: '#dcfce7', color: '#16a34a' },
    part_time:  { bg: '#fef9c3', color: '#a16207' },
    remote:     { bg: '#dbeafe', color: '#1d4ed8' },
    contract:   { bg: '#fde8d8', color: '#c2410c' },
    internship: { bg: '#f3e8ff', color: '#6d28d9' },
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={tabStyles.sectionHeader}>
        <h3 style={tabStyles.sectionTitle}>
          🔖 Saved Jobs
          <span style={tabStyles.count}>{savedJobs.length}</span>
        </h3>
      </div>

      {savedJobs.length === 0 ? (
        <EmptyState
          icon="🔖"
          title="No saved jobs"
          text="Bookmark jobs you like to apply later."
          btnText="Browse Jobs"
          btnLink="/jobs"
        />
      ) : (
        <div style={tabStyles.grid}>
          {savedJobs.map(saved => {
            const job       = saved.job;
            const typeStyle = typeColors[job.job_type] || typeColors.full_time;
            return (
              <div
                key={saved.id}
                style={tabStyles.savedCard}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div style={tabStyles.savedTop}>
                  <div style={tabStyles.savedAvatar}>
                    {job.company?.charAt(0).toUpperCase()}
                  </div>
                  <button
                    style={tabStyles.unsaveBtn}
                    onClick={(e) => handleUnsave(e, job.id)}
                    title="Remove bookmark"
                  >
                    🔖
                  </button>
                </div>
                <div style={tabStyles.savedTitle}>{job.title}</div>
                <div style={tabStyles.savedCompany}>{job.company}</div>
                <div style={tabStyles.savedLocation}>📍 {job.location}</div>
                <div style={tabStyles.savedFooter}>
                  <span style={{
                    ...tabStyles.typeBadge,
                    backgroundColor: typeStyle.bg,
                    color:           typeStyle.color,
                  }}>
                    {job.job_type?.replace('_', ' ')}
                  </span>
                  {job.salary_min && (
                    <span style={tabStyles.salary}>
                      💰 ${job.salary_min.toLocaleString()}+
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// SEEKER STATS TAB
// ─────────────────────────────────────────────────────────────

function SeekerStatsTab() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/my/');
      const apps = res.data.applications || [];

      const avgScore = apps.length > 0
        ? (apps.reduce((sum, a) => sum + parseFloat(a.ai_score), 0) / apps.length).toFixed(1)
        : 0;

      const topScore = apps.length > 0
        ? Math.max(...apps.map(a => parseFloat(a.ai_score))).toFixed(1)
        : 0;

      setStats({
        total:       apps.length,
        applied:     apps.filter(a => a.status === 'applied').length,
        reviewed:    apps.filter(a => a.status === 'reviewed').length,
        shortlisted: apps.filter(a => a.status === 'shortlisted').length,
        rejected:    apps.filter(a => a.status === 'rejected').length,
        hired:       apps.filter(a => a.status === 'hired').length,
        avgScore,
        topScore,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!stats)  return null;

  return (
    <div>
      <h3 style={tabStyles.sectionTitle}>📊 Application Statistics</h3>

      {/* Big stats */}
      <div style={tabStyles.bigStatRow}>
        {[
          { icon: '📋', label: 'Total Applied',    value: stats.total,       color: '#2563eb' },
          { icon: '⭐', label: 'Shortlisted',      value: stats.shortlisted, color: '#16a34a' },
          { icon: '✅', label: 'Hired',            value: stats.hired,        color: '#a16207' },
          { icon: '🤖', label: 'Avg AI Score',     value: `${stats.avgScore}%`, color: '#8b5cf6' },
          { icon: '🏆', label: 'Top AI Score',     value: `${stats.topScore}%`, color: '#10b981' },
        ].map((s, i) => (
          <div key={i} style={tabStyles.bigStatCard}>
            <div style={tabStyles.bigStatIcon}>{s.icon}</div>
            <div style={{ ...tabStyles.bigStatNum, color: s.color }}>{s.value}</div>
            <div style={tabStyles.bigStatLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div style={tabStyles.breakdownCard}>
        <h4 style={tabStyles.breakdownTitle}>Status Breakdown</h4>
        {[
          { label: 'Applied',     value: stats.applied,     color: '#6b7280', max: stats.total },
          { label: 'Reviewed',    value: stats.reviewed,    color: '#2563eb', max: stats.total },
          { label: 'Shortlisted', value: stats.shortlisted, color: '#16a34a', max: stats.total },
          { label: 'Rejected',    value: stats.rejected,    color: '#dc2626', max: stats.total },
          { label: 'Hired',       value: stats.hired,       color: '#a16207', max: stats.total },
        ].map((item, i) => (
          <div key={i} style={tabStyles.breakdownRow}>
            <div style={tabStyles.breakdownLabel}>{item.label}</div>
            <div style={tabStyles.breakdownBar}>
              <div style={{
                ...tabStyles.breakdownFill,
                width:           `${item.max > 0 ? (item.value / item.max) * 100 : 0}%`,
                backgroundColor: item.color,
              }} />
            </div>
            <div style={tabStyles.breakdownVal}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={tabStyles.tipsCard}>
        <h4 style={tabStyles.tipsTitle}>💡 Tips to Improve</h4>
        <ul style={tabStyles.tipsList}>
          <li>Keep your skills section updated on your profile</li>
          <li>Write a tailored cover letter for each application</li>
          <li>Upload a clean, well-formatted PDF resume</li>
          <li>Apply to jobs where your AI match score is 50%+</li>
        </ul>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// MY JOBS TAB — Recruiter
// ─────────────────────────────────────────────────────────────

function MyJobsTab({ navigate }) {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs/my-jobs/');
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (e, jobId, currentStatus) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
      await api.put(`/jobs/${jobId}/update/`, { status: newStatus });
      setJobs(prev =>
        prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filter === 'all'
    ? jobs
    : jobs.filter(j => j.status === filter);

  const statusColors = {
    active: { bg: '#dcfce7', color: '#16a34a' },
    closed: { bg: '#fef2f2', color: '#dc2626' },
    draft:  { bg: '#f3f4f6', color: '#6b7280' },
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Summary */}
      <div style={tabStyles.statRow}>
        {[
          { label: 'Total Jobs',  value: jobs.length,                              color: '#2563eb' },
          { label: 'Active',      value: jobs.filter(j=>j.status==='active').length, color: '#16a34a' },
          { label: 'Closed',      value: jobs.filter(j=>j.status==='closed').length, color: '#dc2626' },
          { label: 'Total Apps',  value: jobs.reduce((s,j) => s + (j.total_applicants||0), 0), color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} style={tabStyles.statCard}>
            <div style={{ ...tabStyles.statNum, color: s.color }}>{s.value}</div>
            <div style={tabStyles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={tabStyles.filterRow}>
        {['all','active','closed','draft'].map(f => (
          <button
            key={f}
            style={{
              ...tabStyles.chip,
              backgroundColor: filter === f ? '#2563eb' : '#f3f4f6',
              color:           filter === f ? '#ffffff' : '#374151',
              borderColor:     filter === f ? '#2563eb' : '#e5e7eb',
            }}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <Link to="/post-job" style={tabStyles.newJobBtn}>
          + New Job
        </Link>
      </div>

{filtered.length === 0 ? (
        <EmptyState
          icon="💼"
          title="No jobs posted yet"
          text="Post your first job to start receiving applications."
          btnText="Post a Job"
          btnLink="/post-job"
        />
      ) : (
        <div style={tabStyles.list}>
          {filtered.map(job => {
            const statusStyle = statusColors[job.status] || statusColors.draft;
            return (
              <div
                key={job.id}
                style={tabStyles.jobCard}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div style={tabStyles.jobCardLeft}>
                  <div style={tabStyles.jobCardAvatar}>
                    {job.company?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={tabStyles.jobCardTitle}>{job.title}</div>
                    <div style={tabStyles.jobCardMeta}>
                      🏢 {job.company} · 📍 {job.location} · {job.job_type?.replace('_',' ')}
                    </div>
                    <div style={tabStyles.jobCardDate}>
                      Posted {new Date(job.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <div style={tabStyles.jobCardRight}>
                  <div style={tabStyles.jobCardApps}>
                    <span style={tabStyles.appCount}>
                      {job.total_applicants || 0}
                    </span>
                    <span style={tabStyles.appCountLabel}>applicants</span>
                  </div>

                  <span style={{
                    ...tabStyles.statusBadge,
                    backgroundColor: statusStyle.bg,
                    color:           statusStyle.color,
                  }}>
                    {job.status}
                  </span>

                  <div style={tabStyles.jobActions}>
                    <button
                      style={tabStyles.toggleBtn}
                      onClick={(e) => handleToggleStatus(e, job.id, job.status)}
                    >
                      {job.status === 'active' ? 'Close' : 'Reopen'}
                    </button>
                    <Link
                      to={`/post-job/edit/${job.id}`}
                      style={tabStyles.editBtn}
                      onClick={e => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ALL APPLICANTS TAB — Recruiter
// ─────────────────────────────────────────────────────────────

function AllApplicantsTab({ navigate }) {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs/my-jobs/');
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const jobsWithApps = jobs.filter(j => j.total_applicants > 0);

  return (
    <div>
      <div style={tabStyles.sectionHeader}>
        <h3 style={tabStyles.sectionTitle}>
          👥 Applicants Overview
        </h3>
        <p style={tabStyles.sectionSubtitle}>
          Click on a job to view and manage its applicants
        </p>
      </div>

      {jobsWithApps.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No applicants yet"
          text="Applicants will appear here once someone applies to your jobs."
          btnText="View My Jobs"
          btnLink="/dashboard?tab=jobs"
        />
      ) : (
        <div style={tabStyles.list}>
          {jobsWithApps.map(job => (
            <div
              key={job.id}
              style={tabStyles.appOverviewCard}
              onClick={() => navigate(`/jobs/${job.id}?tab=applicants`)}
            >
              <div style={tabStyles.appOverviewLeft}>
                <div style={tabStyles.appOverviewAvatar}>
                  {job.company?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={tabStyles.appOverviewTitle}>{job.title}</div>
                  <div style={tabStyles.appOverviewMeta}>
                    🏢 {job.company} · 📍 {job.location}
                  </div>
                </div>
              </div>
              <div style={tabStyles.appOverviewRight}>
                <div style={tabStyles.bigAppCount}>
                  {job.total_applicants}
                </div>
                <div style={tabStyles.bigAppLabel}>applicants</div>
                <span style={tabStyles.viewBtn}>View →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// RECRUITER STATS TAB
// ─────────────────────────────────────────────────────────────

function RecruiterStatsTab() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs/my-jobs/');
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalApps = jobs.reduce((s, j) => s + (j.total_applicants || 0), 0);

  return (
    <div>
      <h3 style={tabStyles.sectionTitle}>📊 Recruiter Statistics</h3>

      <div style={tabStyles.bigStatRow}>
        {[
          { icon: '💼', label: 'Jobs Posted',   value: jobs.length,                                color: '#2563eb' },
          { icon: '✅', label: 'Active Jobs',   value: jobs.filter(j=>j.status==='active').length, color: '#16a34a' },
          { icon: '👥', label: 'Total Applicants', value: totalApps,                               color: '#8b5cf6' },
          { icon: '📈', label: 'Avg per Job',   value: jobs.length > 0
              ? (totalApps / jobs.length).toFixed(1)
              : 0,                                                                                   color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={tabStyles.bigStatCard}>
            <div style={tabStyles.bigStatIcon}>{s.icon}</div>
            <div style={{ ...tabStyles.bigStatNum, color: s.color }}>{s.value}</div>
            <div style={tabStyles.bigStatLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top jobs by applicants */}
      {jobs.length > 0 && (
        <div style={tabStyles.breakdownCard}>
          <h4 style={tabStyles.breakdownTitle}>Top Jobs by Applicants</h4>
          {[...jobs]
            .sort((a,b) => (b.total_applicants||0) - (a.total_applicants||0))
            .slice(0, 5)
            .map((job, i) => (
              <div key={i} style={tabStyles.breakdownRow}>
                <div style={tabStyles.breakdownLabel}>{job.title}</div>
                <div style={tabStyles.breakdownBar}>
                  <div style={{
                    ...tabStyles.breakdownFill,
                    width: totalApps > 0
                      ? `${((job.total_applicants||0) / totalApps) * 100}%`
                      : '0%',
                    backgroundColor: '#2563eb',
                  }} />
                </div>
                <div style={tabStyles.breakdownVal}>
                  {job.total_applicants || 0}
                </div>
              </div>
            ))
          }
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

function EmptyState({ icon, title, text, btnText, btnLink }) {
  return (
    <div style={sharedStyles.empty}>
      <div style={sharedStyles.emptyIcon}>{icon}</div>
      <h3 style={sharedStyles.emptyTitle}>{title}</h3>
      {text && <p style={sharedStyles.emptyText}>{text}</p>}
      {btnText && btnLink && (
        <Link to={btnLink} style={sharedStyles.emptyBtn}>
          {btnText}
        </Link>
      )}
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
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   '24px',
    flexWrap:       'wrap',
    gap:            '12px',
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
  postBtn: {
    padding:         '10px 20px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    borderRadius:    '8px',
    fontWeight:      '600',
    fontSize:        '14px',
    textDecoration:  'none',
    border:          'none',
    cursor:          'pointer',
    whiteSpace:      'nowrap',
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
    padding:    '14px 16px',
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
  // Stat row
  statRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap:                 '12px',
    marginBottom:        '20px',
  },
  statCard: {
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '10px',
    padding:         '16px',
    textAlign:       'center',
  },
  statNum: {
    fontSize:    '28px',
    fontWeight:  '800',
    marginBottom:'4px',
  },
  statLabel: {
    fontSize: '12px',
    color:    '#6b7280',
    fontWeight:'500',
  },
  // Filter row
  filterRow: {
    display:      'flex',
    flexWrap:     'wrap',
    gap:          '8px',
    marginBottom: '20px',
    alignItems:   'center',
  },
  chip: {
    padding:      '6px 14px',
    borderRadius: '20px',
    border:       '1px solid #e5e7eb',
    fontSize:     '13px',
    fontWeight:   '500',
    cursor:       'pointer',
    transition:   'all 0.15s',
  },
  newJobBtn: {
    padding:         '6px 14px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    borderRadius:    '20px',
    fontSize:        '13px',
    fontWeight:      '600',
    textDecoration:  'none',
    marginLeft:      'auto',
  },
  // List
  list: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
  // Application card
  appCard: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '16px',
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '10px',
    cursor:          'pointer',
    transition:      'all 0.15s',
    flexWrap:        'wrap',
    gap:             '12px',
  },
  appLeft: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '12px',
  },
  appAvatar: {
    width:           '44px',
    height:          '44px',
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
  appTitle: {
    fontWeight:   '700',
    fontSize:     '15px',
    color:        '#111827',
    marginBottom: '3px',
  },
  appCompany: {
    fontSize:     '13px',
    color:        '#6b7280',
    marginBottom: '3px',
  },
  appDate: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
  appRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  aiScore: {
    textAlign: 'center',
  },
  aiScoreNum: {
    display:    'block',
    fontSize:   '20px',
    fontWeight: '800',
  },
  aiScoreLabel: {
    display:  'block',
    fontSize: '10px',
    color:    '#9ca3af',
  },
  statusBadge: {
    fontSize:     '12px',
    fontWeight:   '600',
    padding:      '4px 12px',
    borderRadius: '20px',
    textTransform:'capitalize',
    whiteSpace:   'nowrap',
  },
  // Saved jobs grid
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap:                 '16px',
  },
  savedCard: {
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '16px',
    cursor:          'pointer',
    transition:      'all 0.2s',
  },
  savedTop: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   '10px',
  },
  savedAvatar: {
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
  },
  unsaveBtn: {
    background:  'none',
    border:      'none',
    fontSize:    '18px',
    cursor:      'pointer',
    opacity:     0.7,
  },
  savedTitle: {
    fontWeight:   '700',
    fontSize:     '14px',
    color:        '#111827',
    marginBottom: '4px',
  },
  savedCompany: {
    fontSize:     '13px',
    color:        '#374151',
    fontWeight:   '600',
    marginBottom: '2px',
  },
  savedLocation: {
    fontSize:     '12px',
    color:        '#9ca3af',
    marginBottom: '10px',
  },
  savedFooter: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
    flexWrap:   'wrap',
  },
  typeBadge: {
    fontSize:     '11px',
    fontWeight:   '600',
    padding:      '2px 8px',
    borderRadius: '20px',
    textTransform:'capitalize',
  },
  salary: {
    fontSize:   '12px',
    color:      '#16a34a',
    fontWeight: '600',
  },
  // Section header
  sectionHeader: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize:    '18px',
    fontWeight:  '700',
    color:       '#111827',
    display:     'flex',
    alignItems:  'center',
    gap:         '10px',
    marginBottom:'4px',
  },
  sectionSubtitle: {
    fontSize: '13px',
    color:    '#6b7280',
  },
  count: {
    fontSize:        '13px',
    fontWeight:      '500',
    color:           '#6b7280',
    backgroundColor: '#f3f4f6',
    padding:         '2px 8px',
    borderRadius:    '20px',
  },
  // Big stats
  bigStatRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap:                 '16px',
    marginBottom:        '24px',
  },
  bigStatCard: {
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
    textAlign:       'center',
  },
  bigStatIcon: {
    fontSize:     '28px',
    marginBottom: '8px',
  },
  bigStatNum: {
    fontSize:    '32px',
    fontWeight:  '800',
    lineHeight:  '1',
    marginBottom:'6px',
  },
  bigStatLabel: {
    fontSize: '13px',
    color:    '#6b7280',
    fontWeight:'500',
  },
  // Breakdown
  breakdownCard: {
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
    marginBottom:    '16px',
  },
  breakdownTitle: {
    fontSize:    '15px',
    fontWeight:  '700',
    color:       '#111827',
    marginBottom:'16px',
  },
  breakdownRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    marginBottom:'10px',
  },
  breakdownLabel: {
    fontSize:  '13px',
    color:     '#374151',
    width:     '100px',
    flexShrink:0,
  },
  breakdownBar: {
    flex:            1,
    height:          '8px',
    backgroundColor: '#e5e7eb',
    borderRadius:    '4px',
    overflow:        'hidden',
  },
  breakdownFill: {
    height:       '100%',
    borderRadius: '4px',
    transition:   'width 0.5s',
  },
  breakdownVal: {
    fontSize:   '13px',
    fontWeight: '700',
    color:      '#374151',
    width:      '24px',
    textAlign:  'right',
    flexShrink: 0,
  },
  // Tips
  tipsCard: {
    backgroundColor: '#eff6ff',
    border:          '1px solid #bfdbfe',
    borderRadius:    '12px',
    padding:         '20px',
  },
  tipsTitle: {
    fontSize:    '15px',
    fontWeight:  '700',
    color:       '#1d4ed8',
    marginBottom:'12px',
  },
  tipsList: {
    paddingLeft: '16px',
    display:     'flex',
    flexDirection:'column',
    gap:         '6px',
  },
  // Jobs tab
  jobCard: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '16px',
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '10px',
    cursor:          'pointer',
    transition:      'all 0.15s',
    flexWrap:        'wrap',
    gap:             '12px',
  },
  jobCardLeft: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '12px',
  },
  jobCardAvatar: {
    width:           '44px',
    height:          '44px',
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
  jobCardTitle: {
    fontWeight:   '700',
    fontSize:     '15px',
    color:        '#111827',
    marginBottom: '3px',
  },
  jobCardMeta: {
    fontSize:     '13px',
    color:        '#6b7280',
    marginBottom: '3px',
    textTransform:'capitalize',
  },
  jobCardDate: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
  jobCardRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    flexWrap:   'wrap',
  },
  jobCardApps: {
    textAlign: 'center',
  },
  appCount: {
    display:    'block',
    fontSize:   '20px',
    fontWeight: '800',
    color:      '#2563eb',
  },
  appCountLabel: {
    display:  'block',
    fontSize: '11px',
    color:    '#9ca3af',
  },
  jobActions: {
    display: 'flex',
    gap:     '6px',
  },
  toggleBtn: {
    padding:         '6px 12px',
    backgroundColor: '#f9fafb',
    color:           '#374151',
    border:          '1px solid #e5e7eb',
    borderRadius:    '6px',
    fontSize:        '12px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
  editBtn: {
    padding:         '6px 12px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    border:          '1px solid #bfdbfe',
    borderRadius:    '6px',
    fontSize:        '12px',
    fontWeight:      '600',
    textDecoration:  'none',
    cursor:          'pointer',
  },
  // Applicants overview
  appOverviewCard: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '16px',
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '10px',
    cursor:          'pointer',
    transition:      'all 0.15s',
  },
  appOverviewLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  appOverviewAvatar: {
    width:           '44px',
    height:          '44px',
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
  appOverviewTitle: {
    fontWeight:   '700',
    fontSize:     '15px',
    color:        '#111827',
    marginBottom: '3px',
  },
  appOverviewMeta: {
    fontSize: '13px',
    color:    '#6b7280',
  },
  appOverviewRight: {
    textAlign:  'right',
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  bigAppCount: {
    fontSize:   '28px',
    fontWeight: '800',
    color:      '#2563eb',
  },
  bigAppLabel: {
    fontSize: '12px',
    color:    '#9ca3af',
  },
  viewBtn: {
    fontSize:        '13px',
    fontWeight:      '600',
    color:           '#2563eb',
    backgroundColor: '#eff6ff',
    padding:         '6px 12px',
    borderRadius:    '6px',
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
  empty: {
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
    fontSize:    '14px',
    color:       '#6b7280',
    marginBottom:'20px',
  },
  emptyBtn: {
    display:         'inline-block',
    padding:         '10px 24px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    borderRadius:    '8px',
    fontWeight:      '600',
    fontSize:        '14px',
    textDecoration:  'none',
  },
};