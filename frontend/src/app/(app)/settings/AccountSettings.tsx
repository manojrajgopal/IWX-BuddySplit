'use client';
import { useState, FormEvent } from 'react';
import { apiClient } from '@/lib/api/client';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}

interface Props {
  profile: UserProfile;
}

export function AccountSettings({ profile: initial }: Props): JSX.Element {
  const [profile, setProfile] = useState(initial);

  // Profile form
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl ?? '');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function saveProfile(e: FormEvent): Promise<void> {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const data = await apiClient<Partial<UserProfile>>('/v1/users/me', {
        method: 'PATCH',
        body: {
          displayName: displayName || undefined,
          phone: phone || null,
          avatarUrl: avatarUrl || null,
        },
      });
      setProfile((p) => ({ ...p, ...data }));
      setProfileMsg({ type: 'ok', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'err', text: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setProfileBusy(false);
    }
  }

  async function changePassword(e: FormEvent): Promise<void> {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg(null);
    try {
      await apiClient('/v1/users/me/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword, confirmNewPassword },
      });
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPwMsg({ type: 'err', text: err instanceof Error ? err.message : 'Change failed' });
    } finally {
      setPwBusy(false);
    }
  }

  const msgStyle = (type: 'ok' | 'err'): React.CSSProperties => ({
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    background: type === 'ok' ? 'var(--color-success-bg, #d1fae5)' : 'var(--color-error-bg, #fee2e2)',
    color: type === 'ok' ? 'var(--color-success, #065f46)' : 'var(--color-error, #991b1b)',
  });

  const eyeBtn: React.CSSProperties = {
    position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    color: 'var(--color-text-secondary, #6b7280)', lineHeight: 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Account info */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 className="card__title" style={{ marginBottom: '0.25rem' }}>Account info</h3>
        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Read-only account details.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div><div className="text-uppercase-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Email</div><span>{profile.email}</span></div>
          <div><div className="text-uppercase-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Role</div><span className="pill pill--default" style={{ textTransform: 'capitalize' }}>User</span></div>
          <div><div className="text-uppercase-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Email verified</div><span>{profile.emailVerifiedAt ? new Date(profile.emailVerifiedAt).toLocaleDateString() : 'Not verified'}</span></div>
          <div><div className="text-uppercase-label" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Member since</div><span>{new Date(profile.createdAt).toLocaleDateString()}</span></div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 className="card__title" style={{ marginBottom: '0.25rem' }}>Profile</h3>
        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Update your display name, phone, and avatar.</p>
        {profileMsg && <div style={msgStyle(profileMsg.type)} role="alert">{profileMsg.text}</div>}
        <form onSubmit={saveProfile}>
          <div className="field">
            <label className="label">Display name</label>
            <input className="input" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Phone number</label>
            <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div className="field">
            <label className="label">Avatar URL</label>
            <input className="input" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://… (optional)" />
          </div>
          <button className="btn btn--primary" type="submit" disabled={profileBusy}>
            {profileBusy ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 className="card__title" style={{ marginBottom: '0.25rem' }}>Change password</h3>
        <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>Choose a strong password of at least 8 characters.</p>
        {pwMsg && <div style={msgStyle(pwMsg.type)} role="alert">{pwMsg.text}</div>}
        <form onSubmit={changePassword}>
          <div className="field">
            <label className="label">Current password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showCurrent ? 'text' : 'password'} required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ paddingRight: '2.5rem' }} autoComplete="current-password" />
              <button type="button" style={eyeBtn} onClick={() => setShowCurrent((v) => !v)} aria-label={showCurrent ? 'Hide' : 'Show'}>{showCurrent ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div className="field">
            <label className="label">New password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showNew ? 'text' : 'password'} required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ paddingRight: '2.5rem' }} autoComplete="new-password" />
              <button type="button" style={eyeBtn} onClick={() => setShowNew((v) => !v)} aria-label={showNew ? 'Hide' : 'Show'}>{showNew ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div className="field">
            <label className="label">Confirm new password</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type={showConfirm ? 'text' : 'password'} required minLength={8} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} style={{ paddingRight: '2.5rem' }} autoComplete="new-password" />
              <button type="button" style={eyeBtn} onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? 'Hide' : 'Show'}>{showConfirm ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <button className="btn btn--primary" type="submit" disabled={pwBusy}>
            {pwBusy ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </div>

    </div>
  );
}
