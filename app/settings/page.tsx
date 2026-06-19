'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, disableTwoFactor } from '../lib/api';

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; twoFactorEnabled: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCurrentUser();
        setUser({ email: data.email, twoFactorEnabled: data.twoFactorEnabled ?? false });
      } catch {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError('');
    setDisableLoading(true);
    try {
      await disableTwoFactor(disableCode);
      setUser(u => u ? { ...u, twoFactorEnabled: false } : u);
      setShowDisableModal(false);
      setDisableCode('');
      showToast('Two-factor authentication disabled.', 'success');
    } catch (err: any) {
      setDisableError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setDisableLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#EDE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #C9BFB0', borderTopColor: '#8B1A1A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#EDE8DF', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 100,
          background: toast.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
          color: toast.type === 'success' ? '#065F46' : '#DC2626',
          borderRadius: '10px', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 500,
          animation: 'fadeIn 0.2s ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        }}>
          {toast.message}
        </div>
      )}

      {/* Navbar */}
      <nav style={{ background: '#F5F0E8', borderBottom: '1px solid #C9BFB0', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#8B1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📄</div>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2C1810' }}>Utility Bills</span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ padding: '0.5rem 1rem', background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '8px', color: '#8B1A1A', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
        >
          ← Dashboard
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2C1810', margin: 0, letterSpacing: '-0.025em' }}>Settings</h1>
          <p style={{ color: '#7A6255', fontSize: '0.9375rem', marginTop: '0.375rem' }}>{user?.email}</p>
        </div>

        {/* Security section */}
        <div style={{ background: '#F5F0E8', border: '1px solid #C9BFB0', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #C9BFB0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A6255', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Security</span>
          </div>

          {/* Change Password */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E4DDD3' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#2C1810', fontSize: '0.9375rem' }}>Password</div>
              <div style={{ color: '#9E887A', fontSize: '0.8125rem', marginTop: '0.125rem' }}>Change your account password</div>
            </div>
            <button
              onClick={() => router.push('/change-password')}
              style={{ padding: '0.5rem 1rem', background: '#EDE8DF', border: '1px solid #C9BFB0', borderRadius: '8px', color: '#2C1810', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Change
            </button>
          </div>

          {/* 2FA Row */}
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#2C1810', fontSize: '0.9375rem' }}>Two-factor authentication</span>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                  padding: '0.1875rem 0.5rem', borderRadius: '999px',
                  background: user?.twoFactorEnabled ? 'rgba(5,150,105,0.12)' : 'rgba(122,98,85,0.10)',
                  color: user?.twoFactorEnabled ? '#065F46' : '#7A6255',
                  border: `1px solid ${user?.twoFactorEnabled ? 'rgba(5,150,105,0.25)' : 'rgba(122,98,85,0.2)'}`,
                }}>
                  {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div style={{ color: '#9E887A', fontSize: '0.8125rem', marginTop: '0.125rem' }}>
                {user?.twoFactorEnabled
                  ? 'Your account is protected with an authenticator app.'
                  : 'Add an extra layer of security to your account.'}
              </div>
            </div>
            {user?.twoFactorEnabled ? (
              <button
                onClick={() => setShowDisableModal(true)}
                style={{ padding: '0.5rem 1rem', background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: '8px', color: '#8B1A1A', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Disable
              </button>
            ) : (
              <button
                onClick={() => router.push('/2fa-setup')}
                style={{ padding: '0.5rem 1rem', background: '#8B1A1A', border: 'none', borderRadius: '8px', color: '#F5F0E8', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(44,24,16,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDisableModal(false); setDisableCode(''); setDisableError(''); } }}
        >
          <div style={{ background: '#F5F0E8', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '380px', boxShadow: '0 8px 32px rgba(44,24,16,0.18)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2C1810', margin: '0 0 0.5rem' }}>Disable Two-Factor Authentication</h2>
            <p style={{ color: '#7A6255', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>Enter the 6-digit code from your authenticator app to confirm.</p>

            {disableError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '0.625rem 0.875rem', marginBottom: '1rem' }}>
                <p style={{ color: '#DC2626', fontSize: '0.8125rem', margin: 0 }}>{disableError}</p>
              </div>
            )}

            <form onSubmit={handleDisable2FA}>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #C9BFB0', borderRadius: '8px', fontSize: '1.25rem', textAlign: 'center', letterSpacing: '0.25em', outline: 'none', background: '#EDE8DF', color: '#2C1810', marginBottom: '1rem', boxSizing: 'border-box' }}
                onFocus={(e) => (e.target.style.borderColor = '#8B1A1A')}
                onBlur={(e) => (e.target.style.borderColor = '#C9BFB0')}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => { setShowDisableModal(false); setDisableCode(''); setDisableError(''); }}
                  style={{ flex: 1, padding: '0.75rem', background: '#EDE8DF', border: '1px solid #C9BFB0', borderRadius: '8px', color: '#7A6255', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableLoading || disableCode.length !== 6}
                  style={{ flex: 1, padding: '0.75rem', background: disableLoading || disableCode.length !== 6 ? '#C9BFB0' : '#8B1A1A', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: disableLoading || disableCode.length !== 6 ? 'not-allowed' : 'pointer' }}
                >
                  {disableLoading ? 'Verifying...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
