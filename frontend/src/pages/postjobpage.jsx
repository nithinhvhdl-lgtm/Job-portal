import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function PostJobPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { id }     = useParams(); // if id exists → edit mode

  const isEditMode = Boolean(id);

  // ── Form State ────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title:        '',
    company:      '',
    location:     '',
    job_type:     'full_time',
    description:  '',
    requirements: '',
    salary_min:   '',
    salary_max:   '',
    deadline:     '',
    status:       'active',
  });

  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [success,  setSuccess]  = useState(false);

  // ── Fetch job data in edit mode ───────────────────────────

  useEffect(() => {
    if (isEditMode) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    setFetching(true);
    try {
      const res = await api.get(`/jobs/${id}/`);
      const job = res.data;

      // Check ownership
      if (job.recruiter?.id !== user?.id) {
        navigate('/dashboard');
        return;
      }

      setFormData({
        title:        job.title        || '',
        company:      job.company      || '',
        location:     job.location     || '',
        job_type:     job.job_type     || 'full_time',
        description:  job.description  || '',
        requirements: job.requirements || '',
        salary_min:   job.salary_min   || '',
        salary_max:   job.salary_max   || '',
        deadline:     job.deadline     || '',
        status:       job.status       || 'active',
      });
    } catch (err) {
      setApiError('Failed to load job data.');
    } finally {
      setFetching(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required.';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters.';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required.';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required.';
    }

    if (!formData.job_type) {
      newErrors.job_type = 'Job type is required.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required.';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters.';
    }

    if (!formData.requirements.trim()) {
      newErrors.requirements = 'Requirements are required.';
    } else if (formData.requirements.trim().length < 20) {
      newErrors.requirements = 'Requirements must be at least 20 characters.';
    }

    if (formData.salary_min && formData.salary_max) {
      if (Number(formData.salary_min) > Number(formData.salary_max)) {
        newErrors.salary_min = 'Min salary cannot be greater than max salary.';
      }
    }

    if (formData.deadline) {
      const today    = new Date();
      const deadline = new Date(formData.deadline);
      today.setHours(0, 0, 0, 0);
      if (deadline < today) {
        newErrors.deadline = 'Deadline must be a future date.';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setApiError('');

    // Clean empty strings to null
    const payload = { ...formData };
    if (!payload.salary_min) delete payload.salary_min;
    if (!payload.salary_max) delete payload.salary_max;
    if (!payload.deadline)   delete payload.deadline;

    try {
      if (isEditMode) {
        await api.put(`/jobs/${id}/update/`, payload);
      } else {
        await api.post('/jobs/create/', payload);
      }
      setSuccess(true);
      setTimeout(() => navigate('/dashboard?tab=jobs'), 1500);

    } catch (err) {
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
        `Failed to ${isEditMode ? 'update' : 'post'} job. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Loading (edit mode fetching) ──────────────────────────

  if (fetching) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading job...</p>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────

  if (success) {
    return (
      <div style={styles.successPage}>
        <div style={styles.successIcon}>🎉</div>
        <h2 style={styles.successTitle}>
          Job {isEditMode ? 'Updated' : 'Posted'} Successfully!
        </h2>
        <p style={styles.successText}>
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* ── Breadcrumb ── */}
        <div style={styles.breadcrumb}>
          <Link to="/dashboard?tab=jobs" style={styles.breadcrumbLink}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* ── Page Header ── */}
        <div style={styles.pageHeader}>
          <div style={styles.pageHeaderIcon}>
            {isEditMode ? '✏️' : '💼'}
          </div>
          <div>
            <h1 style={styles.pageTitle}>
              {isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
            </h1>
            <p style={styles.pageSubtitle}>
              {isEditMode
                ? 'Update the details of your job posting'
                : 'Fill in the details below to start receiving applications'}
            </p>
          </div>
        </div>

        <div style={styles.layout}>

          {/* ════════════════════════════════════════════════ */}
          {/* FORM                                             */}
          {/* ════════════════════════════════════════════════ */}
          <form onSubmit={handleSubmit} style={styles.form} noValidate>

            {/* ── API Error ── */}
            {apiError && (
              <div style={styles.errorBanner}>
                ⚠️ {apiError}
              </div>
            )}

            {/* ════════════════════════ */}
            {/* SECTION 1 — Basic Info  */}
            {/* ════════════════════════ */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionNum}>1</span>
                Basic Information
              </h2>

              {/* Title */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="title">
                  Job Title <span style={styles.required}>*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Python Developer"
                  style={{
                    ...styles.input,
                    borderColor: errors.title ? '#ef4444' : '#d1d5db',
                  }}
                  autoFocus
                />
                {errors.title && (
                  <span style={styles.fieldError}>{errors.title}</span>
                )}
              </div>

              {/* Company */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="company">
                  Company Name <span style={styles.required}>*</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. TechCorp Inc."
                  style={{
                    ...styles.input,
                    borderColor: errors.company ? '#ef4444' : '#d1d5db',
                  }}
                />
                {errors.company && (
                  <span style={styles.fieldError}>{errors.company}</span>
                )}
              </div>

              {/* Two columns: location + job type */}
              <div style={styles.twoCol}>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="location">
                    Location <span style={styles.required}>*</span>
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. New York, NY or Remote"
                    style={{
                      ...styles.input,
                      borderColor: errors.location ? '#ef4444' : '#d1d5db',
                    }}
                  />
                  {errors.location && (
                    <span style={styles.fieldError}>{errors.location}</span>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label} htmlFor="job_type">
                    Job Type <span style={styles.required}>*</span>
                  </label>
                  <select
                    id="job_type"
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleChange}
                    style={{
                      ...styles.select,
                      borderColor: errors.job_type ? '#ef4444' : '#d1d5db',
                    }}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                    <option value="internship">Internship</option>
                  </select>
                  {errors.job_type && (
                    <span style={styles.fieldError}>{errors.job_type}</span>
                  )}
                </div>
              </div>

            </div>

            {/* ════════════════════════════ */}
            {/* SECTION 2 — Job Details     */}
            {/* ════════════════════════════ */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionNum}>2</span>
                Job Details
              </h2>

              {/* Description */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="description">
                  Job Description <span style={styles.required}>*</span>
                </label>
                <div style={styles.hintRow}>
                  <span style={styles.hint}>
                    Describe the role, responsibilities, and what a typical day looks like.
                    More detail = better AI matching.
                  </span>
                  <span style={{
                    ...styles.charCount,
                    color: formData.description.length < 50 ? '#ef4444' : '#10b981',
                  }}>
                    {formData.description.length} chars
                    {formData.description.length < 50 ? ` (min 50)` : ' ✓'}
                  </span>
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={`Example:\nWe are looking for a passionate Python developer to join our growing team.\n\nYou will be responsible for:\n- Building and maintaining REST APIs\n- Working with our Django backend\n- Collaborating with the frontend React team`}
                  style={{
                    ...styles.textarea,
                    borderColor: errors.description ? '#ef4444' : '#d1d5db',
                  }}
                  rows={8}
                />
                {errors.description && (
                  <span style={styles.fieldError}>{errors.description}</span>
                )}
              </div>

              {/* Requirements */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="requirements">
                  Requirements <span style={styles.required}>*</span>
                </label>
                <div style={styles.hintRow}>
                  <span style={styles.hint}>
                    List skills, qualifications, and experience needed.
                    These keywords are used by the AI screening system.
                  </span>
                  <span style={{
                    ...styles.charCount,
                    color: formData.requirements.length < 20 ? '#ef4444' : '#10b981',
                  }}>
                    {formData.requirements.length} chars
                    {formData.requirements.length < 20 ? ` (min 20)` : ' ✓'}
                  </span>
                </div>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder={`Example:\n- 3+ years of Python experience\n- Strong knowledge of Django and REST APIs\n- Experience with React or Vue\n- Familiarity with MySQL or PostgreSQL\n- Good communication skills\n- Bachelor's degree in Computer Science or related field`}
                  style={{
                    ...styles.textarea,
                    borderColor: errors.requirements ? '#ef4444' : '#d1d5db',
                  }}
                  rows={7}
                />
                {errors.requirements && (
                  <span style={styles.fieldError}>{errors.requirements}</span>
                )}
              </div>

            </div>

            {/* ════════════════════════════ */}
            {/* SECTION 3 — Compensation    */}
            {/* ════════════════════════════ */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionNum}>3</span>
                Compensation & Deadline
                <span style={styles.optionalBadge}>Optional</span>
              </h2>

              <p style={styles.sectionHint}>
                Jobs with salary info get 40% more applications.
              </p>

              {/* Salary */}
              <div style={styles.twoCol}>
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="salary_min">
                    Minimum Salary (USD/year)
                  </label>
                  <div style={styles.inputPrefix}>
                    <span style={styles.prefix}>$</span>
                    <input
                      id="salary_min"
                      name="salary_min"
                      type="number"
                      value={formData.salary_min}
                      onChange={handleChange}
                      placeholder="50000"
                      min="0"
                      style={{
                        ...styles.input,
                        borderColor:  errors.salary_min ? '#ef4444' : '#d1d5db',
                        paddingLeft:  '28px',
                      }}
                    />
                  </div>
                  {errors.salary_min && (
                    <span style={styles.fieldError}>{errors.salary_min}</span>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label} htmlFor="salary_max">
                    Maximum Salary (USD/year)
                  </label>
                  <div style={styles.inputPrefix}>
                    <span style={styles.prefix}>$</span>
                    <input
                      id="salary_max"
                      name="salary_max"
                      type="number"
                      value={formData.salary_max}
                      onChange={handleChange}
                      placeholder="80000"
                      min="0"
                      style={{
                        ...styles.input,
                        borderColor:  errors.salary_max ? '#ef4444' : '#d1d5db',
                        paddingLeft:  '28px',
                      }}
                    />
                  </div>
                  {errors.salary_max && (
                    <span style={styles.fieldError}>{errors.salary_max}</span>
                  )}
                </div>
              </div>

              {/* Salary preview */}
              {(formData.salary_min || formData.salary_max) && (
                <div style={styles.salaryPreview}>
                  💰 Showing as:{' '}
                  <strong>
                    {formData.salary_min
                      ? `$${Number(formData.salary_min).toLocaleString()}`
                      : ''}
                    {formData.salary_min && formData.salary_max ? ' — ' : ''}
                    {formData.salary_max
                      ? `$${Number(formData.salary_max).toLocaleString()}`
                      : formData.salary_min ? '+' : ''}
                  </strong>
                  {' '}per year
                </div>
              )}

              {/* Deadline */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="deadline">
                  Application Deadline
                </label>
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    ...styles.input,
                    borderColor: errors.deadline ? '#ef4444' : '#d1d5db',
                    maxWidth:    '240px',
                  }}
                />
                {errors.deadline && (
                  <span style={styles.fieldError}>{errors.deadline}</span>
                )}
              </div>

            </div>

            {/* ════════════════════════════ */}
            {/* SECTION 4 — Status          */}
            {/* ════════════════════════════ */}
            {isEditMode && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                  <span style={styles.sectionNum}>4</span>
                  Job Status
                </h2>
                <div style={styles.statusOptions}>
                  {[
                    { value: 'active', label: '✅ Active',
                      desc: 'Visible to job seekers, accepting applications' },
                    { value: 'closed', label: '🔒 Closed',
                      desc: 'No longer accepting applications'              },
                    { value: 'draft',  label: '📝 Draft',
                      desc: 'Not visible to job seekers yet'                },
                  ].map(opt => (
                    <div
                      key={opt.value}
                      style={{
                        ...styles.statusOption,
                        borderColor:     formData.status === opt.value ? '#2563eb' : '#e5e7eb',
                        backgroundColor: formData.status === opt.value ? '#eff6ff' : '#ffffff',
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, status: opt.value }))}
                    >
                      <div style={styles.statusOptionTop}>
                        <span style={styles.statusOptionLabel}>{opt.label}</span>
                        <div style={styles.radioCircle}>
                          {formData.status === opt.value && (
                            <div style={styles.radioFill} />
                          )}
                        </div>
                      </div>
                      <div style={styles.statusOptionDesc}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Submit Buttons ── */}
            <div style={styles.submitRow}>
              <Link
                to="/dashboard?tab=jobs"
                style={styles.cancelBtn}
              >
                Cancel
              </Link>

              {/* Draft button (new job only) */}
              {!isEditMode && (
                <button
                  type="button"
                  style={styles.draftBtn}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, status: 'draft' }));
                    setTimeout(() => handleSubmit({ preventDefault: () => {} }), 100);
                  }}
                  disabled={loading}
                >
                  💾 Save as Draft
                </button>
              )}

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
                    <span style={styles.spinner2} />
                    {isEditMode ? 'Updating...' : 'Posting...'}
                  </span>
                ) : (
                  isEditMode ? '✅ Update Job' : '🚀 Post Job Now'
                )}
              </button>
            </div>

          </form>

          {/* ════════════════════════════════════════════════ */}
          {/* SIDEBAR — Tips                                   */}
          {/* ════════════════════════════════════════════════ */}
          <div style={styles.sidebar}>

            {/* AI Tip */}
            <div style={styles.tipCard}>
              <h3 style={styles.tipTitle}>🤖 AI Screening Tips</h3>
              <ul style={styles.tipList}>
                <li>List specific skills in requirements (Python, React, SQL)</li>
                <li>Include years of experience needed</li>
                <li>Mention tools and technologies used</li>
                <li>The more specific, the better the AI matching</li>
              </ul>
            </div>

            {/* Checklist */}
            <div style={styles.checkCard}>
              <h3 style={styles.tipTitle}>✅ Job Post Checklist</h3>
              <div style={styles.checkList}>
                {[
                  { label: 'Clear job title',           done: formData.title.length >= 3           },
                  { label: 'Company name added',        done: formData.company.length >= 2         },
                  { label: 'Location specified',        done: formData.location.length >= 2        },
                  { label: 'Description (50+ chars)',   done: formData.description.length >= 50    },
                  { label: 'Requirements (20+ chars)',  done: formData.requirements.length >= 20   },
                  { label: 'Salary range added',        done: Boolean(formData.salary_min)         },
                  { label: 'Deadline set',              done: Boolean(formData.deadline)           },
                ].map((item, i) => (
                  <div key={i} style={styles.checkItem}>
                    <span style={{
                      ...styles.checkIcon,
                      color: item.done ? '#10b981' : '#d1d5db',
                    }}>
                      {item.done ? '✅' : '⬜'}
                    </span>
                    <span style={{
                      ...styles.checkLabel,
                      color: item.done ? '#374151' : '#9ca3af',
                      textDecoration: item.done ? 'none' : 'none',
                    }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {(() => {
                const done = [
                  formData.title.length >= 3,
                  formData.company.length >= 2,
                  formData.location.length >= 2,
                  formData.description.length >= 50,
                  formData.requirements.length >= 20,
                  Boolean(formData.salary_min),
                  Boolean(formData.deadline),
                ].filter(Boolean).length;
                const pct = Math.round((done / 7) * 100);
                return (
                  <div style={styles.progressWrapper}>
                    <div style={styles.progressTop}>
                      <span style={styles.progressLabel}>Completion</span>
                      <span style={{
                        ...styles.progressPct,
                        color: pct === 100 ? '#10b981' : '#2563eb',
                      }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width:           `${pct}%`,
                        backgroundColor: pct === 100 ? '#10b981' : '#2563eb',
                      }} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Preview card */}
            <div style={styles.previewCard}>
              <h3 style={styles.tipTitle}>👁️ Preview</h3>
              <div style={styles.previewJob}>
                <div style={styles.previewAvatar}>
                  {formData.company?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div style={styles.previewTitle}>
                    {formData.title || 'Job Title'}
                  </div>
                  <div style={styles.previewMeta}>
                    {formData.company || 'Company'} ·{' '}
                    {formData.location || 'Location'}
                  </div>
                  {formData.salary_min && (
                    <div style={styles.previewSalary}>
                      💰 ${Number(formData.salary_min).toLocaleString()}+
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.previewTypeBadge}>
                {formData.job_type?.replace('_', ' ') || 'full time'}
              </div>
            </div>

          </div>

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
  successPage: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    minHeight:      'calc(100vh - 64px)',
    textAlign:      'center',
    padding:        '40px',
  },
  successIcon: {
    fontSize:     '64px',
    marginBottom: '20px',
  },
  successTitle: {
    fontSize:    '28px',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'10px',
  },
  successText: {
    fontSize: '16px',
    color:    '#6b7280',
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
  pageHeader: {
    display:      'flex',
    alignItems:   'center',
    gap:          '16px',
    marginBottom: '28px',
  },
  pageHeaderIcon: {
    fontSize:        '36px',
    width:           '60px',
    height:          '60px',
    backgroundColor: '#eff6ff',
    borderRadius:    '14px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  pageTitle: {
    fontSize:    '26px',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color:    '#6b7280',
  },
  layout: {
    display:    'flex',
    gap:        '24px',
    alignItems: 'flex-start',
    flexWrap:   'wrap',
  },
  form: {
    flex:          '1 1 0',
    minWidth:      '300px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '20px',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    padding:         '14px 16px',
    color:           '#dc2626',
    fontSize:        '14px',
  },
  section: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '24px',
    display:         'flex',
    flexDirection:   'column',
    gap:             '18px',
  },
  sectionTitle: {
    fontSize:    '17px',
    fontWeight:  '700',
    color:       '#111827',
    display:     'flex',
    alignItems:  'center',
    gap:         '10px',
    marginBottom:'4px',
  },
  sectionNum: {
    width:           '26px',
    height:          '26px',
    borderRadius:    '50%',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontSize:        '13px',
    fontWeight:      '700',
    flexShrink:      0,
  },
  optionalBadge: {
    fontSize:        '11px',
    fontWeight:      '500',
    color:           '#6b7280',
    backgroundColor: '#f3f4f6',
    padding:         '2px 8px',
    borderRadius:    '20px',
    marginLeft:      '4px',
  },
  sectionHint: {
    fontSize:    '13px',
    color:       '#6b7280',
    marginTop:   '-8px',
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
  required: {
    color: '#ef4444',
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
    fontFamily:      'inherit',
  },
  select: {
    padding:         '11px 14px',
    borderRadius:    '8px',
    border:          '1px solid #d1d5db',
    fontSize:        '14px',
    color:           '#111827',
    outline:         'none',
    width:           '100%',
    backgroundColor: '#ffffff',
    cursor:          'pointer',
    fontFamily:      'inherit',
  },
  textarea: {
    padding:         '12px 14px',
    borderRadius:    '8px',
    border:          '1px solid #d1d5db',
    fontSize:        '14px',
    color:           '#111827',
    outline:         'none',
    width:           '100%',
    resize:          'vertical',
    lineHeight:      '1.6',
    transition:      'border-color 0.15s',
    backgroundColor: '#ffffff',
    fontFamily:      'inherit',
    minHeight:       '140px',
  },
  hintRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            '8px',
  },
  hint: {
    fontSize:   '12px',
    color:      '#9ca3af',
    lineHeight: '1.4',
    flex:       1,
  },
  charCount: {
    fontSize:   '12px',
    fontWeight: '600',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  twoCol: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '16px',
  },
  inputPrefix: {
    position: 'relative',
  },
  prefix: {
    position:   'absolute',
    left:       '12px',
    top:        '50%',
    transform:  'translateY(-50%)',
    color:      '#9ca3af',
    fontSize:   '14px',
    fontWeight: '600',
    zIndex:     1,
  },
  salaryPreview: {
    backgroundColor: '#f0fdf4',
    border:          '1px solid #bbf7d0',
    borderRadius:    '8px',
    padding:         '10px 14px',
    fontSize:        '13px',
    color:           '#15803d',
  },
  fieldError: {
    fontSize: '12px',
    color:    '#ef4444',
  },
  // Status options
  statusOptions: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
  },
  statusOption: {
    border:       '2px solid #e5e7eb',
    borderRadius: '10px',
    padding:      '14px 16px',
    cursor:       'pointer',
    transition:   'all 0.15s',
  },
  statusOptionTop: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '4px',
  },
  statusOptionLabel: {
    fontWeight: '600',
    fontSize:   '14px',
    color:      '#111827',
  },
  statusOptionDesc: {
    fontSize:   '13px',
    color:      '#6b7280',
  },
  radioCircle: {
    width:           '18px',
    height:          '18px',
    borderRadius:    '50%',
    border:          '2px solid #d1d5db',
    backgroundColor: '#ffffff',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  radioFill: {
    width:           '9px',
    height:          '9px',
    borderRadius:    '50%',
    backgroundColor: '#2563eb',
  },
  // Submit row
  submitRow: {
    display:        'flex',
    gap:            '10px',
    justifyContent: 'flex-end',
    alignItems:     'center',
    flexWrap:       'wrap',
  },
  cancelBtn: {
    padding:         '12px 20px',
    backgroundColor: '#ffffff',
    color:           '#374151',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    textDecoration:  'none',
    cursor:          'pointer',
  },
  draftBtn: {
    padding:         '12px 20px',
    backgroundColor: '#f9fafb',
    color:           '#374151',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '600',
    cursor:          'pointer',
    transition:      'all 0.15s',
  },
  submitBtn: {
    padding:         '12px 28px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '15px',
    fontWeight:      '700',
    cursor:          'pointer',
    transition:      'background 0.2s',
  },
  btnInner: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
  },
  spinner2: {
    display:      'inline-block',
    width:        '16px',
    height:       '16px',
    border:       '2px solid rgba(255,255,255,0.4)',
    borderTop:    '2px solid #ffffff',
    borderRadius: '50%',
    animation:    'spin 0.7s linear infinite',
  },
  // Sidebar
  sidebar: {
    width:         '280px',
    flexShrink:    0,
    display:       'flex',
    flexDirection: 'column',
    gap:           '16px',
    position:      'sticky',
    top:           '80px',
  },
  tipCard: {
    backgroundColor: '#eff6ff',
    border:          '1px solid #bfdbfe',
    borderRadius:    '12px',
    padding:         '20px',
  },
  checkCard: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '20px',
  },
  tipTitle: {
    fontSize:    '14px',
    fontWeight:  '700',
    color:       '#111827',
    marginBottom:'12px',
  },
  tipList: {
    paddingLeft: '16px',
    display:     'flex',
    flexDirection:'column',
    gap:         '6px',
    fontSize:    '13px',
    color:       '#374151',
    lineHeight:  '1.5',
  },
  checkList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
    marginBottom:  '16px',
  },
  checkItem: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  checkIcon: {
    fontSize:  '14px',
    flexShrink:0,
  },
  checkLabel: {
    fontSize: '13px',
  },
  progressWrapper: {
    marginTop: '4px',
  },
  progressTop: {
    display:        'flex',
    justifyContent: 'space-between',
    marginBottom:   '6px',
  },
  progressLabel: {
    fontSize:   '12px',
    color:      '#6b7280',
    fontWeight: '500',
  },
  progressPct: {
    fontSize:   '12px',
    fontWeight: '700',
  },
  progressBar: {
    height:          '6px',
    backgroundColor: '#e5e7eb',
    borderRadius:    '3px',
    overflow:        'hidden',
  },
  progressFill: {
    height:       '100%',
    borderRadius: '3px',
    transition:   'width 0.3s, background-color 0.3s',
  },
  previewJob: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    marginBottom: '10px',
  },
  previewAvatar: {
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
  previewTitle: {
    fontWeight:   '700',
    fontSize:     '14px',
    color:        '#111827',
    marginBottom: '2px',
  },
  previewMeta: {
    fontSize: '12px',
    color:    '#6b7280',
  },
  previewSalary: {
    fontSize:   '12px',
    color:      '#16a34a',
    fontWeight: '600',
    marginTop:  '2px',
  },
  previewTypeBadge: {
    display:         'inline-block',
    backgroundColor: '#dcfce7',
    color:           '#16a34a',
    padding:         '3px 10px',
    borderRadius:    '20px',
    fontSize:        '11px',
    fontWeight:      '600',
    textTransform:   'capitalize',
  },
};