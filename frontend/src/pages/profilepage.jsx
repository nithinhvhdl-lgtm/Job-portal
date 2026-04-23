// src/pages/ProfilePage.jsx
// ─────────────────────────────────────────────────────────────
// Profile page with:
//   - View and edit profile info
//   - Skills management
//   - Resume upload
//   - Change password
//   - Account info
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ProfilePage() {
  const { user, login } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* ── Page Header ── */}
        <div style={styles.pageHeader}>
          <div style={styles.avatarLarge}>
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={styles.pageTitle}>{user?.full_name}</h1>
            <p style={styles.pageSubtitle}>{user?.email}</p>
            <span style={{
              ...styles.roleBadge,
              ...(user?.role === 'recruiter'
                ? styles.recruiterBadge
                : user?.role === 'admin'
                ? styles.adminBadge
                : styles.seekerBadge)
            }}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={styles.tabs}>
          {[
            { key: 'profile',  label: '👤 Profile Info'    },
            { key: 'skills',   label: '🛠️ Skills'          },
            { key: 'resume',   label: '📄 Resume'           },
            { key: 'password', label: '🔒 Change Password'  },
            { key: 'account',  label: '⚙️ Account'          },
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
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={styles.content}>
          {activeTab === 'profile'  && <ProfileInfoTab user={user} />}
          {activeTab === 'skills'   && <SkillsTab />}
          {activeTab === 'resume'   && <ResumeTab />}
          {activeTab === 'password' && <PasswordTab />}
          {activeTab === 'account'  && <AccountTab user={user} />}
        </div>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB 1 — PROFILE INFO
// ─────────────────────────────────────────────────────────────

function ProfileInfoTab({ user }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone:     '',
    location:  '',
    bio:       '',
    linkedin:  '',
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile/');
      const p   = res.data;
      setFormData({
        full_name: p.user?.full_name || user?.full_name || '',
        phone:     p.phone    || '',
        location:  p.location || '',
        bio:       p.bio      || '',
        linkedin:  p.linkedin || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await api.put('/auth/profile/update/', formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error  ||
        'Failed to update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={tabStyles.sectionHeader}>
        <h2 style={tabStyles.sectionTitle}>Profile Information</h2>
        <p style={tabStyles.sectionDesc}>
          Update your personal details and contact information.
        </p>
      </div>

      {success && (
        <div style={tabStyles.successBanner}>
          ✅ Profile updated successfully!
        </div>
      )}
      {error && (
        <div style={tabStyles.errorBanner}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={tabStyles.form}>

        {/* Two columns */}
        <div style={tabStyles.twoCol}>
          <div style={tabStyles.field}>
            <label style={tabStyles.label} htmlFor="full_name">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              style={tabStyles.input}
            />
          </div>

          <div style={tabStyles.field}>
            <label style={tabStyles.label} htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
              style={tabStyles.input}
            />
          </div>
        </div>

        <div style={tabStyles.field}>
          <label style={tabStyles.label} htmlFor="location">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            placeholder="City, Country (e.g. New York, USA)"
            style={tabStyles.input}
          />
        </div>

        <div style={tabStyles.field}>
          <label style={tabStyles.label} htmlFor="bio">
            Bio / About Me
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Write a short bio about yourself, your experience, and what you're looking for..."
            style={tabStyles.textarea}
            rows={4}
          />
          <span style={tabStyles.charHint}>
            {formData.bio.length}/500 characters
          </span>
        </div>

        <div style={tabStyles.field}>
          <label style={tabStyles.label} htmlFor="linkedin">
            LinkedIn URL
          </label>
          <div style={tabStyles.inputWithIcon}>
            <span style={tabStyles.inputIcon}>🔗</span>
            <input
              id="linkedin"
              name="linkedin"
              type="url"
              value={formData.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/yourprofile"
              style={{ ...tabStyles.input, paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={tabStyles.submitRow}>
          <button
            type="submit"
            style={{
              ...tabStyles.saveBtn,
              opacity: saving ? 0.7 : 1,
              cursor:  saving ? 'not-allowed' : 'pointer',
            }}
            disabled={saving}
          >
            {saving ? (
              <span style={tabStyles.btnInner}>
                <span style={tabStyles.spinner} /> Saving...
              </span>
            ) : '💾 Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB 2 — SKILLS
// ─────────────────────────────────────────────────────────────

function SkillsTab() {
  const [skills,  setSkills]  = useState([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const inputRef              = useRef(null);

  // Suggested skills
  const suggestions = [
    'Python', 'Django', 'React', 'JavaScript', 'TypeScript',
    'Node.js', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB',
    'Docker', 'AWS', 'Git', 'REST API', 'GraphQL',
    'Machine Learning', 'TensorFlow', 'Flutter', 'Java',
    'C++', 'PHP', 'Laravel', 'Vue.js', 'Figma', 'CSS',
  ];

  useEffect(() => { fetchSkills(); }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile/');
      const raw = res.data.skills || '';
      setSkills(raw.split(',').map(s => s.trim()).filter(Boolean));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (skills.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) return;
    if (skills.length >= 20) {
      setError('Maximum 20 skills allowed.');
      return;
    }
    setSkills(prev => [...prev, trimmed]);
    setInput('');
    setError('');
  };

  const removeSkill = (index) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
    }
    if (e.key === 'Backspace' && input === '' && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await api.put('/auth/profile/update/', {
        skills: skills.join(', ')
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save skills.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const unusedSuggestions = suggestions.filter(
    s => !skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase())
  );

  return (
    <div>
      <div style={tabStyles.sectionHeader}>
        <h2 style={tabStyles.sectionTitle}>Skills</h2>
        <p style={tabStyles.sectionDesc}>
          Add your technical and professional skills.
          These are used by the AI to match you to jobs.
        </p>
      </div>

      {success && (
        <div style={tabStyles.successBanner}>✅ Skills saved!</div>
      )}
      {error && (
        <div style={tabStyles.errorBanner}>⚠️ {error}</div>
      )}

      {/* Skills input box */}
      <div
        style={tabStyles.skillsBox}
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map((skill, i) => (
          <div key={i} style={tabStyles.skillTag}>
            {skill}
            <button
              type="button"
              style={tabStyles.removeSkillBtn}
              onClick={() => removeSkill(i)}
            >
              ✕
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? 'Type a skill and press Enter...' : ''}
          style={tabStyles.skillInput}
        />
      </div>
      <p style={tabStyles.inputHint}>
        Press <strong>Enter</strong> or <strong>,</strong> to add a skill.
        {' '}{skills.length}/20 skills added.
      </p>

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div style={tabStyles.suggestionsSection}>
          <p style={tabStyles.suggestLabel}>
            💡 Quick add popular skills:
          </p>
          <div style={tabStyles.suggestionsGrid}>
            {unusedSuggestions.slice(0, 12).map((s, i) => (
              <button
                key={i}
                type="button"
                style={tabStyles.suggestChip}
                onClick={() => addSkill(s)}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={tabStyles.submitRow}>
        <button
          type="button"
          style={{
            ...tabStyles.saveBtn,
            opacity: saving ? 0.7 : 1,
            cursor:  saving ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span style={tabStyles.btnInner}>
              <span style={tabStyles.spinner} /> Saving...
            </span>
          ) : '💾 Save Skills'}
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB 3 — RESUME
// ─────────────────────────────────────────────────────────────

function ResumeTab() {
  const [resumeUrl,  setResumeUrl]  = useState(null);
  const [file,       setFile]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const fileInputRef                = useRef(null);

  useEffect(() => { fetchResume(); }, []);

  const fetchResume = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile/');
      setResumeUrl(res.data.resume_url || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setError('');
    setSuccess(false);

    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.pdf')) {
      setError('Only PDF files are allowed.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    handleFileSelect(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/auth/profile/resume/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResumeUrl(res.data.resume_url);
      setFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Upload failed. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={tabStyles.sectionHeader}>
        <h2 style={tabStyles.sectionTitle}>Resume</h2>
        <p style={tabStyles.sectionDesc}>
          Upload your resume PDF. It will be used for AI matching
          when you apply for jobs.
        </p>
      </div>

      {success && (
        <div style={tabStyles.successBanner}>
          ✅ Resume uploaded successfully!
        </div>
      )}
      {error && (
        <div style={tabStyles.errorBanner}>⚠️ {error}</div>
      )}

      {/* Current resume */}
      {resumeUrl && (
        <div style={tabStyles.currentResume}>
          <div style={tabStyles.resumeInfo}>
            <span style={tabStyles.resumeIcon}>📄</span>
            <div>
              <div style={tabStyles.resumeTitle}>Current Resume</div>
              <div style={tabStyles.resumeSubtitle}>PDF uploaded</div>
            </div>
          </div>
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            style={tabStyles.viewResumeBtn}
          >
            👁️ View
          </a>
        </div>
      )}

      {/* Drag and drop zone */}
      <div
        style={{
          ...tabStyles.dropZone,
          borderColor:     dragOver ? '#2563eb' : file ? '#10b981' : '#d1d5db',
          backgroundColor: dragOver ? '#eff6ff' : file ? '#f0fdf4' : '#f9fafb',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={e => handleFileSelect(e.target.files[0])}
        />

        {file ? (
          <div style={tabStyles.dropZoneSelected}>
            <div style={tabStyles.dropZoneIcon}>📄</div>
            <div style={tabStyles.dropZoneFileName}>{file.name}</div>
            <div style={tabStyles.dropZoneFileSize}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <button
              type="button"
              style={tabStyles.changeFileBtn}
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setError('');
              }}
            >
              Change File
            </button>
          </div>
        ) : (
          <div style={tabStyles.dropZoneEmpty}>
            <div style={tabStyles.dropZoneIcon}>☁️</div>
            <div style={tabStyles.dropZoneText}>
              <strong>Click to upload</strong> or drag and drop
            </div>
            <div style={tabStyles.dropZoneHint}>
              PDF only · Max 5MB
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      {file && (
        <div style={tabStyles.submitRow}>
          <button
            type="button"
            style={{
              ...tabStyles.saveBtn,
              opacity: uploading ? 0.7 : 1,
              cursor:  uploading ? 'not-allowed' : 'pointer',
            }}
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <span style={tabStyles.btnInner}>
                <span style={tabStyles.spinner} /> Uploading...
              </span>
            ) : '📤 Upload Resume'}
          </button>
        </div>
      )}

      {/* Tips */}
      <div style={tabStyles.resumeTips}>
        <h4 style={tabStyles.tipsTitle}>💡 Resume Tips</h4>
        <ul style={tabStyles.tipsList}>
          <li>Use a clean, ATS-friendly format</li>
          <li>Include your key skills in a dedicated section</li>
          <li>List specific technologies and tools you've used</li>
          <li>Keep it to 1-2 pages</li>
          <li>Save as PDF to preserve formatting</li>
        </ul>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB 4 — CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────

function PasswordTab() {
  const [formData, setFormData] = useState({
    old_password:     '',
    new_password:     '',
    confirm_password: '',
  });
  const [saving,       setSaving]       = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [error,        setError]        = useState('');
  const [errors,       setErrors]       = useState({});
  const [showOld,      setShowOld]      = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
    setSuccess(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.old_password) {
      newErrors.old_password = 'Current password is required.';
    }
    if (!formData.new_password) {
      newErrors.new_password = 'New password is required.';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters.';
    }
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password.';
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match.';
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
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await api.post('/auth/change-password/', formData);
      setSuccess(true);
      setFormData({
        old_password:     '',
        new_password:     '',
        confirm_password: '',
      });
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to change password.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getStrength = () => {
    const p = formData.new_password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8)           score++;
    if (/[A-Z]/.test(p))         score++;
    if (/[0-9]/.test(p))         score++;
    if (/[^A-Za-z0-9]/.test(p))  score++;
    if (score <= 1) return { label: 'Weak',   color: '#ef4444', width: '25%'  };
    if (score === 2) return { label: 'Fair',   color: '#f59e0b', width: '50%'  };
    if (score === 3) return { label: 'Good',   color: '#3b82f6', width: '75%'  };
    return               { label: 'Strong', color: '#10b981', width: '100%' };
  };

  const strength = getStrength();

  return (
    <div>
      <div style={tabStyles.sectionHeader}>
        <h2 style={tabStyles.sectionTitle}>Change Password</h2>
        <p style={tabStyles.sectionDesc}>
          Keep your account secure with a strong password.
        </p>
      </div>

      {success && (
        <div style={tabStyles.successBanner}>
          ✅ Password changed successfully!
        </div>
      )}
      {error && (
        <div style={tabStyles.errorBanner}>⚠️ {error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ ...tabStyles.form, maxWidth: '480px' }}>

        {/* Current password */}
        <div style={tabStyles.field}>
          <label style={tabStyles.label}>Current Password</label>
          <div style={tabStyles.passwordRow}>
            <input
              name="old_password"
              type={showOld ? 'text' : 'password'}
              value={formData.old_password}
              onChange={handleChange}
              placeholder="Enter current password"
              style={{
                ...tabStyles.input,
                borderColor: errors.old_password ? '#ef4444' : '#d1d5db',
                paddingRight: '44px',
              }}
            />
            <button
              type="button"
              style={tabStyles.eyeBtn}
              onClick={() => setShowOld(!showOld)}
            >
              {showOld ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.old_password && (
            <span style={tabStyles.fieldError}>{errors.old_password}</span>
          )}
        </div>

        {/* New password */}
        <div style={tabStyles.field}>
          <label style={tabStyles.label}>New Password</label>
          <div style={tabStyles.passwordRow}>
            <input
              name="new_password"
              type={showNew ? 'text' : 'password'}
              value={formData.new_password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              style={{
                ...tabStyles.input,
                borderColor: errors.new_password ? '#ef4444' : '#d1d5db',
                paddingRight: '44px',
              }}
            />
            <button
              type="button"
              style={tabStyles.eyeBtn}
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? '🙈' : '👁️'}
            </button>
          </div>
          {strength && (
            <div style={tabStyles.strengthRow}>
              <div style={tabStyles.strengthBar}>
                <div style={{
                  ...tabStyles.strengthFill,
                  width:           strength.width,
                  backgroundColor: strength.color,
                }} />
              </div>
              <span style={{ ...tabStyles.strengthLabel, color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}
          {errors.new_password && (
            <span style={tabStyles.fieldError}>{errors.new_password}</span>
          )}
        </div>

        {/* Confirm password */}
        <div style={tabStyles.field}>
          <label style={tabStyles.label}>Confirm New Password</label>
          <div style={tabStyles.passwordRow}>
            <input
              name="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Repeat new password"
              style={{
                ...tabStyles.input,
                borderColor: errors.confirm_password ? '#ef4444' : '#d1d5db',
                paddingRight: '44px',
              }}
            />
            <button
              type="button"
              style={tabStyles.eyeBtn}
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? '🙈' : '👁️'}
            </button>
          </div>
          {formData.confirm_password && (
            <span style={{
              fontSize: '12px',
              color: formData.new_password === formData.confirm_password
                ? '#10b981' : '#ef4444',
            }}>
              {formData.new_password === formData.confirm_password
                ? '✅ Passwords match'
                : '❌ Passwords do not match'}
            </span>
          )}
          {errors.confirm_password && (
            <span style={tabStyles.fieldError}>{errors.confirm_password}</span>
          )}
        </div>

        <div style={tabStyles.submitRow}>
          <button
            type="submit"
            style={{
              ...tabStyles.saveBtn,
              opacity: saving ? 0.7 : 1,
              cursor:  saving ? 'not-allowed' : 'pointer',
            }}
            disabled={saving}
          >
            {saving ? (
              <span style={tabStyles.btnInner}>
                <span style={tabStyles.spinner} /> Updating...
              </span>
            ) : '🔒 Update Password'}
          </button>
        </div>

      </form>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// TAB 5 — ACCOUNT INFO
// ─────────────────────────────────────────────────────────────

function AccountTab({ user }) {
  const { logout } = useAuth();

  return (
    <div>
      <div style={tabStyles.sectionHeader}>
        <h2 style={tabStyles.sectionTitle}>Account Information</h2>
        <p style={tabStyles.sectionDesc}>
          View your account details and manage your account.
        </p>
      </div>

      {/* Account details */}
      <div style={tabStyles.accountCard}>
        {[
          { label: 'Full Name',   value: user?.full_name              },
          { label: 'Email',       value: user?.email                  },
          { label: 'Role',        value: user?.role?.replace('_',' ') },
          { label: 'Account ID',  value: `#${user?.id}`               },
          { label: 'Status',      value: user?.is_active ? '✅ Active' : '❌ Inactive' },
          { label: 'Member Since',value: user?.created_at
              ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })
              : 'N/A'
          },
        ].map((item, i) => (
          <div key={i} style={tabStyles.accountRow}>
            <div style={tabStyles.accountLabel}>{item.label}</div>
            <div style={tabStyles.accountValue}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={tabStyles.quickLinks}>
        <h3 style={tabStyles.quickLinksTitle}>Quick Links</h3>
        <div style={tabStyles.quickLinksGrid}>
          <Link to="/dashboard" style={tabStyles.quickLink}>
            📊 Go to Dashboard
          </Link>
          <Link to="/jobs" style={tabStyles.quickLink}>
            💼 Browse Jobs
          </Link>
          {user?.role === 'recruiter' && (
            <Link to="/post-job" style={tabStyles.quickLink}>
              ➕ Post a Job
            </Link>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div style={tabStyles.dangerZone}>
        <h3 style={tabStyles.dangerTitle}>⚠️ Danger Zone</h3>
        <div style={tabStyles.dangerRow}>
          <div>
            <div style={tabStyles.dangerLabel}>Log Out</div>
            <div style={tabStyles.dangerDesc}>
              Sign out of your account on this device.
            </div>
          </div>
          <button
            style={tabStyles.logoutBtn}
            onClick={logout}
          >
            🚪 Log Out
          </button>
        </div>
      </div>
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
    maxWidth: '900px',
    margin:   '0 auto',
  },
  pageHeader: {
    display:      'flex',
    alignItems:   'center',
    gap:          '20px',
    marginBottom: '28px',
    flexWrap:     'wrap',
  },
  avatarLarge: {
    width:           '72px',
    height:          '72px',
    borderRadius:    '50%',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '800',
    fontSize:        '28px',
    flexShrink:      0,
    border:          '3px solid #ffffff',
    boxShadow:       '0 2px 12px rgba(37,99,235,0.3)',
  },
  pageTitle: {
    fontSize:    '24px',
    fontWeight:  '800',
    color:       '#111827',
    marginBottom:'4px',
  },
  pageSubtitle: {
    fontSize:    '14px',
    color:       '#6b7280',
    marginBottom:'8px',
  },
  roleBadge: {
    display:      'inline-block',
    padding:      '3px 12px',
    borderRadius: '20px',
    fontSize:     '12px',
    fontWeight:   '600',
    textTransform:'capitalize',
  },
  seekerBadge: {
    backgroundColor: '#dcfce7',
    color:           '#16a34a',
  },
  recruiterBadge: {
    backgroundColor: '#dbeafe',
    color:           '#1d4ed8',
  },
  adminBadge: {
    backgroundColor: '#fde8d8',
    color:           '#c2410c',
  },
  tabs: {
    display:         'flex',
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    marginBottom:    '20px',
    padding:         '0 8px',
    overflowX:       'auto',
  },
  tab: {
    padding:    '13px 14px',
    border:     'none',
    cursor:     'pointer',
    fontSize:   '13px',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  content: {
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    padding:         '28px',
  },
};

const tabStyles = {
  sectionHeader: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize:    '20px',
    fontWeight:  '700',
    color:       '#111827',
    marginBottom:'6px',
  },
  sectionDesc: {
    fontSize: '14px',
    color:    '#6b7280',
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    border:          '1px solid #bbf7d0',
    borderRadius:    '8px',
    padding:         '12px 16px',
    color:           '#16a34a',
    fontSize:        '14px',
    fontWeight:      '600',
    marginBottom:    '20px',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    padding:         '12px 16px',
    color:           '#dc2626',
    fontSize:        '14px',
    marginBottom:    '20px',
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '18px',
  },
  twoCol: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '16px',
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
    backgroundColor: '#ffffff',
    fontFamily:      'inherit',
    transition:      'border-color 0.15s',
  },
  textarea: {
    padding:         '11px 14px',
    borderRadius:    '8px',
    border:          '1px solid #d1d5db',
    fontSize:        '14px',
    color:           '#111827',
    outline:         'none',
    width:           '100%',
    resize:          'vertical',
    lineHeight:      '1.6',
    backgroundColor: '#ffffff',
    fontFamily:      'inherit',
  },
  charHint: {
    fontSize: '12px',
    color:    '#9ca3af',
    textAlign:'right',
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position:   'absolute',
    left:       '12px',
    top:        '50%',
    transform:  'translateY(-50%)',
    fontSize:   '14px',
    zIndex:     1,
  },
  fieldError: {
    fontSize: '12px',
    color:    '#ef4444',
  },
  submitRow: {
    display:  'flex',
    gap:      '10px',
    marginTop:'8px',
  },
  saveBtn: {
    padding:         '11px 24px',
    backgroundColor: '#2563eb',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '14px',
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
  spinner: {
    display:      'inline-block',
    width:        '14px',
    height:       '14px',
    border:       '2px solid rgba(255,255,255,0.4)',
    borderTop:    '2px solid #ffffff',
    borderRadius: '50%',
    animation:    'spin 0.7s linear infinite',
  },
  // Skills
  skillsBox: {
    display:         'flex',
    flexWrap:        'wrap',
    gap:             '8px',
    padding:         '12px',
    border:          '1px solid #d1d5db',
    borderRadius:    '8px',
    backgroundColor: '#ffffff',
    minHeight:       '56px',
    cursor:          'text',
    alignItems:      'center',
  },
  skillTag: {
    display:         'flex',
    alignItems:      'center',
    gap:             '6px',
    backgroundColor: '#eff6ff',
    color:           '#2563eb',
    border:          '1px solid #bfdbfe',
    borderRadius:    '20px',
    padding:         '4px 12px',
    fontSize:        '13px',
    fontWeight:      '500',
  },
  removeSkillBtn: {
    background:  'none',
    border:      'none',
    color:       '#93c5fd',
    cursor:      'pointer',
    fontSize:    '12px',
    padding:     '0',
    lineHeight:  '1',
    fontWeight:  '700',
  },
  skillInput: {
    border:          'none',
    outline:         'none',
    fontSize:        '14px',
    color:           '#111827',
    flex:            1,
    minWidth:        '160px',
    backgroundColor: 'transparent',
    fontFamily:      'inherit',
    padding:         '2px 0',
  },
  inputHint: {
    fontSize:  '12px',
    color:     '#9ca3af',
    marginTop: '6px',
  },
  suggestionsSection: {
    marginTop: '20px',
  },
  suggestLabel: {
    fontSize:    '13px',
    color:       '#6b7280',
    marginBottom:'10px',
    fontWeight:  '500',
  },
  suggestionsGrid: {
    display:  'flex',
    flexWrap: 'wrap',
    gap:      '8px',
  },
  suggestChip: {
    padding:         '5px 12px',
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '20px',
    fontSize:        '13px',
    color:           '#374151',
    cursor:          'pointer',
    transition:      'all 0.15s',
    fontFamily:      'inherit',
  },
  // Resume
  currentResume: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    backgroundColor: '#f0fdf4',
    border:          '1px solid #bbf7d0',
    borderRadius:    '10px',
    padding:         '14px 16px',
    marginBottom:    '16px',
  },
  resumeInfo: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  resumeIcon: {
    fontSize: '28px',
  },
  resumeTitle: {
    fontWeight:   '600',
    fontSize:     '14px',
    color:        '#111827',
    marginBottom: '2px',
  },
  resumeSubtitle: {
    fontSize: '12px',
    color:    '#6b7280',
  },
  viewResumeBtn: {
    padding:         '7px 14px',
    backgroundColor: '#ffffff',
    border:          '1px solid #bbf7d0',
    borderRadius:    '6px',
    color:           '#16a34a',
    fontSize:        '13px',
    fontWeight:      '600',
    textDecoration:  'none',
    cursor:          'pointer',
  },
  dropZone: {
    border:       '2px dashed #d1d5db',
    borderRadius: '12px',
    padding:      '40px 24px',
    textAlign:    'center',
    cursor:       'pointer',
    transition:   'all 0.2s',
    marginBottom: '16px',
  },
  dropZoneEmpty: {},
  dropZoneSelected: {},
  dropZoneIcon: {
    fontSize:     '40px',
    marginBottom: '12px',
  },
  dropZoneText: {
    fontSize:    '15px',
    color:       '#374151',
    marginBottom:'6px',
  },
  dropZoneHint: {
    fontSize: '13px',
    color:    '#9ca3af',
  },
  dropZoneFileName: {
    fontSize:    '15px',
    fontWeight:  '600',
    color:       '#111827',
    marginBottom:'4px',
  },
  dropZoneFileSize: {
    fontSize:    '13px',
    color:       '#6b7280',
    marginBottom:'12px',
  },
  changeFileBtn: {
    padding:         '6px 14px',
    backgroundColor: '#ffffff',
    border:          '1px solid #e5e7eb',
    borderRadius:    '6px',
    fontSize:        '13px',
    color:           '#374151',
    cursor:          'pointer',
    fontFamily:      'inherit',
  },
 resumeTips: {
    backgroundColor: '#fffbeb',
    border:          '1px solid #fde68a',
    borderRadius:    '10px',
    padding:         '16px',
    marginTop:       '8px',
  },
  tipsTitle: {
    fontSize:    '14px',
    fontWeight:  '700',
    color:       '#92400e',
    marginBottom:'10px',
  },
  tipsList: {
    paddingLeft: '16px',
    display:     'flex',
    flexDirection:'column',
    gap:         '5px',
    fontSize:    '13px',
    color:       '#78350f',
    lineHeight:  '1.5',
  },
  // Password tab
  passwordRow: {
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
  },
  strengthRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    marginTop:  '4px',
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
  // Account tab
  accountCard: {
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '12px',
    overflow:        'hidden',
    marginBottom:    '24px',
  },
  accountRow: {
    display:      'flex',
    justifyContent:'space-between',
    alignItems:   'center',
    padding:      '14px 18px',
    borderBottom: '1px solid #f3f4f6',
  },
  accountLabel: {
    fontSize:   '13px',
    color:      '#6b7280',
    fontWeight: '500',
  },
  accountValue: {
    fontSize:     '14px',
    color:        '#111827',
    fontWeight:   '600',
    textTransform:'capitalize',
  },
  quickLinks: {
    marginBottom: '24px',
  },
  quickLinksTitle: {
    fontSize:    '15px',
    fontWeight:  '700',
    color:       '#111827',
    marginBottom:'12px',
  },
  quickLinksGrid: {
    display:  'flex',
    flexWrap: 'wrap',
    gap:      '10px',
  },
  quickLink: {
    padding:         '10px 16px',
    backgroundColor: '#f9fafb',
    border:          '1px solid #e5e7eb',
    borderRadius:    '8px',
    fontSize:        '14px',
    color:           '#374151',
    textDecoration:  'none',
    fontWeight:      '500',
    transition:      'all 0.15s',
  },
  dangerZone: {
    border:       '1px solid #fecaca',
    borderRadius: '12px',
    padding:      '20px',
    backgroundColor:'#fef2f2',
  },
  dangerTitle: {
    fontSize:    '15px',
    fontWeight:  '700',
    color:       '#dc2626',
    marginBottom:'14px',
  },
  dangerRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    gap:            '16px',
    flexWrap:       'wrap',
  },
  dangerLabel: {
    fontSize:    '14px',
    fontWeight:  '600',
    color:       '#111827',
    marginBottom:'3px',
  },
  dangerDesc: {
    fontSize: '13px',
    color:    '#6b7280',
  },
  logoutBtn: {
    padding:         '10px 20px',
    backgroundColor: '#dc2626',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '8px',
    fontSize:        '14px',
    fontWeight:      '700',
    cursor:          'pointer',
    whiteSpace:      'nowrap',
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
};