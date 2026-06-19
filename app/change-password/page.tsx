'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '../lib/api';

export default function ChangePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#EDE8DF', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>Change Password</h1>
          <p style={{ color: '#7A6255', fontSize: '0.875rem', marginTop: '0.5rem' }}>Enter your current and new password</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
            <p style={{ color: '#DC2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {message && (
          <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
            <p style={{ color: '#059669', fontSize: '0.875rem', margin: 0 }}>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#2C1810', marginBottom: '0.5rem' }}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #C9BFB0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#8B1A1A')}
              onBlur={(e) => (e.target.style.borderColor = '#C9BFB0')}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#2C1810', marginBottom: '0.5rem' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #C9BFB0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#8B1A1A')}
              onBlur={(e) => (e.target.style.borderColor = '#C9BFB0')}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#2C1810', marginBottom: '0.5rem' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #C9BFB0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#8B1A1A')}
              onBlur={(e) => (e.target.style.borderColor = '#C9BFB0')}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isLoading ? '#C9BFB0' : '#8B1A1A',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#8B1A1A',
              fontSize: '0.875rem',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
