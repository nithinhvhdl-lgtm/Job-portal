// src/pages/JobDetailPage.jsx
// ─────────────────────────────────────────────────────────────
// Single job detail page with:
//   - Full job info
//   - Apply form (job seeker)
//   - AI score result after applying
//   - Save/unsave job
//   - Applicants list (recruiter)
//   - Edit/delete job (recruiter owner)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function JobDetailPage() {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  // ── State ─────────────────────────────────────────────────
  const [job,          setJob]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // Apply form
  const [coverLetter,  setCoverLetter]  = useState('');
  const [resumeFile,   setResumeFile]   = useState(null);
  const [applying,     setApplying]     = useState(false);
  const [applyError,   setApplyError]   = useState('');
  const [applyResult,  setApplyResult]  = useState(null);
  const [showApplyForm,setShowApplyForm]= useState(false);

  // Applicants (recruiter)
  const [applicants,   setApplicants]   = useState([]);
  const [appStats,     setAppStats]     = useState(null);
  const [loadingApps,  setLoadingApps]  = useState(false);
  const [activeTab,    setActiveTab]    = useState('details');

  // Save job
  const [saving,       setSaving]       = useState(false);

  // Delete
  const [deleting,     setDeleting]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // ── Fetch job ─────────────────────────────────────────────

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${id}/`);
      setJob(res.data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'Job not found or no longer available.'
          : 'Failed to load job. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    setLoadingApps(true);
    try {
      const res = await api.get(`/jobs/${id}/applications/`);
      setApplicants(res.data.applications || []);
      setAppStats(res.data.stats || null);
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    setApplyError('');

    try {
      const formData = new FormData();
      formData.append('cover_letter', coverLetter);
      if (resumeFile) formData.append('resume', resumeFile);

      const res = await api.post(`/jobs/${id}/apply/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setApplyResult(res.data);
      setShowApplyForm(false);
      // Refresh job to update has_applied
      fetchJob();

    } catch (err) {
      setApplyError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to submit application. Please try again.'
      );
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    try {
      const res = await api.post(`/jobs/${id}/save/`);
      setJob(prev => ({ ...prev, is_saved: res.data.saved }));
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/jobs/${id}/delete/`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      await api.put(`/applications/${appId}/status/`, { status: newStatus });
      // Update locally
      setApplicants(prev =>
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      );
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // ── Tab change ────────────────────────────────────────────

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'applicants' && applicants.length === 0) {
      fetchApplicants();
    }
  };

  // ── Helpers ───────────────────────────────────────────────

  const isOwner = user && job && user.role === 'recruiter'
    && job.recruiter?.id === user.id;

  const daysAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30)  return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const typeColors = {
    full_time:  { bg: '#dcfce7', color: '#16a34a' },
    part_time:  { bg: '#fef9c3', color: '#a16207' },
    remote:     { bg: '#dbeafe', color: '#1d4ed8' },
    contract:   { bg: '#fde8d8', color: '#c2410c' },
    internship: { bg: '#f3e8ff', color: '#6d28d9' },
  };

  const scoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#3b82f6';
    if (score >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const statusColors = {
    applied:     { bg: '#f3f4f6', color: '#374151' },
    reviewed:    { bg: '#dbeafe', color: '#1d4ed8' },
    shortlisted: { bg: '#dcfce7', color: '#16a34a' },
    rejected:    { bg: '#fef2f2', color: '#dc2626' },
    hired:       { bg: '#fef9c3', color: '#a16207' },
  };

  // ── Loading state ─────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading job...</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────

  if (error) {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorIcon}>😕</div>
        <h2 style={styles.errorTitle}>{error}</h2>
        <button
          style={styles.backBtn}
          onClick={() => navigate('/jobs')}
        >
          ← Back to Jobs
        </button>
      </div>
    );
  }

  if (!job) return null;

  const typeStyle = typeColors[job.job_type] || typeColors.full_time;

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* ── Breadcrumb ── */}
        <div style={styles.breadcrumb}>
          <Link to="/jobs" style={styles.breadcrumbLink}>
            ← Back to Jobs
          </Link>
        </div>

        <div style={styles.layout}>

          {/* ════════════════════════════════════════════════ */}
          {/* LEFT COLUMN — Main content                      */}
          {/* ════════════════════════════════════════════════ */}
          <div style={styles.mainCol}>

            {/* ── Job Header Card ── */}
            <div style={styles.card}>

              <div style={styles.jobHeader}>
                {/* Company avatar */}
                <div style={styles.companyAvatar}>
                  {job.company?.charAt(0).toUpperCase()}
                </div>

                <div style={styles.jobHeaderInfo}>
                  <h1 style={styles.jobTitle}>{job.title}</h1>
                  <div style={styles.jobMeta}>
                    <span style={styles.company}>🏢 {job.company}</span>
                    <span style={styles.metaDot}>·</span>
                    <span style={styles.location}>📍 {job.location}</span>
                    <span style={styles.metaDot}>·</span>
                    <span style={styles.posted}>🕐 {daysAgo(job.created_at)}</span>
                  </div>
                  <div style={styles.badgeRow}>
                    <span style={{
                      ...styles.typeBadge,
                      backgroundColor: typeStyle.bg,
                      color:           typeStyle.color,
                    }}>
                      {job.job_type?.replace('_', ' ')}
                    </span>
                    {job.status === 'closed' && (
                      <span style={styles.closedBadge}>Closed</span>
                    )}
                    {job.has_applied && (
                      <span style={styles.appliedBadge}>✅ Applied</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Salary */}
              {job.salary_min && (
                <div style={styles.salaryBanner}>
                  💰 <strong>
                    ${job.salary_min.toLocaleString()}
                    {job.salary_max
                      ? ` — $${job.salary_max.toLocaleString()}`
                      : '+'}
                  </strong> per year
                </div>
              )}

              {/* Deadline */}
              {job.deadline && (
                <div style={styles.deadlineBanner}>
                  📅 Application deadline:{' '}
                  <strong>
                    {new Date(job.deadline).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </strong>
                </div>
              )}

            </div>

            {/* ── Tabs (recruiter only) ── */}
            {isOwner && (
              <div style={styles.tabs}>
                {['details', 'applicants'].map(tab => (
                  <button
                    key={tab}
                    style={{
                      ...styles.tab,
                      borderBottom: activeTab === tab
                        ? '2px solid #2563eb' : '2px solid transparent',
                      color: activeTab === tab ? '#2563eb' : '#6b7280',
                      fontWeight: activeTab === tab ? '700' : '500',
                    }}
                    onClick={() => handleTabChange(tab)}
                  >
                    {tab === 'details'    ? '📄 Job Details' : ''}
                    {tab === 'applicants' ? `👥 Applicants (${appStats?.total ?? job.total_applicants ?? 0})` : ''}
                  </button>
                ))}
              </div>
            )}

            {/* ── Details Tab ── */}
            {activeTab === 'details' && (
              <>
                {/* Description */}
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>Job Description</h2>
                  <div style={styles.jobText}>
                    {job.description?.split('\n').map((line, i) => (
                      <p key={i} style={{ marginBottom: '10px' }}>{line}</p>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div style={styles.card}>
                  <h2 style={styles.sectionTitle}>Requirements</h2>
                  <div style={styles.jobText}>
                    {job.requirements?.split('\n').map((line, i) => (
                      <div key={i} style={styles.reqItem}>
                        <span style={styles.reqBullet}>▸</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Applicants Tab (recruiter owner) ── */}
            {activeTab === 'applicants' && isOwner && (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>
                  Applicants
                  <span style={styles.sectionCount}>
                    {appStats?.total || 0} total
                  </span>
                </h2>

                {/* Stats row */}
                {appStats && (
                  <div style={styles.appStatsRow}>
                    {[
                      { label: 'Applied',     value: appStats.applied,     color: '#6b7280' },
                      { label: 'Reviewed',    value: appStats.reviewed,    color: '#2563eb' },
                      { label: 'Shortlisted', value: appStats.shortlisted, color: '#16a34a' },
                      { label: 'Rejected',    value: appStats.rejected,    color: '#dc2626' },
                      { label: 'Hired',       value: appStats.hired,       color: '#a16207' },
                    ].map((s, i) => (
                      <div key={i} style={styles.appStat}>
                        <div style={{ ...styles.appStatNum, color: s.color }}>
                          {s.value}
                        </div>
                        <div style={styles.appStatLabel}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {loadingApps ? (
                  <div style={styles.loadingRow}>
                    <div style={styles.miniSpinner} />
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      Loading applicants...
                    </span>
                  </div>
                ) : applicants.length === 0 ? (
                  <div style={styles.emptyApps}>
                    <p>No applications yet.</p>
                  </div>
                ) : (
                  <div style={styles.applicantsList}>
                    {applicants.map(app => (
                      <ApplicantCard
                        key={app.id}
                        app={app}
                        onStatusUpdate={handleStatusUpdate}
                        statusColors={statusColors}
                        scoreColor={scoreColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN — Sidebar                          */}
          {/* ════════════════════════════════════════════════ */}
          <div style={styles.sidebar}>

            {/* ── AI Score Result (after applying) ── */}
            {applyResult && (
              <div style={{
                ...styles.sideCard,
                border: `2px solid ${scoreColor(applyResult.ai_score)}`,
                backgroundColor: '#f0fdf4',
              }}>
                <h3 style={styles.sideCardTitle}>🤖 AI Match Result</h3>
                <div style={styles.scoreCircle}>
                  <div style={{
                    ...styles.scoreNum,
                    color: scoreColor(applyResult.ai_score),
                  }}>
                    {applyResult.ai_score}%
                  </div>
                  <div style={styles.scoreLabel}>
                    {applyResult.score_label}
                  </div>
                </div>
                <div style={styles.scoreBar}>
                  <div style={{
                    ...styles.scoreBarFill,
                    width:           `${applyResult.ai_score}%`,
                    backgroundColor: scoreColor(applyResult.ai_score),
                  }} />
                </div>
                <p style={styles.applySuccess}>
                  ✅ Application submitted successfully!
                </p>
              </div>
            )}

            {/* ── Apply Card (job seeker) ── */}
            {user?.role === 'job_seeker' && !applyResult && (
              <div style={styles.sideCard}>
                <h3 style={styles.sideCardTitle}>
                  {job.has_applied ? '✅ Applied' : '🚀 Apply Now'}
                </h3>

                {job.has_applied ? (
                  <div>
                    <p style={styles.alreadyApplied}>
                      You have already applied to this job.
                      Check your application status in your dashboard.
                    </p>
                    <Link to="/dashboard" style={styles.dashboardLink}>
                      View in Dashboard →
                    </Link>
                  </div>
                ) : job.status === 'closed' ? (
                  <p style={styles.closedText}>
                    This job is no longer accepting applications.
                  </p>
                ) : !showApplyForm ? (
                  <div>
                    <p style={styles.applyDesc}>
                      Your profile skills will be used for AI matching.
                      Optionally attach a cover letter and resume.
                    </p>
                    <button
                      style={styles.applyBtn}
                      onClick={() => setShowApplyForm(true)}
                    >
                      Apply for this Job
                    </button>
                  </div>
                ) : (
                  // Apply form
                  <form onSubmit={handleApply}>
                    {applyError && (
                      <div style={styles.applyError}>
                        ⚠️ {applyError}
                      </div>
                    )}
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>
                        Cover Letter
                        <span style={styles.optional}>(optional)</span>
                      </label>
                      <textarea
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        placeholder="Tell the recruiter why you're a great fit..."
                        style={styles.textarea}
                        rows={5}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.formLabel}>
                        Resume PDF
                        <span style={styles.optional}>(optional)</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => setResumeFile(e.target.files[0])}
                        style={styles.fileInput}
                      />
                      {resumeFile && (
                        <p style={styles.fileName}>
                          📄 {resumeFile.name}
                        </p>
                      )}
                      <p style={styles.fileHint}>
                        If not uploaded, your profile resume will be used.
                      </p>
                    </div>
                    <div style={styles.applyFormBtns}>
                      <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={() => {
                          setShowApplyForm(false);
                          setApplyError('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          ...styles.submitApplyBtn,
                          opacity: applying ? 0.7 : 1,
                          cursor:  applying ? 'not-allowed' : 'pointer',
                        }}
                        disabled={applying}
                      >
                        {applying ? (
                          <span style={styles.btnInner}>
                            <span style={styles.miniSpinner2} />
                            Submitting...
                          </span>
                        ) : (
                          '🚀 Submit Application'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Save button */}
                {!job.has_applied && job.status !== 'closed' && (
                  <button
                    style={{
                      ...styles.saveBtn,
                      backgroundColor: job.is_saved ? '#eff6ff' : '#f9fafb',
                      color:           job.is_saved ? '#2563eb' : '#6b7280',
                      borderColor:     job.is_saved ? '#bfdbfe' : '#e5e7eb',
                    }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {job.is_saved ? '🔖 Saved' : '🔖 Save Job'}
                  </button>
                )}
              </div>
            )}

            {/* ── Not logged in ── */}
            {!user && (
              <div style={styles.sideCard}>
                <h3 style={styles.sideCardTitle}>Apply for this Job</h3>
                <p style={styles.loginPrompt}>
                  Create a free account or log in to apply for this job.
                </p>
                <Link to="/register" style={styles.applyBtn}>
                  Sign Up to Apply
                </Link>
                <p style={styles.loginLink}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#2563eb' }}>Log in</Link>
                </p>
              </div>
            )}

            {/* ── Recruiter owner actions ── */}
            {isOwner && (
              <div style={styles.sideCard}>
                <h3 style={styles.sideCardTitle}>Manage Job</h3>
                <Link
                  to={`/post-job/edit/${job.id}`}
                  style={styles.editBtn}
                >
                  ✏️ Edit Job
                </Link>
                <button
                  style={styles.deleteBtn}
                  onClick={() => setShowConfirm(true)}
                >
                  🗑️ Delete Job
                </button>

                {/* Confirm delete modal */}
                {showConfirm && (
                  <div style={styles.confirmBox}>
                    <p style={styles.confirmText}>
                      Are you sure? This will permanently delete the job
                      and all applications.
                    </p>
                    <div style={styles.confirmBtns}>
                      <button
                        style={styles.confirmCancel}
                        onClick={() => setShowConfirm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        style={{
                          ...styles.confirmDelete,
                          opacity: deleting ? 0.7 : 1,
                        }}
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Job Info Summary ── */}
            <div style={styles.sideCard}>
              <h3 style={styles.sideCardTitle}>Job Overview</h3>
              <div style={styles.overviewList}>
                {[
                  { icon: '🏢', label: 'Company',   value: job.company                                          },
                  { icon: '📍', label: 'Location',  value: job.location                                         },
                  { icon: '💼', label: 'Job Type',  value: job.job_type?.replace('_', ' ')                      },
                  { icon: '👥', label: 'Applicants',value: `${job.total_applicants || 0} applied`               },
                  { icon: '📅', label: 'Posted',    value: daysAgo(job.created_at)                               },
                  { icon: '⏰', label: 'Deadline',  value: job.deadline
                    ? new Date(job.deadline).toLocaleDateString()
                    : 'Not specified'                                                                             },
                  { icon: '💰', label: 'Salary',    value: job.salary_min
                    ? `$${job.salary_min.toLocaleString()}${job.salary_max
                      ? ` — $${job.salary_max.toLocaleString()}`
                      : '+'}`
                    : 'Not specified'                                                                             },
                ].map((item, i) => (
                  <div key={i} style={styles.overviewItem}>
                    <span style={styles.overviewIcon}>{item.icon}</span>
                    <div>
                      <div style={styles.overviewLabel}>{item.label}</div>
                      <div style={styles.overviewValue}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// APPLICANT CARD — used in recruiter's applicants tab
// ─────────────────────────────────────────────────────────────

function ApplicantCard({ app, onStatusUpdate, statusColors, scoreColor }) {
  const [expanded, setExpanded] = useState(false);

  const statusStyle = statusColors[app.status] || statusColors.applied;

  return (
    <div style={appCardStyles.card}>
      <div style={appCardStyles.top}>

        {/* Avatar + info */}
        <div style={appCardStyles.left}>
          <div style={appCardStyles.avatar}>
            {app.applicant?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={appCardStyles.name}>
              {app.applicant?.full_name}
            </div>
            <div style={appCardStyles.email}>
              {app.applicant?.email}
            </div>
            {app.applicant?.location && (
              <div style={appCardStyles.location}>
                📍 {app.applicant.location}
              </div>
            )}
          </div>
        </div>

        {/* Score + status */}
        <div style={appCardStyles.right}>
          <div style={{
            ...appCardStyles.score,
            color: scoreColor(parseFloat(app.ai_score)),
          }}>
            🤖 {parseFloat(app.ai_score).toFixed(1)}%
          </div>
          <div style={appCardStyles.scoreLabel}>
            {app.score_info?.label}
          </div>
        </div>

      </div>

      {/* Skills */}
      {app.applicant?.skills && (
        <div style={appCardStyles.skills}>
          {app.applicant.skills.split(',').slice(0, 5).map((s, i) => (
            <span key={i} style={appCardStyles.skill}>
              {s.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Score bar */}
      <div style={appCardStyles.scoreBar}>
        <div style={{
          ...appCardStyles.scoreBarFill,
          width:           `${Math.min(parseFloat(app.ai_score), 100)}%`,
          backgroundColor: scoreColor(parseFloat(app.ai_score)),
        }} />
      </div>

      {/* Cover letter (expandable) */}
      {app.cover_letter && (
        <div>
          <button
            style={appCardStyles.expandBtn}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ Hide' : '▼ Cover Letter'}
          </button>
          {expanded && (
            <div style={appCardStyles.coverLetter}>
              {app.cover_letter}
            </div>
          )}
        </div>
      )}

      {/* Resume link */}
      {app.resume_url && (
        <a
          href={app.resume_url}
          target="_blank"
          rel="noreferrer"
          style={appCardStyles.resumeLink}
          onClick={e => e.stopPropagation()}
        >
          📄 View Resume
        </a>
      )}

      {/* Status + actions */}
      <div style={appCardStyles.bottom}>
        <span style={{
          ...appCardStyles.statusBadge,
          backgroundColor: statusStyle.bg,
          color:           statusStyle.color,
        }}>
          {app.status}
        </span>

        <div style={appCardStyles.actions}>
          {app.status !== 'shortlisted' && app.status !== 'hired' && (
            <button
              style={appCardStyles.shortlistBtn}
              onClick={() => onStatusUpdate(app.id, 'shortlisted')}
            >
              ⭐ Shortlist
            </button>
          )}
          {app.status !== 'hired' && (
            <button
              style={appCardStyles.hireBtn}
              onClick={() => onStatusUpdate(app.id, 'hired')}
            >
              ✅ Hire
            </button>
          )}
          {app.status !== 'rejected' && (
            <button
              style={appCardStyles.rejectBtn}
              onClick={() => onStatusUpdate(app.id, 'rejected')}
            >
              ✕ Reject
            </button>
          )}
        </div>
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
    padding:         '32px 24px',
  },
  inner: {
    maxWidth: '1100px',
    margin:   '0 auto',
  },
  loadingPage: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      'calc(100vh - 64px)',
  },
  spinner: {
    width:        '40px',
    height:       '40px',
    border:       '4px solid #e5e7eb',
    borderTop:    '4px solid #2563eb',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
  },
  errorPage: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      'calc(100vh - 64px)',
    textAlign:      'center',
    padding:        '40px',
  },
  errorIcon: {
    fontSize:     '48px',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize:    '20px',
    fontWeight:  '700',
    color:       '#374151',
    marginBottom:'24px',
  },
  backBtn: {
    padding:         '10px 24px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
  breadcrumb: {
    marginBottom: '20px',
  },
  breadcrumbLink: {
    color:          '#6b7280',
    textDecoration: 'none',
    fontSize:       '14px',
    fontWeight:     '500',
  },
  layout: {
    display:  'flex',
    gap:      '24px',
    alignItems:'flex-start',
    flexWrap: 'wrap',
  },
  mainCol: {
    flex:          '1 1 0',
    minWidth:      '300px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '16px',
  },
  sidebar: {
    width:         '320px',
    flexShrink:    0,
    display:       'flex',
    flexDirection: 'column',
    gap:           '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '24px',
  },
  sideCard: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
    display:         'flex',
    flexDirection:   'column',
    gap:             '12px',
  },
  sideCardTitle: {
    fontSize:    '16px',
    fontWeight:  '700',
    color:       '#111827',
    marginBottom:'4px',
  },
  jobHeader: {
    display:    'flex',
    gap:        '16px',
    alignItems: 'flex-start',
    marginBottom:'16px',
  },
  companyAvatar: {
    width:           '56px',
    height:          '56px',
    borderRadius:    '12px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '800',
    fontSize:        '24px',
    flexShrink:      0,
  },
  jobHeaderInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize:    '24px',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'8px',
    lineHeight:  '1.2',
  },
  jobMeta: {
    display:    'flex',
    flexWrap:   'wrap',
    gap:        '6px',
    alignItems: 'center',
    marginBottom:'10px',
  },
  company: {
    fontSize:   '14px',
    color:      '#374151',
    fontWeight: '600',
  },
  location: {
    fontSize: '14px',
    color:    '#6b7280',
  },
  posted: {
    fontSize: '13px',
    color:    '#9ca3af',
  },
  metaDot: {
    color: '#d1d5db',
  },
  badgeRow: {
    display:    'flex',
    flexWrap:   'wrap',
    gap:        '6px',
    alignItems: 'center',
  },
  typeBadge: {
    fontSize:     '12px',
    fontWeight:   '600',
    padding:      '4px 12px',
    borderRadius: '20px',
    textTransform:'capitalize',
  },
  closedBadge: {
    fontSize:        '12px',
    fontWeight:      '600',
    padding:         '4px 12px',
    borderRadius:    '20px',
    backgroundColor: '#fef2f2',
    color:           '#dc2626',
  },
  appliedBadge: {
    fontSize:        '12px',
    fontWeight:      '600',
    padding:         '4px 12px',
    borderRadius:    '20px',
    backgroundColor: '#f0fdf4',
    color:           '#16a34a',
  },
  salaryBanner: {
    backgroundColor: '#f0fdf4',
    border:          '1px solid #bbf7d0',
    borderRadius:    '8px',
    padding:         '10px 14px',
    fontSize:        '14px',
    color:           '#15803d',
    marginTop:       '12px',
  },
  deadlineBanner: {
    backgroundColor: '#fffbeb',
    border:          '1px solid #fde68a',
    borderRadius:    '8px',
    padding:         '10px 14px',
    fontSize:        '14px',
    color:           '#92400e',
    marginTop:       '8px',
  },
  tabs: {
    display:         'flex',
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    overflow:        'hidden',
    padding:         '0 8px',
  },
  tab: {
    padding:         '14px 16px',
    background:      'none',
    border:          'none',
    cursor:          'pointer',
    fontSize:        '14px',
    transition:      'all 0.15s',
  },
  sectionTitle: {
    fontSize:     '18px',
    fontWeight:   '700',
    color:        '#111827',
    marginBottom: '16px',
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
  },
  sectionCount: {
    fontSize:        '13px',
    fontWeight:      '500',
    color:           '#6b7280',
    backgroundColor: '#f3f4f6',
    padding:         '2px 8px',
    borderRadius:    '20px',
  },
  jobText: {
    fontSize:   '15px',
    color:      '#374151',
    lineHeight: '1.7',
  },
  reqItem: {
    display:      'flex',
    gap:          '8px',
    marginBottom: '8px',
    alignItems:   'flex-start',
  },
  reqBullet: {
    color:      '#2563eb',
    flexShrink: 0,
    marginTop:  '2px',
  },
  // Apply form
  formField: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
    marginBottom:  '12px',
  },
  formLabel: {
    fontSize:   '13px',
    fontWeight: '600',
    color:      '#374151',
  },
  optional: {
    fontSize:   '11px',
    color:      '#9ca3af',
    marginLeft: '4px',
    fontWeight: '400',
  },
  textarea: {
    padding:         '10px 12px',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    color:           '#111827',
    resize:          'vertical',
    outline:         'none',
    fontFamily:      'inherit',
    lineHeight:      '1.5',
  },
  fileInput: {
    fontSize:   '13px',
    color:      '#374151',
  },
  fileName: {
    fontSize:   '12px',
    color:      '#2563eb',
    marginTop:  '4px',
  },
  fileHint: {
    fontSize:   '11px',
    color:      '#9ca3af',
    marginTop:  '2px',
  },
  applyFormBtns: {
    display: 'flex',
    gap:     '8px',
  },
  cancelBtn: {
    flex:            1,
    padding:         '10px',
    backgroundColor: '#f9fafb',
    color:           '#374151',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
  submitApplyBtn: {
    flex:            2,
    padding:         '10px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '700',
    cursor:          'pointer',
  },
  btnInner: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
  },
  miniSpinner2: {
    display:      'inline-block',
    width:        '14px',
    height:       '14px',
    border:       '2px solid rgba(255,255,255,0.4)',
    borderTop:    '2px solid #ffffff',
    borderRadius: '50%',
    animation:    'spin 0.7s linear infinite',
  },
  applyError: {
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    padding:         '10px 12px',
    color:           '#dc2626',
    fontSize:        '13px',
    marginBottom:    '12px',
  },
  applyBtn: {
    display:         'block',
    textAlign:       'center',
    padding:         '12px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '15px',
    fontWeight:      '700',
    cursor:          'pointer',
    textDecoration:  'none',
    width:           '100%',
  },
  saveBtn: {
    padding:      '10px',
    border:       '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize:     '14px',
    fontWeight:   '600',
    cursor:       'pointer',
    textAlign:    'center',
    width:        '100%',
    transition:   'all 0.15s',
  },
  alreadyApplied: {
    fontSize:     '13px',
    color:        '#6b7280',
    lineHeight:   '1.5',
    marginBottom: '10px',
  },
  dashboardLink: {
    color:          '#2563eb',
    fontSize:       '13px',
    fontWeight:     '600',
    textDecoration: 'none',
  },
  closedText: {
    fontSize:   '13px',
    color:      '#dc2626',
    lineHeight: '1.5',
  },
  applyDesc: {
    fontSize:    '13px',
    color:       '#6b7280',
    lineHeight:  '1.5',
    marginBottom:'12px',
  },
  loginPrompt: {
    fontSize:   '14px',
    color:      '#6b7280',
    lineHeight: '1.5',
  },
  loginLink: {
    textAlign: 'center',
    fontSize:  '13px',
    color:     '#6b7280',
  },
  editBtn: {
    display:         'block',
    textAlign:       'center',
    padding:         '10px',
    backgroundColor: '#f9fafb',
    color:           '#374151',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    textDecoration:  'none',
    cursor:          'pointer',
  },
  deleteBtn: {
    padding:         '10px',
    backgroundColor: '#fef2f2',
    color:           '#dc2626',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    cursor:          'pointer',
    width:           '100%',
  },
  confirmBox: {
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    padding:         '14px',
  },
  confirmText: {
    fontSize:     '13px',
    color:        '#374151',
    lineHeight:   '1.5',
    marginBottom: '12px',
  },
  confirmBtns: {
    display: 'flex',
    gap:     '8px',
  },
  confirmCancel: {
    flex:            1,
    padding:         '8px',
    backgroundColor: '#ffffff',
    color:           '#374151',
    border:          '1px solid #e5e7eb',
    borderRadius:    '6px',
    fontSize:        '13px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
  confirmDelete: {
    flex:            1,
    padding:         '8px',
    backgroundColor: '#dc2626',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '6px',
    fontSize:        '13px',
    fontWeight:      '700',
    cursor:          'pointer',
  },
  scoreCircle: {
    textAlign:    'center',
    padding:      '12px 0',
  },
  scoreNum: {
    fontSize:   '36px',
    fontWeight: '800',
    lineHeight: '1',
  },
  scoreLabel: {
    fontSize:   '14px',
    color:      '#6b7280',
    marginTop:  '4px',
    fontWeight: '600',
  },
  scoreBar: {
    height:          '8px',
    backgroundColor: '#f3f4f6',
    borderRadius:    '4px',
    overflow:        'hidden',
  },
  scoreBarFill: {
    height:       '100%',
    borderRadius: '4px',
    transition:   'width 0.5s',
  },
  applySuccess: {
    textAlign:  'center',
    fontSize:   '13px',
    color:      '#16a34a',
    fontWeight: '600',
  },
  // Job overview
  overviewList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
  overviewItem: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '10px',
  },
  overviewIcon: {
    fontSize:  '16px',
    marginTop: '1px',
    flexShrink:0,
  },
  overviewLabel: {
    fontSize:   '11px',
    color:      '#9ca3af',
    fontWeight: '600',
    textTransform:'uppercase',
    letterSpacing:'0.4px',
  },
  overviewValue: {
    fontSize:     '14px',
    color:        '#111827',
    fontWeight:   '500',
    textTransform:'capitalize',
  },
  // Applicants
  appStatsRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap:                 '8px',
    marginBottom:        '20px',
    textAlign:           'center',
  },
  appStat: {},
  appStatNum: {
    fontSize:  '20px',
    fontWeight:'800',
  },
  appStatLabel: {
    fontSize: '11px',
    color:    '#9ca3af',
  },
  loadingRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    padding:    '20px 0',
  },
  miniSpinner: {
    width:        '20px',
    height:       '20px',
    border:       '3px solid #e5e7eb',
    borderTop:    '3px solid #2563eb',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
  },
  emptyApps: {
    textAlign: 'center',
    padding:   '32px',
    color:     '#9ca3af',
    fontSize:  '14px',
  },
  applicantsList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
};

// Applicant card styles
const appCardStyles = {
  card: {
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '10px',
    padding:         '16px',
  },
  top: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   '10px',
  },
  left: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '10px',
  },
  avatar: {
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
  name: {
    fontWeight: '700',
    fontSize:   '14px',
    color:      '#111827',
  },
  email: {
    fontSize: '12px',
    color:    '#6b7280',
  },
  location: {
    fontSize: '11px',
    color:    '#9ca3af',
  },
  right: {
    textAlign: 'right',
  },
  score: {
    fontSize:   '18px',
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: '11px',
    color:    '#6b7280',
  },
  skills: {
    display:      'flex',
    flexWrap:     'wrap',
    gap:          '4px',
    marginBottom: '10px',
  },
  skill: {
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    padding:         '2px 8px',
    borderRadius:    '20px',
    fontSize:        '11px',
    fontWeight:      '500',
  },
  scoreBar: {
    height:          '4px',
    backgroundColor: '#e5e7eb',
    borderRadius:    '2px',
    overflow:        'hidden',
    marginBottom:    '10px',
  },
  scoreBarFill: {
    height:       '100%',
    borderRadius: '2px',
    transition:   'width 0.5s',
  },
  expandBtn: {
    background:     'none',
    border:         'none',
    color:          '#6b7280',
    fontSize:       '12px',
    cursor:         'pointer',
    padding:        '0',
    marginBottom:   '6px',
  },
  coverLetter: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '6px',
    padding:         '10px',
    fontSize:        '13px',
    color:           '#374151',
    lineHeight:      '1.5',
    marginBottom:    '8px',
  },
  resumeLink: {
    display:        'inline-block',
    fontSize:       '13px',
    color:          '#2563eb',
    textDecoration: 'none',
    fontWeight:     '500',
    marginBottom:   '10px',
  },
  bottom: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    flexWrap:       'wrap',
    gap:            '8px',
  },
  statusBadge: {
    fontSize:     '12px',
    fontWeight:   '600',
    padding:      '4px 10px',
    borderRadius: '20px',
    textTransform:'capitalize',
  },
  actions: {
    display: 'flex',
    gap:     '6px',
  },
  shortlistBtn: {
    padding:         '5px 10px',
    backgroundColor: '#fef9c3',
    color:           '#a16207',
    border:          '1px solid #fde68a',
    borderRadius:    '6px',
    fontSize:        '12px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
  hireBtn: {
    padding:         '5px 10px',
    backgroundColor: '#dcfce7',
    color:           '#16a34a',
    border:          '1px solid #bbf7d0',
    borderRadius:    '6px',
    fontSize:        '12px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
  rejectBtn: {
    padding:         '5px 10px',
    backgroundColor: '#fef2f2',
    color:           '#dc2626',
    border:          '1px solid #fecaca',
    borderRadius:    '6px',
    fontSize:        '12px',
    fontWeight:      '600',
    cursor:          'pointer',
  },
};